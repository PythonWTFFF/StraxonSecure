import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldOff, ShieldCheck, AlertTriangle, ExternalLink } from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { LabFrame, LogPanel, nowTs, type LogEntry } from "@/components/labs/LabFrame";
import { toast } from "sonner";

export const Route = createFileRoute("/labs/csrf")({
  head: () => ({
    meta: [
      { title: "CSRF Lab — Cross-Site Request Forgery — Straxon Secure" },
      {
        name: "description",
        content:
          "Forge authenticated requests across sites. Bypass CSRF protection and modify state without user consent.",
      },
    ],
  }),
  component: CSRFLab,
});

// ─── Simulated state ─────────────────────────────────────────────────────────

interface BankState {
  balance: number;
  lastTransfer: string | null;
  csrfToken: string;
}

function generateToken() {
  return Math.random().toString(36).slice(2, 18).toUpperCase();
}

const VALID_TOKEN = generateToken();

function processTransfer(
  amount: number,
  to: string,
  submittedToken: string | undefined,
  mode: "vulnerable" | "secure",
): { success: boolean; message: string; attack?: boolean } {
  if (mode === "secure") {
    if (!submittedToken || submittedToken !== VALID_TOKEN) {
      return {
        success: false,
        message: `CSRF token validation failed. Expected: ${VALID_TOKEN.slice(0, 4)}... Got: ${submittedToken?.slice(0, 4) ?? "none"}...`,
      };
    }
  }

  if (amount <= 0 || amount > 10000) {
    return { success: false, message: "Invalid transfer amount" };
  }

  const isAttack = to.includes("attacker") || to.includes("evil") || to.includes("hacker");
  return {
    success: true,
    message: `Transfer of $${amount} to ${to} completed`,
    attack: isAttack,
  };
}

const ATTACK_SCENARIOS = [
  {
    label: "Simple GET CSRF",
    code: `<!-- Attacker page: evil.io/csrf.html -->
<img src="https://bank.straxon.io/transfer
  ?amount=5000&to=attacker@evil.io"
  style="display:none" />
<!-- Victim browser auto-fetches this -->`,
    to: "attacker@evil.io",
    amount: 5000,
    token: undefined,
    desc: "Image tag forces victim to make GET request",
  },
  {
    label: "Auto-Submit Form",
    code: `<!-- Attacker's page silently submits POST -->
<form action="https://bank.straxon.io/transfer"
  method="POST" id="csrf">
  <input name="amount" value="9999">
  <input name="to" value="evil.hacker@attacker.io">
</form>
<script>document.getElementById('csrf').submit();</script>`,
    to: "evil.hacker@attacker.io",
    amount: 9999,
    token: undefined,
    desc: "Auto-submitting form on attacker's site",
  },
  {
    label: "Fetch with Credentials",
    code: `// Attacker page JS
fetch('https://bank.straxon.io/transfer', {
  method: 'POST',
  credentials: 'include', // sends victim's cookies!
  body: JSON.stringify({ amount: 1000, to: 'hacker' })
});`,
    to: "hacker@evil.io",
    amount: 1000,
    token: undefined,
    desc: "Fetch request that includes victim's session cookies",
  },
  {
    label: "With Valid Token (Fails)",
    code: `<!-- Attacker doesn't have victim's CSRF token -->
<form action="https://bank.straxon.io/transfer">
  <input name="amount" value="5000">
  <input name="to" value="attacker">
  <!-- Can't forge valid CSRF token! -->
  <input name="_csrf" value="ATTACKER_GUESS_????">
</form>`,
    to: "attacker@evil.io",
    amount: 5000,
    token: "WRONG_TOKEN_CANNOT_FORGE",
    desc: "With CSRF token — should be blocked in secure mode",
  },
];

