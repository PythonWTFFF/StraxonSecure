import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export type Severity = "critical" | "high" | "medium" | "low";
export type Protocol = "HTTP" | "HTTPS" | "TCP" | "UDP" | "DNS" | "ICMP";

export interface AttackEvent {
  id: string;
  lat: number;
  lng: number;
  ip: string;
  country: string;
  type: string;
  severity: Severity;
  intensity: number;
}

export interface ThreatEvent {
  id: string;
  ts: number;
  ip: string;
  country: string;
  lat: number;
  lng: number;
  type: string;
  severity: Severity;
  protocol: Protocol;
  port: number;
  confidence: number;
  target: string;
  mitreId: string;
  mitreClass: string;
  signature: string;
  payload: string;
  headers: Record<string, string>;
  false_positive?: boolean;
}

interface BlockedIP {
  ip: string;
  country: string;
  ts: number;
  reason: string;
  events: number;
}

interface DashboardContextType {
  user: any;
  events: ThreatEvent[];
  blockedIPs: BlockedIP[];
  blockedSet: Set<string>;
  blockIP: (ip: string, country: string, reason: string) => void;
  unblockIP: (ip: string) => void;
  flagEvent: (id: string, fp: boolean) => void;
  liveOps: number;
  rtConnected: boolean;
  paused: boolean;
  setPaused: React.Dispatch<React.SetStateAction<boolean>>;
  soundOn: boolean;
  setSoundOn: React.Dispatch<React.SetStateAction<boolean>>;
  autoBlock: boolean;
  setAutoBlock: React.Dispatch<React.SetStateAction<boolean>>;
  mounted: boolean;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

function mkEvent(historical = false): ThreatEvent {
  const S: Severity[] = ["critical", "high", "high", "medium", "medium", "medium", "low", "low"];
  const sev = S[Math.floor(Math.random() * S.length)];
  const c = { lat: 37.7749, lng: -122.4194 };
  return {
    id: crypto.randomUUID(),
    ts: historical ? Date.now() - Math.random() * 120_000 : Date.now(),
    ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    country: "US",
    lat: c.lat + (Math.random() - 0.5) * 5,
    lng: c.lng + (Math.random() - 0.5) * 5,
    type: "SQL Injection",
    severity: sev,
    protocol: "HTTPS",
    port: 443,
    confidence: Math.floor(Math.random() * 40) + 60,
    target: "api.straxon.io",
    mitreId: "T1190",
    mitreClass: "Execution",
    signature: "SQLi detected in payload",
    payload: "SELECT * FROM users WHERE id = 1",
    headers: { "User-Agent": "curl/7.64.1" },
  };
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [autoBlock, setAutoBlock] = useState(false);

  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [liveOps, setLiveOps] = useState(1);
  const [rtConnected, setRtConnected] = useState(false);

  const blockedSet = useMemo(() => new Set(blockedIPs.map((b) => b.ip)), [blockedIPs]);

  useEffect(() => {
    setMounted(true);
    setEvents(Array.from({ length: 40 }, () => mkEvent(true)).sort((a, b) => b.ts - a.ts));
  }, []);

  useEffect(() => {
    if (!mounted || paused) return;

    let sub = supabase
      .channel("soc_events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "soc_events" },
        (payload) => {
          const row = payload.new as any;
          if (blockedSet.has(row.ip_address)) return;
          const e: ThreatEvent = {
            id: row.id,
            ts: new Date(row.created_at).getTime(),
            ip: row.ip_address,
            country: row.country || "Unknown",
            lat: 0,
            lng: 0,
            type: row.attack_type,
            severity: row.severity,
            protocol: row.protocol,
            port: row.port,
            confidence: 90,
            target: row.target_url || "Unknown",
            mitreId: row.mitre_id || "Unknown",
            mitreClass: "Execution",
            signature: row.signature || "Unknown",
            payload: row.payload ? JSON.stringify(row.payload) : "",
            headers: (row.headers as Record<string, string>) || {},
            false_positive: row.false_positive,
          };
          setEvents((prev) => [e, ...prev].slice(0, 200));
        },
      )
      .subscribe((status) => setRtConnected(status === "SUBSCRIBED"));

    const interval = setInterval(() => {
      if (Math.random() > 0.3) {
        const fake = mkEvent();
        if (!blockedSet.has(fake.ip)) {
          setEvents((prev) => [fake, ...prev].slice(0, 200));
        }
      }
      setLiveOps(Math.floor(Math.random() * 5) + 3);
    }, 800);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(sub);
    };
  }, [mounted, paused, blockedSet]);

  const blockIP = (ip: string, country: string, reason: string) => {
    setBlockedIPs((p) => {
      if (p.find((b) => b.ip === ip)) return p;
      return [
        {
          ip,
          country,
          ts: Date.now(),
          reason,
          events: events.filter((e) => e.ip === ip).length,
        },
        ...p,
      ];
    });
    setEvents((p) => p.filter((e) => e.ip !== ip));
  };

  const unblockIP = (ip: string) => {
    setBlockedIPs((p) => p.filter((b) => b.ip !== ip));
  };

  const flagEvent = (id: string, fp: boolean) => {
    setEvents((p) => p.map((e) => (e.id === id ? { ...e, false_positive: fp } : e)));
  };

  return (
    <DashboardContext.Provider
      value={{
        user,
        events,
        blockedIPs,
        blockedSet,
        blockIP,
        unblockIP,
        flagEvent,
        liveOps,
        rtConnected,
        paused,
        setPaused,
        soundOn,
        setSoundOn,
        autoBlock,
        setAutoBlock,
        mounted,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardContext must be used within a DashboardProvider");
  }
  return context;
}
