import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Mail,
  Target,
  Eye,
  MousePointerClick,
  ShieldOff,
  Send,
  PlayCircle,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/phishing")({
  head: () => ({
    meta: [
      { title: "Phishing Simulator — Straxon Secure" },
      {
        name: "description",
        content: "Automated social engineering and phishing campaign simulator.",
      },
    ],
  }),
  component: PhishingDashboard,
});

type Template = {
  id: string;
  name: string;
  subject: string;
  sender: string;
  risk: "Low" | "Medium" | "High" | "Critical";
  conversionRate: number; // base multiplier for clicks
};

const TEMPLATES: Template[] = [
  {
    id: "t1",
    name: "Mandatory HR Policy Update",
    subject: "ACTION REQUIRED: Q3 HR Policy Changes",
    sender: "hr@company.internal",
    risk: "Medium",
    conversionRate: 0.35,
  },
  {
    id: "t2",
    name: "IT Password Reset Alert",
    subject: "Security Alert: Unusual Login Detected",
    sender: "it-support@company-security.io",
    risk: "High",
    conversionRate: 0.65,
  },
  {
    id: "t3",
    name: "CEO Urgent Wire Transfer",
    subject: "URGENT: Vendor Payment Processing",
    sender: "ceo.executive@gmail.com",
    risk: "Critical",
    conversionRate: 0.8,
  },
  {
    id: "t4",
    name: "Free Amazon Gift Card",
    subject: "Employee Appreciation: Claim your $50 Gift Card!",
    sender: "rewards@amazon-promo.com",
    risk: "Low",
    conversionRate: 0.9,
  },
];

type TargetGroup = {
  id: string;
  name: string;
  size: number;
  susceptibility: number; // multiplier
};

const GROUPS: TargetGroup[] = [
  { id: "g1", name: "Sales Department", size: 450, susceptibility: 0.8 },
  { id: "g2", name: "Engineering Team", size: 150, susceptibility: 0.2 },
  { id: "g3", name: "Executive Suite (Whaling)", size: 12, susceptibility: 0.5 },
  { id: "g4", name: "All Employees", size: 2800, susceptibility: 0.6 },
];

type DataPoint = {
  time: string;
  sent: number;
  opened: number;
  clicked: number;
  compromised: number;
};

