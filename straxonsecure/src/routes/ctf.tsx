import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flag,
  Trophy,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Clock,
  Star,
  Lightbulb,
  CheckCircle2,
  Target,
  Zap,
  Medal,
} from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { toast } from "sonner";
import { getCTFChallenges, submitCTFFlag, useCTFHint } from "@/server/labs";

export const Route = createFileRoute("/ctf")({
  head: () => ({
    meta: [
      { title: "CTF — Capture The Flag — Straxon Secure" },
      {
        name: "description",
        content:
          "Hands-on CTF challenges across web, crypto, forensics, networking, and reverse engineering. Compete and earn XP.",
      },
    ],
  }),
  component: CTFHub,
});

// ─── Static challenge data for when not logged in ────────────────────────────

const STATIC_CHALLENGES = [
  {
    id: "c1",
    slug: "web-01-cookie-monster",
    title: "Cookie Monster",
    category: "web",
    difficulty: "easy",
    points: 100,
    description:
      "A login page stores user role in a cookie. Can you escalate your privileges to admin?",
    hints: [
      { index: 0, text: "Inspect your browser cookies" },
      { index: 1, text: "The role field seems editable" },
      { index: 2, text: "Try changing role=user to role=admin" },
    ],
    solve_count: 47,
    solved: false,
    usedHints: [],
    flag_hash: "straxon{c00k1e_m4n1pul4t10n_1s_d4ng3r0us}",
  },
  {
    id: "c2",
    slug: "web-02-jwt-confusion",
    title: "Algorithm Confusion",
    category: "web",
    difficulty: "medium",
    points: 200,
    description:
      "The API uses JWT tokens for authentication. The developer made a critical mistake. Forge a token as admin.",
    hints: [
      { index: 0, text: "Look at the alg field" },
      { index: 1, text: "Try setting alg to none" },
      { index: 2, text: "An unsigned token might be accepted" },
    ],
    solve_count: 23,
    solved: false,
    usedHints: [],
    flag_hash: "straxon{4lg_n0n3_4tt4ck_byp4ss3d}",
  },
  {
    id: "c3",
    slug: "web-03-ssrf-internal",
    title: "Internal Recon",
    category: "web",
    difficulty: "medium",
    points: 250,
    description:
      "The web app fetches URLs from user input. Make it fetch from the internal network.",
    hints: [
      { index: 0, text: "The /fetch endpoint takes a url parameter" },
      { index: 1, text: "Try cloud metadata endpoints" },
      { index: 2, text: "AWS/GCP metadata: 169.254.169.254" },
    ],
    solve_count: 18,
    solved: false,
    usedHints: [],
    flag_hash: "straxon{ssrf_l34ds_t0_m3t4d4t4_l34k}",
  },
  {
    id: "c4",
    slug: "crypto-01-xor-cipher",
    title: "XOR Secrets",
    category: "crypto",
    difficulty: "easy",
    points: 100,
    description:
      "A file has been encrypted with a single-byte XOR cipher. Decrypt to find the flag.",
    hints: [
      { index: 0, text: "Single byte XOR = 256 possible keys" },
      { index: 1, text: "Brute force all 256 keys" },
      { index: 2, text: "The decrypted text will be readable English" },
    ],
    solve_count: 61,
    solved: false,
    usedHints: [],
    flag_hash: "straxon{x0r_1s_n0t_3ncrypt10n}",
  },
  {
    id: "c5",
    slug: "crypto-02-weak-rsa",
    title: "Tiny Exponent",
    category: "crypto",
    difficulty: "hard",
    points: 400,
    description: "RSA was used with e=3. Small messages with tiny exponents are vulnerable.",
    hints: [
      { index: 0, text: "When e=3, try cube root of ciphertext" },
      { index: 1, text: "If message^e < n, no modular reduction happens" },
      { index: 2, text: "Integer cube root of ciphertext = message" },
    ],
    solve_count: 8,
    solved: false,
    usedHints: [],
    flag_hash: "straxon{sm4ll_3xp0n3nt_4tt4ck_rsa}",
  },
  {
    id: "c6",
    slug: "network-01-pcap-analysis",
    title: "Traffic Analysis",
    category: "network",
    difficulty: "medium",
    points: 200,
    description:
      "A network capture contains suspicious activity. Analyze packets and find the exfiltrated secret.",
    hints: [
      { index: 0, text: "DNS queries can carry data" },
      { index: 1, text: "Check unusually long subdomain names" },
      { index: 2, text: "Flag is base64 encoded in DNS TXT records" },
    ],
    solve_count: 29,
    solved: false,
    usedHints: [],
    flag_hash: "straxon{dns_3xfil_1s_stealthy}",
  },
  {
    id: "c7",
    slug: "misc-01-steganography",
    title: "Hidden in Plain Sight",
    category: "misc",
    difficulty: "easy",
    points: 150,
    description: "An innocent-looking image contains a hidden message. Extract the flag.",
    hints: [
      { index: 0, text: "Check LSB of pixel values" },
      { index: 1, text: "Hidden in red channel LSBs" },
      { index: 2, text: "Read bits sequentially, convert to ASCII" },
    ],
    solve_count: 52,
    solved: false,
    usedHints: [],
    flag_hash: "straxon{l35t_s1gn1f1c4nt_b1t_st3g4n0}",
  },
  {
    id: "c8",
    slug: "forensics-01-log-analysis",
    title: "Log Hunter",
    category: "forensics",
    difficulty: "medium",
    points: 300,
    description:
      "Analyze server access logs to identify the attacker's IP, vulnerability, and timestamp.",
    hints: [
      { index: 0, text: "Look for unusual URL patterns" },
      { index: 1, text: "SQL injection leaves UNION SELECT patterns" },
      { index: 2, text: "First successful injection = timestamp" },
    ],
    solve_count: 15,
    solved: false,
    usedHints: [],
    flag_hash: "straxon{192.168.1.105_SQLi_2026-08-01T14:23:07}",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  web: "text-primary border-primary/40 bg-primary/10",
  crypto: "text-accent border-accent/40 bg-accent/10",
  network: "text-warning border-warning/40 bg-warning/10",
  forensics: "text-neon-lime border-neon-lime/40 bg-neon-lime/10",
  reverse: "text-neon-violet border-neon-violet/40 bg-neon-violet/10",
  misc: "text-muted-foreground border-border bg-muted/20",
  pwn: "text-destructive border-destructive/40 bg-destructive/10",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-success",
  medium: "text-warning",
  hard: "text-destructive",
  insane: "text-accent",
};

const DIFFICULTY_STARS: Record<string, number> = { easy: 1, medium: 2, hard: 3, insane: 4 };

function ChallengeCard({ challenge }: { challenge: (typeof STATIC_CHALLENGES)[0] }) {
  const [expanded, setExpanded] = useState(false);
  const [flag, setFlag] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [solved, setSolved] = useState(challenge.solved);
  const [usedHints, setUsedHints] = useState<number[]>(challenge.usedHints ?? []);
  const [showHints, setShowHints] = useState(false);
  const [startTime] = useState(Date.now());

  const handleSubmit = async () => {
    if (!flag.trim()) return;
    setSubmitting(true);
    try {
      // Client-side check using the static hash for demo
      const isCorrect = flag.trim().toLowerCase() === challenge.flag_hash.toLowerCase();
      if (isCorrect) {
        setSolved(true);
        toast.success(`🚩 ${challenge.title} — Captured! +${challenge.points} pts`, {
          duration: 5000,
        });
      } else {
        toast.error("❌ Wrong flag. Keep hunting!");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const useHint = (idx: number) => {
    if (usedHints.includes(idx)) return;
    setUsedHints((p) => [...p, idx]);
    toast.info(`💡 Hint ${idx + 1} unlocked. -${Math.floor(challenge.points * 0.1)} pts`, {
      duration: 3000,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} layout>
      <CyberCard
        variant={solved ? "cyan" : "magenta"}
        glow={solved}
        className={`transition-all duration-300 ${solved ? "border-success/40" : ""}`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-widest ${CATEGORY_COLORS[challenge.category] ?? CATEGORY_COLORS.misc}`}
              >
                {challenge.category}
              </span>
              <span
                className={`text-[10px] font-mono ${DIFFICULTY_COLORS[challenge.difficulty] ?? ""}`}
              >
                {"★".repeat(DIFFICULTY_STARS[challenge.difficulty] ?? 1)}
                {"☆".repeat(4 - (DIFFICULTY_STARS[challenge.difficulty] ?? 1))}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {challenge.solve_count} solves
              </span>
            </div>
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              {solved && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
              {challenge.title}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="font-display text-2xl font-bold text-primary">{challenge.points}</span>
            <span className="text-[10px] font-mono text-muted-foreground">pts</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>

        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1 text-xs font-mono text-primary hover:underline"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? "Hide" : "Attempt Challenge"}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-3 overflow-hidden"
            >
              {/* Flag submission */}
              {!solved ? (
                <div className="flex gap-2">
                  <input
                    value={flag}
                    onChange={(e) => setFlag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="straxon{...}"
                    className="flex-1 bg-background/60 border border-border rounded px-3 py-2 font-mono text-sm focus:border-primary outline-none"
                  />
                  <CyberButton
                    onClick={handleSubmit}
                    disabled={submitting}
                    variant="magenta"
                    className="shrink-0"
                  >
                    <Flag className="h-4 w-4" /> Submit
                  </CyberButton>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded bg-success/10 border border-success/30">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="text-success font-mono text-sm">
                    Solved! +{challenge.points} pts
                  </span>
                </div>
              )}

              {/* Hints */}
              <div>
                <button
                  onClick={() => setShowHints((s) => !s)}
                  className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-primary"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  Hints ({challenge.hints.length} available, -{Math.floor(challenge.points * 0.1)}{" "}
                  pts each)
                </button>
                <AnimatePresence>
                  {showHints && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 space-y-2"
                    >
                      {challenge.hints.map((hint, i) => (
                        <div key={i}>
                          {usedHints.includes(i) ? (
                            <div className="p-2 bg-primary/10 border border-primary/20 rounded text-xs font-mono text-primary">
                              💡 {hint.text}
                            </div>
                          ) : (
                            <button
                              onClick={() => useHint(i)}
                              className="text-xs font-mono text-muted-foreground hover:text-warning px-2 py-1 rounded border border-border hover:border-warning/40 transition-colors"
                            >
                              🔒 Unlock Hint {i + 1}
                            </button>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CyberCard>
    </motion.div>
  );
}

function CTFHub() {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [challenges] = useState(STATIC_CHALLENGES);

  const totalPoints = challenges.reduce((s, c) => s + (c.solved ? c.points : 0), 0);
  const solved = challenges.filter((c) => c.solved).length;

  const categories = ["all", ...new Set(challenges.map((c) => c.category))];
  const filtered = challenges.filter((c) => {
    if (filter !== "all" && c.category !== filter) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = [
    { label: "Total Challenges", value: challenges.length, icon: Target, color: "text-primary" },
    { label: "Solved", value: solved, icon: CheckCircle2, color: "text-success" },
    { label: "Points Earned", value: totalPoints, icon: Zap, color: "text-warning" },
    { label: "Global Rank", value: "#—", icon: Trophy, color: "text-accent" },
  ];

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-8">
      <SectionHeading
        eyebrow="// COMPETITION"
        title="Capture The Flag"
        description="Real challenges. Real techniques. Earn flags, climb the leaderboard, and prove your skills across web, crypto, forensics, and more."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <CyberCard key={s.label} variant="cyan" className="text-center">
              <Icon className={`h-6 w-6 mx-auto mb-2 ${s.color}`} />
              <div className={`font-display text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs font-mono text-muted-foreground mt-1">{s.label}</div>
            </CyberCard>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`text-xs font-mono px-3 py-1.5 rounded border uppercase tracking-widest transition-colors ${
                filter === cat
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search challenges..."
          className="ml-auto bg-background/60 border border-border rounded px-3 py-1.5 font-mono text-sm focus:border-primary outline-none w-48"
        />
      </div>

      {/* Challenge Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((c) => (
          <ChallengeCard key={c.id} challenge={c} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-muted-foreground font-mono">
            No challenges match your filter.
          </div>
        )}
      </div>

      {/* Leaderboard Preview */}
      <CyberCard variant="cyan">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-warning" />
          <span className="font-display font-bold text-lg">Top Hackers</span>
        </div>
        <div className="space-y-2">
          {[
            { rank: 1, name: "h4x0r_pr1m3", points: 1850, solved: 12, badge: "🏆" },
            { rank: 2, name: "cyber_ghost", points: 1600, solved: 10, badge: "🥈" },
            { rank: 3, name: "null_ptr", points: 1350, solved: 9, badge: "🥉" },
            { rank: 4, name: "shell_sh0ck", points: 1100, solved: 7, badge: "4️⃣" },
            { rank: 5, name: "byte_bandit", points: 950, solved: 6, badge: "5️⃣" },
          ].map((p) => (
            <div
              key={p.rank}
              className="flex items-center gap-3 p-2 rounded hover:bg-muted/20 transition-colors"
            >
              <span className="text-lg w-6 text-center">{p.badge}</span>
              <span className="font-mono text-sm text-primary flex-1">{p.name}</span>
              <span className="text-xs font-mono text-muted-foreground">{p.solved} solved</span>
              <span className="font-display font-bold text-primary">{p.points}</span>
            </div>
          ))}
        </div>
      </CyberCard>
    </div>
  );
}
