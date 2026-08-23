"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePulseStore } from "@/stores/pulse.store";
import { authFetch } from "@/lib/api";
import {
  Key, Webhook, Copy, Check, Zap, Send, Loader2, Trash2,
  Eye, EyeOff, RefreshCw, Terminal, Shield, Clock, Globe,
  Activity, Plus, X, AlertTriangle, CheckCircle2, ChevronDown,
  Code, Download, RotateCcw, Lock, Unlock, Filter, BarChart2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { InfrastructureMap } from "@/components/layout/InfrastructureMap";

// ─── SELF-CONTAINED MOCK API (no external import needed) ─────────────────────

async function mockGenerateApiKey() {
  await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const seg = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `stx_live_${seg(8)}_${seg(8)}_${seg(8)}`;
}

async function realFireWebhook(event, { url, customPayload }) {
  const t0 = Date.now();
  try {
    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      version: "v1",
      data: customPayload ? JSON.parse(customPayload) : { source: "straxon-labs" },
    });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Straxon-Event": event },
      body,
      signal: AbortSignal.timeout(10000),
    });
    const latency = Date.now() - t0;
    return { ok: res.ok, status: res.status, latency, payload: JSON.parse(body) };
  } catch (err: any) {
    const latency = Date.now() - t0;
    return { ok: false, status: 0, latency, payload: { error: err.message } };
  }
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const WEBHOOK_EVENTS = [
  "invoice.created", "invoice.paid", "invoice.overdue",
  "srs.generated", "srs.approved",
  "client.onboarded", "client.updated",
  "payment.received", "payment.failed",
  "proposal.sent", "proposal.accepted",
];

const KEY_SCOPES = ["read", "write", "admin", "readonly"];

const ENVIRONMENTS = ["production", "staging", "development"];

const TOAST_DURATION = 3000;

// ─── TOAST SYSTEM (self-contained, no sonner needed) ─────────────────────────

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), TOAST_DURATION + 400);
  }, []);
  return {
    toasts,
    success: (msg) => add("success", msg),
    error:   (msg) => add("error", msg),
    info:    (msg) => add("info", msg),
  };
}

