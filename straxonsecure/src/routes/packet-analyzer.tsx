import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi,
  Play,
  Square,
  Filter,
  Download,
  Search,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Globe,
  Server,
  Lock,
  Unlock,
  Radio,
  Brain,
  RefreshCw,
} from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { askAI } from "@/server/ai";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/packet-analyzer")({
  head: () => ({
    meta: [
      { title: "Packet Analyzer — Straxon Secure" },
      {
        name: "description",
        content:
          "Browser-based network packet analyzer. Capture, filter, and analyze simulated network traffic with protocol dissection.",
      },
    ],
  }),
  component: PacketAnalyzer,
});

// ─── Types ──────────────────────────────────────────────────────────────────

interface Packet {
  id: number;
  ts: string;
  src: string;
  dst: string;
  protocol: string;
  length: number;
  info: string;
  flags: string[];
  ttl: number;
  payload?: string;
  anomaly?: string;
  severity?: "critical" | "high" | "medium" | "low";
}

// ─── Packet Generation Engine ────────────────────────────────────────────────

const PROTOCOLS = ["TCP", "UDP", "HTTP", "HTTPS", "DNS", "ICMP", "ARP", "TLS", "SSH", "FTP"];
const INTERNAL_IPS = [
  "192.168.1.1",
  "192.168.1.10",
  "10.0.0.1",
  "10.0.0.5",
  "172.16.0.1",
  "192.168.0.254",
];
const EXTERNAL_IPS = [
  "185.220.101.42",
  "103.21.244.1",
  "45.142.212.100",
  "91.108.4.1",
  "203.0.113.1",
  "8.8.8.8",
  "1.1.1.1",
];

const ANOMALIES = [
  {
    trigger: "HTTP",
    chance: 0.1,
    anomaly: "Cleartext credentials in HTTP POST",
    severity: "high" as const,
  },
  {
    trigger: "DNS",
    chance: 0.08,
    anomaly: "DNS exfiltration: base64 encoded data in subdomain",
    severity: "critical" as const,
  },
  {
    trigger: "TCP",
    chance: 0.05,
    anomaly: "Port scan detected: sequential port sweep",
    severity: "medium" as const,
  },
  {
    trigger: "ICMP",
    chance: 0.12,
    anomaly: "ICMP tunnel: large payload suggests covert channel",
    severity: "high" as const,
  },
  {
    trigger: "FTP",
    chance: 0.3,
    anomaly: "Plaintext FTP authentication detected",
    severity: "high" as const,
  },
  {
    trigger: "TLS",
    chance: 0.04,
    anomaly: "TLS 1.0 negotiated — deprecated protocol",
    severity: "medium" as const,
  },
];

const HTTP_PATHS = [
  "/",
  "/api/login",
  "/api/users",
  "/admin/",
  "/wp-admin/",
  "/robots.txt",
  "/api/data",
  "/.env",
  "/config.php",
];
const DNS_QUERIES = [
  "google.com",
  "api.straxon.io",
  "update.windows.com",
  "d3fa2k.exfil.attacker.io",
  "c2.malware-host.ru",
  "github.com",
];

