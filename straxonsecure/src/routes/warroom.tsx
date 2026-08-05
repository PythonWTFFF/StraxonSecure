import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sword,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Radio,
  Target,
  Activity,
  Play,
  Square,
  Trophy,
  ChevronRight,
  Brain,
  RefreshCw,
} from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { ingestThreatEvent } from "@/server/soc";
import { createWarRoom } from "@/server/posture";
import { supabase } from "@/integrations/supabase/client";
import { askAI } from "@/server/ai";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/warroom")({
  head: () => ({
    meta: [
      { title: "War Room — Red vs Blue — Straxon Secure" },
      {
        name: "description",
        content:
          "Real-time Red Team vs Blue Team cyber warfare simulation. Attack, defend, and dominate.",
      },
    ],
  }),
  component: WarRoom,
});

// ─── Attack Scenarios ─────────────────────────────────────────────────────────

interface Attack {
  id: string;
  ts: string;
  type: string;
  payload: string;
  target: string;
  severity: "low" | "medium" | "high" | "critical";
  mitre: string;
  detected: boolean;
  blocked: boolean;
  points: number;
}

const RED_ATTACKS = [
  {
    type: "SQL Injection",
    payload: "' OR 1=1 --",
    target: "/api/login",
    severity: "high" as const,
    mitre: "T1190",
    points: 15,
  },
  {
    type: "XSS Payload",
    payload: "<script>document.cookie</script>",
    target: "/search",
    severity: "medium" as const,
    mitre: "T1059.007",
    points: 10,
  },
  {
    type: "Credential Stuffing",
    payload: "admin:password123",
    target: "/api/auth",
    severity: "high" as const,
    mitre: "T1110.004",
    points: 20,
  },
  {
    type: "Path Traversal",
    payload: "../../etc/passwd",
    target: "/api/file",
    severity: "critical" as const,
    mitre: "T1083",
    points: 25,
  },
  {
    type: "JWT Bypass",
    payload: '{"alg":"none"}',
    target: "/api/admin",
    severity: "critical" as const,
    mitre: "T1552",
    points: 30,
  },
  {
    type: "SSRF Probe",
    payload: "http://169.254.169.254/",
    target: "/api/fetch",
    severity: "high" as const,
    mitre: "T1090",
    points: 20,
  },
  {
    type: "Command Injection",
    payload: "; cat /etc/passwd",
    target: "/api/ping",
    severity: "critical" as const,
    mitre: "T1059",
    points: 35,
  },
  {
    type: "Port Scan",
    payload: "SYN flood 1-1024",
    target: "192.168.0.0/24",
    severity: "medium" as const,
    mitre: "T1046",
    points: 10,
  },
  {
    type: "Phishing Attempt",
    payload: "fake-login.straxon.io",
    target: "email:alice@straxon.io",
    severity: "high" as const,
    mitre: "T1566",
    points: 15,
  },
  {
    type: "Ransomware Drop",
    payload: "encrypt.exe --all-files",
    target: "file-server",
    severity: "critical" as const,
    mitre: "T1486",
    points: 50,
  },
];

const BLUE_DEFENSES = [
  "Rate limiter triggered — 429 Too Many Requests",
  "WAF rule matched: SQL injection blocked",
  "CSP header prevented XSS execution",
  "SIEM alert raised — anomalous login pattern",
  "IP banned after 5 failed attempts",
  "JWT signature verification failed",
  "EDR quarantined suspicious process",
  "Network segmentation — lateral movement blocked",
  "Honeypot triggered — attacker IP logged",
  "IDS signature match — connection reset",
];