function ToastStack({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: -8,  scale: 0.95 }}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl text-xs font-mono backdrop-blur-md pointer-events-auto ${
              t.type === "success" ? "bg-emerald-950/90 border-emerald-800/60 text-emerald-300" :
              t.type === "error"   ? "bg-rose-950/90    border-rose-800/60    text-rose-300"    :
                                     "bg-slate-900/90   border-slate-700       text-slate-300"
            }`}
          >
            {t.type === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
            {t.type === "error"   && <AlertTriangle className="w-3.5 h-3.5 text-rose-400    flex-shrink-0" />}
            {t.type === "info"    && <Activity       className="w-3.5 h-3.5 text-cyan-400    flex-shrink-0" />}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── UTILS ────────────────────────────────────────────────────────────────────

function maskKey(key) {
  if (!key) return "";
  return key.slice(0, 14) + "•".repeat(18) + key.slice(-4);
}

function nowTime() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

function fmtJson(obj) {
  return JSON.stringify(obj, null, 2);
}

function downloadJson(obj, filename) {
  const blob = new Blob([fmtJson(obj)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── API KEY CARD ─────────────────────────────────────────────────────────────

function ApiKeyCard({ ak, onCopy, onDelete, onRevoke, copiedId }) {
  const [revealed, setRevealed] = useState(false);

  const envColor = {
    production:  "text-rose-400   bg-rose-500/10   border-rose-500/20",
    staging:     "text-amber-400  bg-amber-500/10  border-amber-500/20",
    development: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };

  const scopeColor = {
    admin:    "text-rose-400",
    write:    "text-amber-400",
    read:     "text-cyan-400",
    readonly: "text-slate-400",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: ak.revoked ? 0.45 : 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className={`p-4 rounded-xl border transition-all group ${
        ak.revoked
          ? "bg-slate-900/30 border-slate-800/40"
          : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
      }`}
    >
      <div className="flex items-start gap-3 flex-wrap">
        {/* Icon */}
        <div className={`p-2 rounded-lg border flex-shrink-0 ${ak.revoked ? "bg-slate-800/40 border-slate-700/30 text-slate-600" : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"}`}>
          {ak.revoked ? <Lock className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className={`text-sm font-bold ${ak.revoked ? "text-slate-600 line-through" : "text-slate-200"}`}>{ak.name}</p>
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${envColor[ak.env] || envColor.development}`}>
              {ak.env}
            </span>
            <span className={`text-[9px] font-mono ${scopeColor[ak.scope] || "text-slate-400"}`}>
              [{ak.scope}]
            </span>
            {ak.revoked && <span className="text-[9px] font-mono text-rose-500 border border-rose-900/40 bg-rose-500/5 px-1.5 py-0.5 rounded">REVOKED</span>}
          </div>

          {/* Key display */}
          <code className={`text-[10px] font-mono block ${ak.revoked ? "text-slate-700" : "text-slate-500"}`}>
            {revealed ? ak.key : maskKey(ak.key)}
          </code>
          <p className="text-[9px] font-mono text-slate-700 mt-1">Created {ak.created} · {ak.usage} requests</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!ak.revoked && (
            <>
              <button
                onClick={() => setRevealed(v => !v)}
                className="p-1.5 rounded-lg border border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-700 transition-all"
                title={revealed ? "Hide key" : "Reveal key"}
              >
                {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
              <button
                onClick={() => onCopy(ak.id, ak.key)}
                className="p-1.5 rounded-lg border border-slate-800 text-slate-600 hover:text-cyan-400 hover:border-cyan-800 transition-all"
                title="Copy key"
              >
                {copiedId === ak.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
              <button
                onClick={() => onRevoke(ak.id)}
                className="p-1.5 rounded-lg border border-slate-800 text-slate-600 hover:text-amber-400 hover:border-amber-900 transition-all"
                title="Revoke key"
              >
                <Unlock className="w-3 h-3" />
              </button>
            </>
          )}
          <button
            onClick={() => onDelete(ak.id)}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-600 hover:text-rose-400 hover:border-rose-900 transition-all"
            title="Delete key"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── WEBHOOK RESULT ROW ───────────────────────────────────────────────────────

function WebhookResultRow({ r, index }) {
  const [open, setOpen] = useState(false);
  const isOk = r.status === 200;

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="border-b border-slate-800/40 last:border-0"
    >
      <div
        className="flex items-center gap-3 px-4 py-2.5 text-xs font-mono hover:bg-slate-800/20 transition-colors cursor-pointer group"
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-slate-600 w-20 flex-shrink-0">{r.time}</span>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOk ? "bg-emerald-500" : "bg-rose-500"}`} />
        <span className="text-slate-400 flex-1 truncate">{r.event}</span>
        <span className="text-slate-600 flex-shrink-0">{r.latency}ms</span>
        <span className={`font-bold flex-shrink-0 ${isOk ? "text-emerald-400" : "text-rose-400"}`}>
          {r.status} {isOk ? "OK" : "ERR"}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-600 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <pre className="mx-4 mb-3 p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-400 overflow-x-auto leading-relaxed">
              {fmtJson(r.payload)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── ENV TEST RUNNER ──────────────────────────────────────────────────────────

const ENV_CHECKS = [
  { id: "api",   label: "API Gateway",       url: "api.straxonlabs.com"    },
  { id: "db",    label: "Database Cluster",  url: "db.straxonlabs.internal"},
  { id: "cdn",   label: "CDN Edge",          url: "cdn.straxonlabs.com"    },
  { id: "auth",  label: "Auth Service",      url: "auth.straxonlabs.com"   },
  { id: "queue", label: "Event Queue",       url: "queue.straxonlabs.com"  },
];

  const ENV_CHECKS_REAL = [
  { id: "backend", label: "Node.js API",      url: "/api/v1/health",            internal: true  },
  { id: "pulse",   label: "Go Pulse WS",      url: "http://localhost:8081/health", internal: false },
  { id: "redis",   label: "Redis Bus",        url: "/api/v1/health",            internal: true  },
];

function EnvHealthPanel({ toast }) {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);

  const runChecks = async () => {
    setRunning(true);
    setResults({});

    // Check real internal services
    for (const chk of ENV_CHECKS_REAL) {
      const t0 = Date.now();
      try {
        const res = chk.internal
          ? await authFetch(chk.url)
          : await fetch(chk.url, { signal: AbortSignal.timeout(4000) });
        const latency = Date.now() - t0;
        setResults(prev => ({ ...prev, [chk.id]: { ok: res.ok, latency } }));
      } catch {
        setResults(prev => ({ ...prev, [chk.id]: { ok: false, latency: Date.now() - t0 } }));
      }
    }
    setRunning(false);
    toast.success("Health checks complete");
  };

  const statusOf = (id) => results[id];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Environment Health</h3>
            <p className="text-[9px] font-mono text-slate-600 mt-0.5">Live connectivity checks</p>
          </div>
        </div>
        <button
          onClick={runChecks}
          disabled={running}
          className="flex items-center gap-1.5 text-[9px] font-mono px-3 py-1.5 rounded-lg border border-slate-800 text-slate-500 hover:text-emerald-400 hover:border-emerald-900 transition-all disabled:opacity-40"
        >
          <RefreshCw className={`w-3 h-3 ${running ? "animate-spin text-emerald-400" : ""}`} />
          {running ? "Checking…" : "Run Checks"}
        </button>
      </div>

      <div className="divide-y divide-slate-800/40">
        {ENV_CHECKS.map((chk) => {
          const res = statusOf(chk.id);
          return (
            <div key={chk.id} className="flex items-center gap-3 px-5 py-3">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                !res             ? "bg-slate-700" :
                res.ok           ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" :
                                   "bg-rose-500    shadow-[0_0_6px_rgba(244,63,94,0.6)]"
              }`} />
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-300">{chk.label}</p>
                <p className="text-[9px] font-mono text-slate-600">{chk.url}</p>
              </div>
              {running && !res && (
                <Loader2 className="w-3 h-3 text-slate-600 animate-spin" />
              )}
              {res && (
                <div className="text-right">
                  <p className={`text-xs font-bold font-mono ${res.ok ? "text-emerald-400" : "text-rose-400"}`}>
                    {res.ok ? "Online" : "Offline"}
                  </p>
                  <p className="text-[9px] font-mono text-slate-600">{res.latency}ms</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── LIVE REQUEST LOG (subscribes to pulse.store) ────────────────────────────

function LiveRequestLog() {
  const { metrics, isConnected } = usePulseStore();
  const [log, setLog] = useState<{ id: number; ts: string; rps: number; lat: number; mem: number; cpu: number }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isConnected) return;
    const entry = {
      id:  Date.now(),
      ts:  new Date().toLocaleTimeString("en-US", { hour12: false }),
      rps: metrics.requestsPerSecond,
      lat: metrics.latencyMs,
      mem: metrics.memoryUsage,
      cpu: metrics.cpuUsage,
    };
    setLog(prev => [...prev.slice(-49), entry]); // keep last 50
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [metrics.lastUpdated]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Live Request Log</h3>
            <p className="text-[9px] font-mono text-slate-600 mt-0.5">Real-time stream from Straxon Pulse</p>
          </div>
        </div>
        <span className={`text-[9px] font-mono px-2 py-1 rounded border flex items-center gap-1.5 ${
          isConnected ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" : "text-slate-600 border-slate-800"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
          {isConnected ? `${metrics.requestsPerSecond} req/s` : "No signal"}
        </span>
      </div>
      <div className="font-mono text-[10px] max-h-[220px] overflow-y-auto">
        <div className="grid grid-cols-5 gap-2 px-4 py-2 text-slate-600 uppercase tracking-widest text-[8px] border-b border-slate-800/50 sticky top-0 bg-slate-900">
          <span>Time</span><span>Req/s</span><span>Latency</span><span>CPU</span><span>Mem</span>
        </div>
        {log.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-slate-600">
            {isConnected ? "Waiting for data…" : "Connect Pulse to see live logs"}
          </div>
        ) : (
          log.map(e => (
            <div key={e.id} className="grid grid-cols-5 gap-2 px-4 py-1.5 border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
              <span className="text-slate-500">{e.ts}</span>
              <span className="text-cyan-400 font-bold">{e.rps}</span>
              <span className={e.lat > 100 ? "text-amber-400" : "text-emerald-400"}>{e.lat.toFixed(1)}ms</span>
              <span className={e.cpu > 80 ? "text-rose-400" : "text-slate-300"}>{e.cpu.toFixed(1)}%</span>
              <span className={e.mem > 80 ? "text-rose-400" : "text-slate-300"}>{e.mem.toFixed(1)}%</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── RATE LIMIT MONITOR ───────────────────────────────────────────────────────

function RateLimitPanel() {
  const [limits] = useState([
    { endpoint: "/api/invoices",  limit: 100, used: 67,  window: "1min"  },
    { endpoint: "/api/clients",   limit: 50,  used: 12,  window: "1min"  },
    { endpoint: "/api/export",    limit: 10,  used: 9,   window: "1hr"   },
    { endpoint: "/api/webhooks",  limit: 200, used: 134, window: "1min"  },
  ]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
        <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <BarChart2 className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Rate Limits</h3>
          <p className="text-[9px] font-mono text-slate-600 mt-0.5">Per-endpoint quota usage</p>
        </div>
      </div>
      <div className="divide-y divide-slate-800/40">
        {limits.map((l) => {
          const pct = Math.round((l.used / l.limit) * 100);
          const color = pct > 85 ? "bg-rose-500" : pct > 60 ? "bg-amber-500" : "bg-cyan-500";
          const textColor = pct > 85 ? "text-rose-400" : pct > 60 ? "text-amber-400" : "text-cyan-400";
          return (
            <div key={l.endpoint} className="px-5 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-slate-400">{l.endpoint}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-mono font-bold ${textColor}`}>{l.used}/{l.limit}</span>
                  <span className="text-[9px] font-mono text-slate-600">{l.window}</span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${color}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function DevTools() {
  const toast = useToast();

  // ── API Keys state ──
  const [apiKeys, setApiKeys] = useState([
    { id: "1", name: "Production Key",  key: "stx_live_a1b2c3d4_e5f6g7h8_i9j0k1l2", created: "2025-04-01", env: "production",  scope: "admin",    usage: 4821, revoked: false },
    { id: "2", name: "Staging Key",     key: "stx_live_b2c3d4e5_f6g7h8i9_j0k1l2m3", created: "2025-04-10", env: "staging",     scope: "write",    usage: 912,  revoked: false },
    { id: "3", name: "Read-Only",       key: "stx_live_c3d4e5f6_g7h8i9j0_k1l2m3n4", created: "2025-04-14", env: "development", scope: "readonly", usage: 238,  revoked: true  },
  ]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyEnv,  setNewKeyEnv]  = useState("development");
  const [newKeyScope,setNewKeyScope]= useState("read");
  const [generating, setGenerating] = useState(false);
  const [copiedId,   setCopiedId]   = useState(null);
  const [showRevoked,setShowRevoked]= useState(false);

  // ── Webhook state ──
  const [webhookUrl,     setWebhookUrl]     = useState("https://hooks.slack.com/services/xxx");
  const [selectedEvent,  setSelectedEvent]  = useState(WEBHOOK_EVENTS[0]);
  const [firing,         setFiring]         = useState(false);
  const [webhookResults, setWebhookResults] = useState([]);
  const [customPayload,  setCustomPayload]  = useState('{\n  "test": true,\n  "source": "straxon-labs"\n}');
  const [showPayload,    setShowPayload]    = useState(false);
  const [filterStatus,   setFilterStatus]  = useState("all");

  // ── Generate API key ──
  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) { toast.error("Enter a key name"); return; }
    setGenerating(true);
    const key = await mockGenerateApiKey();
    setApiKeys(prev => [...prev, {
      id:      crypto.randomUUID(),
      name:    newKeyName.trim(),
      key,
      created: new Date().toISOString().split("T")[0],
      env:     newKeyEnv,
      scope:   newKeyScope,
      usage:   0,
      revoked: false,
    }]);
    setNewKeyName("");
    setGenerating(false);
    toast.success(`Key "${newKeyName.trim()}" generated`);
  };

  const handleCopy = (id, key) => {
    navigator.clipboard?.writeText(key).catch(() => {});
    setCopiedId(id);
    toast.success("Key copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = (id) => {
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, revoked: true } : k));
    toast.info("API key revoked");
  };

  const handleDelete = (id) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
    toast.success("API key deleted");
  };

  const handleExportKeys = () => {
    const data = apiKeys.map(({ key, ...rest }) => ({ ...rest, key: maskKey(key) }));
    downloadJson(data, "straxon-api-keys.json");
    toast.success("Keys exported (masked)");
  };

  // ── Fire webhook (real POST) ──
  const handleFireWebhook = async () => {
    if (!webhookUrl.trim()) { toast.error("Enter a webhook URL"); return; }
    setFiring(true);
    const result = await realFireWebhook(selectedEvent, { url: webhookUrl, customPayload: showPayload ? customPayload : null });
    const entry = {
      id:      Date.now(),
      event:   selectedEvent,
      status:  result.status,
      latency: result.latency,
      time:    nowTime(),
      payload: result.payload,
      url:     webhookUrl,
    };
    setWebhookResults(prev => [entry, ...prev].slice(0, 20));
    setFiring(false);
    if (result.ok) {
      toast.success(`${selectedEvent} → ${result.status} OK (${result.latency}ms)`);
    } else {
      toast.error(`${selectedEvent} → ${result.status || "Network Error"} FAILED`);
    }
  };

  const handleClearResults = () => {
    setWebhookResults([]);
    toast.info("Webhook history cleared");
  };

  const handleExportResults = () => {
    downloadJson(webhookResults, "straxon-webhook-log.json");
    toast.success("Webhook log exported");
  };

  // ── Derived ──
  const visibleKeys    = showRevoked ? apiKeys : apiKeys.filter(k => !k.revoked);
  const activeKeyCount = apiKeys.filter(k => !k.revoked).length;
  const successCount   = webhookResults.filter(r => r.status === 200).length;
  const failCount      = webhookResults.filter(r => r.status !== 200).length;
  const avgLatency     = webhookResults.length
    ? Math.round(webhookResults.reduce((a, r) => a + r.latency, 0) / webhookResults.length)
    : 0;
  const filteredResults = filterStatus === "all"
    ? webhookResults
    : webhookResults.filter(r => filterStatus === "ok" ? r.status === 200 : r.status !== 200);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 sm:px-6 py-6 max-w-6xl mx-auto">
      <ToastStack toasts={toast.toasts} />

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap justify-between items-start gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-50 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <Terminal className="w-5 h-5 text-cyan-400" />
            </div>
            Developer Tools
          </h1>
          <p className="text-[10px] text-slate-500 font-mono mt-1.5 uppercase tracking-widest">
            API Keys · Webhooks · Health Monitor · Rate Limits
          </p>
        </div>
        {/* Stats strip */}
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <div className="flex flex-col items-center px-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl">
            <span className="text-lg font-black text-cyan-400">{activeKeyCount}</span>
            <span className="text-slate-600 uppercase tracking-widest">Active Keys</span>
          </div>
          <div className="flex flex-col items-center px-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl">
            <span className="text-lg font-black text-emerald-400">{successCount}</span>
            <span className="text-slate-600 uppercase tracking-widest">Webhooks OK</span>
          </div>
          <div className="flex flex-col items-center px-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl">
            <span className="text-lg font-black text-amber-400">{avgLatency}ms</span>
            <span className="text-slate-600 uppercase tracking-widest">Avg Latency</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6"
      >
        <InfrastructureMap />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ══ LEFT COLUMN ══════════════════════════════════════════════════════ */}
        <div className="space-y-5">

          {/* ── API Key Manager ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">API Key Manager</h3>
                  <p className="text-[9px] font-mono text-slate-600 mt-0.5">{activeKeyCount} active / {apiKeys.length} total</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRevoked(v => !v)}
                  className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                    showRevoked ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "border-slate-800 text-slate-600 hover:text-slate-300"
                  }`}
                >
                  {showRevoked ? "Hide" : "Show"} Revoked
                </button>
                <button
                  onClick={handleExportKeys}
                  className="p-1.5 rounded-lg border border-slate-800 text-slate-600 hover:text-cyan-400 hover:border-slate-700 transition-all"
                  title="Export keys"
                >
                  <Download className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Keys list */}
            <div className="p-4 space-y-3 max-h-[340px] overflow-y-auto">
              <AnimatePresence>
                {visibleKeys.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-slate-600 font-mono text-xs gap-2">
                    <Key className="w-8 h-8 opacity-30" />
                    <span>No API keys</span>
                  </div>
                ) : (
                  visibleKeys.map(ak => (
                    <ApiKeyCard
                      key={ak.id}
                      ak={ak}
                      onCopy={handleCopy}
                      onDelete={handleDelete}
                      onRevoke={handleRevoke}
                      copiedId={copiedId}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Generate form */}
            <div className="px-4 pb-4 border-t border-slate-800/60 pt-4 space-y-3">
              <div className="flex gap-2">
                <input
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleGenerateKey()}
                  placeholder='Key name (e.g., "Staging Read")'
                  className="flex-1 px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={newKeyEnv}
                  onChange={e => setNewKeyEnv(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-colors"
                >
                  {ENVIRONMENTS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <select
                  value={newKeyScope}
                  onChange={e => setNewKeyScope(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-colors"
                >
                  {KEY_SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  onClick={handleGenerateKey}
                  disabled={generating}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  {generating ? "Generating…" : "Generate"}
                </button>
              </div>
            </div>
          </motion.div>

          {/* ── Environment Health ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <EnvHealthPanel toast={toast} />
          </motion.div>
        </div>

        {/* ══ RIGHT COLUMN ═════════════════════════════════════════════════════ */}
        <div className="space-y-5">

          {/* ── Webhook Simulator ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
              <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <Webhook className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Webhook Simulator</h3>
                <p className="text-[9px] font-mono text-slate-600 mt-0.5">Fire & inspect payloads in real time</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* URL */}
              <div>
                <label className="text-[9px] uppercase tracking-widest text-slate-600 font-mono mb-1.5 block">Endpoint URL</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
                    <input
                      value={webhookUrl}
                      onChange={e => setWebhookUrl(e.target.value)}
                      placeholder="https://hooks.example.com/…"
                      className="w-full pl-8 pr-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-slate-300 placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                    />
                  </div>
                  {/* Quick presets */}
                  <select
                    onChange={e => e.target.value && setWebhookUrl(e.target.value)}
                    defaultValue=""
                    className="px-2 py-2 text-[9px] font-mono bg-slate-950 border border-slate-800 rounded-xl text-slate-500 focus:outline-none focus:border-slate-700"
                  >
                    <option value="">Presets</option>
                    <option value="https://hooks.slack.com/services/xxx">Slack</option>
                    <option value="https://discord.com/api/webhooks/xxx">Discord</option>
                    <option value="https://api.telegram.org/botXXX/sendMessage">Telegram</option>
                    <option value="https://httpbin.org/post">httpbin (test)</option>
                  </select>
                </div>
              </div>

              {/* Event selector */}
              <div>
                <label className="text-[9px] uppercase tracking-widest text-slate-600 font-mono mb-1.5 block">Event Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {WEBHOOK_EVENTS.map(ev => (
                    <button
                      key={ev}
                      onClick={() => setSelectedEvent(ev)}
                      className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                        selectedEvent === ev
                          ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                          : "border-slate-800 text-slate-600 hover:text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {ev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom payload toggle */}
              <div>
                <button
                  onClick={() => setShowPayload(v => !v)}
                  className="flex items-center gap-2 text-[9px] font-mono text-slate-600 hover:text-slate-300 transition-colors"
                >
                  <Code className="w-3 h-3" />
                  {showPayload ? "Hide" : "Edit"} custom payload
                  <ChevronDown className={`w-3 h-3 transition-transform ${showPayload ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {showPayload && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-2"
                    >
                      <textarea
                        value={customPayload}
                        onChange={e => setCustomPayload(e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 text-[10px] font-mono bg-slate-950 border border-slate-800 rounded-xl text-slate-400 focus:outline-none focus:border-violet-500/50 resize-none leading-relaxed"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Fire button */}
              <button
                onClick={handleFireWebhook}
                disabled={firing}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-mono font-bold uppercase tracking-widest bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                {firing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {firing ? "Firing…" : "Fire Webhook"}
              </button>
            </div>

            {/* Results log */}
            {webhookResults.length > 0 && (
              <div className="border-t border-slate-800">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-950/50">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Recent Pings</span>
                    <div className="flex gap-2 text-[9px] font-mono">
                      <span className="text-emerald-400">{successCount} OK</span>
                      <span className="text-rose-400">{failCount} ERR</span>
                      {avgLatency > 0 && <span className="text-slate-500">{avgLatency}ms avg</span>}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {["all","ok","err"].map(f => (
                      <button
                        key={f}
                        onClick={() => setFilterStatus(f)}
                        className={`text-[8px] font-mono px-2 py-0.5 rounded border transition-all uppercase ${
                          filterStatus === f ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" : "border-slate-800 text-slate-600"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                    <button onClick={handleExportResults} className="p-1 rounded border border-slate-800 text-slate-600 hover:text-cyan-400 transition-all" title="Export">
                      <Download className="w-2.5 h-2.5" />
                    </button>
                    <button onClick={handleClearResults} className="p-1 rounded border border-slate-800 text-slate-600 hover:text-rose-400 transition-all" title="Clear">
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
                <div className="max-h-[240px] overflow-y-auto">
                  {filteredResults.map((r, i) => (
                    <WebhookResultRow key={r.id} r={r} index={i} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* ── Rate Limits ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <RateLimitPanel />
          </motion.div>

          {/* ── Live Request Log ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <LiveRequestLog />
          </motion.div>
        </div>

      </div>
    </div>
  );
}