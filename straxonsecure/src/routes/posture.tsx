import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Zap,
  TrendingUp,
  Award,
  Target,
  Activity,
  Lock,
  CheckCircle2,
  Star,
  Trophy,
  Flame,
  ChevronRight,
  Radar,
  BarChart3,
  Bot,
  Send,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar as ReRadar,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { CyberCard } from "@/components/cyber/CyberCard";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import { aiThreatHunt, getSecurityPosture, getGlobalLeaderboard } from "@/server/posture";

export const Route = createFileRoute("/posture")({
  head: () => ({
    meta: [
      { title: "Security Posture — Straxon Secure" },
      {
        name: "description",
        content:
          "Your comprehensive security posture score across labs, SOC, architecture, CTF, and compliance.",
      },
    ],
  }),
  component: PosturePage,
});

// ─── Demo data (will be replaced by real API call in production) ─────────────

// Score history will be generated dynamically from real data
const BREAKDOWN_COLORS: Record<string, string> = {
  labs: "#00d4ff",
  ctf: "#ff003c",
  compliance: "#00ff88",
  soc: "#ff6b35",
  architecture: "#a855f7",
  threat_intel: "#ffaa00",
};

const RARITY_COLORS: Record<string, string> = {
  common: "border-muted-foreground/30 bg-muted/20",
  uncommon: "border-success/40 bg-success/10",
  rare: "border-primary/50 bg-primary/10",
  epic: "border-accent/60 bg-accent/10",
  legendary: "border-warning/70 bg-warning/10",
};

const RARITY_TEXT: Record<string, string> = {
  common: "text-muted-foreground",
  uncommon: "text-success",
  rare: "text-primary",
  epic: "text-accent",
  legendary: "text-warning",
};

const NEXT_ACTIONS = [
  {
    title: "Complete 3 more labs",
    subtitle: "Unlock Flag Collector badge",
    xp: "+150 XP",
    to: "/labs",
    icon: "⚗️",
  },
  {
    title: "Solve a CTF challenge",
    subtitle: "Earn your next flag",
    xp: "+100 XP",
    to: "/ctf",
    icon: "🚩",
  },
  {
    title: "Run compliance check",
    subtitle: "Improve compliance score",
    xp: "+80 XP",
    to: "/compliance",
    icon: "📋",
  },
  {
    title: "Create architecture",
    subtitle: "Earn Architect badge",
    xp: "+50 XP",
    to: "/architecture",
    icon: "🏗️",
  },
  {
    title: "Open a war room",
    subtitle: "Experience red/blue team",
    xp: "+200 XP",
    to: "/warroom",
    icon: "⚔️",
  },
];

function ScoreRing({ score, max = 1000 }: { score: number; max?: number }) {
  const pct = score / max;
  const r = 80;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="200" height="200" className="-rotate-90">
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="oklch(0.30 0.05 260 / 0.3)"
          strokeWidth="12"
        />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="oklch(0.78 0.18 200)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          style={{ filter: "drop-shadow(0 0 8px oklch(0.78 0.18 200))" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-4xl font-bold neon-text">{score}</div>
        <div className="text-xs font-mono text-muted-foreground">/ {max}</div>
      </div>
    </div>
  );
}