const SCENARIOS = [
  {
    key: "breach",
    title: "Corporate Breach",
    icon: "🏢",
    desc: "Red team attempts full corporate network compromise. Blue team defends crown jewels.",
    duration: 10,
  },
  {
    key: "ransomware",
    title: "Ransomware APT",
    icon: "🦠",
    desc: "Sophisticated APT group deploys ransomware. Blue team races to contain.",
    duration: 15,
  },
  {
    key: "ddos",
    title: "DDoS Barrage",
    icon: "💥",
    desc: "Sustained DDoS campaign with multiple attack vectors. Mitigation race.",
    duration: 8,
  },
  {
    key: "apt",
    title: "Nation-State APT",
    icon: "🕵️",
    desc: "Advanced persistent threat with multi-stage attack chain.",
    duration: 20,
  },
];

function WarRoom() {
  const [phase, setPhase] = useState<"lobby" | "active" | "completed">("lobby");
  const [team, setTeam] = useState<"red" | "blue">("red");
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [redScore, setRedScore] = useState(0);
  const [blueScore, setBlueScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [autoDefend, setAutoDefend] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const counterRef = useRef(1);
  const [debrief, setDebrief] = useState<string | null>(null);
  const [debriefing, setDebriefing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const attacksRef = useRef<Attack[]>([]);
  const redScoreRef = useRef(0);
  const blueScoreRef = useRef(0);

  const startSession = async () => {
    setPhase("active");
    setAttacks([]);
    attacksRef.current = [];
    setRedScore(0);
    setBlueScore(0);
    redScoreRef.current = 0;
    blueScoreRef.current = 0;
    setDebrief(null);
    setTimeLeft(scenario.duration * 60);
    counterRef.current = 1;

    // Persist session to Supabase
    try {
      const res = await createWarRoom({
        data: {
          name: `${scenario.title} — ${new Date().toLocaleString()}`,
          durationMinutes: scenario.duration,
          scenario: scenario.key as any,
        },
      });
      setSessionId(res.sessionId);
      // Mark session as active
      await supabase
        .from("warroom_sessions")
        .update({ status: "active", starts_at: new Date().toISOString() })
        .eq("id", res.sessionId);
    } catch (e: any) {
      console.warn("[WarRoom] Could not persist session:", e.message);
    }

    // Timer
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endSession(attacksRef.current, redScoreRef.current, blueScoreRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // Attack generator
    intervalRef.current = setInterval(
      () => {
        const tmpl = RED_ATTACKS[Math.floor(Math.random() * RED_ATTACKS.length)];
        const detected = Math.random() > 0.4;
        const blocked = detected && Math.random() > 0.3;

        const attack: Attack = {
          id: crypto.randomUUID(),
          ts: new Date().toLocaleTimeString(),
          type: tmpl.type,
          payload: tmpl.payload,
          target: tmpl.target,
          severity: tmpl.severity,
          mitre: tmpl.mitre,
          detected,
          blocked,
          points: tmpl.points,
        };

        attacksRef.current = [attack, ...attacksRef.current].slice(0, 50);
        setAttacks((p) => [attack, ...p].slice(0, 50));

        if (!blocked) {
          redScoreRef.current += tmpl.points;
          setRedScore((s) => s + tmpl.points);
          if (team === "red")
            toast.error(`🎯 Attack landed! +${tmpl.points} pts — ${tmpl.type}`, { duration: 2000 });
        } else {
          const pts = Math.floor(tmpl.points * 0.7);
          blueScoreRef.current += pts;
          setBlueScore((s) => s + pts);
          if (team === "blue") toast.success(`🛡️ Blocked! +${pts} pts`, { duration: 2000 });
        }
      },
      2000 + Math.random() * 1500,
    );

    toast.success("⚔️ War Room session started!", { duration: 3000 });
  };

  const endSession = async (finalAttacks?: Attack[], finalRed?: number, finalBlue?: number) => {
    setPhase("completed");
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    toast.info("🏁 Session ended!", { duration: 5000 });

    // Save critical attacks to SOC events AND to warroom_sessions.attack_log
    const toSave = (finalAttacks ?? attacksRef.current)
      .filter((a) => a.severity === "critical" || a.severity === "high")
      .slice(0, 5);

    // Persist final state to Supabase
    if (sessionId) {
      const allAttacks = finalAttacks ?? attacksRef.current;
      const fRed2 = finalRed ?? redScoreRef.current;
      const fBlue2 = finalBlue ?? blueScoreRef.current;
      try {
        await supabase
          .from("warroom_sessions")
          .update({
            status: "completed",
            red_score: fRed2,
            blue_score: fBlue2,
            ends_at: new Date().toISOString(),
            attack_log: allAttacks.slice(0, 100),
          })
          .eq("id", sessionId);
      } catch (e: any) {
        console.warn("[WarRoom] Could not save session results:", e.message);
      }
    }
    for (const a of toSave) {
      try {
        await ingestThreatEvent({
          data: {
            severity: a.severity === "critical" ? "critical" : "high",
            attack_type: a.type,
            source_ip: `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            message: `War Room: ${a.type} — ${a.payload} → ${a.target}`,
            mitre_technique: a.mitre,
            response_action: a.blocked ? "block" : "alert",
          },
        });
      } catch {}
    }

    // Generate AI debrief
    setDebriefing(true);
    const fAtk = finalAttacks ?? attacksRef.current;
    const fRed = finalRed ?? redScoreRef.current;
    const fBlue = finalBlue ?? blueScoreRef.current;
    try {
      const summary = [
        `Scenario: ${scenario.title}`,
        `Team: ${team === "red" ? "Red (Attacker)" : "Blue (Defender)"}`,
        `Red Score: ${fRed} | Blue Score: ${fBlue}`,
        `Total Attacks: ${fAtk.length}`,
        `Blocked: ${fAtk.filter((a) => a.blocked).length}`,
        `Undetected: ${fAtk.filter((a) => !a.detected).length}`,
        `Attack Types: ${[...new Set(fAtk.map((a) => a.type))].join(", ")}`,
        `MITRE Techniques: ${[...new Set(fAtk.map((a) => a.mitre))].join(", ")}`,
      ].join("\n");

      const res = await askAI({
        data: {
          messages: [
            {
              role: "user",
              content: `You are a War Room exercise debrief analyst. Provide a concise after-action report for this cybersecurity exercise:\n\n${summary}\n\nInclude:\n## 🎯 Key Takeaways\n## 🔴 Attack Analysis\n## 🔵 Defense Performance\n## 📋 Recommendations\n\nKeep it under 300 words, be specific and actionable.`,
            },
          ],
          mode: "explain",
        },
      });
      setDebrief(res.reply);
    } catch {
      setDebrief(null);
    } finally {
      setDebriefing(false);
    }
  };

  const manualDefend = () => {
    const attack = attacks.find((a) => !a.blocked);
    if (!attack) {
      toast.info("Nothing to block right now");
      return;
    }
    setAttacks((p) =>
      p.map((a) => (a.id === attack.id ? { ...a, blocked: true, detected: true } : a)),
    );
    const pts = Math.floor(attack.points * 0.7);
    setBlueScore((s) => s + pts);
    toast.success(`🛡️ Manually blocked ${attack.type}! +${pts} pts`, { duration: 2000 });
  };

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  const SEV_COLORS: Record<string, string> = {
    critical: "text-destructive border-destructive/40",
    high: "text-warning border-warning/40",
    medium: "text-accent border-accent/40",
    low: "text-primary border-primary/40",
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (phase === "lobby") {
    return (
      <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-8">
        <SectionHeading
          eyebrow="// ADVERSARIAL TRAINING"
          title="War Room"
          description="Real-time Red vs Blue team simulation. Red team attacks, Blue team defends. Score points. Dominate."
        />

        <div className="grid md:grid-cols-2 gap-6">
          {/* Team Selection */}
          <CyberCard variant="cyan">
            <div className="text-xs font-mono text-primary mb-4">// SELECT YOUR TEAM</div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTeam("red")}
                className={`p-6 rounded-lg border-2 transition-all ${team === "red" ? "border-destructive bg-destructive/10" : "border-border hover:border-destructive/50"}`}
              >
                <Sword
                  className={`h-8 w-8 mx-auto mb-2 ${team === "red" ? "text-destructive" : "text-muted-foreground"}`}
                />
                <div className="font-display font-bold text-lg">Red Team</div>
                <div className="text-xs text-muted-foreground mt-1">Offensive Operations</div>
              </button>
              <button
                onClick={() => setTeam("blue")}
                className={`p-6 rounded-lg border-2 transition-all ${team === "blue" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
              >
                <Shield
                  className={`h-8 w-8 mx-auto mb-2 ${team === "blue" ? "text-primary" : "text-muted-foreground"}`}
                />
                <div className="font-display font-bold text-lg">Blue Team</div>
                <div className="text-xs text-muted-foreground mt-1">Defensive Operations</div>
              </button>
            </div>
          </CyberCard>

          {/* Scenario Selection */}
          <CyberCard variant="magenta">
            <div className="text-xs font-mono text-accent mb-4">// SELECT SCENARIO</div>
            <div className="space-y-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setScenario(s)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${scenario.key === s.key ? "border-accent bg-accent/10" : "border-border hover:border-accent/40"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{s.icon}</span>
                    <div className="flex-1">
                      <div className="font-mono text-sm font-medium">{s.title}</div>
                      <div className="text-[11px] text-muted-foreground">{s.desc}</div>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {s.duration}min
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CyberCard>
        </div>

        <div className="flex justify-center">
          <CyberButton
            onClick={startSession}
            variant={team === "red" ? "magenta" : "cyan"}
            className="px-12 py-3 text-lg"
          >
            <Play className="h-5 w-5" />
            Launch {team === "red" ? "Attack" : "Defense"} — {scenario.title}
          </CyberButton>
        </div>
      </div>
    );
  }

  if (phase === "completed") {
    const redWon = redScore > blueScore;
    const winner = redWon ? "RED TEAM" : "BLUE TEAM";
    return (
      <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
        <CyberCard variant={redWon ? "magenta" : "cyan"} glow className="text-center py-10">
          <Trophy
            className={`h-14 w-14 mx-auto mb-4 ${redWon ? "text-red-400" : "text-[#00f3ff]"}`}
          />
          <div className="font-display text-4xl font-bold mb-2">{winner} WINS</div>
          <div className="text-slate-400 font-mono">{scenario.title} — Completed</div>
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-sm mx-auto">
            <div className="text-center">
              <div className="text-red-400 font-display text-3xl font-bold">{redScore}</div>
              <div className="text-[10px] font-mono text-slate-500">RED SCORE</div>
            </div>
            <div className="text-center">
              <div className="text-slate-500 font-mono text-sm">VS</div>
            </div>
            <div className="text-center">
              <div className="text-[#00f3ff] font-display text-3xl font-bold">{blueScore}</div>
              <div className="text-[10px] font-mono text-slate-500">BLUE SCORE</div>
            </div>
          </div>
          <div className="mt-4 text-xs font-mono text-slate-500">
            {attacks.length} attacks · {attacks.filter((a) => a.blocked).length} blocked ·{" "}
            {attacks.filter((a) => !a.detected).length} undetected
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <CyberButton
              onClick={() => {
                setPhase("lobby");
                setDebrief(null);
              }}
              variant={redWon ? "magenta" : "cyan"}
            >
              <Play className="h-4 w-4" /> New Session
            </CyberButton>
          </div>
        </CyberCard>

        {/* AI Debrief */}
        <CyberCard variant="magenta" className="p-6">
          <div className="text-[10px] font-mono text-[#ff003c] uppercase tracking-widest mb-3 flex items-center gap-2">
            <Brain className="h-3.5 w-3.5" />
            AI AFTER-ACTION REPORT
          </div>
          {debriefing ? (
            <div className="flex items-center gap-3 text-sm font-mono text-slate-400 py-6">
              <RefreshCw className="h-5 w-5 text-[#ff003c] animate-spin" />
              Generating after-action report...
            </div>
          ) : debrief ? (
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-[#ff003c] prose-headings:font-mono prose-headings:text-sm prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white">
              <ReactMarkdown>{debrief}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-slate-500 font-mono">
              AI debrief unavailable — check GEMINI_API_KEY
            </p>
          )}
        </CyberCard>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-4">
      {/* HUD */}
      <div className="grid grid-cols-3 gap-4">
        <CyberCard variant="magenta" className="text-center py-3">
          <Sword className="h-5 w-5 text-destructive mx-auto mb-1" />
          <div className="font-display text-3xl font-bold text-destructive">{redScore}</div>
          <div className="text-[10px] font-mono text-muted-foreground">RED SCORE</div>
        </CyberCard>
        <CyberCard variant="cyan" className="text-center py-3">
          <Clock className="h-5 w-5 text-warning mx-auto mb-1" />
          <div
            className={`font-display text-3xl font-bold ${timeLeft < 60 ? "text-destructive animate-pulse" : "text-warning"}`}
          >
            {formatTime(timeLeft)}
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">TIME REMAINING</div>
        </CyberCard>
        <CyberCard variant="cyan" className="text-center py-3">
          <Shield className="h-5 w-5 text-primary mx-auto mb-1" />
          <div className="font-display text-3xl font-bold text-primary">{blueScore}</div>
          <div className="text-[10px] font-mono text-muted-foreground">BLUE SCORE</div>
        </CyberCard>
      </div>

      {/* Controls */}
      {team === "blue" && (
        <div className="flex gap-3">
          <CyberButton onClick={manualDefend} variant="cyan">
            <Shield className="h-4 w-4" /> Manual Block
          </CyberButton>
          <CyberButton onClick={endSession} variant="magenta">
            <Square className="h-4 w-4" /> End Session
          </CyberButton>
        </div>
      )}
      {team === "red" && (
        <CyberButton onClick={endSession} variant="magenta">
          <Square className="h-4 w-4" /> End Session
        </CyberButton>
      )}

      {/* Attack Feed */}
      <CyberCard variant="cyan" className="p-0 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/50 bg-background/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-destructive animate-pulse" />
            <span className="text-xs font-mono text-primary">// LIVE ATTACK FEED</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            {attacks.length} events
          </span>
        </div>
        <div className="max-h-[500px] overflow-auto">
          <AnimatePresence initial={false}>
            {attacks.map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-start gap-3 px-4 py-3 border-b border-border/20 text-xs font-mono transition-colors ${a.blocked ? "bg-success/5" : "bg-destructive/5"}`}
              >
                <span className="text-muted-foreground/60 shrink-0 mt-0.5">{a.ts}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-1.5 py-0.5 rounded border text-[9px] uppercase ${SEV_COLORS[a.severity]}`}
                    >
                      {a.severity}
                    </span>
                    <span className="text-foreground/90 font-bold">{a.type}</span>
                    <span className="text-muted-foreground text-[10px]">MITRE: {a.mitre}</span>
                    {a.blocked ? (
                      <span className="text-success text-[10px]">🛡️ BLOCKED</span>
                    ) : a.detected ? (
                      <span className="text-warning text-[10px]">⚠️ DETECTED (not blocked)</span>
                    ) : (
                      <span className="text-destructive text-[10px]">💀 UNDETECTED</span>
                    )}
                  </div>
                  <div className="text-muted-foreground mt-0.5 truncate">
                    {a.payload} → {a.target}
                  </div>
                </div>
                <span
                  className={`shrink-0 font-bold ${a.blocked ? "text-primary" : "text-destructive"}`}
                >
                  {a.blocked ? `+${Math.floor(a.points * 0.7)} 🔵` : `+${a.points} 🔴`}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CyberCard>
    </div>
  );
}
