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
export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "SOC Dashboard — Straxon Secure" },
      {
        name: "description",
        content:
          "Real-time security operations center with global attack map, live threat feed, and deep packet inspection.",
      },
    ],
  }),
  component: Dashboard,
});

import { GlitchHeadline, Panel, SevBadge, Toggle, SevFilter, EventFeed, DPIPanel, uid, fmtBytes, fmtTime, hexDump, DEFAULT_RULES } from "@/components/dashboard/DashboardShared";
import { DashboardProvider, useDashboardContext } from "@/components/dashboard/DashboardContext";
function DashboardContent() {
  const { user } = useAuth();
  const alertedIdsRef = useRef(new Set<string>());
  const [mounted, setMounted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [tab, setTab] = useState<TabKey>("globe");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [autoBlock, setAutoBlock] = useState(false);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(DEFAULT_RULES);
  const [sideOpen, setSideOpen] = useState(true);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { events, blockedIPs, blockedSet, blockIP, unblockIP, flagEvent, liveOps, rtConnected } =
    useDashboardContext();

  // ML Engine Integration
  const [mlAnomalies, setMlAnomalies] = useState<any[]>([]);
  useEffect(() => {
    if (!mounted || paused || events.length === 0) return;
    const interval = setInterval(async () => {
      try {
        const payload = events.slice(0, 20);
        const mlUrl = import.meta.env.VITE_ML_ENGINE_URL || "http://localhost:8082";
        const res = await fetch(`${mlUrl}/api/ml/anomaly-detect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events: payload }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.anomalies && data.anomalies.length > 0) {
            setMlAnomalies((prev) => {
              const newMap = new Map(prev.map((a: any) => [a.event_id, a]));
              data.anomalies.forEach((a: any) => {
                newMap.set(a.event_id, a);

                // Webhook Alerting Logic
                const webhookUrl = user?.user_metadata?.slack_webhook_url;
                if (
                  (a.severity === "critical" || a.anomaly_score > 0.85) &&
                  !alertedIdsRef.current.has(a.event_id) &&
                  webhookUrl
                ) {
                  alertedIdsRef.current.add(a.event_id);
                  const payload = {
                    content: `🚨 **STRAXON SECURE: CRITICAL ANOMALY DETECTED** 🚨\n**Type:** ${a.attack_type || "Unknown"}\n**Confidence:** ${Math.round(a.anomaly_score * 100)}%\n**Details:** ${a.reason}`,
                    text: `🚨 *STRAXON SECURE: CRITICAL ANOMALY DETECTED* 🚨\n*Type:* ${a.attack_type || "Unknown"}\n*Confidence:* ${Math.round(a.anomaly_score * 100)}%\n*Details:* ${a.reason}`,
                  };
                  fetch(webhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  }).catch(console.error);
                }
              });
              return Array.from(newMap.values())
                .sort((a: any, b: any) => b.anomaly_score - a.anomaly_score)
                .slice(0, 20);
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [mounted, paused, events]);

  // Auto-block
  useEffect(() => {
    if (!autoBlock || events.length === 0) return;
    const latest = events[0];
    if (latest?.severity === "critical" && !blockedSet.has(latest.ip)) {
      blockIP(latest.ip, latest.country, "Auto-block: critical severity");
    }
  }, [events, autoBlock, blockIP, blockedSet]);

  // Sound alert
  useEffect(() => {
    if (!soundOn || !mounted || events.length === 0) return;
    if (events[0]?.severity !== "critical") return;
    try {
      if (!audioRef.current) audioRef.current = new AudioContext();
      const ctx = audioRef.current;
      const osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      /* ignore */
    }
  }, [events, soundOn, mounted]);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedId) ?? null,
    [events, selectedId],
  );

  const globeArcs = useMemo<AttackEvent[]>(
    () =>
      events.slice(0, 20).map((e) => ({
        id: e.id,
        lat: e.lat,
        lng: e.lng,
        ip: e.ip,
        country: e.country,
        type: e.type,
        severity: e.severity,
        intensity:
          e.severity === "critical"
            ? 1
            : e.severity === "high"
              ? 0.75
              : e.severity === "medium"
                ? 0.45
                : 0.2,
      })),
    [events],
  );

  // Stats
  const critCount = useMemo(() => events.filter((e) => e.severity === "critical").length, [events]);
  const highCount = useMemo(() => events.filter((e) => e.severity === "high").length, [events]);
  const avgConf = useMemo(
    () =>
      events.length ? Math.round(events.reduce((s, e) => s + e.confidence, 0) / events.length) : 0,
    [events],
  );
  const evPerSec = useMemo(
    () => (events.filter((e) => Date.now() - e.ts < 5000).length / 5).toFixed(1),
    [events],
  );
  const evPerMin = useMemo(() => events.filter((e) => Date.now() - e.ts < 60_000).length, [events]);
  const defcon = useMemo(() => {
    const now = Date.now(),
      rec = events.filter((e) => now - e.ts < 30_000);
    return Math.min(
      100,
      10 +
        rec.filter((e) => e.severity === "critical").length * 12 +
        rec.filter((e) => e.severity === "high").length * 5,
    );
  }, [events]);
  const defconColor =
    defcon >= 80 ? "#ff0033" : defcon >= 55 ? "#ff6b35" : defcon >= 30 ? "#ffaa00" : "#00ff88";

  // Chart data
  const trendData = useMemo(() => {
    const now = Date.now();
    const buckets = Array.from({ length: 20 }, (_, i) => ({
      t: `-${(19 - i) * 3}s`,
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }));
    events.forEach((e) => {
      const idx = Math.min(19, Math.floor((now - e.ts) / 3000));
      if (idx >= 0 && idx < 20) {
        const b = buckets[19 - idx];
        b.total++;
        (b as any)[e.severity]++;
      }
    });
    return buckets;
  }, [events]);

  const radarData = useMemo(() => {
    const c: Record<string, number> = {
      Recon: 0,
      Access: 0,
      Execution: 0,
      Evasion: 0,
      C2: 0,
      Exfiltration: 0,
      Impact: 0,
    };
    events.forEach((e) => {
      if (c[e.mitreClass] !== undefined) c[e.mitreClass]++;
    });
    return Object.entries(c).map(([subject, A]) => ({ subject, A: A + 2, fullMark: 60 }));
  }, [events]);

  const countryData = useMemo(() => {
    const m: Record<string, number> = {};
    events.forEach((e) => {
      m[e.country] = (m[e.country] ?? 0) + 1;
    });
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [events]);

  const sevBreakdown = useMemo(() => {
    const m: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    events.forEach((e) => m[e.severity]++);
    return (["critical", "high", "medium", "low"] as Severity[]).map((s) => ({
      name: s,
      value: m[s],
      color: SEV_COLORS[s],
    }));
  }, [events]);

  const topAttackers = useMemo(() => {
    const m = new Map<string, number>();
    events.forEach((e) => m.set(e.country, (m.get(e.country) ?? 0) + 1));
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [events]);

  const exportCSV = () => {
    const rows = [
      "ts,severity,type,ip,country,port,protocol,confidence,target,mitreId",
      ...events
        .slice(0, 500)
        .map((e) =>
          [
            new Date(e.ts).toISOString(),
            e.severity,
            e.type,
            e.ip,
            e.country,
            e.port,
            e.protocol,
            e.confidence,
            e.target,
            e.mitreId,
          ].join(","),
        ),
    ];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    a.download = "straxon-events.csv";
    a.click();
    toast.success("Exported CSV");
  };

  if (!mounted) return <div className="min-h-screen bg-[#020617]" />;

  const TABS: { key: TabKey; label: string; icon: typeof Globe }[] = [
    { key: "globe", label: "Globe", icon: Globe },
    { key: "events", label: "Event Feed", icon: Terminal },
    { key: "blocked", label: "Blocked", icon: Lock },
    { key: "rules", label: "Rules", icon: Bell },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
    { key: "anomalies", label: "Anomalies", icon: Zap },
  ];

  return (
    <div className="soc-scanline min-h-screen bg-[#020617] text-slate-300 font-mono selection:bg-cyan-900/60 overflow-x-hidden">
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#020617]/97 backdrop-blur border-b border-slate-800/80 px-3 lg:px-5 py-2.5">
        <div className="max-w-[1920px] mx-auto flex flex-wrap items-center gap-y-2 gap-x-4">
          <GlitchHeadline />
          <p className="hidden md:block text-[9px] text-slate-500 uppercase tracking-widest">
            Enterprise SOC · DPI · Threat Intelligence
          </p>

          {/* Realtime status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider border ${
              rtConnected
                ? "border-green-800/60 text-green-400 bg-green-950/30"
                : "border-yellow-800/60 text-yellow-400 bg-yellow-950/30"
            }`}
          >
            <Radio className="h-3 w-3" />
            {rtConnected ? "Realtime · Live" : "Connecting…"}
            <Users className="h-3 w-3 ml-1 opacity-60" />
            <span>{liveOps}</span>
          </div>

          {/* Desktop stats */}
          <div className="hidden lg:flex items-center gap-5 ml-auto">
            {[
              { label: "Ev/min", value: evPerMin, color: "#00d4ff" },
              { label: "Ev/s", value: evPerSec, color: "#00d4ff" },
              { label: "Critical", value: critCount, color: "#ff0033" },
              { label: "High", value: highCount, color: "#ff6b35" },
              { label: "Blocked", value: blockedIPs.length, color: "#00ff88" },
              { label: "Conf", value: `${avgConf}%`, color: "#00d4ff" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div
                  className="text-base font-bold leading-none"
                  style={{ color: s.color, textShadow: `0 0 10px ${s.color}55` }}
                >
                  {s.value}
                </div>
                <div className="text-[8px] text-slate-600 uppercase tracking-widest mt-0.5">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* DEFCON */}
          <div className="text-right">
            <div className="text-[8px] text-slate-600 uppercase tracking-widest">DEFCON</div>
            <div
              className="text-xl font-bold leading-none"
              style={{ color: defconColor, textShadow: `0 0 12px ${defconColor}77` }}
            >
              {defcon}
              <span className="text-xs opacity-40">/100</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 ml-2 flex-wrap">
            <button
              onClick={() => setAutoBlock((a) => !a)}
              className={`flex items-center gap-1 px-2 py-1.5 text-[9px] border rounded uppercase tracking-wide transition-colors ${
                autoBlock
                  ? "border-red-500/60 text-red-400 bg-red-950/30"
                  : "border-slate-700 text-slate-400 hover:border-red-500/60 hover:text-red-400"
              }`}
            >
              <Shield className="h-3 w-3" /> <span className="hidden sm:inline">Auto-Block</span>
            </button>
            <button
              onClick={() => setSoundOn((s) => !s)}
              className="p-1.5 border border-slate-700 rounded text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
              title={soundOn ? "Mute" : "Sound alerts"}
            >
              {soundOn ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={exportCSV}
              className="p-1.5 border border-slate-700 rounded text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
              title="Export CSV"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setSideOpen((o) => !o)}
              className="p-1.5 border border-slate-700 rounded text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors hidden xl:flex"
              title="Toggle DPI Panel"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPaused((p) => !p)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border rounded uppercase tracking-wide transition-colors ${
                paused
                  ? "border-cyan-500 text-cyan-400 bg-cyan-950/40"
                  : "border-slate-700 text-slate-400 hover:border-cyan-500"
              }`}
            >
              {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              <span className="hidden sm:inline">{paused ? "Resume" : "Pause"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── BODY ──────────────────────────────────────────────────────── */}
      <div
        className="px-2 lg:px-4 py-3 max-w-[1920px] mx-auto flex flex-col gap-3"
        style={{ minHeight: "calc(100vh - 60px)" }}
      >
        {/* Mobile stat strip */}
        <div className="flex gap-2 lg:hidden overflow-x-auto cs pb-1">
          {[
            { label: "Ev/min", value: evPerMin, color: "#00d4ff" },
            { label: "Critical", value: critCount, color: "#ff0033" },
            { label: "Blocked", value: blockedIPs.length, color: "#00ff88" },
            { label: "DEFCON", value: defcon, color: defconColor },
          ].map((s) => (
            <div
              key={s.label}
              className="shrink-0 bg-slate-900/60 border border-slate-800 rounded px-3 py-2 text-center min-w-[72px]"
            >
              <div className="text-base font-bold" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-[8px] text-slate-600 uppercase tracking-wider mt-0.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN GRID ───────────────────────────────────────────────── */}
        <div
          className={`flex-1 grid gap-3 min-h-0 overflow-y-auto p-4 xl:p-0 xl:overflow-hidden ${sideOpen ? "xl:grid-cols-[280px_1fr_260px]" : "xl:grid-cols-[280px_1fr]"}`}
        >
          {/* ── COL 1: Metrics (desktop only) ──────────────────────────── */}
          <div className="flex flex-col gap-3 min-h-0 w-full xl:w-auto">
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-2 shrink-0">
              {[
                { label: "Total Events", value: events.length, color: "#00d4ff", icon: Activity },
                { label: "Blacklisted", value: blockedIPs.length, color: "#00ff88", icon: Lock },
                {
                  label: "Unique Sources",
                  value: new Set(events.map((e) => e.ip)).size,
                  color: "#00d4ff",
                  icon: Globe,
                },
                {
                  label: "Countries",
                  value: new Set(events.map((e) => e.country)).size,
                  color: "#ffaa00",
                  icon: MapPin,
                },
              ].map(({ label, value, color, icon: Icon }) => (
                <div
                  key={label}
                  className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-1">
                    <Icon className="h-3.5 w-3.5 opacity-30" style={{ color }} />
                    <div className="text-[8px] text-slate-500 uppercase tracking-wider text-right leading-tight">
                      {label}
                    </div>
                  </div>
                  <div className="text-2xl font-bold leading-none" style={{ color }}>
                    {value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* MITRE Radar */}
            <Panel
              title={
                <>
                  <BarChart3 className="h-3.5 w-3.5" />
                  MITRE ATT&CK
                </>
              }
              className="shrink-0"
            >
              <div style={{ height: 155, padding: "6px 0" }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                    <PolarGrid stroke="#0f172a" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "#475569", fontSize: 8, fontFamily: "monospace" }}
                    />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    <Radar
                      dataKey="A"
                      stroke="#00d4ff"
                      fill="#00d4ff"
                      fillOpacity={0.14}
                      strokeWidth={1.5}
                    />
                    <Tooltip {...TTP} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            {/* Velocity */}
            <Panel
              title={
                <>
                  <TrendingUp className="h-3.5 w-3.5" />
                  Ingress Velocity
                </>
              }
              titleRight="60s"
              className="shrink-0"
            >
              <div style={{ height: 106, padding: "4px 0" }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={trendData} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                    <XAxis
                      dataKey="t"
                      stroke="#1e293b"
                      fontSize={7}
                      tickLine={false}
                      interval={4}
                    />
                    <YAxis stroke="#1e293b" fontSize={7} />
                    <Tooltip {...TTP} />
                    <Area
                      type="monotone"
                      dataKey="critical"
                      stackId="a"
                      stroke="#ff0033"
                      fill="#ff003322"
                      strokeWidth={1}
                    />
                    <Area
                      type="monotone"
                      dataKey="high"
                      stackId="a"
                      stroke="#ff6b35"
                      fill="#ff6b3522"
                      strokeWidth={1}
                    />
                    <Area
                      type="monotone"
                      dataKey="medium"
                      stackId="a"
                      stroke="#ffaa00"
                      fill="#ffaa0018"
                      strokeWidth={1}
                    />
                    <Area
                      type="monotone"
                      dataKey="low"
                      stackId="a"
                      stroke="#00d4ff"
                      fill="#00d4ff15"
                      strokeWidth={1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            {/* Top origins */}
            <Panel
              title={
                <>
                  <Globe className="h-3.5 w-3.5" />
                  Top Origins
                </>
              }
              className="flex-1 min-h-0"
            >
              <div className="flex-1 overflow-y-auto cs p-3 space-y-2">
                {countryData.map((c) => {
                  const pct = events.length ? Math.round((c.value / events.length) * 100) : 0;
                  return (
                    <div key={c.name}>
                      <div className="flex items-center justify-between text-[9px] mb-0.5">
                        <span className="text-slate-400 font-mono">{c.name}</span>
                        <span className="text-slate-600">
                          {c.value} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: "linear-gradient(90deg,#00d4ff,#0055ff)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>

          {/* ── COL 2: Main tabbed area ────────────────────────────────── */}
          <div className="flex flex-col gap-3 min-h-0 w-full xl:w-auto">
            {/* Tabs */}
            <div className="flex items-center gap-0 bg-slate-900/50 border border-slate-800 rounded-lg overflow-x-auto cs shrink-0">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-[10px] uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    tab === key
                      ? "border-cyan-500 text-cyan-400 bg-cyan-950/20"
                      : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/20"
                  }`}
                >
                  <Icon className="h-3 w-3" /> {label}
                  {key === "events" && (
                    <span className="ml-1 text-[8px] bg-slate-800 px-1 rounded">
                      {events.length}
                    </span>
                  )}
                  {key === "blocked" && blockedIPs.length > 0 && (
                    <span className="ml-1 text-[8px] bg-red-950/60 text-red-400 border border-red-900/40 px-1 rounded">
                      {blockedIPs.length}
                    </span>
                  )}
                </button>
              ))}
              {paused && (
                <span className="ml-auto mr-3 text-[9px] font-mono text-yellow-400 border border-yellow-400/30 px-2 py-0.5 rounded shrink-0">
                  PAUSED
                </span>
              )}
            </div>

            {/* Tab content */}
            <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden flex flex-col min-h-0">
              {/* GLOBE TAB */}
              {tab === "globe" && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="relative" style={{ height: "clamp(260px, 45vh, 420px)" }}>
                    <ErrorBoundary>
                      <Suspense
                        fallback={
                          <div className="h-full w-full flex items-center justify-center text-slate-500 font-mono text-xs">
                            Initializing 3D Globe...
                          </div>
                        }
                      >
                        <AttackGlobe
                          attacks={globeArcs}
                          selectedEvent={selectedEvent as any}
                          paused={paused}
                        />
                      </Suspense>
                    </ErrorBoundary>
                    <div className="absolute top-3 left-4 z-10 flex items-center gap-2 pointer-events-none">
                      <Globe className="h-3.5 w-3.5 text-cyan-500" />
                      <span className="text-[9px] font-mono text-cyan-500 uppercase tracking-widest">
                        Live Global Threat Vectors
                      </span>
                    </div>
                  </div>

                  {/* Mini live feed + intel below globe */}
                  <div className="flex-1 min-h-0 border-t border-slate-800/60 grid sm:grid-cols-2 divide-x divide-slate-800/40">
                    {/* Recent events */}
                    <div className="flex flex-col min-h-0">
                      <div className="px-3 py-2 border-b border-slate-800/40 flex items-center justify-between shrink-0">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                          Latest Events
                        </span>
                        <button
                          onClick={() => setTab("events")}
                          className="text-[9px] font-mono text-cyan-500 hover:text-cyan-300 transition-colors"
                        >
                          View all →
                        </button>
                      </div>
                      <div className="overflow-y-auto cs flex-1">
                        {events.slice(0, 10).map((e) => (
                          <div
                            key={e.id}
                            onClick={() => {
                              setSelectedId(e.id);
                              setTab("events");
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono border-b border-slate-800/20 cursor-pointer hover:bg-slate-800/20 transition-colors ${e.severity === "critical" ? "bg-red-950/8" : ""}`}
                          >
                            <SevBadge sev={e.severity} />
                            <span className="text-slate-400 truncate flex-1">
                              {e.ip} [{e.country}]
                            </span>
                            <span className="text-slate-600 shrink-0 hidden sm:block">
                              {fmtTime(e.ts)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Threat intel */}
                    <div className="flex flex-col min-h-0">
                      <div className="px-3 py-2 border-b border-slate-800/40 shrink-0">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                          Threat Intelligence
                        </span>
                      </div>
                      <div className="overflow-y-auto cs flex-1 p-3 space-y-2">
                        {THREAT_INTEL.map((ti) => (
                          <div key={ti.id} className="flex items-start gap-2">
                            <span className="shrink-0 mt-0.5" style={{ color: SEV_COLORS[ti.sev] }}>
                              ▸
                            </span>
                            <div>
                              <span
                                className="font-mono text-[10px]"
                                style={{ color: SEV_COLORS[ti.sev] }}
                              >
                                {ti.label}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-1">— {ti.text}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* EVENTS TAB */}
              {tab === "events" && (
                <EventFeed
                  events={events}
                  selectedId={selectedId}
                  onSelectId={setSelectedId}
                  blockIP={blockIP}
                  flagEvent={flagEvent}
                />
              )}

              {/* BLOCKED IPs TAB */}
              {tab === "blocked" && (
                <div className="flex-1 overflow-auto cs min-h-0">
                  {blockedIPs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3 p-8">
                      <Lock className="h-12 w-12 opacity-10" />
                      <p className="text-xs font-mono uppercase tracking-widest">No blocked IPs</p>
                    </div>
                  ) : (
                    <table className="w-full text-[10px] font-mono">
                      <thead className="sticky top-0 bg-slate-950/95 text-slate-500 z-10 border-b border-slate-800/50">
                        <tr>
                          <th className="px-3 py-2 font-normal text-left">IP ADDRESS</th>
                          <th className="px-2 py-2 font-normal text-left">CC</th>
                          <th className="px-2 py-2 font-normal text-left hidden sm:table-cell">
                            REASON
                          </th>
                          <th className="px-2 py-2 font-normal text-left hidden md:table-cell">
                            BLOCKED AT
                          </th>
                          <th className="px-2 py-2 font-normal text-left">EVENTS</th>
                          <th className="px-2 py-2 font-normal w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {blockedIPs.map((b) => (
                          <tr
                            key={b.ip}
                            className="border-b border-slate-800/30 hover:bg-slate-800/15 transition-colors"
                          >
                            <td className="px-3 py-2 text-red-400">{b.ip}</td>
                            <td className="px-2 py-2 text-slate-500">{b.country}</td>
                            <td className="px-2 py-2 text-slate-600 hidden sm:table-cell max-w-[160px] truncate">
                              {b.reason}
                            </td>
                            <td className="px-2 py-2 text-slate-600 hidden md:table-cell whitespace-nowrap">
                              {fmtTime(b.ts)}
                            </td>
                            <td className="px-2 py-2 text-slate-400">{b.events}</td>
                            <td className="px-2 py-2">
                              <button
                                onClick={() => unblockIP(b.ip)}
                                className="text-slate-600 hover:text-green-400 transition-colors"
                                title="Unblock"
                              >
                                <XCircle className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* RULES TAB */}
              {tab === "rules" && (
                <div className="flex-1 overflow-auto cs p-4 space-y-2.5 min-h-0">
                  {alertRules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        rule.enabled
                          ? "border-slate-700 bg-slate-900/40"
                          : "border-slate-800/40 bg-slate-900/15 opacity-55"
                      }`}
                    >
                      <Toggle
                        on={rule.enabled}
                        onChange={(v) =>
                          setAlertRules((rs) =>
                            rs.map((r) => (r.id === rule.id ? { ...r, enabled: v } : r)),
                          )
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-slate-200 truncate">{rule.name}</div>
                        {rule.lastFired && (
                          <div className="text-[9px] text-slate-600 mt-0.5">
                            Last fired: {fmtTime(rule.lastFired)}
                          </div>
                        )}
                      </div>
                      <SevBadge sev={rule.severity} />
                      <span className="text-[9px] text-slate-600 shrink-0">
                        {rule.count} triggers
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* ANALYTICS TAB */}
              {tab === "analytics" && (
                <div className="flex-1 overflow-auto cs p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-0">
                  {/* Severity pie */}
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-2 font-mono">
                      Severity Distribution
                    </div>
                    <ResponsiveContainer width="100%" height={150} minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={sevBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={38}
                          outerRadius={60}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {sevBreakdown.map((s, i) => (
                            <Cell key={i} fill={s.color} />
                          ))}
                        </Pie>
                        <Tooltip {...TTP} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      {sevBreakdown.map((s) => (
                        <div
                          key={s.name}
                          className="flex items-center gap-1.5 text-[9px] font-mono"
                        >
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: s.color }}
                          />
                          <span className="text-slate-400">{s.name}</span>
                          <span className="ml-auto font-bold" style={{ color: s.color }}>
                            {s.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Country bar */}
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-2 font-mono">
                      Attack Origins
                    </div>
                    <ResponsiveContainer width="100%" height={170} minWidth={0} minHeight={0}>
                      <BarChart
                        data={countryData}
                        layout="vertical"
                        margin={{ left: 0, right: 8, top: 0, bottom: 0 }}
                      >
                        <XAxis type="number" stroke="#1e293b" fontSize={8} tickLine={false} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#1e293b"
                          fontSize={8}
                          width={22}
                        />
                        <Tooltip {...TTP} />
                        <Bar
                          dataKey="value"
                          fill="#00d4ff"
                          fillOpacity={0.7}
                          radius={[0, 2, 2, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Top Attackers (from first version) */}
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-3 font-mono">
                      Top Attacker Origins
                    </div>
                    <div className="space-y-2">
                      {topAttackers.map(([country, count], i) => {
                        const pct = topAttackers[0][1] > 0 ? (count / topAttackers[0][1]) * 100 : 0;
                        return (
                          <div key={country} className="flex items-center gap-3">
                            <span className="font-mono text-[9px] w-5 text-slate-600">
                              #{i + 1}
                            </span>
                            <span className="font-mono text-[10px] w-8 text-slate-300">
                              {country}
                            </span>
                            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  background: "linear-gradient(90deg,#00d4ff,#aa00ff)",
                                }}
                              />
                            </div>
                            <span className="font-mono text-[9px] text-slate-400 w-6 text-right">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Protocol breakdown */}
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-2 font-mono">
                      Protocol Breakdown
                    </div>
                    {(["HTTP", "HTTPS", "TCP", "UDP", "DNS", "ICMP"] as Protocol[]).map((p) => {
                      const cnt = events.filter((e) => e.protocol === p).length;
                      const pct = events.length ? Math.round((cnt / events.length) * 100) : 0;
                      return (
                        <div key={p} className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] text-slate-500 w-10 font-mono">{p}</span>
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: "#00d4ff" }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-400 w-8 text-right font-mono">
                            {cnt}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* MITRE radar (mobile-visible version) */}
                  <div className="sm:col-span-2 xl:hidden">
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-2 font-mono">
                      MITRE ATT&CK Coverage
                    </div>
                    <ResponsiveContainer width="100%" height={200} minWidth={0} minHeight={0}>
                      <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                        <PolarGrid stroke="#0f172a" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: "#475569", fontSize: 9, fontFamily: "monospace" }}
                        />
                        <PolarRadiusAxis tick={false} axisLine={false} />
                        <Radar
                          dataKey="A"
                          stroke="#00d4ff"
                          fill="#00d4ff"
                          fillOpacity={0.14}
                          strokeWidth={1.5}
                        />
                        <Tooltip {...TTP} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* ANOMALIES TAB */}
              {tab === "anomalies" && (
                <div className="flex-1 overflow-auto cs p-4 space-y-4 min-h-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                      <Zap className="h-4 w-4" /> Machine Learning Anomaly Detection
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border border-slate-700 px-2 py-0.5 rounded">
                      Model: STRAXON-ML-v2.1
                    </span>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-1">
                      <AIAnalystPanel />
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                        Behavioral Drift
                      </div>
                      <div className="text-sm font-mono text-slate-300">
                        Account <span className="text-cyan-400">admin@straxon.io</span> logged in
                        from unusual ASN (AS4134 ChinaNet) outside typical business hours.
                      </div>
                      <div className="flex justify-between items-center mt-auto pt-2 border-t border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500">
                          Confidence: 92%
                        </span>
                        <button className="text-[10px] font-mono text-red-400 border border-red-900 bg-red-950/30 px-2 py-1 rounded hover:bg-red-900/50 transition-colors">
                          FORCE MFA
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                        Time Series Spike
                      </div>
                      <div className="text-sm font-mono text-slate-300">
                        <span className="text-yellow-400">400% increase</span> in outbound DNS
                        traffic over past 5 mins compared to 14-day baseline.
                      </div>
                      <div className="flex justify-between items-center mt-auto pt-2 border-t border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500">
                          Confidence: 88%
                        </span>
                        <button className="text-[10px] font-mono text-cyan-400 border border-cyan-900 bg-cyan-950/30 px-2 py-1 rounded hover:bg-cyan-900/50 transition-colors">
                          VIEW PCAP
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                        Protocol Mismatch
                      </div>
                      <div className="text-sm font-mono text-slate-300">
                        Non-HTTP traffic detected on TCP port 443. Possible C2 beaconing or
                        encrypted tunnel.
                      </div>
                      <div className="flex justify-between items-center mt-auto pt-2 border-t border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500">
                          Confidence: 75%
                        </span>
                        <button className="text-[10px] font-mono text-yellow-400 border border-yellow-900 bg-yellow-950/30 px-2 py-1 rounded hover:bg-yellow-900/50 transition-colors">
                          BLOCK PORT
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                        Cluster Anomaly
                      </div>
                      <div className="text-sm font-mono text-slate-300">
                        Unusual clustering of 404 errors targeting hidden directories. Potential
                        enumeration scan.
                      </div>
                      <div className="flex justify-between items-center mt-auto pt-2 border-t border-slate-800">
                        <span className="text-[10px] font-mono text-slate-500">
                          Confidence: 81%
                        </span>
                        <button className="text-[10px] font-mono text-cyan-400 border border-cyan-900 bg-cyan-950/30 px-2 py-1 rounded hover:bg-cyan-900/50 transition-colors">
                          ENABLE WAF STRIKE
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── COL 3: DPI Inspector (desktop) ───────────────────────────── */}
          {sideOpen && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col w-full xl:w-auto xl:w-[260px]"
              >
                <Panel
                  title={
                    <>
                      <Search className="h-3.5 w-3.5" />
                      Deep Packet Inspector
                    </>
                  }
                  className="w-full"
                >
                  <DPIPanel
                    event={selectedEvent}
                    onClose={() => setSelectedId(null)}
                    blockIP={blockIP}
                    flagEvent={flagEvent}
                  />
                </Panel>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* ── MOBILE DPI DRAWER ─────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedEvent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="xl:hidden bg-slate-900/95 border border-slate-700 rounded-lg backdrop-blur overflow-hidden flex flex-col"
              style={{ maxHeight: 380 }}
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/70 shrink-0">
                <div className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5" /> Packet Inspector
                </div>
              </div>
              <DPIPanel
                event={selectedEvent}
                onClose={() => setSelectedId(null)}
                blockIP={blockIP}
                flagEvent={flagEvent}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── STATUS BAR ───────────────────────────────────────────────── */}
        <footer className="shrink-0 border-t border-slate-800/60 pt-2 flex flex-wrap items-center justify-between gap-2 text-[9px] font-mono text-slate-600">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${rtConnected ? "bg-green-400 shadow-[0_0_4px_#00ff88]" : "bg-yellow-400"} animate-pulse`}
              />
              <span className="text-slate-500">
                {rtConnected ? "REALTIME CONNECTED" : "CONNECTING…"}
              </span>
            </div>
            <span>TLP:RED</span>
            <span className="hidden sm:inline">ENGINE: STRAXON-AI v4.2</span>
            <span className="hidden md:inline">FEEDS: 12 ACTIVE</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span>BUFFER: {events.length}/200</span>
            <span>BLOCKED: {blockedIPs.length}</span>
            <span className="hidden sm:inline">UPTIME: 99.97%</span>
            <span className="text-slate-700 hidden md:inline">
              {new Date().toUTCString().split(" ").slice(0, 5).join(" ")} UTC
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}


function Dashboard() { return <DashboardProvider><DashboardContent /></DashboardProvider>; }