function PhishingDashboard() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[0]);
  const [selectedGroup, setSelectedGroup] = useState<TargetGroup>(GROUPS[3]);
  const [status, setStatus] = useState<"idle" | "running" | "completed">("idle");
  const [progress, setProgress] = useState(0);

  // Stats
  const [stats, setStats] = useState({ sent: 0, opened: 0, clicked: 0, compromised: 0 });
  const [history, setHistory] = useState<DataPoint[]>([]);

  // Simulation Refs
  const simRef = useRef<NodeJS.Timeout | null>(null);

  const launchCampaign = () => {
    setStatus("running");
    setProgress(0);
    setStats({ sent: 0, opened: 0, clicked: 0, compromised: 0 });
    setHistory([{ time: "0s", sent: 0, opened: 0, clicked: 0, compromised: 0 }]);

    let tick = 0;
    const maxTicks = 20; // 20 intervals
    const totalTargets = selectedGroup.size;
    const baseConversion = selectedTemplate.conversionRate * selectedGroup.susceptibility;

    simRef.current = setInterval(() => {
      tick++;
      setProgress((tick / maxTicks) * 100);

      setStats((prev) => {
        // Curve: fast send, slower opens, trickling clicks
        const newSent = Math.min(
          totalTargets,
          prev.sent + Math.floor(totalTargets * 0.2 * Math.random() + totalTargets * 0.1),
        );
        const newOpened = Math.min(
          newSent,
          prev.opened + Math.floor(newSent * 0.15 * Math.random() + newSent * 0.05),
        );
        const newClicked = Math.min(
          newOpened,
          prev.clicked + Math.floor(newOpened * baseConversion * 0.2 * Math.random()),
        );
        const newCompromised = Math.min(
          newClicked,
          prev.compromised + Math.floor(newClicked * 0.5 * Math.random()),
        );

        const newData = {
          sent: newSent,
          opened: newOpened,
          clicked: newClicked,
          compromised: newCompromised,
        };

        setHistory((h) => [...h, { time: `${tick * 2}s`, ...newData }]);
        return newData;
      });

      if (tick >= maxTicks) {
        clearInterval(simRef.current!);
        setStatus("completed");
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (simRef.current) clearInterval(simRef.current);
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
          <Mail className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-wide">
            Automated Phishing Simulator
          </h1>
          <p className="font-mono text-xs text-slate-400 mt-1 uppercase tracking-widest">
            Social Engineering & Human Risk Validation
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Builder */}
        <div className="lg:col-span-1 space-y-6">
          <CyberCard variant="orange" className="p-5 flex flex-col gap-4 bg-[#020610]">
            <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
              <Target className="h-4 w-4 text-orange-500" />
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest">
                Campaign Builder
              </h3>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1 block">
                1. Select Target Group
              </label>
              <select
                className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs font-mono text-slate-300 focus:border-orange-500 transition-colors"
                value={selectedGroup.id}
                onChange={(e) => setSelectedGroup(GROUPS.find((g) => g.id === e.target.value)!)}
                disabled={status === "running"}
              >
                {GROUPS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.size} targets)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1 block">
                2. Select Email Template
              </label>
              <select
                className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs font-mono text-slate-300 focus:border-orange-500 transition-colors"
                value={selectedTemplate.id}
                onChange={(e) =>
                  setSelectedTemplate(TEMPLATES.find((t) => t.id === e.target.value)!)
                }
                disabled={status === "running"}
              >
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-black/30 border border-white/5 p-3 rounded-lg space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                <span>Spoofed Sender:</span>
                <span className="text-slate-300">{selectedTemplate.sender}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                <span>Subject Line:</span>
                <span className="text-slate-300 truncate max-w-[150px]">
                  {selectedTemplate.subject}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                <span>Predicted Evasion:</span>
                <span
                  className={
                    selectedTemplate.risk === "Critical" || selectedTemplate.risk === "High"
                      ? "text-red-400 font-bold"
                      : "text-yellow-400"
                  }
                >
                  {selectedTemplate.risk}
                </span>
              </div>
            </div>

            <CyberButton
              variant="orange"
              className="w-full justify-center mt-2"
              onClick={launchCampaign}
              disabled={status === "running"}
            >
              {status === "running"
                ? "SIMULATING..."
                : status === "completed"
                  ? "RE-LAUNCH CAMPAIGN"
                  : "LAUNCH PHISHING CAMPAIGN"}
              <PlayCircle className="ml-2 h-4 w-4" />
            </CyberButton>
          </CyberCard>

          {status === "running" && (
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono uppercase text-slate-400 tracking-widest">
                <span>Simulation Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Stat Cards */}
          <div className="grid grid-cols-4 gap-4">
            <CyberCard className="p-4 flex flex-col items-center justify-center text-center gap-2 bg-[#020610]">
              <Send className="h-5 w-5 text-slate-400" />
              <span className="text-2xl font-bold font-display text-white">{stats.sent}</span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">
                Emails Sent
              </span>
            </CyberCard>
            <CyberCard className="p-4 flex flex-col items-center justify-center text-center gap-2 bg-[#020610]">
              <Eye className="h-5 w-5 text-blue-400" />
              <span className="text-2xl font-bold font-display text-white">{stats.opened}</span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-blue-400/70">
                Emails Opened
              </span>
            </CyberCard>
            <CyberCard className="p-4 flex flex-col items-center justify-center text-center gap-2 bg-[#020610]">
              <MousePointerClick className="h-5 w-5 text-orange-400" />
              <span className="text-2xl font-bold font-display text-white">{stats.clicked}</span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-orange-400/70">
                Links Clicked
              </span>
            </CyberCard>
            <CyberCard className="p-4 flex flex-col items-center justify-center text-center gap-2 bg-[#020610]">
              <ShieldOff className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold font-display text-red-500">
                {stats.compromised}
              </span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-red-500/70">
                Compromised
              </span>
            </CyberCard>
          </div>

          {/* Chart */}
          <CyberCard className="p-5 h-[350px] bg-[#020610]">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">
              Real-Time Conversion Funnel
            </div>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorClicked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompromised" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickMargin={10} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#020610",
                    borderColor: "#1e293b",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                  itemStyle={{ color: "#e2e8f0" }}
                />
                <Area
                  type="monotone"
                  dataKey="sent"
                  stroke="#94a3b8"
                  fillOpacity={1}
                  fill="url(#colorSent)"
                />
                <Area
                  type="monotone"
                  dataKey="opened"
                  stroke="#60a5fa"
                  fillOpacity={1}
                  fill="url(#colorOpened)"
                />
                <Area
                  type="monotone"
                  dataKey="clicked"
                  stroke="#f97316"
                  fillOpacity={1}
                  fill="url(#colorClicked)"
                />
                <Area
                  type="monotone"
                  dataKey="compromised"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorCompromised)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CyberCard>
        </div>
      </div>
    </div>
  );
}
