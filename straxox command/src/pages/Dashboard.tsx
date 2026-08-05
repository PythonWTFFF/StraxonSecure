"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, TrendingUp, AlertCircle, Briefcase,
  Server, Globe, ShieldAlert, RefreshCw, ChevronUp,
  ChevronDown, MoreHorizontal, ArrowUpRight, Bell,
  CheckCircle2, Clock, XCircle, Filter, Download,
  Calendar, Zap, Activity, BarChart2, PieChart,
  ChevronRight, Plus, Eye
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart as RechartPie,
  Pie, Cell, Legend
} from "recharts";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const generateMonthlyData = () =>
  MONTHS.slice(0, 8).map((month, i) => ({
    month,
    revenue:  Math.round((200000 + i * 35000 + Math.random() * 40000)),
    expenses: Math.round((120000 + i * 12000 + Math.random() * 20000)),
    profit:   Math.round((80000  + i * 23000 + Math.random() * 20000)),
  }));

const revenueByCategory = [
  { name: "Web Dev",    value: 38, color: "#06b6d4" },
  { name: "Design",     value: 22, color: "#8b5cf6" },
  { name: "Consulting", value: 18, color: "#10b981" },
  { name: "Retainers",  value: 15, color: "#f59e0b" },
  { name: "Other",      value: 7,  color: "#64748b" },
];

const recentTransactions = [
  { id: "INV-1042", client: "Acme Corp",      amount: 84500,  status: "paid",    date: "Today, 10:32 AM",    type: "Invoice" },
  { id: "INV-1041", client: "TechNova Ltd",    amount: 52000,  status: "pending", date: "Yesterday, 2:14 PM", type: "Invoice" },
  { id: "INV-1040", client: "StartupXYZ",      amount: 28000,  status: "pending", date: "Jul 18, 2025",       type: "Invoice" },
  { id: "INV-1039", client: "GlobalRetail",    amount: 110000, status: "paid",    date: "Jul 17, 2025",       type: "Proposal" },
  { id: "INV-1038", client: "MediaHouse",      amount: 36000,  status: "overdue", date: "Jul 10, 2025",       type: "Invoice" },
];

const watchlistData = [
  { id: 1, type: "Domain",  name: "acmecorp.in",       daysLeft: 4,  status: "critical", icon: Globe      },
  { id: 2, type: "Hosting", name: "AWS EC2 – EdTech",  daysLeft: 12, status: "warning",  icon: Server     },
  { id: 3, type: "SSL",     name: "straxonlabs.com",   daysLeft: 28, status: "safe",     icon: ShieldAlert },
  { id: 4, type: "Domain",  name: "clientproject.io",  daysLeft: 45, status: "safe",     icon: Globe      },
];

