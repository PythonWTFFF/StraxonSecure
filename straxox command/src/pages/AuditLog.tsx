"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Download, RefreshCw, Filter, X, Terminal,
  ShieldAlert, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, Info, Wifi, WifiOff, Trash2, Copy,
  Eye, Clock, Globe, Lock, Zap, Activity
} from "lucide-react";

// ─── AUDIT STORE (singleton so other pages can push events) ──────────────────

const STORE_KEY = "straxon_audit_log";

function loadStore() {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveStore(systemLogs, anomalyLogs) {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify({ systemLogs, anomalyLogs }));
  } catch {}
}

// Exported helper — call from anywhere: pushAuditEvent("SUCCESS", "Invoice #1043 created")
export function pushAuditEvent(tag, msg) {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    const store = raw ? JSON.parse(raw) : { systemLogs: [], anomalyLogs: [] };
    const entry = {
      id: Date.now(),
      time: new Date().toISOString().replace("T", " ").slice(0, 19),
      tag,
      msg,
    };
    store.systemLogs.unshift(entry);
    sessionStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {}
}

// ─── SEED DATA ────────────────────────────────────────────────────────────────

const SEED_SYSTEM = [
  { id: 1, time: "2025-04-21 14:32:01", tag: "SUCCESS", msg: "Invoice #STX-1042 generated for Acme Corp — ₹1,20,000", category: "invoice"  },
  { id: 2, time: "2025-04-21 14:28:44", tag: "INFO",    msg: "Client record updated: TechStart Inc (email change)",   category: "client"   },
  { id: 3, time: "2025-04-21 13:55:12", tag: "WARN",    msg: "Domain acmecorp.in expiring in 12 days — renewal pending", category: "system" },
  { id: 4, time: "2025-04-21 13:40:00", tag: "SUCCESS", msg: "Payment received: ₹65,000 from EduLearn Platform",      category: "payment"  },
  { id: 5, time: "2025-04-21 12:15:33", tag: "INFO",    msg: "Proposal SRS-0087 exported to PDF",                     category: "proposal" },
  { id: 6, time: "2025-04-21 11:02:10", tag: "WARN",    msg: "SSL certificate for client-portal.io expires in 22 days", category: "system" },
  { id: 7, time: "2025-04-21 10:45:00", tag: "SUCCESS", msg: "New client onboarded: NexGen Solutions",                category: "client"   },
  { id: 8, time: "2025-04-20 18:20:11", tag: "INFO",    msg: "System backup completed — 2.4 GB archived",             category: "system"   },
  { id: 9, time: "2025-04-20 15:10:05", tag: "SUCCESS", msg: "Invoice #STX-1041 marked paid by TechNova Ltd",         category: "invoice"  },
  { id: 10,time: "2025-04-20 11:30:22", tag: "INFO",    msg: "Audit log exported by admin user",                      category: "system"   },
];

const SEED_ANOMALY = [
  { id: 101, time: "2025-04-21 14:10:22", ip: "91.108.56.120",  location: "Moscow, RU",    action: "Login attempt (failed)",                 severity: "HIGH"     },
  { id: 102, time: "2025-04-21 12:45:33", ip: "203.0.113.42",   location: "Unknown VPN",   action: "API key enumeration detected",            severity: "CRITICAL" },
  { id: 103, time: "2025-04-21 10:30:00", ip: "192.168.1.55",   location: "Office LAN",    action: "Bulk PDF download (12 files)",            severity: "MEDIUM"   },
  { id: 104, time: "2025-04-20 22:15:11", ip: "45.33.32.156",   location: "San Jose, US",  action: "Unauthorized endpoint access /api/admin", severity: "HIGH"     },
  { id: 105, time: "2025-04-20 19:00:44", ip: "172.16.0.12",    location: "Internal",      action: "Session token reuse from 2 IPs",          severity: "MEDIUM"   },
  { id: 106, time: "2025-04-19 08:33:00", ip: "103.21.244.0",   location: "Singapore, SG", action: "Rate limit exceeded (200 req/min)",       severity: "LOW"      },
];