function generatePacket(id: number): Packet {
  const isExternal = Math.random() > 0.5;
  const src = isExternal
    ? EXTERNAL_IPS[Math.floor(Math.random() * EXTERNAL_IPS.length)]
    : INTERNAL_IPS[Math.floor(Math.random() * INTERNAL_IPS.length)];
  const dst = isExternal
    ? INTERNAL_IPS[Math.floor(Math.random() * INTERNAL_IPS.length)]
    : EXTERNAL_IPS[Math.floor(Math.random() * EXTERNAL_IPS.length)];
  const protocol = PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)];
  const srcPort = Math.floor(Math.random() * 60000) + 1024;
  const dstPort =
    protocol === "HTTP"
      ? 80
      : protocol === "HTTPS" || protocol === "TLS"
        ? 443
        : protocol === "DNS"
          ? 53
          : protocol === "SSH"
            ? 22
            : protocol === "FTP"
              ? 21
              : Math.floor(Math.random() * 1024);
  const length = Math.floor(Math.random() * 1400) + 40;
  const ttl = Math.floor(Math.random() * 128) + 64;

  let info = "";
  let payload: string | undefined;

  switch (protocol) {
    case "HTTP":
      const method = Math.random() > 0.7 ? "POST" : "GET";
      const path = HTTP_PATHS[Math.floor(Math.random() * HTTP_PATHS.length)];
      info = `${method} ${path} HTTP/1.1`;
      payload =
        method === "POST"
          ? `POST ${path} HTTP/1.1\nHost: target.com\nContent-Type: application/x-www-form-urlencoded\n\nusername=admin&password=hunter2`
          : undefined;
      break;
    case "DNS":
      const domain = DNS_QUERIES[Math.floor(Math.random() * DNS_QUERIES.length)];
      info = `Standard query A ${domain}`;
      payload = `Transaction ID: 0x${Math.floor(Math.random() * 65535)
        .toString(16)
        .padStart(4, "0")}\nQuery: ${domain}\nType: A`;
      break;
    case "TLS":
      info = `TLSv1.${Math.floor(Math.random() * 3)} ${Math.random() > 0.5 ? "Client Hello" : "Server Hello"}`;
      break;
    case "TCP":
      const flags = Math.random() > 0.7 ? ["SYN"] : Math.random() > 0.5 ? ["ACK"] : ["PSH", "ACK"];
      info = `${srcPort} → ${dstPort} [${flags.join(",")}] Seq=0 Ack=0`;
      break;
    case "ICMP":
      info = `Echo ${Math.random() > 0.5 ? "request" : "reply"} id=0x${Math.floor(Math.random() * 65535).toString(16)}`;
      break;
    case "ARP":
      info = `Who has ${dst}? Tell ${src}`;
      break;
    case "SSH":
      info = `Encrypted session data`;
      break;
    case "FTP":
      const ftpCmds = [
        "USER admin",
        "PASS hunter2",
        "LIST /",
        "RETR secret.txt",
        "STOR malware.exe",
      ];
      info = ftpCmds[Math.floor(Math.random() * ftpCmds.length)];
      payload = `220 FTP Server Ready\n${info}`;
      break;
    default:
      info = `${srcPort} → ${dstPort} len=${length}`;
  }

  // Check for anomaly
  let anomaly: string | undefined;
  let severity: Packet["severity"];
  for (const a of ANOMALIES) {
    if (protocol === a.trigger && Math.random() < a.chance) {
      anomaly = a.anomaly;
      severity = a.severity;
      break;
    }
  }

  const now = new Date();
  return {
    id,
    ts: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}.${now.getMilliseconds().toString().padStart(3, "0")}`,
    src: `${src}:${srcPort}`,
    dst: `${dst}:${dstPort}`,
    protocol,
    length,
    info,
    flags: [],
    ttl,
    payload,
    anomaly,
    severity,
  };
}

const PROTO_COLORS: Record<string, string> = {
  HTTP: "text-warning",
  HTTPS: "text-success",
  TLS: "text-success",
  DNS: "text-primary",
  TCP: "text-foreground/80",
  UDP: "text-foreground/60",
  ICMP: "text-neon-violet",
  ARP: "text-accent",
  SSH: "text-neon-lime",
  FTP: "text-destructive",
};

const SEV_COLORS: Record<string, string> = {
  critical: "bg-destructive/20 border-destructive/50 text-destructive",
  high: "bg-warning/20 border-warning/50 text-warning",
  medium: "bg-accent/20 border-accent/50 text-accent",
  low: "bg-primary/20 border-primary/50 text-primary",
};

function PacketRow({
  pkt,
  onClick,
  selected,
}: {
  pkt: Packet;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={`cursor-pointer transition-colors text-xs font-mono border-b border-border/20 ${
        pkt.anomaly
          ? "bg-destructive/5 hover:bg-destructive/10"
          : selected
            ? "bg-primary/10"
            : "hover:bg-muted/30"
      }`}
    >
      <td className="p-1.5 text-muted-foreground/60 w-12">{pkt.id}</td>
      <td className="p-1.5 text-muted-foreground">{pkt.ts}</td>
      <td className="p-1.5 text-foreground/80 max-w-[120px] truncate">{pkt.src}</td>
      <td className="p-1.5 text-foreground/80 max-w-[120px] truncate">{pkt.dst}</td>
      <td className={`p-1.5 font-bold ${PROTO_COLORS[pkt.protocol] ?? "text-foreground"}`}>
        {pkt.protocol}
      </td>
      <td className="p-1.5 text-muted-foreground">{pkt.length}</td>
      <td className="p-1.5 text-foreground/70 max-w-[200px] truncate">
        {pkt.anomaly ? <span className="text-destructive">⚠️ {pkt.anomaly}</span> : pkt.info}
      </td>
    </motion.tr>
  );
}

function PacketAnalyzer() {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [selected, setSelected] = useState<Packet | null>(null);
  const [filter, setFilter] = useState("");
  const [protoFilter, setProtoFilter] = useState("ALL");
  const [anomalyOnly, setAnomalyOnly] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<Record<number, string>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const counterRef = useRef(1);
  const tbodyRef = useRef<HTMLDivElement>(null);
  const captureStartRef = useRef<number>(Date.now());
  const { user } = useAuth();

  const start = () => {
    setCapturing(true);
    captureStartRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const burst = Math.floor(Math.random() * 3) + 1;
      setPackets((p) => {
        const newPkts = Array.from({ length: burst }, () => generatePacket(counterRef.current++));
        return [...newPkts, ...p].slice(0, 500);
      });
    }, 300);
    toast.success("📡 Capture started", { duration: 2000 });
  };

  const stop = async () => {
    setCapturing(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const durationSeconds = Math.round((Date.now() - captureStartRef.current) / 1000);
    const anomalyCount = packets.filter((p) => p.anomaly).length;
    toast.info(`⏹️ Capture stopped — ${packets.length} packets, ${anomalyCount} anomalies`, { duration: 3000 });
    // Persist session to Supabase
    if (user && packets.length > 0) {
      try {
        await supabase.from("pcap_sessions").insert({
          user_id: user.id,
          name: `Capture ${new Date().toLocaleString()}`,
          packets: packets.slice(0, 200).map((p) => ({
            id: p.id, ts: p.ts, src: p.src, dst: p.dst,
            protocol: p.protocol, length: p.length, info: p.info,
            anomaly: p.anomaly ?? null, severity: p.severity ?? null,
          })),
          anomalies_detected: anomalyCount,
          duration_seconds: durationSeconds,
        });
        toast.success("💾 Session saved to history", { duration: 2000 });
      } catch (e: any) {
        console.warn("[Packets] Failed to save session:", e.message);
      }
    }
  };

  const clear = () => {
    setPackets([]);
    setSelected(null);
    setAiAnalysis({});
    counterRef.current = 1;
  };

  const analyzePacket = async (pkt: Packet) => {
    if (aiAnalysis[pkt.id] || analyzing) return;
    setAnalyzing(true);
    try {
      const pktData = `ID: ${pkt.id}\nTime: ${pkt.ts}\nSrc: ${pkt.src}\nDst: ${pkt.dst}\nProto: ${pkt.protocol}\nLen: ${pkt.length}\nInfo: ${pkt.info}\nPayload: ${pkt.payload ?? "None"}\nAnomaly Flag: ${pkt.anomaly ?? "None"}`;
      const res = await askAI({
        data: {
          messages: [
            {
              role: "user",
              content: `You are a SOC analyst performing Deep Packet Inspection (DPI). Analyze this network packet and provide a concise security assessment:\n\n${pktData}\n\nProvide:\n## 🔍 Packet Analysis\n## ⚠️ Threat Assessment (if any)\n## 🛡️ Recommended Action\n\nKeep it under 200 words.`,
            },
          ],
          mode: "explain",
        },
      });
      setAiAnalysis((prev) => ({ ...prev, [pkt.id]: res.reply }));
    } catch {
      toast.error("AI analysis failed — check GEMINI_API_KEY");
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    [],
  );

  const filtered = packets.filter((p) => {
    if (protoFilter !== "ALL" && p.protocol !== protoFilter) return false;
    if (anomalyOnly && !p.anomaly) return false;
    if (
      filter &&
      !p.src.includes(filter) &&
      !p.dst.includes(filter) &&
      !p.info.toLowerCase().includes(filter.toLowerCase()) &&
      !p.protocol.toLowerCase().includes(filter.toLowerCase())
    )
      return false;
    return true;
  });

  const anomalies = packets.filter((p) => p.anomaly);
  const protoStats: Record<string, number> = {};
  for (const p of packets) protoStats[p.protocol] = (protoStats[p.protocol] ?? 0) + 1;

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <SectionHeading
        eyebrow="// NETWORK FORENSICS"
        title="Packet Analyzer"
        description="Real-time network traffic capture with protocol dissection, anomaly detection, and deep packet inspection."
      />

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {!capturing ? (
          <CyberButton onClick={start} variant="cyan">
            <Play className="h-4 w-4" /> Start Capture
          </CyberButton>
        ) : (
          <CyberButton onClick={stop} variant="magenta">
            <Square className="h-4 w-4" /> Stop
          </CyberButton>
        )}
        <CyberButton onClick={clear} variant="cyan" className="opacity-70">
          Clear
        </CyberButton>

        {/* Protocol filter */}
        <div className="flex gap-1.5 flex-wrap">
          {["ALL", ...PROTOCOLS.slice(0, 6)].map((p) => (
            <button
              key={p}
              onClick={() => setProtoFilter(p)}
              className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${protoFilter === p ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setAnomalyOnly((a) => !a)}
            className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${anomalyOnly ? "border-destructive bg-destructive/10 text-destructive" : "border-border text-muted-foreground"}`}
          >
            ⚠️ Anomalies Only
          </button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter packets..."
              className="bg-background/60 border border-border rounded pl-8 pr-3 py-1.5 font-mono text-xs focus:border-primary outline-none w-40"
            />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CyberCard variant="cyan" className="py-3">
          <div className="flex items-center gap-2">
            <Wifi
              className={`h-4 w-4 ${capturing ? "text-success animate-pulse" : "text-muted-foreground"}`}
            />
            <div>
              <div className="text-xs font-mono text-muted-foreground">STATUS</div>
              <div
                className={`font-display font-bold ${capturing ? "text-success" : "text-muted-foreground"}`}
              >
                {capturing ? "CAPTURING" : "IDLE"}
              </div>
            </div>
          </div>
        </CyberCard>
        <CyberCard variant="cyan" className="py-3">
          <div className="text-xs font-mono text-muted-foreground">PACKETS</div>
          <div className="font-display text-2xl font-bold text-primary">{packets.length}</div>
        </CyberCard>
        <CyberCard variant={anomalies.length > 0 ? "magenta" : "cyan"} className="py-3">
          <div className="text-xs font-mono text-muted-foreground">ANOMALIES</div>
          <div
            className={`font-display text-2xl font-bold ${anomalies.length > 0 ? "text-destructive" : "text-success"}`}
          >
            {anomalies.length}
          </div>
        </CyberCard>
        <CyberCard variant="cyan" className="py-3">
          <div className="text-xs font-mono text-muted-foreground">TOP PROTOCOL</div>
          <div className="font-display text-2xl font-bold text-primary">
            {Object.entries(protoStats).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "—"}
          </div>
        </CyberCard>
      </div>

      {/* Anomaly Alerts */}
      <AnimatePresence>
        {anomalies.slice(0, 3).map((a) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-3 rounded border flex items-start gap-3 ${SEV_COLORS[a.severity ?? "low"]}`}
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="font-mono text-xs">
              <span className="font-bold">{a.severity?.toUpperCase()}: </span>
              {a.anomaly}
              <span className="text-muted-foreground ml-2">
                {a.src} → {a.dst}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Packet Table */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CyberCard variant="cyan" className="p-0 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border/50 bg-background/50 flex items-center justify-between">
              <span className="text-xs font-mono text-primary">// LIVE CAPTURE</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {filtered.length} packets
              </span>
            </div>
            <div ref={tbodyRef} className="overflow-auto max-h-[500px]">
              <table className="w-full">
                <thead className="sticky top-0 bg-background/90 backdrop-blur">
                  <tr className="text-[10px] font-mono text-muted-foreground border-b border-border/50">
                    <th className="p-1.5 text-left w-12">#</th>
                    <th className="p-1.5 text-left">Time</th>
                    <th className="p-1.5 text-left">Source</th>
                    <th className="p-1.5 text-left">Destination</th>
                    <th className="p-1.5 text-left">Proto</th>
                    <th className="p-1.5 text-left">Len</th>
                    <th className="p-1.5 text-left">Info</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map((p) => (
                    <PacketRow
                      key={p.id}
                      pkt={p}
                      onClick={() => setSelected(p)}
                      selected={selected?.id === p.id}
                    />
                  ))}
                </tbody>
              </table>
              {packets.length === 0 && (
                <div className="p-8 text-center text-muted-foreground font-mono text-sm">
                  Press Start Capture to begin monitoring...
                </div>
              )}
            </div>
          </CyberCard>
        </div>

        {/* Packet Detail */}
        <CyberCard variant="cyan" className="p-0 overflow-hidden flex flex-col max-h-[500px]">
          <div className="px-4 py-2.5 border-b border-border/50 bg-background/50 flex items-center justify-between">
            <span className="text-xs font-mono text-primary">// PACKET DETAIL</span>
            {selected && (
              <CyberButton
                size="sm"
                variant="magenta"
                onClick={() => analyzePacket(selected)}
                disabled={analyzing || !!aiAnalysis[selected.id]}
                className="py-1 px-2 h-auto text-[10px]"
              >
                {analyzing ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Brain className="h-3 w-3 mr-1" />
                )}
                {aiAnalysis[selected.id] ? "Analyzed" : "Deep Inspect"}
              </CyberButton>
            )}
          </div>
          <div className="p-4 font-mono text-xs space-y-3 overflow-auto flex-1">
            {selected ? (
              <>
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Frame
                  </div>
                  <div>Length: {selected.length} bytes</div>
                  <div>Timestamp: {selected.ts}</div>
                  <div>TTL: {selected.ttl}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Network
                  </div>
                  <div>
                    Src: <span className="text-primary">{selected.src}</span>
                  </div>
                  <div>
                    Dst: <span className="text-primary">{selected.dst}</span>
                  </div>
                  <div>
                    Protocol:{" "}
                    <span className={PROTO_COLORS[selected.protocol]}>{selected.protocol}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Info
                  </div>
                  <div className="text-foreground/80">{selected.info}</div>
                </div>
                {selected.anomaly && (
                  <div className={`p-2 rounded border ${SEV_COLORS[selected.severity ?? "low"]}`}>
                    <div className="font-bold mb-1">⚠️ ANOMALY DETECTED</div>
                    <div>{selected.anomaly}</div>
                  </div>
                )}
                {selected.payload && (
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Payload
                    </div>
                    <pre className="bg-background/60 border border-border rounded p-2 text-[10px] whitespace-pre-wrap break-all text-warning">
                      {selected.payload}
                    </pre>
                  </div>
                )}
                {/* AI Analysis Result */}
                {aiAnalysis[selected.id] && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="text-[10px] text-[#ff003c] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Brain className="h-3 w-3" /> STRAXON AI DEEP INSPECTION
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none prose-headings:text-[#ff003c] prose-headings:font-mono prose-headings:text-xs prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
                      <ReactMarkdown>{aiAnalysis[selected.id]}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-muted-foreground italic text-center mt-10">
                Click a packet to inspect
              </div>
            )}
          </div>
        </CyberCard>
      </div>
    </div>
  );
}
