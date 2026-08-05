import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { LabFrame, LogPanel, nowTs, type LogEntry } from "@/components/labs/LabFrame";
import { Lock, Unlock, Play, Square } from "lucide-react";

export const Route = createFileRoute("/labs/brute")({
  head: () => ({
    meta: [
      { title: "Brute Force Lab — Straxon Secure" },
      {
        name: "description",
        content: "Simulate a brute-force attack with rate-limiting and lockout defenses.",
      },
    ],
  }),
  component: BruteLab,
});

const PASSWORDS = [
  "123456",
  "password",
  "qwerty",
  "letmein",
  "admin",
  "welcome",
  "hunter2",
  "trustno1",
  "S3cure!2024",
  "P@ssw0rd123",
];

function strength(p: string): { score: number; label: string; color: string } {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  const labels = ["weak", "weak", "fair", "good", "strong", "elite"];
  const colors = ["destructive", "destructive", "warning", "primary", "success", "accent"];
  return { score: s, label: labels[s], color: `text-${colors[s]}` };
}

function BruteLab() {
  const [target, setTarget] = useState("S3cure!2024");
  const [defended, setDefended] = useState(false);
  const [running, setRunning] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [success, setSuccess] = useState(false);
  const [locked, setLocked] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const str = useMemo(() => strength(target), [target]);

  useEffect(() => {
    if (!running) return;
    let i = 0;
    let lockoutCount = 0;
    const dictionary = [...PASSWORDS, target];
    const tick = setInterval(
      () => {
        if (i >= dictionary.length) {
          setRunning(false);
          return;
        }
        const guess = dictionary[i];
        i++;
        setAttempts((a) => a + 1);

        if (defended && lockoutCount >= 3) {
          setLocked(true);
          setLogs((l) =>
            [
              {
                ts: nowTs(),
                line: `[BLOCKED] account locked after 3 failures`,
                level: "error" as const,
              },
              ...l,
            ].slice(0, 30),
          );
          setRunning(false);
          return;
        }

        if (guess === target) {
          setSuccess(true);
          setLogs((l) =>
            [
              {
                ts: nowTs(),
                line: `[BREACH] password matched: "${guess}"`,
                level: "error" as const,
              },
              ...l,
            ].slice(0, 30),
          );
          setRunning(false);
          return;
        }

        lockoutCount++;
        setLogs((l) =>
          [
            { ts: nowTs(), line: `try "${guess}" → 401 unauthorized`, level: "warn" as const },
            ...l,
          ].slice(0, 30),
        );
      },
      defended ? 600 : 120,
    );
    return () => clearInterval(tick);
  }, [running, target, defended]);

  const start = () => {
    setAttempts(0);
    setSuccess(false);
    setLocked(false);
    setLogs([
      {
        ts: nowTs(),
        line: `[START] attacking ${defended ? "rate-limited" : "open"} endpoint`,
        level: "info" as const,
      },
    ]);
    setRunning(true);
  };

  return (
    <LabFrame title="BRUTE FORCE" badge="LAB-03" recorderLab="brute">
      <p className="text-muted-foreground max-w-3xl">
        Watch an attacker try a password dictionary. Toggle defenses to enable rate limiting +
        account lockout.
      </p>

      <div className="grid lg:grid-cols-2 gap-4">
        <CyberCard variant="cyan">
          <div className="text-xs font-mono uppercase tracking-wider text-primary mb-2">
            Target Password
          </div>
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full bg-background/60 border border-border rounded px-3 py-2 font-mono"
          />
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1"
                  style={{
                    background:
                      i < str.score
                        ? str.score <= 2
                          ? "var(--destructive)"
                          : str.score <= 3
                            ? "var(--warning)"
                            : "var(--success)"
                        : "transparent",
                  }}
                />
              ))}
            </div>
            <span className="text-xs font-mono uppercase">{str.label}</span>
          </div>

          <label className="flex items-center gap-3 mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={defended}
              onChange={(e) => setDefended(e.target.checked)}
              className="accent-primary"
            />
            <span className="text-sm font-mono">
              Defenses: rate limit (600ms) + 3-attempt lockout
            </span>
          </label>

          <div className="mt-4 flex gap-2">
            {!running ? (
              <CyberButton onClick={start} className="flex-1">
                <Play className="h-4 w-4" /> Start attack
              </CyberButton>
            ) : (
              <CyberButton onClick={() => setRunning(false)} className="flex-1" variant="danger">
                <Square className="h-4 w-4" /> Stop
              </CyberButton>
            )}
          </div>
        </CyberCard>

        <CyberCard variant="magenta">
          <div className="text-xs font-mono uppercase tracking-wider text-accent mb-3">Status</div>
          <div className="space-y-3">
            <Stat label="Attempts" value={attempts} />
            <Stat
              label="State"
              value={
                locked ? "🔒 LOCKED" : success ? "💀 BREACHED" : running ? "ATTACKING…" : "IDLE"
              }
            />
            <Stat label="Defended" value={defended ? "YES" : "NO"} />
          </div>
          <div className="mt-4 p-3 rounded bg-background/40 border border-border text-center">
            {success ? (
              <div className="text-destructive">
                <Unlock className="inline h-5 w-5 mr-2" /> Password compromised
              </div>
            ) : locked ? (
              <div className="text-success">
                <Lock className="inline h-5 w-5 mr-2" /> Account locked — attacker stopped
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">Awaiting result…</div>
            )}
          </div>
        </CyberCard>
      </div>

      <LogPanel logs={logs} />

      <CyberCard variant="magenta">
        <div className="text-xs font-mono uppercase tracking-wider text-accent mb-2">// FIX</div>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>Strong password policies + breach-list checks (HIBP).</li>
          <li>Rate limiting per IP/user + exponential backoff.</li>
          <li>Account lockout after N failed attempts (with safe unlock flow).</li>
          <li>MFA — even a leaked password becomes useless.</li>
          <li>CAPTCHA on suspicious traffic.</li>
        </ul>
      </CyberCard>
    </LabFrame>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between font-mono">
      <span className="text-xs uppercase text-muted-foreground tracking-wider">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