function AIThreatHuntPanel() {
  const [mode, setMode] = useState<"analyst" | "redteam" | "blueteam">("analyst");
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleHunt() {
    if (!query) return;
    setLoading(true);
    setReply("");
    try {
      const res = await aiThreatHunt({
        data: {
          mode,
          context:
            "User is reviewing their security posture and needs advice based on their current stats.",
          query,
        },
      });
      setReply(res.reply);
    } catch (e: any) {
      setReply("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <CyberCard variant="cyan" className="col-span-full mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="h-5 w-5 text-cyan-400" />
        <span className="font-display font-bold text-lg">AI Threat Hunter</span>
        <span className="text-[10px] font-mono text-cyan-500 ml-auto bg-cyan-950/40 px-2 py-1 rounded border border-cyan-900/50">
          STRAX-1 ONLINE
        </span>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/3 flex flex-col gap-3">
          <div className="text-xs font-mono text-muted-foreground">// SELECT MODULE</div>
          <div className="flex flex-col gap-2">
            {[
              { id: "analyst", label: "Threat Analyst", desc: "IOCs & Patterns" },
              { id: "redteam", label: "Red Team Ops", desc: "Attack Vectors" },
              { id: "blueteam", label: "Blue Team Def", desc: "Hardening & Rules" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`p-3 rounded-lg border text-left transition-all ${mode === m.id ? "bg-cyan-950/40 border-cyan-900/50 text-cyan-400" : "bg-muted/10 border-transparent hover:bg-muted/20 text-muted-foreground"}`}
              >
                <div className="font-mono text-sm font-bold">{m.label}</div>
                <div className="text-[10px] mt-1 opacity-70">{m.desc}</div>
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs font-mono text-muted-foreground">// QUERY</div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about your posture, anomalies, or request a playbook..."
            className="flex-1 min-h-[100px] bg-muted/20 border border-border rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-cyan-500/50 resize-none"
          />
          <button
            onClick={handleHunt}
            disabled={loading || !query}
            className="flex items-center justify-center gap-2 bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-900/50 text-cyan-400 p-3 rounded-lg font-mono text-sm transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? "ANALYZING..." : "INITIALIZE HUNT"}
          </button>
        </div>
        <div className="w-full md:w-2/3 bg-slate-950/50 rounded-lg border border-border p-4 overflow-y-auto min-h-[300px] max-h-[500px]">
          {reply ? (
            <div className="prose prose-invert prose-sm font-mono max-w-none text-slate-300">
              <ReactMarkdown>{reply}</ReactMarkdown>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-xs text-center opacity-50 flex-col gap-2 py-20">
              <Bot className="h-8 w-8 mb-2 opacity-50" />
              Awaiting parameters for target analysis. <br /> Select a module and initialize hunt.
            </div>
          )}
        </div>
      </div>
    </CyberCard>
  );
}

function PosturePage() {
  const [posture, setPosture] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [postureRes, boardRes] = await Promise.all([
        getSecurityPosture(),
        getGlobalLeaderboard(),
      ]);
      setPosture(postureRes);
      setLeaderboard(boardRes.leaderboard ?? []);
    } catch (e: any) {
      console.error("Failed to load posture", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading || !posture) {
    return (
      <div className="px-4 lg:px-8 py-20 max-w-7xl mx-auto flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-mono text-sm text-muted-foreground">Loading security posture…</p>
      </div>
    );
  }

  // Build breakdown with colors + labels
  const breakdownLabels: Record<string, { label: string; max: number }> = {
    labs: { label: "Attack Labs", max: 300 },
    ctf: { label: "CTF Challenges", max: 300 },
    compliance: { label: "Compliance", max: 200 },
    soc: { label: "SOC Operations", max: 200 },
    architecture: { label: "Architecture", max: 200 },
    threat_intel: { label: "Threat Intel", max: 200 },
  };

  const breakdownEntries = Object.entries(breakdownLabels).map(([key, meta]) => ({
    key,
    label: meta.label,
    max: meta.max,
    score: (posture as any)[`${key}_score`] ?? posture.breakdown?.[key]?.score ?? 0,
    color: BREAKDOWN_COLORS[key] ?? "#888",
  }));

  // Build badges list — earned slugs from posture.badges
  const earnedSlugs = new Set<string>(posture.badges ?? []);
  const ALL_BADGES = [
    { slug: "first_blood", title: "First Blood", icon: "🩸", rarity: "common" },
    { slug: "sqli_master", title: "SQL Sorcerer", icon: "💉", rarity: "uncommon" },
    { slug: "xss_hunter", title: "XSS Hunter", icon: "🎯", rarity: "uncommon" },
    { slug: "jwt_breaker", title: "JWT Breaker", icon: "🔑", rarity: "rare" },
    { slug: "rce_god", title: "RCE God", icon: "💀", rarity: "epic" },
    { slug: "ctf_rookie", title: "CTF Rookie", icon: "🚩", rarity: "common" },
    { slug: "flag_collector", title: "Flag Collector", icon: "🏴", rarity: "rare" },
    { slug: "soc_operator", title: "SOC Operator", icon: "🛡️", rarity: "uncommon" },
    { slug: "architect", title: "Security Architect", icon: "🏗️", rarity: "rare" },
    { slug: "red_team_ace", title: "Red Team Ace", icon: "🔴", rarity: "epic" },
    { slug: "blue_team_guardian", title: "Blue Guardian", icon: "🔵", rarity: "epic" },
    { slug: "speed_demon", title: "Speed Demon", icon: "⚡", rarity: "legendary" },
    { slug: "dark_knight", title: "Dark Knight", icon: "🦇", rarity: "legendary" },
    { slug: "compliance_king", title: "Compliance King", icon: "📋", rarity: "rare" },
    { slug: "threat_hunter", title: "Threat Hunter", icon: "🔍", rarity: "uncommon" },
  ];
  const badges = ALL_BADGES.map((b) => ({ ...b, earned: earnedSlugs.has(b.slug) }));
  const badges_earned = earnedSlugs.size;

  // Score history (use score across breakdown as data)
  const scoreHistory = breakdownEntries.map((e) => ({ day: e.label.split(" ")[0], score: e.score }));


  const radarData = breakdownEntries.map((e) => ({
    subject: e.label.split(" ")[0],
    score: Math.round((e.score / e.max) * 100),
    fullMark: 100,
  }));

  const grade =
    posture.total_score >= 900
      ? "S"
      : posture.total_score >= 750
        ? "A"
        : posture.total_score >= 600
          ? "B"
          : posture.total_score >= 400
            ? "C"
            : posture.total_score >= 200
              ? "D"
              : "F";

  const gradeColor =
    grade === "S"
      ? "text-warning"
      : grade === "A"
        ? "text-success"
        : grade === "B"
          ? "text-primary"
          : grade === "C"
            ? "text-accent"
            : "text-destructive";

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-8">
      <SectionHeading
        eyebrow="// SECURITY METRICS"
        title="Security Posture"
        description="Your comprehensive security posture across every dimension of the platform. Track progress, earn badges, dominate the leaderboard."
      />

      {/* Hero Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Score Ring */}
        <CyberCard variant="cyan" className="flex flex-col items-center py-8">
          <ScoreRing score={posture.total_score} />
          <div className="mt-4 text-center">
            <div className={`font-display text-6xl font-bold ${gradeColor}`}>{grade}</div>
            <div className="text-xs font-mono text-muted-foreground mt-1">SECURITY GRADE</div>
            <div className="mt-3 flex items-center gap-2 justify-center">
              <Flame className="h-4 w-4 text-warning" />
              <span className="font-mono text-sm text-warning">
                {posture.streak_days} day streak
              </span>
            </div>
          </div>
        </CyberCard>

        {/* Level & XP */}
        <CyberCard variant="magenta" className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10">
                <Star className="h-6 w-6 text-accent" />
              </div>
              <div>
                <div className="text-xs font-mono text-muted-foreground">OPERATOR LEVEL</div>
                <div className="font-display text-3xl font-bold">Lv. {posture.level}</div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
                <span>{posture.xp} XP</span>
                <span>
                  {posture.next_level_xp} XP to Lv. {posture.level + 1}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(posture.xp / posture.next_level_xp) * 100}%` }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="h-full bg-gradient-to-r from-accent to-primary rounded-full"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {breakdownEntries
              .slice(0, 4)
              .map((val) => (
                <div key={val.key} className="text-center">
                  <div className="font-display text-xl font-bold" style={{ color: val.color }}>
                    {val.score}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {val.label.split(" ")[0]}
                  </div>
                </div>
              ))}
          </div>
        </CyberCard>

        {/* Radar Chart */}
        <CyberCard variant="cyan" className="py-4">
          <div className="text-xs font-mono text-primary mb-3">// CAPABILITY RADAR</div>
          <ResponsiveContainer width="100%" height={200} minWidth={0} minHeight={0}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="oklch(0.30 0.05 260 / 0.4)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 10, fill: "oklch(0.68 0.04 240)", fontFamily: "monospace" }}
              />
              <ReRadar
                dataKey="score"
                stroke="oklch(0.78 0.18 200)"
                fill="oklch(0.78 0.18 200)"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CyberCard>
      </div>

      {/* Score Breakdown */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {breakdownEntries.map((val) => {
          const pct = Math.round((val.score / val.max) * 100);
          return (
            <CyberCard key={val.key} variant="cyan">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono" style={{ color: val.color }}>
                  {val.label}
                </span>
                <span className="font-display text-xl font-bold" style={{ color: val.color }}>
                  {val.score}/{val.max}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: val.color }}
                />
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mt-1">
                {pct}% complete
              </div>
            </CyberCard>
          );
        })}
      </div>

      <CyberCard variant="cyan">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-mono text-primary">// SCORE BREAKDOWN BY CATEGORY</div>
          <button onClick={load} className="text-muted-foreground hover:text-primary transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <ResponsiveContainer width="100%" height={150} minWidth={0} minHeight={0}>
          <AreaChart data={scoreHistory}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="oklch(0.78 0.18 200)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="oklch(0.78 0.18 200)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "oklch(0.68 0.04 240)", fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "oklch(0.17 0.035 265)",
                border: "1px solid oklch(0.78 0.18 200 / 0.3)",
                borderRadius: 6,
                fontFamily: "monospace",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="oklch(0.78 0.18 200)"
              strokeWidth={2}
              fill="url(#scoreGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CyberCard>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Badges */}
        <CyberCard variant="magenta">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-accent" />
            <span className="font-display font-bold text-lg">Achievements</span>
            <span className="text-xs font-mono text-muted-foreground ml-auto">
              {badges_earned}/{badges.length}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {badges.map((badge) => (
              <div
                key={badge.slug}
                title={badge.title}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg border text-2xl transition-all ${badge.earned ? RARITY_COLORS[badge.rarity] : "border-border/30 bg-muted/10 opacity-30 grayscale"}`}
              >
                {badge.icon}
                <span className={`text-[8px] font-mono mt-1 ${RARITY_TEXT[badge.rarity]}`}>
                  {badge.rarity.slice(0, 3).toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </CyberCard>

        {/* Global Leaderboard */}
        <CyberCard variant="cyan">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-warning" />
            <span className="font-display font-bold text-lg">Global Leaderboard</span>
          </div>
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((p: any, i: number) => {
              const rankEmoji = i === 0 ? "🏆" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
              return (
                <div
                  key={p.userId}
                  className={`flex items-center gap-3 p-2 rounded transition-colors ${
                    p.isCurrentUser
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted/20"
                  }`}
                >
                  <span className="text-lg w-6 text-center shrink-0">{rankEmoji}</span>
                  <span
                    className={`font-mono text-sm flex-1 truncate ${
                      p.isCurrentUser ? "text-primary font-bold" : "text-foreground/80"
                    }`}
                  >
                    {p.displayName}
                    {p.isCurrentUser && " ← you"}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground shrink-0">Lv.{p.level}</span>
                  <span className="font-display font-bold text-primary shrink-0">{p.totalScore}</span>
                </div>
              );
            })}
            {leaderboard.length === 0 && (
              <p className="text-center text-muted-foreground font-mono text-xs py-6">No data yet — complete labs to appear here!</p>
            )}
          </div>
        </CyberCard>
      </div>

      {/* Next Actions */}
      <CyberCard variant="cyan">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-warning" />
          <span className="font-display font-bold text-lg">Next Actions</span>
          <span className="text-xs font-mono text-muted-foreground">Boost your score</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {NEXT_ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to as any}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <span className="text-2xl">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{a.title}</div>
                <div className="text-[11px] text-muted-foreground">{a.subtitle}</div>
              </div>
              <div className="text-[10px] font-mono text-success shrink-0">{a.xp}</div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </CyberCard>

      {/* AI Threat Hunt */}
      <AIThreatHuntPanel />
    </div>
  );
}