function CSRFLab() {
  const [state, setState] = useState<BankState>({
    balance: 10000,
    lastTransfer: null,
    csrfToken: VALID_TOKEN,
  });
  const [secure, setSecure] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [amount, setAmount] = useState(500);
  const [to, setTo] = useState("friend@example.com");
  const [selectedAttack, setSelectedAttack] = useState(ATTACK_SCENARIOS[0]);
  const [attackResult, setAttackResult] = useState<{
    success: boolean;
    message: string;
    attack?: boolean;
  } | null>(null);

  const legitimateTransfer = () => {
    const result = processTransfer(amount, to, state.csrfToken, secure ? "secure" : "vulnerable");
    if (result.success) {
      setState((s) => ({
        ...s,
        balance: s.balance - amount,
        lastTransfer: to,
        csrfToken: generateToken(),
      }));
    }
    setLogs((p) =>
      [
        { ts: nowTs(), line: `[LEGITIMATE] Transfer $${amount} → ${to}`, level: "info" },
        { ts: nowTs(), line: result.message, level: result.success ? "ok" : "error" },
        ...p,
      ].slice(0, 30),
    );
  };

  const simulateAttack = () => {
    // Attacker doesn't have the CSRF token
    const result = processTransfer(
      selectedAttack.amount,
      selectedAttack.to,
      selectedAttack.token,
      secure ? "secure" : "vulnerable",
    );

    setAttackResult(result);

    if (result.success && result.attack) {
      setState((s) => ({
        ...s,
        balance: s.balance - selectedAttack.amount,
        lastTransfer: selectedAttack.to,
      }));
      toast.error(`💀 CSRF attack succeeded! $${selectedAttack.amount} stolen!`, {
        duration: 4000,
      });
    }

    setLogs((p) =>
      [
        { ts: nowTs(), line: `[ATTACK] ${selectedAttack.label}`, level: "warn" },
        { ts: nowTs(), line: `From: evil.io → Target: bank.straxon.io/transfer`, level: "info" },
        {
          ts: nowTs(),
          line: result.success
            ? `🚨 CSRF SUCCEEDED — $${selectedAttack.amount} transferred to ${selectedAttack.to}`
            : `🛡️ CSRF BLOCKED — ${result.message}`,
          level: result.success ? "error" : "ok",
        },
        ...p,
      ].slice(0, 30),
    );
  };

  return (
    <LabFrame title="CROSS-SITE REQUEST FORGERY" badge="LAB-08" recorderLab="csrf">
      <p className="text-muted-foreground max-w-3xl">
        CSRF tricks a victim's browser into making authenticated requests to another site. The bank
        trusts the cookie — but the request came from the attacker's page!
      </p>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Left: Bank App */}
        <CyberCard variant={secure ? "cyan" : "magenta"}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
              {secure ? (
                <ShieldCheck className="h-4 w-4 text-success" />
              ) : (
                <ShieldOff className="h-4 w-4 text-destructive" />
              )}
              Straxon Bank — {secure ? "CSRF Tokens ON" : "No CSRF Protection"}
            </div>
            <button
              onClick={() => setSecure((s) => !s)}
              className="text-xs font-mono px-2 py-1 rounded border border-border hover:border-primary transition-colors"
            >
              {secure ? "Disable CSRF" : "Enable CSRF Token"}
            </button>
          </div>

          <div className="bg-background/60 border border-border rounded p-3 mb-4 font-mono text-xs">
            <div className="text-muted-foreground">Balance</div>
            <div
              className={`font-display text-3xl font-bold ${state.balance < 5000 ? "text-destructive" : "text-success"}`}
            >
              ${state.balance.toLocaleString()}
            </div>
            {state.lastTransfer && (
              <div className="text-xs text-muted-foreground mt-1">
                Last transfer → {state.lastTransfer}
              </div>
            )}
          </div>

          {secure && (
            <div className="mb-3 p-2 rounded bg-success/10 border border-success/30 text-[10px] font-mono text-success break-all">
              CSRF Token: {state.csrfToken}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Transfer Amount ($)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full mt-1 bg-background/60 border border-border rounded px-3 py-2 font-mono text-sm focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Recipient
              </label>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full mt-1 bg-background/60 border border-border rounded px-3 py-2 font-mono text-sm focus:border-primary outline-none"
              />
            </div>
          </div>

          <CyberButton
            onClick={legitimateTransfer}
            className="w-full mt-4"
            variant={secure ? "cyan" : "magenta"}
          >
            Transfer Funds
          </CyberButton>
        </CyberCard>

        {/* Right: Attack Panel */}
        <CyberCard variant="magenta">
          <div className="text-xs font-mono uppercase tracking-wider text-accent mb-3">
            // ATTACKER CONTROL PANEL
          </div>
          <div className="text-[10px] font-mono text-muted-foreground mb-3">
            evil.io/steal-money.html
          </div>

          <div className="space-y-2 mb-4">
            {ATTACK_SCENARIOS.map((a) => (
              <button
                key={a.label}
                onClick={() => setSelectedAttack(a)}
                className={`w-full text-left p-2.5 rounded border text-xs font-mono transition-colors ${selectedAttack.label === a.label ? "border-destructive bg-destructive/10 text-destructive" : "border-border text-muted-foreground hover:border-destructive/40"}`}
              >
                <div className="font-bold">{a.label}</div>
                <div className="text-[10px] opacity-80">{a.desc}</div>
              </button>
            ))}
          </div>

          <pre className="bg-background/60 border border-border rounded p-3 text-[10px] font-mono text-warning overflow-auto max-h-32 mb-4 whitespace-pre-wrap">
            {selectedAttack.code}
          </pre>

          <CyberButton onClick={simulateAttack} className="w-full" variant="magenta">
            <AlertTriangle className="h-4 w-4" /> Simulate CSRF Attack
          </CyberButton>

          {attackResult && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-3 p-3 rounded border text-xs font-mono ${attackResult.success ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-success/40 bg-success/10 text-success"}`}
            >
              {attackResult.success
                ? `💀 ${attackResult.message}`
                : `🛡️ BLOCKED: ${attackResult.message}`}
            </motion.div>
          )}
        </CyberCard>
      </div>

      <LogPanel logs={logs} />

      <div className="grid md:grid-cols-2 gap-4">
        <CyberCard variant="magenta">
          <div className="text-xs font-mono uppercase tracking-wider text-accent mb-2">
            // HOW IT WORKS
          </div>
          <p className="text-sm text-muted-foreground">
            Browser automatically sends cookies with every request — including requests forged by
            attacker sites. The server sees a valid session cookie and processes the request without
            knowing it was forged.
          </p>
        </CyberCard>
        <CyberCard variant="cyan">
          <div className="text-xs font-mono uppercase tracking-wider text-primary mb-2">// FIX</div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              • <span className="text-primary">CSRF Tokens</span> — unpredictable secret in every
              form
            </li>
            <li>
              • <code className="text-primary">SameSite=Strict</code> cookies prevent cross-site
              sends
            </li>
            <li>
              • Check <code className="text-primary">Origin/Referer</code> headers on state-changing
              requests
            </li>
            <li>
              • Use <code className="text-primary">double submit cookie</code> pattern for APIs
            </li>
          </ul>
        </CyberCard>
      </div>
    </LabFrame>
  );
}