// ─── LIVE EVENT GENERATORS ────────────────────────────────────────────────────

const LIVE_SYSTEM_POOL = [
  { tag: "SUCCESS", msg: "Invoice auto-generated for scheduled client",    category: "invoice"  },
  { tag: "INFO",    msg: "Database backup triggered — incremental",        category: "system"   },
  { tag: "WARN",    msg: "Disk usage at 78% — cleanup recommended",        category: "system"   },
  { tag: "SUCCESS", msg: "Payment webhook received from Razorpay",         category: "payment"  },
  { tag: "INFO",    msg: "New session started: admin@straxonlabs.com",     category: "system"   },
  { tag: "SUCCESS", msg: "Client proposal sent: MediaHouse Q3 Retainer",   category: "proposal" },
  { tag: "WARN",    msg: "Memory usage spike detected — 91% peak",         category: "system"   },
  { tag: "INFO",    msg: "CDN cache purged for 3 client assets",           category: "system"   },
];

const LIVE_ANOMALY_POOL = [
  { ip: "185.220.101.1",  location: "Frankfurt, DE",   action: "Tor exit node detected — blocked",       severity: "HIGH"     },
  { ip: "198.51.100.22",  location: "Unknown",          action: "Brute force attempt: 47 requests/10s",   severity: "CRITICAL" },
  { ip: "10.0.0.44",      location: "Internal",         action: "Unusual after-hours access pattern",     severity: "MEDIUM"   },
  { ip: "104.21.14.101",  location: "Cloudflare Proxy", action: "Repeated 403 on /api/clients endpoint",  severity: "LOW"      },
];

function nowStr() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

// ─── COLOR MAPS ───────────────────────────────────────────────────────────────

