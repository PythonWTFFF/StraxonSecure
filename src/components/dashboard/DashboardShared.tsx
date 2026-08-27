import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Shield,
  Globe,
  Search,
  ShieldAlert,
  HardDrive,
  Fingerprint,
  Activity,
  Bell,
  BellOff,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  BarChart3,
  TrendingUp,
  MapPin,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  Lock,
  AlertTriangle,
  Zap,
  Eye,
  Radio,
  Users,
  Network,
  Database,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import type { AttackEvent } from "@/components/dashboard/AttackGlobe";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { lazy, Suspense } from "react";

const AttackGlobe = lazy(() =>
  import("@/components/dashboard/AttackGlobe").then((m) => ({ default: m.AttackGlobe })),
);
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AIAnalystPanel } from "@/components/cyber/AIAnalystPanel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type Severity = "low" | "medium" | "high" | "critical";
type Protocol = "TCP" | "UDP" | "HTTP" | "HTTPS" | "DNS" | "ICMP";
type TabKey = "globe" | "events" | "blocked" | "rules" | "analytics" | "anomalies";

interface ThreatEvent {
  id: string;
  ts: number;
  severity: Severity;
  type: string;
  mitreClass: string;
  mitreId: string;
  ip: string;
  asn: string;
  country: string;
  lat: number;
  lng: number;
  target: string;
  port: number;
  protocol: Protocol;
  confidence: number;
  payloadHash: string;
  bytes: number;
  packets: number;
  ttl: number;
  flagged: boolean;
  actionTaken?: "block" | "null-route" | "quarantine" | "alert";
}

interface BlockedIP {
  ip: string;
  ts: number;
  reason: string;
  country: string;
  events: number;
}

interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  severity: Severity;
  count: number;
  lastFired?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const SEV_COLORS: Record<Severity, string> = {
  critical: "#ff0033",
  high: "#ff6b35",
  medium: "#ffaa00",
  low: "#00d4ff",
};
const SEV_BG: Record<Severity, string> = {
  critical: "rgba(255,0,51,0.12)",
  high: "rgba(255,107,53,0.12)",
  medium: "rgba(255,170,0,0.10)",
  low: "rgba(0,212,255,0.08)",
};

const COUNTRIES = [
  { name: "RU", lat: 55.7, lng: 37.6, asn: "AS12389 Rostelecom" },
  { name: "CN", lat: 39.9, lng: 116.4, asn: "AS4134 ChinaNet" },
  { name: "US", lat: 38.9, lng: -77.0, asn: "AS7018 AT&T Services" },
  { name: "BR", lat: -15.8, lng: -47.9, asn: "AS28573 Claro S.A." },
  { name: "KP", lat: 39.0, lng: 125.7, asn: "AS131279 Ryugyong Dong" },
  { name: "IR", lat: 35.7, lng: 51.4, asn: "AS58224 Iran Telecom" },
  { name: "NG", lat: 9.1, lng: 7.4, asn: "AS37049 Airtel Nigeria" },
  { name: "UA", lat: 50.4, lng: 30.5, asn: "AS15895 Kyivstar GSM" },
  { name: "IN", lat: 28.6, lng: 77.2, asn: "AS45609 BHARTI Airtel" },
  { name: "VN", lat: 21.0, lng: 105.8, asn: "AS45899 VNPT Corp" },
];

