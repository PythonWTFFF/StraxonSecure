import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { usePulseStore } from "../stores/pulse.store";
import { useQueryClient } from "@tanstack/react-query";

interface SocketContextType {
  socket: Socket | null;
  pulseWs: WebSocket | null;
  connectionState: "connected" | "reconnecting" | "disconnected";
  sendPulseMessage: (msg: any) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [pulseWs, setPulseWs] = useState<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<"connected" | "reconnecting" | "disconnected">("disconnected");
  const { updateMetrics, setConnected } = usePulseStore();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 1. Node.js Socket.io setup with backoff
    const newSocket = io({
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setConnectionState("connected");
    });
    newSocket.on("disconnect", () => {
      setConnectionState("disconnected");
    });
    newSocket.io.on("reconnect_attempt", () => {
      setConnectionState("reconnecting");
    });

    // Cache invalidations
    newSocket.on("invalidate_dashboard", () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }));
    newSocket.on("invalidate_clients", () => queryClient.invalidateQueries({ queryKey: ["clients"] }));
    newSocket.on("invalidate_proposals", () => queryClient.invalidateQueries({ queryKey: ["proposals"] }));
    newSocket.on("invalidate_audit", () => queryClient.invalidateQueries({ queryKey: ["audit"] }));
    
    // Mutations (Optimistic)
    newSocket.on("deal_updated", (deal) => {
      queryClient.setQueryData(["deals"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((d: any) => d.id === deal.id ? { ...d, ...deal } : d);
      });
    });

    // 2. Go Pulse WebSocket Setup
    const connectPulse = () => {
      const isDev = import.meta.env.DEV;
      const wsUrl = import.meta.env.VITE_PULSE_WS_URL || (isDev ? "ws://localhost:8081/ws" : `wss://straxon-pulse.onrender.com/ws`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setPulseWs(ws);
      };

      ws.onclose = () => {
        setConnected(false);
        setPulseWs(null);
        setTimeout(connectPulse, 3000);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === "metric_tick") {
            updateMetrics(payload.data);
          } else if (payload.event === "presence_update") {
             window.dispatchEvent(new CustomEvent('pulse_presence', { detail: payload }));
          } else if (payload.event === "typing") {
             window.dispatchEvent(new CustomEvent('pulse_typing', { detail: payload }));
          }
        } catch (err) {
          console.error("Pulse parse error:", err);
        }
      };
    };

    connectPulse();

    return () => {
      newSocket.close();
      if (wsRef.current) wsRef.current.close();
    };
  }, [queryClient, updateMetrics, setConnected]);

  const sendPulseMessage = (msg: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  return (
    <SocketContext.Provider value={{ socket, pulseWs, connectionState, sendPulseMessage }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within SocketProvider");
  return context;
};