const TAG_CONFIG = {
  SUCCESS: { cls: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/25", icon: CheckCircle2, dot: "bg-emerald-500" },
  INFO:    { cls: "text-cyan-400",    bg: "bg-cyan-500/10    border-cyan-500/25",    icon: Info,         dot: "bg-cyan-500"    },
  WARN:    { cls: "text-amber-400",   bg: "bg-amber-500/10   border-amber-500/25",   icon: AlertTriangle,dot: "bg-amber-500"   },
  ERROR:   { cls: "text-rose-400",    bg: "bg-rose-500/10    border-rose-500/25",    icon: X,            dot: "bg-rose-500"    },
};

const SEV_CONFIG = {
  CRITICAL: { cls: "text-rose-400    bg-rose-500/10    border-rose-500/30",    bar: "bg-rose-500",    rank: 4 },
  HIGH:     { cls: "text-amber-400   bg-amber-500/10   border-amber-500/30",   bar: "bg-amber-500",   rank: 3 },
  MEDIUM:   { cls: "text-sky-400     bg-sky-500/10     border-sky-500/30",     bar: "bg-sky-500",     rank: 2 },
  LOW:      { cls: "text-slate-400   bg-slate-800      border-slate-700",      bar: "bg-slate-500",   rank: 1 },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function downloadCSV(rows, filename) {
  const headers = Object.keys(rows[0]).join(",");
  const body    = rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob    = new Blob([`${headers}\n${body}`], { type: "text/csv" });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

// ─── STATS BAR ────────────────────────────────────────────────────────────────

function StatsBar({ systemLogs, anomalyLogs }) {
  const counts = {
    SUCCESS: systemLogs.filter(l => l.tag === "SUCCESS").length,
    WARN:    systemLogs.filter(l => l.tag === "WARN").length,
    INFO:    systemLogs.filter(l => l.tag === "INFO").length,
    CRITICAL:anomalyLogs.filter(l => l.severity === "CRITICAL").length,
  };
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { label: "Success Events", val: counts.SUCCESS, color: "emerald", icon: CheckCircle2 },
        { label: "Warnings",       val: counts.WARN,    color: "amber",   icon: AlertTriangle },
        { label: "Info Events",    val: counts.INFO,    color: "cyan",    icon: Info          },
        { label: "Critical Threats",val:counts.CRITICAL,color: "rose",    icon: ShieldAlert   },
      ].map(({ label, val, color, icon: Icon }) => (
        <div key={label} className={`bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-3`}>
          <div className={`p-2 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>
            <Icon className={`w-4 h-4 text-${color}-400`} />
          </div>
          <div>
            <div className={`text-xl font-black font-mono text-${color}-400`}>{val}</div>
            <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SYSTEM LOG PANEL ─────────────────────────────────────────────────────────

function SystemLogPanel({ logs, isLive }) {
  const [search, setSearch]       = useState("");
  const [tagFilter, setTagFilter] = useState("ALL");
  const [catFilter, setCatFilter] = useState("ALL");
  const [expanded, setExpanded]   = useState(null);
  const [copied, setCopied]       = useState(null);
  const bottomRef = useRef(null);

  const TAGS = ["ALL", "SUCCESS", "INFO", "WARN", "ERROR"];
  const CATS = ["ALL", "invoice", "client", "payment", "proposal", "system"];

  const filtered = logs.filter(l => {
    const matchTag = tagFilter === "ALL" || l.tag === tagFilter;
    const matchCat = catFilter === "ALL" || l.category === catFilter;
    const matchQ   = !search || l.msg.toLowerCase().includes(search.toLowerCase()) || l.time.includes(search);
    return matchTag && matchCat && matchQ;
  });

  const handleCopy = (log) => {
    copyToClipboard(`[${log.time}] [${log.tag}] ${log.msg}`);
    setCopied(log.id);
    setTimeout(() => setCopied(null), 1500);
  };

  useEffect(() => {
    if (isLive) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length, isLive]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Terminal chrome bar */}
      <div className="flex items-center justify-between bg-slate-950/80 px-4 py-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500/70" />
          <div className="w-3 h-3 rounded-full bg-amber-500/70" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          <span className="ml-3 text-[10px] font-mono text-slate-500">straxon-cmd ~ /var/log/audit/system.log</span>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              LIVE
            </span>
          )}
          <span className="text-[9px] font-mono text-slate-600">{filtered.length} events</span>
          <button
            onClick={() => downloadCSV(logs.map(({id,...r})=>r), "straxon-system-log.csv")}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-600 hover:text-emerald-400 hover:border-slate-700 transition-all"
            title="Export CSV"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-slate-800/60 bg-slate-950/40">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events…"
            className="w-full pl-7 pr-3 py-1.5 text-[10px] font-mono bg-slate-900 border border-slate-800 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          {TAGS.map(t => {
            const cfg = TAG_CONFIG[t];
            return (
              <button
                key={t}
                onClick={() => setTagFilter(t)}
                className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                  tagFilter === t
                    ? (cfg ? `${cfg.cls} ${cfg.bg}` : "text-slate-300 bg-slate-800 border-slate-700")
                    : "border-slate-800 text-slate-600 hover:text-slate-400"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATS.map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border transition-all capitalize ${
                catFilter === c
                  ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/30"
                  : "border-slate-800 text-slate-600 hover:text-slate-400"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Log entries */}
      <div className="font-mono text-xs max-h-[520px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-600 font-mono text-xs gap-2">
              <Terminal className="w-8 h-8 opacity-30" />
              <span>No events match current filters</span>
            </div>
          ) : (
            filtered.map((log, i) => {
              const cfg = TAG_CONFIG[log.tag] || TAG_CONFIG.INFO;
              const TagIcon = cfg.icon;
              const isOpen = expanded === log.id;
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, delay: i < 20 ? i * 0.02 : 0 }}
                  className="border-b border-slate-800/40 last:border-0 hover:bg-slate-800/20 transition-colors group"
                >
                  <div
                    className="flex items-start gap-3 px-4 py-2.5 cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : log.id)}
                  >
                    {/* Tag dot */}
                    <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />

                    {/* Time */}
                    <span className="text-slate-600 flex-shrink-0 w-36 text-[10px]">{log.time}</span>

                    {/* Tag badge */}
                    <span className={`flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded border w-16 text-center ${cfg.bg} ${cfg.cls}`}>
                      {log.tag}
                    </span>

                    {/* Message */}
                    <span className="text-slate-300 flex-1 leading-relaxed">{log.msg}</span>

                    {/* Actions (visible on hover) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); handleCopy(log); }}
                        className="p-1 rounded text-slate-600 hover:text-cyan-400 transition-colors"
                        title="Copy"
                      >
                        {copied === log.id ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <ChevronDown className={`w-3 h-3 text-slate-600 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mx-4 mb-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] space-y-1.5">
                          <div className="flex gap-2"><span className="text-slate-600 w-20">Event ID:</span><span className="text-slate-400">EVT-{String(log.id).padStart(6, "0")}</span></div>
                          <div className="flex gap-2"><span className="text-slate-600 w-20">Timestamp:</span><span className="text-slate-400">{log.time}</span></div>
                          <div className="flex gap-2"><span className="text-slate-600 w-20">Category:</span><span className="text-cyan-400 capitalize">{log.category}</span></div>
                          <div className="flex gap-2"><span className="text-slate-600 w-20">Severity:</span><span className={cfg.cls}>{log.tag}</span></div>
                          <div className="flex gap-2"><span className="text-slate-600 w-20">Message:</span><span className="text-slate-300">{log.msg}</span></div>
                          <div className="flex gap-2 pt-1">
                            <span className="text-slate-600 w-20">Raw:</span>
                            <code className="text-slate-500 break-all">[{log.time}] [{log.tag}] {log.msg}</code>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
        {isLive && (
          <div className="px-4 py-2 text-[10px] font-mono text-emerald-500/50 animate-pulse flex items-center gap-2">
            <span>▌</span>
            <span>Awaiting new events…</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ANOMALY LOG PANEL ────────────────────────────────────────────────────────

function AnomalyLogPanel({ logs }) {
  const [sevFilter, setSevFilter] = useState("ALL");
  const [search, setSearch]       = useState("");
  const [sortDir, setSortDir]     = useState("desc"); // desc = newest first
  const [expanded, setExpanded]   = useState(null);

  const SEVS = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

  const filtered = logs
    .filter(l => {
      const matchSev = sevFilter === "ALL" || l.severity === sevFilter;
      const matchQ   = !search || l.ip.includes(search) || l.action.toLowerCase().includes(search.toLowerCase()) || l.location.toLowerCase().includes(search.toLowerCase());
      return matchSev && matchQ;
    })
    .sort((a, b) => {
      const diff = new Date(b.time) - new Date(a.time);
      return sortDir === "desc" ? diff : -diff;
    });

  const threatScore = Math.min(100, Math.round(
    logs.filter(l => l.severity === "CRITICAL").length * 25 +
    logs.filter(l => l.severity === "HIGH").length * 12 +
    logs.filter(l => l.severity === "MEDIUM").length * 5
  ));

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Threat header */}
      <div className="flex items-center justify-between bg-rose-950/30 px-4 py-2.5 border-b border-rose-900/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute" />
            <span className="w-2 h-2 rounded-full bg-rose-500 relative" />
          </div>
          <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider">Threat Monitor · Live</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-slate-600">Threat Score:</span>
            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${threatScore}%` }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                className={`h-full rounded-full ${threatScore > 60 ? "bg-rose-500" : threatScore > 30 ? "bg-amber-500" : "bg-emerald-500"}`}
              />
            </div>
            <span className={`text-[9px] font-mono font-bold ${threatScore > 60 ? "text-rose-400" : threatScore > 30 ? "text-amber-400" : "text-emerald-400"}`}>
              {threatScore}/100
            </span>
          </div>
          <button
            onClick={() => downloadCSV(logs.map(({id,...r})=>r), "straxon-anomaly-log.csv")}
            className="p-1.5 rounded-lg border border-rose-900/40 text-rose-600 hover:text-rose-400 hover:border-rose-700 transition-all"
            title="Export CSV"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-slate-800/60 bg-slate-950/40">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search IP, action, location…"
            className="w-full pl-7 pr-3 py-1.5 text-[10px] font-mono bg-slate-900 border border-slate-800 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-rose-500/50"
          />
          {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300"><X className="w-3 h-3" /></button>}
        </div>
        <div className="flex gap-1 flex-wrap">
          {SEVS.map(s => {
            const cfg = SEV_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setSevFilter(s)}
                className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                  sevFilter === s
                    ? (cfg ? cfg.cls : "text-slate-300 bg-slate-800 border-slate-700")
                    : "border-slate-800 text-slate-600 hover:text-slate-400"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
          className="flex items-center gap-1 text-[9px] font-mono px-2.5 py-1 rounded-lg border border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-700 transition-all"
        >
          <Clock className="w-3 h-3" />
          {sortDir === "desc" ? "Newest" : "Oldest"}
        </button>
      </div>

      {/* Anomaly entries */}
      <div className="divide-y divide-slate-800/40 max-h-[520px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-600 font-mono text-xs gap-2">
              <ShieldAlert className="w-8 h-8 opacity-30" />
              <span>No threats match current filters</span>
            </div>
          ) : (
            filtered.map((log, i) => {
              const cfg   = SEV_CONFIG[log.severity];
              const isOpen = expanded === log.id;
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: i < 20 ? i * 0.03 : 0 }}
                  className="hover:bg-slate-800/20 transition-colors group cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : log.id)}
                >
                  <div className="flex items-start gap-4 px-4 py-3.5">
                    {/* Severity bar */}
                    <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${cfg.bar}`} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono font-bold text-slate-200">{log.ip}</span>
                        <span className="text-[10px] text-slate-600 flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" />
                          {log.location}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{log.action}</p>
                      <p className="text-[10px] text-slate-600 font-mono mt-1 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {log.time}
                      </p>
                    </div>

                    {/* Severity badge */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${cfg.cls}`}>
                        {log.severity}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-slate-600 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mx-4 mb-3 p-3 rounded-xl bg-slate-950/80 border border-rose-900/30 text-[10px] font-mono space-y-1.5">
                          <div className="flex gap-2"><span className="text-slate-600 w-24">Threat ID:</span><span className="text-rose-400">THR-{String(log.id).padStart(5,"0")}</span></div>
                          <div className="flex gap-2"><span className="text-slate-600 w-24">Source IP:</span><span className="text-slate-300">{log.ip}</span></div>
                          <div className="flex gap-2"><span className="text-slate-600 w-24">Geo Location:</span><span className="text-slate-300">{log.location}</span></div>
                          <div className="flex gap-2"><span className="text-slate-600 w-24">Action:</span><span className="text-slate-300">{log.action}</span></div>
                          <div className="flex gap-2"><span className="text-slate-600 w-24">Severity:</span><span className={cfg.cls.split(" ")[0]}>{log.severity}</span></div>
                          <div className="flex gap-2"><span className="text-slate-600 w-24">Detected:</span><span className="text-slate-400">{log.time}</span></div>
                          <div className="flex gap-3 pt-2">
                            <button onClick={e => { e.stopPropagation(); copyToClipboard(log.ip); }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-500 hover:text-cyan-400 hover:border-slate-700 transition-all">
                              <Copy className="w-2.5 h-2.5" /> Copy IP
                            </button>
                            <button onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-rose-900/40 text-rose-600 hover:text-rose-400 hover:border-rose-700 transition-all">
                              <Lock className="w-2.5 h-2.5" /> Block IP
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AuditLog() {
  // Initialise from sessionStorage or seed
  const [systemLogs, setSystemLogs] = useState(() => {
    const stored = loadStore();
    return stored?.systemLogs ?? SEED_SYSTEM;
  });
  const [anomalyLogs, setAnomalyLogs] = useState(() => {
    const stored = loadStore();
    return stored?.anomalyLogs ?? SEED_ANOMALY;
  });

  const [isLive, setIsLive]       = useState(true);
  const [cleared, setCleared]     = useState(false);
  const intervalRef               = useRef(null);

  // Persist to sessionStorage on every change
  useEffect(() => {
    saveStore(systemLogs, anomalyLogs);
  }, [systemLogs, anomalyLogs]);

  // Live event simulation
  const startLive = useCallback(() => {
    intervalRef.current = setInterval(() => {
      // Random system event every ~8s
      if (Math.random() > 0.4) {
        const tpl = LIVE_SYSTEM_POOL[Math.floor(Math.random() * LIVE_SYSTEM_POOL.length)];
        setSystemLogs(prev => [{
          id: Date.now(),
          time: nowStr(),
          ...tpl,
        }, ...prev].slice(0, 200));
      }
      // Random anomaly event every ~20s (lower probability)
      if (Math.random() > 0.75) {
        const tpl = LIVE_ANOMALY_POOL[Math.floor(Math.random() * LIVE_ANOMALY_POOL.length)];
        setAnomalyLogs(prev => [{
          id: Date.now(),
          time: nowStr(),
          ...tpl,
        }, ...prev].slice(0, 100));
      }
    }, 7000);
  }, []);

  const stopLive = useCallback(() => {
    clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (isLive) startLive(); else stopLive();
    return stopLive;
  }, [isLive, startLive, stopLive]);

  const handleClearSystem = () => {
    setSystemLogs([]);
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 bg-slate-950 min-h-screen">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap justify-between items-start gap-4"
      >
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-50 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <Terminal className="w-5 h-5 text-cyan-400" />
            </div>
            Audit Vault
          </h1>
          <p className="text-[10px] text-slate-500 font-mono mt-1.5 uppercase tracking-widest">
            Immutable event ledger · Security monitoring · {systemLogs.length + anomalyLogs.length} total records
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Live toggle */}
          <button
            onClick={() => setIsLive(v => !v)}
            className={`flex items-center gap-2 text-[10px] font-mono px-3.5 py-2 rounded-xl border transition-all ${
              isLive
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
          >
            {isLive ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isLive ? "Live Feed" : "Paused"}
          </button>

          {/* Clear system logs */}
          <button
            onClick={handleClearSystem}
            className="flex items-center gap-2 text-[10px] font-mono px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-500 hover:text-rose-400 hover:border-rose-900/50 transition-all"
          >
            {cleared ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Trash2 className="w-3.5 h-3.5" />}
            {cleared ? "Cleared!" : "Clear Logs"}
          </button>

          {/* Export all */}
          <button
            onClick={() => {
              downloadCSV(systemLogs.map(({id,...r})=>r), "straxon-system-log.csv");
              downloadCSV(anomalyLogs.map(({id,...r})=>r), "straxon-anomaly-log.csv");
            }}
            className="flex items-center gap-2 text-[10px] font-mono px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-500 hover:text-cyan-400 hover:border-slate-700 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export All
          </button>
        </div>
      </motion.div>

      {/* ── Stats ── */}
      <StatsBar systemLogs={systemLogs} anomalyLogs={anomalyLogs} />

      {/* ── Tabs ── */}
      <Tabs defaultValue="system" className="space-y-4">
        <TabsList className="bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
          <TabsTrigger
            value="system"
            className="text-[10px] font-mono uppercase tracking-widest data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/20 rounded-lg px-5 py-2 transition-all"
          >
            <Terminal className="w-3 h-3 mr-1.5 inline" />
            System Events
            <span className="ml-2 text-[8px] bg-cyan-500/20 text-cyan-500 px-1.5 py-0.5 rounded font-bold">{systemLogs.length}</span>
          </TabsTrigger>
          <TabsTrigger
            value="anomaly"
            className="text-[10px] font-mono uppercase tracking-widest data-[state=active]:bg-rose-500/10 data-[state=active]:text-rose-400 data-[state=active]:border-rose-500/20 rounded-lg px-5 py-2 transition-all"
          >
            <ShieldAlert className="w-3 h-3 mr-1.5 inline" />
            IP & Anomaly
            <span className="ml-2 text-[8px] bg-rose-500/20 text-rose-500 px-1.5 py-0.5 rounded font-bold">{anomalyLogs.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <SystemLogPanel logs={systemLogs} isLive={isLive} />
        </TabsContent>

        <TabsContent value="anomaly">
          <AnomalyLogPanel logs={anomalyLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}