const ATTACK_VECTORS = [
  {
    type: "SQL Injection",
    mitreClass: "Execution",
    mitreId: "T1059",
    port: 443,
    proto: "HTTP" as Protocol,
  },
  {
    type: "SSH Brute Force",
    mitreClass: "Access",
    mitreId: "T1110",
    port: 22,
    proto: "TCP" as Protocol,
  },
  {
    type: "DDoS SYN Flood",
    mitreClass: "Impact",
    mitreId: "T1498",
    port: 80,
    proto: "TCP" as Protocol,
  },
  {
    type: "Path Traversal",
    mitreClass: "Evasion",
    mitreId: "T1055",
    port: 443,
    proto: "HTTPS" as Protocol,
  },
  {
    type: "DNS Amplification",
    mitreClass: "Impact",
    mitreId: "T1498",
    port: 53,
    proto: "DNS" as Protocol,
  },
  {
    type: "Data Exfiltration",
    mitreClass: "Exfiltration",
    mitreId: "T1048",
    port: 443,
    proto: "HTTPS" as Protocol,
  },
  {
    type: "Credential Stuffing",
    mitreClass: "Access",
    mitreId: "T1110",
    port: 443,
    proto: "HTTP" as Protocol,
  },
  {
    type: "RCE Exploit",
    mitreClass: "Execution",
    mitreId: "T1203",
    port: 8080,
    proto: "HTTP" as Protocol,
  },
  {
    type: "ICMP Ping Flood",
    mitreClass: "Impact",
    mitreId: "T1498",
    port: 0,
    proto: "ICMP" as Protocol,
  },
  { type: "C2 Beacon", mitreClass: "C2", mitreId: "T1071", port: 443, proto: "HTTPS" as Protocol },
  { type: "Port Scan", mitreClass: "Recon", mitreId: "T1046", port: 0, proto: "TCP" as Protocol },
  {
    type: "XSS Payload",
    mitreClass: "Execution",
    mitreId: "T1059",
    port: 443,
    proto: "HTTP" as Protocol,
  },
];

const TARGETS = [
  "api.straxon.io",
  "db-cluster-01",
  "auth-gateway",
  "edge-router-eu",
  "cdn-origin-1",
  "vpn-concentrator",
  "api/login",
  "wp-admin",
  "/.env",
];

const THREAT_INTEL = [
  {
    id: "ti1",
    label: "CVE-2025-1337",
    text: "Critical RCE in popular logging lib. Patch immediately.",
    sev: "critical" as Severity,
  },
  {
    id: "ti2",
    label: "Mirai-X Botnet",
    text: "Surge in IoT-based DDoS from APAC region.",
    sev: "high" as Severity,
  },
  {
    id: "ti3",
    label: "Credential Dump",
    text: "Dark-web dumps detected — rotate all admin keys now.",
    sev: "high" as Severity,
  },
  {
    id: "ti4",
    label: "Phishing Wave",
    text: "Fake Google OAuth pages targeting SaaS admins.",
    sev: "medium" as Severity,
  },
  {
    id: "ti5",
    label: "APT28 Activity",
    text: "Spear-phishing campaign targeting EU government orgs.",
    sev: "critical" as Severity,
  },
];

const DEFAULT_RULES: AlertRule[] = [
  { id: "r1", name: "Critical Severity Auto-Block", enabled: true, severity: "critical", count: 0 },
  { id: "r2", name: "SSH Brute Force (>5 / min)", enabled: true, severity: "high", count: 0 },
  { id: "r3", name: "Data Exfil Detection", enabled: true, severity: "high", count: 0 },
  { id: "r4", name: "C2 Beacon Activity", enabled: false, severity: "critical", count: 0 },
  { id: "r5", name: "Low Confidence Alerts", enabled: false, severity: "low", count: 0 },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
export function uid() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}
const ri = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export function fmtBytes(b: number) {
  if (b < 1024) return `${b}B`;
  if (b < 1_048_576) return `${(b / 1024).toFixed(1)}KB`;
  return `${(b / 1_048_576).toFixed(2)}MB`;
}
export function fmtTime(ts: number) {
  return new Date(ts).toISOString().split("T")[1].slice(0, 8);
}

export function hexDump(seed: string) {
  const HEX = "0123456789ABCDEF";
  let h = 0;
  for (const c of seed) h = ((h << 5) - h + c.charCodeAt(0)) | 0;
  let out = "";
  for (let i = 0; i < 8; i++) {
    let hex = "",
      ascii = "";
    for (let j = 0; j < 8; j++) {
      h = ((h << 5) - h + i * 8 + j) | 0;
      const b1 = Math.abs(h >> 4) & 0xf,
        b2 = Math.abs(h) & 0xf;
      hex += `${HEX[b1]}${HEX[b2]} `;
      const code = (b1 << 4) | b2;
      ascii += code > 32 && code < 127 ? String.fromCharCode(code) : ".";
    }
    out += `0x${i.toString(16).toUpperCase().padStart(4, "0")}: ${hex} ${ascii}\n`;
  }
  return out;
}

