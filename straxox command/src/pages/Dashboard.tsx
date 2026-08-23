"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, TrendingUp, AlertCircle, Briefcase,
  Server, Globe, ShieldAlert, RefreshCw, ChevronUp,
  ChevronDown, ArrowUpRight, Bell,
  CheckCircle2, Clock, XCircle, Download,
  Zap, Activity, BarChart2,
  ChevronRight, Plus, Eye, Target, KanbanSquare, Users,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart as RechartPie,
  Pie, Cell,
} from "recharts";
import { authFetch } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { usePulseStore } from "@/stores/pulse.store";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n >= 10000000 ? `₹${(n / 10000000).toFixed(1)}Cr`
  : n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : n >= 1000   ? `₹${(n / 1000).toFixed(1)}K`
  : `₹${n.toLocaleString()}`;

const statusConfig: Record<string, { label: string; cls: string }> = {
  paid:    { label: "Paid",    cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  pending: { label: "Pending", cls: "text-amber-400  bg-amber-500/10  border-amber-500/20"    },
  overdue: { label: "Overdue", cls: "text-rose-400   bg-rose-500/10   border-rose-500/20"     },
  unpaid:  { label: "Unpaid",  cls: "text-amber-400  bg-amber-500/10  border-amber-500/20"    },
};

const PIE_COLORS = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#64748b"];

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs font-mono">
      <p className="text-slate-400 mb-2 uppercase tracking-widest">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300 capitalize">{p.dataKey}:</span>
          <span className="text-white font-bold">{typeof p.value === "number" ? fmt(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── METRIC CARD ──────────────────────────────────────────────────────────────

const MetricCard = ({
  title, value, sub, isUp, icon: Icon, accent, delay, suffix = "",
}: {
  title: string; value: string | number; sub: string;
  isUp: boolean | null; icon: any; accent: string; delay: number; suffix?: string;
}) => {
  const colors: Record<string, string> = {
    cyan:    "text-cyan-400    bg-cyan-500/10    border-cyan-500/30",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    rose:    "text-rose-400    bg-rose-500/10    border-rose-500/30",
    violet:  "text-violet-400  bg-violet-500/10  border-violet-500/30",
    amber:   "text-amber-400   bg-amber-500/10   border-amber-500/30",
    indigo:  "text-indigo-400  bg-indigo-500/10  border-indigo-500/30",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col relative overflow-hidden group transition-all duration-300"
    >
      <div className="absolute -right-4 -bottom-4 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity">
        <Icon className="w-28 h-28" />
      </div>
      <div className="flex justify-between items-start mb-4">
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest leading-tight">{title}</p>
        <div className={`p-2 rounded-xl border ${colors[accent] || colors.cyan} flex-shrink-0`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="text-2xl font-black text-slate-50 mb-2 tracking-tight">{value}{suffix}</div>
      <div className={`flex items-center gap-1 text-xs font-mono ${isUp === null ? "text-slate-500" : isUp ? "text-emerald-400" : "text-rose-400"}`}>
        {isUp !== null && (isUp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
        <span>{sub}</span>
      </div>
      <div className={`absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 bg-gradient-to-r ${
        accent === "cyan"    ? "from-cyan-500/0 via-cyan-500/60 to-cyan-500/0"       :
        accent === "emerald" ? "from-emerald-500/0 via-emerald-500/60 to-emerald-500/0" :
        accent === "rose"    ? "from-rose-500/0 via-rose-500/60 to-rose-500/0"       :
        accent === "amber"   ? "from-amber-500/0 via-amber-500/60 to-amber-500/0"    :
        accent === "indigo"  ? "from-indigo-500/0 via-indigo-500/60 to-indigo-500/0" :
                               "from-violet-500/0 via-violet-500/60 to-violet-500/0"
      }`} />
    </motion.div>
  );
};

// ─── CHART TABS ───────────────────────────────────────────────────────────────
const CHART_TABS = ["Revenue vs Expenses", "Monthly Profit", "Category Mix"];

const RevenueChartWidget = ({ monthData, categoryData }: { monthData: any[]; categoryData: any[] }) => {
  const [tab, setTab] = useState(0);
  const [range, setRange] = useState("6M");

  const displayed = range === "3M" ? monthData.slice(-3) : range === "6M" ? monthData.slice(-6) : monthData;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col h-full">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-100 tracking-tight">Revenue Analytics</h3>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-widest">Straxon Labs · Live DB Data</p>
        </div>
        <div className="flex items-center gap-2">
          {["3M", "6M", "ALL"].map((r) => (
            <button
              key={r} onClick={() => setRange(r)}
              className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                range === r ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400" : "border-slate-800 text-slate-600 hover:text-slate-400 hover:border-slate-700"
              }`}
            >{r}</button>
          ))}
        </div>
      </div>
      <div className="flex gap-1 mb-5 bg-slate-950/60 rounded-xl p-1">
        {CHART_TABS.map((t, i) => (
          <button
            key={t} onClick={() => setTab(i)}
            className={`flex-1 text-[10px] font-mono py-1.5 px-2 rounded-lg transition-all truncate ${
              tab === i ? "bg-slate-800 text-slate-200 shadow" : "text-slate-600 hover:text-slate-400"
            }`}
          >{t}</button>
        ))}
      </div>
      <div className="flex-1 min-h-[260px] w-full h-[260px]">
        <ResponsiveContainer width="100%" height={260}>
          {tab === 0 ? (
            <AreaChart data={displayed} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
              <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} fontFamily="monospace" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue"  stroke="#06b6d4" strokeWidth={2} fill="url(#gRev)" dot={false} activeDot={{ r: 5, fill: "#06b6d4" }} />
              <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#gExp)" dot={false} activeDot={{ r: 5, fill: "#f43f5e" }} />
            </AreaChart>
          ) : tab === 1 ? (
            <BarChart data={displayed} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} fontFamily="monospace" />
              <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} fontFamily="monospace" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="profit" fill="url(#gProfit)" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : (
            <RechartPie>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value"
                label={({ name, value }) => `${name}`} labelLine={false}
              >
                {categoryData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />)}
              </Pie>
              <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "10px", fontSize: 11 }} />
            </RechartPie>
          )}
        </ResponsiveContainer>
      </div>
      {tab === 0 && (
        <div className="flex items-center gap-5 mt-3 pt-3 border-t border-slate-800">
          {[{ color: "#06b6d4", label: "Revenue" }, { color: "#f43f5e", label: "Expenses" }].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3 h-[2px] rounded-full" style={{ background: l.color }} />
              <span className="text-[10px] font-mono text-slate-500">{l.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── DEALS PIPELINE WIDGET ────────────────────────────────────────────────────

const STAGE_COLORS: Record<string, string> = {
  Lead: "#71717a", Qualified: "#3b82f6", Proposal: "#8b5cf6",
  Negotiation: "#f59e0b", Won: "#06b6d4", Lost: "#ef4444",
};

const DealsPipelineWidget = ({ dealsByStage, totalPipelineValue }: { dealsByStage: Record<string, any>; totalPipelineValue: number }) => {
  const navigate = useNavigate();
  const stages = Object.entries(dealsByStage || {}).filter(([, v]: any) => v.count > 0 || true);
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <KanbanSquare className="w-4 h-4 text-indigo-400" /> Deals Pipeline
          </h3>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Pipeline value: <span className="text-cyan-400">{fmt(totalPipelineValue)}</span></p>
        </div>
        <button onClick={() => navigate("/deals")} className="text-[9px] font-mono text-slate-600 hover:text-cyan-400 flex items-center gap-1 transition-colors">
          Open <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-2.5">
        {stages.map(([stage, data]: any) => {
          const color = STAGE_COLORS[stage] || "#71717a";
          const maxVal = Math.max(...Object.values(dealsByStage || {}).map((v: any) => v.value || 0), 1);
          const pct = Math.round((data.value / maxVal) * 100);
          return (
            <div key={stage} className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-slate-500 w-20 text-right flex-shrink-0">{stage}</span>
              <div className="flex-1 h-5 bg-slate-950 rounded-lg overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-lg flex items-center px-2"
                  style={{ backgroundColor: `${color}33`, borderLeft: `3px solid ${color}` }}
                >
                  {data.count > 0 && <span className="text-[9px] font-mono absolute left-2" style={{ color }}>{data.count} deal{data.count !== 1 ? "s" : ""}</span>}
                </motion.div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 w-16 text-right flex-shrink-0">{fmt(data.value)}</span>
            </div>
          );
        })}
        {!Object.values(dealsByStage || {}).some((v: any) => v.count > 0) && (
          <p className="text-slate-600 text-xs text-center py-3">No deals yet · <button onClick={() => navigate("/deals")} className="text-cyan-400 underline">Create one →</button></p>
        )}
      </div>
    </div>
  );
};

// ─── PROJECT HEALTH WIDGET ────────────────────────────────────────────────────

const ProjectHealthWidget = ({ projectHealth }: { projectHealth: any[] }) => {
  const navigate = useNavigate();
  const HEALTH_COLORS: Record<string, string> = { "on-track": "#06b6d4", "in-progress": "#3b82f6", "at-risk": "#ef4444", "early": "#71717a" };
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" /> Project Health
          </h3>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{projectHealth?.length || 0} active project{projectHealth?.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => navigate("/projects")} className="text-[9px] font-mono text-slate-600 hover:text-cyan-400 flex items-center gap-1 transition-colors">
          Open <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-2.5 max-h-44 overflow-y-auto">
        {(!projectHealth || projectHealth.length === 0) && (
          <p className="text-slate-600 text-xs text-center py-3">No projects yet · <button onClick={() => navigate("/projects")} className="text-cyan-400 underline">Create one →</button></p>
        )}
        {(projectHealth || []).map((p: any) => (
          <div key={p.id} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-300 truncate">{p.name}</span>
                <span className="text-[10px] text-slate-500 font-mono ml-2 flex-shrink-0">{p.progress}%</span>
              </div>
              <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p.progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: HEALTH_COLORS[p.health] || "#71717a" }}
                />
              </div>
            </div>
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded-md flex-shrink-0"
              style={{ color: HEALTH_COLORS[p.health], backgroundColor: `${HEALTH_COLORS[p.health]}20` }}
            >
              {p.health}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── QUICK ACTIONS ────────────────────────────────────────────────────────────

const QuickActions = () => {
  const navigate = useNavigate();
  const actions = [
    { label: "New Deal",    icon: KanbanSquare, href: "/deals",    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40" },
    { label: "New Invoice", icon: DollarSign,   href: "/invoices", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40" },
    { label: "New Project", icon: Briefcase,    href: "/projects", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/40" },
    { label: "New Client",  icon: Users,        href: "/clients",  color: "text-violet-400 bg-violet-500/10 border-violet-500/20 hover:border-violet-500/40" },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-wrap gap-3 mb-6">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={() => navigate(a.href)}
          className={`flex items-center gap-2 text-[11px] font-mono px-4 py-2.5 rounded-xl border transition-all ${a.color}`}
        >
          <Plus className="w-3.5 h-3.5" />
          {a.label}
        </button>
      ))}
    </motion.div>
  );
};

// ─── TRANSACTIONS WIDGET ──────────────────────────────────────────────────────

const TransactionsWidget = ({ invoices }: { invoices: any[] }) => {
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const transactions = invoices || [];
  const filtered = filter === "all" ? transactions : transactions.filter((t: any) => t.status === filter || t.status === (filter === "pending" ? "unpaid" : filter));

  const totals = {
    paid:    transactions.filter((t: any) => t.status === "paid").reduce((s: number, t: any) => s + t.amount, 0),
    pending: transactions.filter((t: any) => t.status === "pending" || t.status === "unpaid").reduce((s: number, t: any) => s + t.amount, 0),
    overdue: transactions.filter((t: any) => t.status === "overdue").reduce((s: number, t: any) => s + t.amount, 0),
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-100">Recent Invoices</h3>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-widest">Live from Database</p>
        </div>
        <div className="flex items-center gap-2">
          {["all", "paid", "pending", "overdue"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border transition-all capitalize ${
                filter === f ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400" : "border-slate-800 text-slate-600 hover:text-slate-400"
              }`}
            >{f}</button>
          ))}
          <button onClick={() => navigate("/invoices")} className="p-1.5 rounded-lg border border-slate-800 text-slate-600 hover:text-cyan-400 hover:border-slate-700 transition-all">
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        {[
          { label: "Collected", val: totals.paid,    cls: "text-emerald-400 bg-emerald-500/8  border-emerald-500/20" },
          { label: "Pending",   val: totals.pending, cls: "text-amber-400  bg-amber-500/8   border-amber-500/20"  },
          { label: "Overdue",   val: totals.overdue, cls: "text-rose-400   bg-rose-500/8    border-rose-500/20"   },
        ].map((s) => (
          <div key={s.label} className={`flex-1 text-center py-2 px-3 rounded-xl border text-[10px] font-mono ${s.cls}`}>
            <div className="font-black text-sm">{fmt(s.val)}</div>
            <div className="opacity-70 uppercase tracking-widest text-[8px] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800">
              {["Invoice #", "Client", "Amount", "Status", "Due Date", ""].map((h) => (
                <th key={h} className="text-left text-[9px] font-mono text-slate-600 uppercase tracking-widest pb-3 pr-4 last:pr-0">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-zinc-600 text-sm">No invoices found</td></tr>
              )}
              {filtered.slice(0, 6).map((tx: any, i: number) => {
                const sc = statusConfig[tx.status] || statusConfig["pending"];
                return (
                  <motion.tr key={tx.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors group cursor-pointer"
                  >
                    <td className="py-3 pr-4 font-mono text-cyan-500/80 text-[11px]">#{tx.invoiceNumber}</td>
                    <td className="py-3 pr-4 text-slate-200 font-medium max-w-[120px] truncate">{tx.clientName}</td>
                    <td className="py-3 pr-4 font-black text-slate-100 font-mono">{fmt(tx.amount)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${sc.cls}`}>
                        {tx.status === "paid" && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {(tx.status === "pending" || tx.status === "unpaid") && <Clock className="w-2.5 h-2.5" />}
                        {tx.status === "overdue" && <XCircle className="w-2.5 h-2.5" />}
                        {sc.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-500 font-mono text-[10px] whitespace-nowrap">{tx.dueDate}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => navigate("/invoices")} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition-all">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── TOP CLIENTS ──────────────────────────────────────────────────────────────

const TopClientsWidget = ({ clients }: { clients: any[] }) => {
  const navigate = useNavigate();
  const sorted = [...(clients || [])].sort((a, b) => b.ltv - a.ltv);
  const maxLtv = sorted[0]?.ltv || 1;
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-100">Top Clients</h3>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-widest">By Lifetime Value</p>
        </div>
        <button onClick={() => navigate("/clients")} className="text-[9px] font-mono text-slate-600 hover:text-cyan-400 flex items-center gap-1 transition-colors">
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-3">
        {sorted.length === 0 && (
          <p className="text-slate-600 text-xs text-center py-3">No clients yet</p>
        )}
        {sorted.slice(0, 5).map((c: any, i: number) => {
          const pct = Math.round((c.ltv / maxLtv) * 100);
          return (
            <div key={c.name} className="group cursor-pointer" onClick={() => navigate("/clients")}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-slate-600 w-4">{i + 1}</span>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white" style={{ background: `hsl(${(c.name.charCodeAt(0) * 47) % 360}, 65%, 45%)` }}>
                    {c.name[0]?.toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-200">{c.name}</span>
                </div>
                <span className="text-xs font-black text-slate-300 font-mono">{fmt(c.ltv)}</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden ml-5">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.7, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: `hsl(${(c.name.charCodeAt(0) * 47) % 360}, 65%, 50%)` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

const PulseTelemetryWidget = () => {
  const { metrics, isConnected } = usePulseStore();
  
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 h-full flex flex-col justify-between">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" /> Pulse Telemetry
          </h3>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-widest flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            {isConnected ? "Live stream active" : "Disconnected"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-md flex items-center gap-1">
            <Zap className="w-3 h-3" /> {metrics.requestsPerSecond} req/s
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/60">
          <p className="text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-widest">CPU Load</p>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-xl font-black text-slate-100 font-mono">{metrics.cpuUsage.toFixed(1)}%</span>
          </div>
          <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-500"
              animate={{ width: `${metrics.cpuUsage}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            />
          </div>
        </div>

        <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/60">
          <p className="text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-widest">Memory Use</p>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-xl font-black text-slate-100 font-mono">{metrics.memoryUsage.toFixed(1)}%</span>
          </div>
          <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-violet-500"
              animate={{ width: `${metrics.memoryUsage}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            />
          </div>
        </div>

        <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/60">
          <p className="text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-widest">Active Conns</p>
          <div className="flex items-end gap-2">
            <span className="text-xl font-black text-slate-100 font-mono">{metrics.activeConnections}</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400 mb-1" />
          </div>
        </div>

        <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/60">
          <p className="text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-widest">Latency (ms)</p>
          <div className="flex items-end gap-2">
            <span className="text-xl font-black text-slate-100 font-mono">{metrics.latencyMs.toFixed(1)}</span>
            <span className="text-[10px] text-slate-500 mb-1 font-mono">ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState("Just now");

  const { data: stats, refetch, isFetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
    refetchInterval: 60000,
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    setLastSync(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
  }, [refetch]);

  const totalRevenue = stats?.totalRevenue || 0;
  const pendingRevenue = stats?.pendingRevenue || 0;
  const totalLtv = stats?.totalLtv || 0;
  const overdueCount = stats?.overdueInvoicesCount || 0;
  const monthData = stats?.revenueByMonth || [];
  const categoryData = (stats?.revenueByCategory || []).map((c: any, i: number) => ({ ...c, color: PIE_COLORS[i % PIE_COLORS.length] }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 sm:px-6 py-6 max-w-[1400px] mx-auto">

      {/* ── Page Header ── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-50">Command Center</h1>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> Live
            </span>
          </div>
          <p className="text-xs text-cyan-500/70 font-mono">Straxon Labs · Real-Time HUD · Last sync: {lastSync}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh} disabled={isRefreshing}
            className="flex items-center gap-2 text-[10px] font-mono text-slate-400 hover:text-cyan-400 transition-colors bg-slate-900/60 border border-slate-800 hover:border-slate-700 px-4 py-2.5 rounded-xl disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
            {isRefreshing ? "Syncing…" : "Sync DB"}
          </button>
        </div>
      </motion.div>

      {/* ── Quick Actions ── */}
      <QuickActions />

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <MetricCard delay={0.10} title="Revenue"        value={fmt(totalRevenue)}            sub="From paid invoices"        isUp={true}  accent="cyan"    icon={TrendingUp}  />
        <MetricCard delay={0.15} title="Pending"        value={fmt(pendingRevenue)}          sub="Awaiting payment"          isUp={null}  accent="amber"   icon={Clock}       />
        <MetricCard delay={0.20} title="Pipeline LTV"   value={fmt(totalLtv)}                sub={`${stats?.clientCount || 0} clients`} isUp={true} accent="emerald" icon={DollarSign} />
        <MetricCard delay={0.25} title="Deals"          value={stats?.dealCount || 0}        sub={`${fmt(stats?.totalPipelineValue || 0)} pipeline`} isUp={true} accent="indigo" icon={KanbanSquare} />
        <MetricCard delay={0.30} title="Projects"       value={stats?.activeProjects || 0}   sub="Active deliveries"         isUp={null}  accent="violet"  icon={Briefcase}   />
        <MetricCard delay={0.35} title="Overdue"        value={overdueCount}                 sub="Invoices overdue"          isUp={false} accent="rose"    icon={AlertCircle} />
      </div>

      {/* ── Charts Row ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 min-h-[440px] flex flex-col gap-5">
          <PulseTelemetryWidget />
          <RevenueChartWidget monthData={monthData} categoryData={categoryData} />
        </div>
        <div className="flex flex-col gap-4">
          <DealsPipelineWidget dealsByStage={stats?.dealsByStage || {}} totalPipelineValue={stats?.totalPipelineValue || 0} />
          <ProjectHealthWidget projectHealth={stats?.projectHealth || []} />
        </div>
      </motion.div>

      {/* ── Transactions + Top Clients ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <TransactionsWidget invoices={stats?.recentInvoices || []} />
        </div>
        <div>
          <TopClientsWidget clients={stats?.topClients || []} />
        </div>
      </motion.div>
    </div>
  );
}