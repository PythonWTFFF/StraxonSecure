package main

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"
	"sync"

	"github.com/go-redis/redis/v8"
	"github.com/gorilla/websocket"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/getsentry/sentry-go"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
)

var ctx = context.Background()

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for dev
	},
}

type Client struct {
	hub       *Hub
	conn      *websocket.Conn
	send      chan []byte
	userId    string
	userName  string
	userColor string
	rooms     map[string]bool
	mu        sync.Mutex
}

type RoomMessage struct {
	Room string
	Data []byte
}

type Hub struct {
	clients    map[*Client]bool
	rooms      map[string]map[*Client]bool // room -> clients
	broadcast  chan []byte
	roomCast   chan RoomMessage
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

func newHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		roomCast:   make(chan RoomMessage),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		rooms:      make(map[string]map[*Client]bool),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				for room := range client.rooms {
					if clients, ok := h.rooms[room]; ok {
						delete(clients, client)
						if len(clients) == 0 {
							delete(h.rooms, room)
						} else {
							// broadcast presence update
							h.broadcastPresence(room)
						}
					}
				}
				close(client.send)
			}
			h.mu.Unlock()
		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		case rm := <-h.roomCast:
			h.mu.RLock()
			if clients, ok := h.rooms[rm.Room]; ok {
				for client := range clients {
					select {
					case client.send <- rm.Data:
					default:
						close(client.send)
						delete(h.clients, client)
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

type UserPresence struct {
	UserId string `json:"userId"`
	Name   string `json:"name"`
	Color  string `json:"color"`
}

func (h *Hub) broadcastPresence(room string) {
	users := make([]UserPresence, 0)
	for c := range h.rooms[room] {
		if c.userId != "" {
			users = append(users, UserPresence{
				UserId: c.userId,
				Name:   c.userName,
				Color:  c.userColor,
			})
		}
	}
	event := map[string]interface{}{
		"event": "presence_update",
		"room": room,
		"users": users,
	}
	b, _ := json.Marshal(event)
	go func() {
		h.roomCast <- RoomMessage{Room: room, Data: b}
	}()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Error().Err(err).Msg("error reading websocket")
			}
			break
		}
		
		var msg struct {
			Type      string `json:"type"`
			Room      string `json:"room"`
			UserId    string `json:"userId"`
			UserName  string `json:"userName"`
			UserColor string `json:"userColor"`
		}
		if err := json.Unmarshal(message, &msg); err == nil {
			c.hub.mu.Lock()
			if msg.Type == "join_room" {
				c.mu.Lock()
				c.rooms[msg.Room] = true
				if msg.UserId != "" {
					c.userId = msg.UserId
					c.userName = msg.UserName
					c.userColor = msg.UserColor
				}
				c.mu.Unlock()
				
				if c.hub.rooms[msg.Room] == nil {
					c.hub.rooms[msg.Room] = make(map[*Client]bool)
				}
				c.hub.rooms[msg.Room][c] = true
				c.hub.broadcastPresence(msg.Room)
			} else if msg.Type == "leave_room" {
				c.mu.Lock()
				delete(c.rooms, msg.Room)
				c.mu.Unlock()
				
				if clients, ok := c.hub.rooms[msg.Room]; ok {
					delete(clients, c)
					if len(clients) == 0 {
						delete(c.hub.rooms, msg.Room)
					} else {
						c.hub.broadcastPresence(msg.Room)
					}
				}
			} else if msg.Type == "typing" {
				// Broadcast typing to room
				event := map[string]interface{}{
					"event": "typing",
					"room": msg.Room,
					"userId": c.userId,
				}
				b, _ := json.Marshal(event)
				go func(rm string, data []byte) {
					c.hub.roomCast <- RoomMessage{Room: rm, Data: data}
				}(msg.Room, b)
			}
			c.hub.mu.Unlock()
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)
			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func serveWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Error().Err(err).Msg("Failed to upgrade websocket")
		return
	}
	client := &Client{hub: hub, conn: conn, send: make(chan []byte, 256), rooms: make(map[string]bool)}
	hub.register <- client

	go client.writePump()
	go client.readPump()
}

func initTracer() *sdktrace.TracerProvider {
	exporter, err := otlptracehttp.New(ctx, otlptracehttp.WithInsecure())
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create otlp exporter")
	}
	
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceNameKey.String("straxon-pulse"),
		)),
	)
	otel.SetTracerProvider(tp)
	return tp
}

func main() {
	// Configure zerolog
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339})
	
	// Init Sentry
	err := sentry.Init(sentry.ClientOptions{
		Dsn: os.Getenv("SENTRY_DSN"),
		EnableTracing: true,
		TracesSampleRate: 1.0,
	})
	if err != nil {
		log.Error().Err(err).Msg("Sentry initialization failed")
	}
	defer sentry.Flush(2 * time.Second)

	// Init OpenTelemetry
	tp := initTracer()
	defer func() {
		if err := tp.Shutdown(ctx); err != nil {
			log.Error().Err(err).Msg("Error shutting down tracer provider")
		}
	}()

	hub := newHub()
	go hub.run()

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis:6379"
	}

	rdb := redis.NewClient(&redis.Options{
		Addr: redisURL,
	})

	// Subscribe to structured events
	pubsub := rdb.Subscribe(ctx, "straxon:events:v1", "straxon:metrics")
	defer pubsub.Close()

	go func() {
		ch := pubsub.Channel()
		for msg := range ch {
			// Legacy metrics channel support
			if msg.Channel == "straxon:metrics" {
				log.Info().RawJSON("payload", []byte(msg.Payload)).Msg("Received raw metrics from Redis")
				event := map[string]interface{}{
					"event": "metric_tick",
					"data":  json.RawMessage(msg.Payload),
				}
				eventBytes, _ := json.Marshal(event)
				hub.broadcast <- eventBytes
				continue
			}

			// New v1 structured events
			var incoming struct {
				EventType string          `json:"eventType"`
				Version   string          `json:"version"`
				TraceId   string          `json:"traceId"`
				Payload   json.RawMessage `json:"payload"`
				Room      string          `json:"room"` // Optional targeted room
			}
			
			if err := json.Unmarshal([]byte(msg.Payload), &incoming); err != nil {
				log.Error().Err(err).Msg("Failed to parse incoming structured event")
				continue
			}
			
			log.Info().Str("eventType", incoming.EventType).Str("traceId", incoming.TraceId).Msg("Received structured event")
			
			wsEvent := map[string]interface{}{
				"event": incoming.EventType,
				"data":  incoming.Payload,
			}
			eventBytes, _ := json.Marshal(wsEvent)
			
			if incoming.Room != "" {
				hub.roomCast <- RoomMessage{Room: incoming.Room, Data: eventBytes}
			} else {
				hub.broadcast <- eventBytes
			}
		}
	}()

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	log.Info().Msg("Straxon Pulse Service starting on :8081")
	if err := http.ListenAndServe(":8081", nil); err != nil {
		log.Fatal().Err(err).Msg("ListenAndServe")
	}
}
