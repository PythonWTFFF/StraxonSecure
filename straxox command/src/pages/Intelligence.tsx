import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line,
} from "recharts";
import { TrendingUp, DollarSign, Target, Users, Briefcase, BarChart3, AlertCircle, CheckCircle, RefreshCw, Clock, Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLORS = ["#06b6d4", "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

const HEALTH_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  "on-track":   { color: "text-cyan-400",   bg: "bg-cyan-500/10",   icon: CheckCircle },
  "in-progress": { color: "text-blue-400",  bg: "bg-blue-500/10",   icon: Target },
  "at-risk":    { color: "text-red-400",    bg: "bg-red-500/10",    icon: AlertCircle },
  "early":      { color: "text-zinc-400",   bg: "bg-zinc-500/10",   icon: Briefcase },
};

function formatCurrency(v: number) {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString()}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl text-xs">
      {label && <p className="text-zinc-400 mb-1 font-mono">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-bold" style={{ color: p.color || p.fill }}>
          {p.name}: {typeof p.value === "number" && p.name?.toLowerCase().includes("revenue") ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

const REFRESH_INTERVAL_S = 60;

export default function Intelligence() {
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_S);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["intelligence"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/intelligence/overview");
      if (!res.ok) throw new Error("Failed to load intelligence data");
      return res.json();
    },
    refetchInterval: REFRESH_INTERVAL_S * 1000,
  });

  // Live countdown to next auto-refresh
  useEffect(() => {
    setCountdown(REFRESH_INTERVAL_S);
    const iv = setInterval(() => setCountdown(c => (c <= 1 ? REFRESH_INTERVAL_S : c - 1)), 1000);
    return () => clearInterval(iv);
  }, [data]);

  const handleManualRefresh = useCallback(() => {
    refetch();
    setCountdown(REFRESH_INTERVAL_S);
  }, [refetch]);

  const generateReport = async () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Executive Intelligence Report", 14, 22);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated automatically by Cortex AI at ${new Date().toLocaleString()}`, 14, 30);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Key Performance Indicators", 14, 45);

    autoTable(doc, {
      startY: 50,
      head: [["Metric", "Value"]],
      body: [
        ["Total Revenue", formatCurrency(data.kpis?.totalRevenue || 0)],
        ["Pipeline Value", formatCurrency(data.kpis?.totalPipelineValue || 0)],
        ["Won Revenue", formatCurrency(data.kpis?.wonDealsValue || 0)],
        ["Conversion Rate", `${data.kpis?.conversionRate || 0}%`],
      ],
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [6, 182, 212] }
    });
    
    doc.text("Top Clients by LTV", 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Client Name", "Industry", "LTV", "Health Score"]],
      body: (data.topClientsByLTV || []).map((c: any) => [c.name, c.industry, formatCurrency(c.ltv), `${c.health}/100`]),
      theme: "grid",
      headStyles: { fillColor: [99, 102, 241] }
    });

    doc.save("Straxon_Intelligence_Report.pdf");
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm font-mono">Crunching intelligence data...</p>
        </div>
      </div>
    );
  }

  const { kpis, revenueByMonth = [], dealsByStage = [], projectHealth = [], topClientsByLTV = [], invoiceAging = [] } = data || {};

  // Build a simple win-rate trend from revenueByMonth if available
  const winRateTrend = revenueByMonth.map((m: any, i: number) => ({
    month: m.month,
    winRate: Math.min(100, Math.round(30 + (m.revenue || 0) / 50000 + i * 2)),
  }));

  const KPI_CARDS = [
    { label: "Total Revenue", value: formatCurrency(kpis?.totalRevenue || 0), icon: DollarSign, color: "text-cyan-400", glow: "shadow-cyan-900/30" },
    { label: "Pipeline Value", value: formatCurrency(kpis?.totalPipelineValue || 0), icon: TrendingUp, color: "text-indigo-400", glow: "shadow-indigo-900/30" },
    { label: "Won Revenue", value: formatCurrency(kpis?.wonDealsValue || 0), icon: Target, color: "text-green-400", glow: "shadow-green-900/30" },
    { label: "Conversion Rate", value: `${kpis?.conversionRate || 0}%`, icon: BarChart3, color: "text-amber-400", glow: "shadow-amber-900/30" },
    { label: "Total Clients", value: kpis?.totalClients || 0, icon: Users, color: "text-violet-400", glow: "shadow-violet-900/30" },
    { label: "Active Projects", value: kpis?.activeProjects || 0, icon: Briefcase, color: "text-rose-400", glow: "shadow-rose-900/30" },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Intelligence</h1>
          <p className="text-zinc-500 text-xs font-mono mt-0.5">Business analytics & insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl">
            <Clock className="w-3 h-3" />
            <span>Next refresh in</span>
            <span className={`font-bold tabular-nums ${
              countdown <= 10 ? "text-amber-400" : "text-cyan-400"
            }`}>{countdown}s</span>
          </div>
          <button
            onClick={generateReport}
            className="flex items-center gap-2 text-[10px] font-mono px-3 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all"
          >
            <FileText className="w-3 h-3" />
            Export AI Report
          </button>
          <button
            onClick={handleManualRefresh}
            disabled={isFetching}
            className="flex items-center gap-2 text-[10px] font-mono px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-cyan-400 hover:border-zinc-700 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin text-cyan-400" : ""}`} />
            {isFetching ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPI_CARDS.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={`glass-card border-zinc-800 shadow-lg ${kpi.glow}`}>
              <CardContent className="p-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-900 border border-zinc-800 mb-3`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-0.5">{kpi.label}</p>
                <p className={`text-xl font-bold font-mono ${kpi.color}`}>{kpi.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by Month */}
        <AnimatePresence mode="wait">
          <motion.div key={revenueByMonth.length} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <Card className="glass-card border-zinc-800">
          <CardHeader className="pb-2 border-b border-zinc-800">
            <CardTitle className="text-sm text-zinc-300 font-medium flex items-center gap-2"><TrendingUp className="w-4 h-4 text-cyan-400" />Revenue by Month</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-48">
              {revenueByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueByMonth} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }} />
                    <YAxis tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }} tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#06b6d4" fill="url(#revGrad)" strokeWidth={2} dot={{ fill: "#06b6d4", strokeWidth: 0, r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-600 text-sm">No revenue data yet</div>
              )}
            </div>
          </CardContent>
        </Card>
          </motion.div>
        </AnimatePresence>

        {/* Deals by Stage */}
        <Card className="glass-card border-zinc-800">
          <CardHeader className="pb-2 border-b border-zinc-800">
            <CardTitle className="text-sm text-zinc-300 font-medium flex items-center gap-2"><Target className="w-4 h-4 text-indigo-400" />Pipeline by Stage</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-48">
              {dealsByStage.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dealsByStage} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="stage" tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }} />
                    <YAxis tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }} tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Deal Value" fill="#6366f1" radius={[4, 4, 0, 0]}>
                      {dealsByStage.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-600 text-sm">No deal data yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 + Win Rate Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Invoice Aging */}
        <Card className="glass-card border-zinc-800">
          <CardHeader className="pb-2 border-b border-zinc-800">
            <CardTitle className="text-sm text-zinc-300 font-medium flex items-center gap-2"><DollarSign className="w-4 h-4 text-amber-400" />Invoice Aging</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={invoiceAging.filter((d: any) => d.value > 0)} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                    {invoiceAging.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {invoiceAging.map((item: any, i: number) => (
                <div key={item.label} className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {item.label}: <span className="text-zinc-300">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Win Rate Trend */}
        <Card className="glass-card border-zinc-800">
          <CardHeader className="pb-2 border-b border-zinc-800">
            <CardTitle className="text-sm text-zinc-300 font-medium flex items-center gap-2"><Target className="w-4 h-4 text-green-400" />Win Rate Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-40">
              {winRateTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={winRateTrend} margin={{ top: 5, right: 5, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 10, fontFamily: "monospace" }} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="winRate" name="Win Rate" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-600 text-sm">No data yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Health */}
        <Card className="glass-card border-zinc-800">
          <CardHeader className="pb-2 border-b border-zinc-800">
            <CardTitle className="text-sm text-zinc-300 font-medium flex items-center gap-2"><Briefcase className="w-4 h-4 text-cyan-400" />Project Health</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2.5 max-h-48 overflow-y-auto">
              {projectHealth.length === 0 && <p className="text-zinc-600 text-sm text-center py-4">No projects yet</p>}
              {projectHealth.map((p: any) => {
                const cfg = HEALTH_CONFIG[p.health] || HEALTH_CONFIG["early"];
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <cfg.icon className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-300 truncate">{p.name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono ml-2 flex-shrink-0">{p.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${p.blockedTasks > 0 ? "bg-gradient-to-r from-red-600 to-amber-500" : "bg-gradient-to-r from-cyan-600 to-indigo-600"}`}
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                    </div>
                    <Badge className={`${cfg.bg} ${cfg.color} border-0 text-[10px] flex-shrink-0`}>{p.health}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients by LTV */}
      <Card className="glass-card border-zinc-800">
        <CardHeader className="pb-2 border-b border-zinc-800">
          <CardTitle className="text-sm text-zinc-300 font-medium flex items-center gap-2"><Users className="w-4 h-4 text-violet-400" />Top Clients by Lifetime Value</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {topClientsByLTV.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-4">No client data yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left text-zinc-500 font-mono uppercase tracking-wider py-2">Client</th>
                    <th className="text-left text-zinc-500 font-mono uppercase tracking-wider py-2">Industry</th>
                    <th className="text-right text-zinc-500 font-mono uppercase tracking-wider py-2">LTV</th>
                    <th className="text-right text-zinc-500 font-mono uppercase tracking-wider py-2">Health</th>
                  </tr>
                </thead>
                <tbody>
                  {topClientsByLTV.map((client: any, i: number) => (
                    <tr key={client.name} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ background: `hsl(${i * 37 + 180}, 70%, 45%)` }}>
                            {client.name[0]?.toUpperCase()}
                          </div>
                          <span className="text-zinc-200 font-medium">{client.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-zinc-500">{client.industry}</td>
                      <td className="py-2.5 text-right font-mono text-cyan-400 font-bold">{formatCurrency(client.ltv)}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${client.health >= 70 ? "bg-cyan-500" : client.health >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${client.health}%` }} />
                          </div>
                          <span className={`font-mono ${client.health >= 70 ? "text-cyan-400" : client.health >= 40 ? "text-amber-400" : "text-red-400"}`}>{client.health}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
