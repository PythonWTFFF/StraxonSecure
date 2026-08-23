# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM golang:alpine AS builder

WORKDIR /app

COPY go.mod ./
RUN go mod download || true

COPY . .
RUN go get github.com/gorilla/websocket github.com/go-redis/redis/v8
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o pulse main.go

# ─── Stage 2: Minimal runtime ────────────────────────────────────────────────
FROM alpine:3.19

WORKDIR /app
COPY --from=builder /app/pulse .

EXPOSE 8081
CMD ["./pulse"]