function mkEvent(historical = false): ThreatEvent {
  const c = COUNTRIES[ri(0, COUNTRIES.length - 1)];
  const v = ATTACK_VECTORS[ri(0, ATTACK_VECTORS.length - 1)];
  const pool: Severity[] = ["low", "low", "medium", "medium", "high", "high", "critical"];
  return {
    id: uid(),
    ts: historical ? Date.now() - Math.random() * 120_000 : Date.now(),
    severity: pool[ri(0, pool.length - 1)],
    type: v.type,
    mitreClass: v.mitreClass,
    mitreId: v.mitreId,
    port: v.port,
    protocol: v.proto,
    ip: `${ri(1, 254)}.${ri(0, 255)}.${ri(0, 255)}.${ri(1, 254)}`,
    asn: c.asn,
    country: c.name,
    lat: c.lat + (Math.random() - 0.5) * 5,
    lng: c.lng + (Math.random() - 0.5) * 5,
    target: TARGETS[ri(0, TARGETS.length - 1)],
    confidence: ri(62, 99),
    payloadHash: Array.from({ length: 32 }, () => "0123456789abcdef"[ri(0, 15)]).join(""),
    bytes: ri(64, 65536),
    packets: ri(1, 1200),
    ttl: ri(32, 128),
    flagged: Math.random() > 0.82,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOLTIP CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const TTP = {
  contentStyle: {
    background: "#020617",
    border: "1px solid #00d4ff33",
    fontSize: 11,
    fontFamily: "monospace",
    borderRadius: 4,
  },
  labelStyle: { color: "#64748b" },
  itemStyle: { color: "#00d4ff" },
};

// ─────────────────────────────────────────────────────────────────────────────
// GLITCH HEADLINE
// ─────────────────────────────────────────────────────────────────────────────
export function GlitchHeadline() {
  return (
    <>
      <style>{`
        @keyframes soc-g1{0%{clip-path:inset(18% 0 70% 0);transform:translate(-3px,2px) skewX(-1deg)}20%{clip-path:inset(55% 0 20% 0);transform:translate(3px,-1px) skewX(1deg)}40%{clip-path:inset(5% 0 85% 0);transform:translate(-2px,3px)}60%{clip-path:inset(80% 0 5% 0);transform:translate(2px,-2px) skewX(-1deg)}80%{clip-path:inset(35% 0 45% 0);transform:translate(-1px,1px)}100%{clip-path:inset(60% 0 25% 0);transform:translate(1px,-1px) skewX(1deg)}}
        @keyframes soc-g2{0%{clip-path:inset(65% 0 10% 0);transform:translate(2px,-2px)}33%{clip-path:inset(12% 0 60% 0);transform:translate(-3px,1px)}66%{clip-path:inset(82% 0 3% 0);transform:translate(3px,2px)}100%{clip-path:inset(28% 0 48% 0);transform:translate(-2px,-1px)}}
        @keyframes soc-rgb{0%,100%{text-shadow:0 0 10px rgba(0,212,255,.4),0 0 30px rgba(0,212,255,.1)}50%{text-shadow:0 0 14px rgba(0,212,255,.65),0 0 40px rgba(0,212,255,.15),2px 0 rgba(255,0,51,.15),-2px 0 rgba(0,212,255,.15)}}
        @keyframes soc-scan{0%{transform:translateY(-100%);opacity:0}5%{opacity:.6}95%{opacity:.3}100%{transform:translateY(100vh);opacity:0}}
        .soc-glitch{position:relative;display:inline-block}
        .soc-glitch::before,.soc-glitch::after{content:attr(data-text);position:absolute;inset:0;background:transparent;font-weight:inherit;font-size:inherit;letter-spacing:inherit;line-height:inherit;color:inherit}
        .soc-glitch::before{text-shadow:-2px 0 #ff0033;animation:soc-g1 3.2s infinite linear alternate-reverse}
        .soc-glitch::after{text-shadow:-2px 0 #00d4ff;animation:soc-g2 3.8s infinite linear alternate-reverse}
        .soc-rgb{animation:soc-rgb 4s ease-in-out infinite}
        .soc-scanline::after{content:'';position:fixed;top:0;left:0;right:0;height:2px;background:linear-gradient(transparent,rgba(0,212,255,.05),transparent);animation:soc-scan 9s linear infinite;pointer-events:none;z-index:9999}
        .cs::-webkit-scrollbar{width:3px;height:3px}
        .cs::-webkit-scrollbar-track{background:transparent}
        .cs::-webkit-scrollbar-thumb{background:#1e293b;border-radius:4px}
        .cs::-webkit-scrollbar-thumb:hover{background:#334155}
      `}</style>
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-cyan-400 shrink-0" />
        <h1
          className="soc-rgb text-xl font-bold text-cyan-400 tracking-tight font-mono select-none"
          data-text="STRAXON OVERWATCH"
        >
          STRAXON OVERWATCH
        </h1>
        <span className="text-[9px] text-slate-600 border border-slate-800 px-1.5 py-0.5 rounded font-mono ml-1">
          v4.2.0
        </span>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED ATOMS
// ─────────────────────────────────────────────────────────────────────────────
export function Panel({
  children,
  className = "",
  title,
  titleRight,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  titleRight?: ReactNode;
}) {
  return (
    <div
      className={`bg-slate-900/50 border border-slate-800 rounded-lg backdrop-blur-sm flex flex-col ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/70 shrink-0">
          <div className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest flex items-center gap-1.5">
            {title}
          </div>
          {titleRight && <div className="text-[10px] font-mono text-slate-500">{titleRight}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function SevBadge({ sev }: { sev: Severity }) {
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase"
      style={{ color: SEV_COLORS[sev], background: SEV_BG[sev] }}
    >
      {sev.slice(0, 4)}
    </span>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`w-8 h-4 rounded-full transition-colors relative shrink-0 ${on ? "bg-cyan-600" : "bg-slate-700"}`}
    >
      <div
        className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`}
      />
    </button>
  );
}

export function SevFilter({
  active,
  onChange,
}: {
  active: Severity[];
  onChange: (f: Severity[]) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {(["critical", "high", "medium", "low"] as Severity[]).map((s) => (
        <button
          key={s}
          onClick={() =>
            onChange(active.includes(s) ? active.filter((x) => x !== s) : [...active, s])
          }
          className="text-[8px] px-1.5 py-0.5 rounded font-mono uppercase border transition-colors"
          style={{
            color: active.includes(s) ? "#020617" : SEV_COLORS[s],
            background: active.includes(s) ? SEV_COLORS[s] : "transparent",
            borderColor: SEV_COLORS[s] + "55",
          }}
        >
          {s.slice(0, 4)}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT FEED COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function EventFeed({
  events,
  selectedId,
  onSelectId,
  blockIP,
  flagEvent,
}: {
  events: ThreatEvent[];
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
  blockIP: (ip: string, country: string, reason: string) => void;
  flagEvent: (id: string) => void;
}) {
  const [filterSev, setFilterSev] = useState<Severity[]>([]);
  const [filterCountry, setFilterCountry] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const filtered = useMemo(
    () =>
      events.filter((e) => {
        if (filterSev.length > 0 && !filterSev.includes(e.severity)) return false;
        if (filterCountry && e.country !== filterCountry) return false;
        if (filterSearch) {
          const q = filterSearch.toLowerCase();
          if (
            !e.ip.includes(q) &&
            !e.type.toLowerCase().includes(q) &&
            !e.country.toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      }),
    [events, filterSev, filterCountry, filterSearch],
  );

  const hasFilter = filterSev.length > 0 || filterSearch || filterCountry;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-slate-800/50 shrink-0">
        <div className="relative flex-1 min-w-[110px] max-w-[180px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600" />
          <input
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="IP, type, country…"
            className="w-full bg-slate-900 border border-slate-700/70 rounded pl-6 pr-2 py-1 text-[9px] focus:outline-none focus:border-cyan-600 text-slate-300 placeholder:text-slate-600 font-mono"
          />
        </div>
        <SevFilter active={filterSev} onChange={setFilterSev} />
        {hasFilter && (
          <button
            onClick={() => {
              setFilterSev([]);
              setFilterSearch("");
              setFilterCountry("");
            }}
            className="text-slate-500 hover:text-red-400 transition-colors p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <span className="text-[9px] font-mono text-slate-600 ml-auto">
          {filtered.length}/{events.length}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto cs min-h-0 table-responsive pb-safe">
        <table className="w-full text-left text-[10px] font-mono">
          <thead className="sticky top-0 bg-slate-950/95 text-slate-500 z-10 border-b border-slate-800/50">
            <tr>
              <th className="px-3 py-2 font-normal whitespace-nowrap">TIME</th>
              <th className="px-2 py-2 font-normal">SEV</th>
              <th className="px-2 py-2 font-normal">SOURCE</th>
              <th className="px-2 py-2 font-normal hidden sm:table-cell">VECTOR</th>
              <th className="px-2 py-2 font-normal hidden md:table-cell">MITRE</th>
              <th className="px-2 py-2 font-normal hidden lg:table-cell">PROTO</th>
              <th className="px-2 py-2 font-normal hidden xl:table-cell text-right">TARGET</th>
              <th className="px-2 py-2 font-normal w-10"></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {filtered.slice(0, 120).map((e) => (
                <motion.tr
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => onSelectId(selectedId === e.id ? null : e.id)}
                  className={[
                    "border-b border-slate-800/30 cursor-pointer transition-colors hover:bg-slate-800/25",
                    selectedId === e.id ? "bg-cyan-950/25 border-b-cyan-900/30" : "",
                    e.flagged ? "bg-yellow-950/8" : "",
                    e.severity === "critical" ? "hover:bg-red-950/10" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <td className="px-3 py-1.5 text-slate-500 whitespace-nowrap">{fmtTime(e.ts)}</td>
                  <td className="px-2 py-1.5">
                    <SevBadge sev={e.severity} />
                  </td>
                  <td className="px-2 py-1.5">
                    <span className="text-slate-300">{e.ip}</span>
                    <span className="text-slate-600 ml-1 hidden xs:inline">[{e.country}]</span>
                  </td>
                  <td
                    className="px-2 py-1.5 hidden sm:table-cell max-w-[110px] truncate"
                    style={{ color: SEV_COLORS[e.severity] }}
                  >
                    {e.type}
                  </td>
                  <td className="px-2 py-1.5 text-slate-600 hidden md:table-cell">{e.mitreId}</td>
                  <td className="px-2 py-1.5 hidden lg:table-cell">
                    <span className="text-[8px] px-1 py-0.5 rounded border border-slate-700 text-slate-400">
                      {e.protocol}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-slate-500 hidden xl:table-cell text-right whitespace-nowrap">
                    {e.target}:{e.port}
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      {e.actionTaken ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            blockIP(e.ip, e.country, e.type);
                          }}
                          className="text-slate-600 hover:text-red-400 transition-colors"
                          title="Block IP"
                        >
                          <Shield className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={(ev) => {
                          ev.stopPropagation();
                          flagEvent(e.id);
                        }}
                        className={`transition-colors ${e.flagged ? "text-yellow-400" : "text-slate-700 hover:text-yellow-400"}`}
                      >
                        <Bell className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        <p className="text-center py-3 text-[9px] text-slate-600 font-mono">
          Showing {Math.min(120, filtered.length)} of {filtered.length} events
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DPI PANEL
// ─────────────────────────────────────────────────────────────────────────────
export function DPIPanel({
  event,
  onClose,
  blockIP,
  flagEvent,
}: {
  event: ThreatEvent | null;
  onClose: () => void;
  blockIP: (ip: string, country: string, reason: string) => void;
  flagEvent: (id: string) => void;
}) {
  const [hexFull, setHexFull] = useState(false);

  if (!event) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-700 gap-3 p-6">
        <Fingerprint className="h-14 w-14 opacity-15" />
        <p className="text-[10px] font-mono text-center uppercase tracking-widest">
          Select an event
          <br />
          to initialize
          <br />
          inspection
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto cs p-3 space-y-3 text-[10px] font-mono">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SevBadge sev={event.severity} />
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              navigator.clipboard.writeText(event.ip);
              toast.success("IP copied");
            }}
            className="text-slate-500 hover:text-cyan-400 transition-colors p-1"
          >
            <Copy className="h-3 w-3" />
          </button>
          <span className="text-slate-600">{fmtTime(event.ts)}</span>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-red-400 transition-colors p-0.5 ml-1"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Origin */}
      <div>
        <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">
          Origin Telemetry
        </div>
        <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
          {[
            ["IP", event.ip, "text-cyan-400"],
            ["COUNTRY", event.country, "text-slate-300"],
            ["ASN", event.asn, "text-slate-400"],
            ["GEO", `${event.lat.toFixed(2)}, ${event.lng.toFixed(2)}`, "text-slate-500"],
            ["PROTO", `${event.protocol}/${event.port}`, "text-slate-300"],
            ["TTL", String(event.ttl), "text-slate-400"],
          ].map(([k, v, c]) => (
            <div key={k} className="flex justify-between gap-2">
              <span className="text-slate-600 shrink-0">{k}:</span>
              <span className={`text-right truncate ${c}`}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Threat */}
      <div>
        <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1">
          Threat Context
        </div>
        <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
          {[
            ["TYPE", event.type, "text-pink-400"],
            ["MITRE", `${event.mitreId} · ${event.mitreClass}`, "text-purple-400"],
            [
              "CONF",
              `${event.confidence}%`,
              event.confidence >= 90 ? "text-red-400" : "text-green-400",
            ],
            ["BYTES", fmtBytes(event.bytes), "text-slate-300"],
            ["PACKETS", String(event.packets), "text-slate-300"],
            ["TARGET", `${event.target}:${event.port}`, "text-slate-400"],
          ].map(([k, v, c]) => (
            <div key={k} className="flex justify-between gap-2">
              <span className="text-slate-600 shrink-0">{k}:</span>
              <span className={`text-right truncate ${c}`}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Confidence */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[9px] text-slate-600 uppercase tracking-widest">Confidence</span>
          <span className={event.confidence >= 90 ? "text-red-400" : "text-green-400"}>
            {event.confidence}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${event.confidence}%`,
              background: event.confidence >= 90 ? "#ff0033" : "#00ff88",
            }}
          />
        </div>
      </div>

      {/* Hex dump */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-slate-600 uppercase tracking-widest">Payload Dump</span>
          <button
            onClick={() => setHexFull((f) => !f)}
            className="text-slate-600 hover:text-cyan-400 transition-colors"
          >
            {hexFull ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
        <pre
          className="bg-[#050a12] p-2 rounded border border-slate-800 text-[9px] text-slate-500 leading-tight overflow-auto cs whitespace-pre"
          style={{ maxHeight: hexFull ? 240 : 108 }}
        >
          {hexDump(event.payloadHash)}
        </pre>
        <p className="text-[8px] text-slate-700 mt-1 truncate">SHA256: {event.payloadHash}</p>
      </div>

      {/* Actions */}
      <div className="space-y-1.5 pt-1">
        <button
          onClick={() => blockIP(event.ip, event.country, event.type)}
          disabled={!!event.actionTaken}
          className="w-full py-2 bg-red-950/40 border border-red-900/60 hover:bg-red-900/50 text-red-400 text-[10px] uppercase tracking-widest transition-colors rounded flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Shield className="h-3 w-3" /> Block IP + Null-Route
        </button>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(event, null, 2));
              toast.success("JSON copied");
            }}
            className="py-1.5 bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 text-slate-300 text-[9px] uppercase tracking-wider transition-colors rounded flex items-center justify-center gap-1"
          >
            <Copy className="h-2.5 w-2.5" /> Export
          </button>
          <button
            onClick={() => flagEvent(event.id)}
            className={`py-1.5 border text-[9px] uppercase tracking-wider transition-colors rounded flex items-center justify-center gap-1 ${
              event.flagged
                ? "bg-yellow-950/40 border-yellow-700 text-yellow-400"
                : "bg-slate-800/50 border-slate-700 text-slate-300 hover:border-yellow-700"
            }`}
          >
            <Bell className="h-2.5 w-2.5" /> {event.flagged ? "Unflag" : "Flag"}
          </button>
        </div>
        <button className="w-full py-1.5 bg-slate-800/40 border border-slate-700 hover:bg-slate-700/40 text-slate-400 text-[9px] uppercase tracking-wider transition-colors rounded flex items-center justify-center gap-1.5">
          <HardDrive className="h-2.5 w-2.5" /> Send to SIEM
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THREAT ENGINE HOOK (with Supabase realtime)
// ─────────────────────────────────────────────────────────────────────────────
function useThreatEngine(paused: boolean, mounted: boolean) {
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [liveOps, setLiveOps] = useState(1);
  const [rtConnected, setRtConnected] = useState(false);
  const blockedSet = useRef(new Set<string>());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Seed historical events
  useEffect(() => {
    if (!mounted) return;
    setEvents(Array.from({ length: 30 }, () => mkEvent(true)).sort((a, b) => b.ts - a.ts));
  }, [mounted]);

  // Supabase realtime
  useEffect(() => {
    const handleIncoming = (e: ThreatEvent) => {
      if (!blockedSet.current.has(e.ip)) {
        setEvents((prev) => [e, ...prev].slice(0, 200));
      }
    };

    const channel = supabase
      .channel("soc-live", { config: { presence: { key: uid() } } })
      .on("broadcast", { event: "attack" }, ({ payload }) => handleIncoming(payload as ThreatEvent))
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "soc_events" },
        (payload) => {
          const r = payload.new as any;
          handleIncoming({
            id: r.id,
            ts: Date.now(),
            severity: r.severity,
            type: r.attack_type,
            mitreClass: r.mitre_class ?? "Unknown",
            mitreId: r.mitre_id ?? "T0000",
            ip: r.source_ip ?? "0.0.0.0",
            asn: r.asn ?? "Unknown",
            country: r.source_country ?? "??",
            lat: r.source_lat ?? 0,
            lng: r.source_lng ?? 0,
            target: r.target ?? "/",
            port: r.port ?? 443,
            protocol: r.protocol ?? "TCP",
            confidence: r.confidence ?? 75,
            payloadHash: r.payload_hash ?? "0".repeat(32),
            bytes: r.bytes ?? 512,
            packets: r.packets ?? 1,
            ttl: r.ttl ?? 64,
            flagged: false,
          });
        },
      )
      .on("presence", { event: "sync" }, () => {
        setLiveOps(Object.keys(channel.presenceState()).length || 1);
      })
      .subscribe(async (status) => {
        setRtConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") await channel.track({ online_at: new Date().toISOString() });
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Local simulator — broadcasts so all tabs get it
  useEffect(() => {
    if (paused || !mounted) return;
    let visible = true;
    const onVis = () => {
      visible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    const iv = setInterval(
      () => {
        if (!visible) return;
        const e = mkEvent();
        const ch = channelRef.current;
        if (ch && rtConnected) {
          ch.send({ type: "broadcast", event: "attack", payload: e });
        } else if (!blockedSet.current.has(e.ip)) {
          setEvents((prev) => [e, ...prev].slice(0, 200));
        }
      },
      ri(600, 1800),
    );

    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [paused, mounted, rtConnected]);

  const blockIP = useCallback((ip: string, country: string, reason: string, evtCount = 1) => {
    if (blockedSet.current.has(ip)) {
      toast.info(`${ip} already blocked`);
      return;
    }
    blockedSet.current.add(ip);
    setBlockedIPs((b) =>
      [{ ip, ts: Date.now(), reason, country, events: evtCount }, ...b].slice(0, 100),
    );
    setEvents((es) => es.map((e) => (e.ip === ip ? { ...e, actionTaken: "block" } : e)));
    toast.success(`IP ${ip} blocked & null-routed`);
  }, []);

  const unblockIP = useCallback((ip: string) => {
    blockedSet.current.delete(ip);
    setBlockedIPs((b) => b.filter((x) => x.ip !== ip));
    toast("IP unblocked");
  }, []);

  const flagEvent = useCallback((id: string) => {
    setEvents((es) => es.map((e) => (e.id === id ? { ...e, flagged: !e.flagged } : e)));
  }, []);

  return {
    events,
    blockedIPs,
    blockedSet: blockedSet.current,
    blockIP,
    unblockIP,
    flagEvent,
    liveOps,
    rtConnected,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