const topClients = [
  { name: "Acme Corp",    revenue: 420000, projects: 3, growth: 18  },
  { name: "TechNova Ltd", revenue: 280000, projects: 2, growth: -4  },
  { name: "GlobalRetail", revenue: 210000, projects: 1, growth: 31  },
  { name: "MediaHouse",   revenue: 180000, projects: 4, growth: 7   },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  n >= 100000
    ? `₹${(n / 100000).toFixed(2)}L`
    : `₹${(n / 1000).toFixed(0)}k`;

const statusConfig = {
  paid:    { label: "Paid",    cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  pending: { label: "Pending", cls: "text-amber-400  bg-amber-500/10  border-amber-500/20"    },
  overdue: { label: "Overdue", cls: "text-rose-400   bg-rose-500/10   border-rose-500/20"     },
};

const watchColor = {
  critical: { dot: "bg-rose-500",   text: "text-rose-400",   badge: "bg-rose-500/10  border-rose-500/20",   icon: "bg-rose-500/10  text-rose-500"   },
  warning:  { dot: "bg-amber-500",  text: "text-amber-400",  badge: "bg-amber-500/10 border-amber-500/20",  icon: "bg-amber-500/10 text-amber-500"  },
  safe:     { dot: "bg-emerald-500",text: "text-slate-400",  badge: "bg-slate-800    border-slate-700",     icon: "bg-slate-800    text-slate-400"  },
};

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs font-mono">
      <p className="text-slate-400 mb-2 uppercase tracking-widest">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300 capitalize">{p.dataKey}:</span>
          <span className="text-white font-bold">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── METRIC CARD ──────────────────────────────────────────────────────────────

const MetricCard = ({ title, value, change, isUp, icon: Icon, accent, delay, suffix = "" }) => {
  const colors = {
    cyan:    "text-cyan-400    bg-cyan-500/10    border-cyan-500/30",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    rose:    "text-rose-400    bg-rose-500/10    border-rose-500/30",
    violet:  "text-violet-400  bg-violet-500/10  border-violet-500/30",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col relative overflow-hidden group transition-all duration-300"
    >
      {/* Background icon */}
      <div className="absolute -right-4 -bottom-4 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity">
        <Icon className="w-28 h-28" />
      </div>

      <div className="flex justify-between items-start mb-4">
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest leading-tight">{title}</p>
        <div className={`p-2 rounded-xl border ${colors[accent]} flex-shrink-0`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="text-2xl font-black text-slate-50 mb-2 tracking-tight">
        {value}{suffix}
      </div>

      <div className={`flex items-center gap-1 text-xs font-mono ${isUp === null ? "text-slate-500" : isUp ? "text-emerald-400" : "text-rose-400"}`}>
        {isUp !== null && (isUp
          ? <ChevronUp className="w-3 h-3" />
          : <ChevronDown className="w-3 h-3" />
        )}
        <span>{change}</span>
      </div>

      {/* Bottom accent bar */}
      <div className={`absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 bg-gradient-to-r ${
        accent === "cyan"    ? "from-cyan-500/0 via-cyan-500/60 to-cyan-500/0"       :
        accent === "emerald" ? "from-emerald-500/0 via-emerald-500/60 to-emerald-500/0" :
        accent === "rose"    ? "from-rose-500/0 via-rose-500/60 to-rose-500/0"       :
                               "from-violet-500/0 via-violet-500/60 to-violet-500/0"
      }`} />
    </motion.div>
  );
};

// ─── CHART TABS ───────────────────────────────────────────────────────────────

const CHART_TABS = ["Revenue vs Expenses", "Monthly Profit", "Category Mix"];

const RevenueChartWidget = ({ data }) => {
  const [tab, setTab] = useState(0);
  const [range, setRange] = useState("6M");

  const displayed = range === "3M" ? data.slice(-3) : range === "6M" ? data.slice(-6) : data;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-100 tracking-tight">Revenue Analytics</h3>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-widest">Straxon Labs · FY 2025</p>
        </div>
        <div className="flex items-center gap-2">
          {["3M", "6M", "ALL"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                range === r
                  ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400"
                  : "border-slate-800 text-slate-600 hover:text-slate-400 hover:border-slate-700"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-950/60 rounded-xl p-1">
        {CHART_TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`flex-1 text-[10px] font-mono py-1.5 px-2 rounded-lg transition-all truncate ${
              tab === i
                ? "bg-slate-800 text-slate-200 shadow"
                : "text-slate-600 hover:text-slate-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
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
              <Pie
                data={revenueByCategory}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name} ${value}%`}
                labelLine={false}
              >
                {revenueByCategory.map((entry, index) => (
                  <Cell key={index} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "10px", fontSize: 11 }} />
            </RechartPie>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend for tab 0 */}
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

// ─── WATCHLIST WIDGET ─────────────────────────────────────────────────────────

const WatchlistWidget = () => {
  const criticals = watchlistData.filter(w => w.status === "critical").length;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col h-full">
      <div className="flex justify-between items-start mb-5 pb-4 border-b border-slate-800/60">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            Priority Watchlist
          </h3>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-widest">
            Expiring Assets · {criticals} critical
          </p>
        </div>
        <button className="text-[9px] font-mono text-slate-600 hover:text-cyan-400 flex items-center gap-1 transition-colors">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      <div className="space-y-3 flex-1">
        {watchlistData.map((item, i) => {
          const wc = watchColor[item.status];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/50 hover:border-slate-700 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${wc.icon}`}>
                  <item.icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">{item.name}</p>
                  <p className="text-[10px] text-slate-600 font-mono">{item.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-sm font-black font-mono ${wc.text} ${item.status === "critical" ? "animate-pulse" : ""}`}>
                    {item.daysLeft}d
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-slate-600">left</p>
                </div>
                <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${wc.badge}`}>
                  {item.status}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <button className="w-full mt-4 py-2.5 text-[10px] font-mono text-cyan-500 border border-cyan-500/20 rounded-xl hover:bg-cyan-500/8 hover:border-cyan-500/40 transition-all flex items-center justify-center gap-2">
        <Eye className="w-3 h-3" />
        View All Assets
      </button>
    </div>
  );
};

// ─── TRANSACTIONS TABLE ───────────────────────────────────────────────────────

const TransactionsWidget = () => {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all"
    ? recentTransactions
    : recentTransactions.filter(t => t.status === filter);

  const total = {
    paid:    recentTransactions.filter(t => t.status === "paid").reduce((a, t) => a + t.amount, 0),
    pending: recentTransactions.filter(t => t.status === "pending").reduce((a, t) => a + t.amount, 0),
    overdue: recentTransactions.filter(t => t.status === "overdue").reduce((a, t) => a + t.amount, 0),
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-100">Recent Transactions</h3>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-widest">Invoices & Proposals</p>
        </div>
        <div className="flex items-center gap-2">
          {["all", "paid", "pending", "overdue"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border transition-all capitalize ${
                filter === f
                  ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400"
                  : "border-slate-800 text-slate-600 hover:text-slate-400"
              }`}
            >
              {f}
            </button>
          ))}
          <button className="p-1.5 rounded-lg border border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-700 transition-all">
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 mb-5">
        {[
          { label: "Collected", val: total.paid,    cls: "text-emerald-400 bg-emerald-500/8  border-emerald-500/20" },
          { label: "Pending",   val: total.pending, cls: "text-amber-400  bg-amber-500/8   border-amber-500/20"  },
          { label: "Overdue",   val: total.overdue, cls: "text-rose-400   bg-rose-500/8    border-rose-500/20"   },
        ].map((s) => (
          <div key={s.label} className={`flex-1 text-center py-2 px-3 rounded-xl border text-[10px] font-mono ${s.cls}`}>
            <div className="font-black text-sm">{fmt(s.val)}</div>
            <div className="opacity-70 uppercase tracking-widest text-[8px] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800">
              {["Invoice", "Client", "Amount", "Status", "Date", ""].map((h) => (
                <th key={h} className="text-left text-[9px] font-mono text-slate-600 uppercase tracking-widest pb-3 pr-4 last:pr-0">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {filtered.map((tx, i) => {
                const sc = statusConfig[tx.status];
                return (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors group cursor-pointer"
                  >
                    <td className="py-3 pr-4 font-mono text-cyan-500/80 text-[11px]">{tx.id}</td>
                    <td className="py-3 pr-4 text-slate-200 font-medium">{tx.client}</td>
                    <td className="py-3 pr-4 font-black text-slate-100 font-mono">{fmt(tx.amount)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${sc.cls}`}>
                        {tx.status === "paid"    && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {tx.status === "pending" && <Clock        className="w-2.5 h-2.5" />}
                        {tx.status === "overdue" && <XCircle      className="w-2.5 h-2.5" />}
                        {sc.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-500 font-mono text-[10px] whitespace-nowrap">{tx.date}</td>
                    <td className="py-3 text-right">
                      <button className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition-all">
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

const TopClientsWidget = () => (
  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
    <div className="flex justify-between items-center mb-5">
      <div>
        <h3 className="text-base font-bold text-slate-100">Top Clients</h3>
        <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-widest">Revenue Ranking</p>
      </div>
      <button className="text-[9px] font-mono text-slate-600 hover:text-cyan-400 flex items-center gap-1 transition-colors">
        View All <ChevronRight className="w-3 h-3" />
      </button>
    </div>
    <div className="space-y-3">
      {topClients.map((c, i) => {
        const maxRev = topClients[0].revenue;
        const pct    = Math.round((c.revenue / maxRev) * 100);
        return (
          <div key={c.name} className="group cursor-pointer">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-slate-600 w-4">{i + 1}</span>
                <span className="text-xs font-semibold text-slate-200">{c.name}</span>
                <span className="text-[9px] text-slate-600 font-mono">{c.projects} proj</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${c.growth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {c.growth >= 0 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {Math.abs(c.growth)}%
                </span>
                <span className="text-xs font-black text-slate-300 font-mono">{fmt(c.revenue)}</span>
              </div>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.8 + i * 0.1, duration: 0.7, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400"
              />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSync, setLastSync]         = useState("Just now");
  const [chartData, setChartData]       = useState(generateMonthlyData);
  const [notifications, setNotifications] = useState(3);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setChartData(generateMonthlyData());
      setIsRefreshing(false);
      setLastSync(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    }, 1200);
  }, []);

  // Auto-refresh every 60s
  useEffect(() => {
    const id = setInterval(handleRefresh, 60000);
    return () => clearInterval(id);
  }, [handleRefresh]);

  const totalRevenue  = chartData.reduce((a, d) => a + d.revenue, 0);
  const totalExpenses = chartData.reduce((a, d) => a + d.expenses, 0);
  const totalProfit   = totalRevenue - totalExpenses;
  const profitMargin  = ((totalProfit / totalRevenue) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 px-4 sm:px-6 py-6 max-w-[1400px] mx-auto">

      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap justify-between items-start gap-4 mb-8"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black tracking-tight text-slate-50">Command Center</h1>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Live
            </span>
          </div>
          <p className="text-xs text-cyan-500/70 font-mono">Straxon Labs · Financial HUD · Last sync: {lastSync}</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-500 hover:text-slate-300 hover:border-slate-700 transition-all">
            <Bell className="w-4 h-4" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 text-[10px] font-mono text-slate-400 hover:text-cyan-400 transition-colors bg-slate-900/60 border border-slate-800 hover:border-slate-700 px-4 py-2.5 rounded-xl disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
            {isRefreshing ? "Syncing…" : "Sync Database"}
          </button>
          <button className="flex items-center gap-2 text-[10px] font-mono text-white bg-cyan-600 hover:bg-cyan-500 transition-colors px-4 py-2.5 rounded-xl font-bold uppercase tracking-widest">
            <Plus className="w-3.5 h-3.5" />
            New Invoice
          </button>
        </div>
      </motion.div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard delay={0.10} title="MRR"               value={fmt(chartData.at(-1).revenue)}  change="+12.5% vs last month"  isUp={true}  accent="cyan"    icon={TrendingUp}  />
        <MetricCard delay={0.18} title="YTD Revenue"       value={fmt(totalRevenue)}               change="+28.3% vs last year"   isUp={true}  accent="emerald" icon={DollarSign}  />
        <MetricCard delay={0.26} title="Outstanding"       value="₹3,20,000"                       change="4 invoices pending"    isUp={false} accent="rose"    icon={AlertCircle} />
        <MetricCard delay={0.34} title="Profit Margin"     value={`${profitMargin}%`}              change={`Based on YTD data`}   isUp={null}  accent="violet"  icon={Briefcase}   />
      </div>

      {/* ── Chart + Watchlist ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5"
      >
        <div className="lg:col-span-2 min-h-[440px]">
          <RevenueChartWidget data={chartData} />
        </div>
        <div className="min-h-[440px]">
          <WatchlistWidget />
        </div>
      </motion.div>

      {/* ── Transactions + Top Clients ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >
        <div className="lg:col-span-2">
          <TransactionsWidget />
        </div>
        <div>
          <TopClientsWidget />
        </div>
      </motion.div>
    </div>
  );
}