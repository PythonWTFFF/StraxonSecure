import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, ShieldAlert, ShieldCheck, Zap, AlertTriangle } from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { LabFrame, LogPanel, nowTs, type LogEntry } from "@/components/labs/LabFrame";
import { toast } from "sonner";

export const Route = createFileRoute("/labs/jwt")({
  head: () => ({
    meta: [
      { title: "JWT Attack Lab — Algorithm Confusion — Straxon Secure" },
      {
        name: "description",
        content:
          "Break JWT authentication via alg:none, HMAC confusion, and secret cracking attacks.",
      },
    ],
  }),
  component: JWTLab,
});

// ─── JWT Simulation ──────────────────────────────────────────────────────────

function base64urlDecode(str: string): string {
  try {
    return atob(
      str.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - (str.length % 4)) % 4),
    );
  } catch {
    return "";
  }
}

function base64urlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function simpleHmacSha256(message: string, key: string): string {
  // Deterministic fake HMAC for demo purposes
  let hash = 0;
  const combined = message + key;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0").repeat(8).slice(0, 43);
}

const VALID_SECRET = "straxon_weak_secret_123";
const VALID_HEADER = { alg: "HS256", typ: "JWT" };
const USER_PAYLOAD = { sub: "user_42", role: "user", exp: Math.floor(Date.now() / 1000) + 3600 };
const ADMIN_PAYLOAD = { sub: "user_42", role: "admin", exp: Math.floor(Date.now() / 1000) + 3600 };

function generateToken(header: object, payload: object, sign: boolean, secret?: string): string {
  const h = base64urlEncode(JSON.stringify(header));
  const p = base64urlEncode(JSON.stringify(payload));
  const body = `${h}.${p}`;
  if (!sign) return `${body}.`;
  const sig = simpleHmacSha256(body, secret ?? VALID_SECRET);
  return `${body}.${sig}`;
}

function verifyToken(
  token: string,
  mode: "vulnerable" | "secure",
): { valid: boolean; payload: any; attack?: string; message: string } {
  const parts = token.split(".");
  if (parts.length !== 3)
    return { valid: false, payload: null, message: "Malformed JWT: expected 3 parts" };

  const headerStr = base64urlDecode(parts[0]);
  const payloadStr = base64urlDecode(parts[1]);

  let header: any, payload: any;
  try {
    header = JSON.parse(headerStr);
    payload = JSON.parse(payloadStr);
  } catch {
    return { valid: false, payload: null, message: "Failed to parse JWT" };
  }

  // Attack 1: alg:none
  if (header.alg === "none" || header.alg === "None" || header.alg === "NONE") {
    if (mode === "vulnerable") {
      return {
        valid: true,
        payload,
        attack: "alg:none",
        message: `✅ [VULN] Accepted! alg:none bypass — no signature required. Role: ${payload.role}`,
      };
    }
    return {
      valid: false,
      payload,
      attack: "alg:none",
      message: "❌ [SAFE] Rejected: alg:none not allowed. Algorithm must be HS256.",
    };
  }

  // Check expiration
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    return { valid: false, payload, message: "Token expired" };
  }

  // Verify signature
  const body = `${parts[0]}.${parts[1]}`;
  const expectedSig = simpleHmacSha256(body, VALID_SECRET);

  if (parts[2] === expectedSig) {
    return { valid: true, payload, message: `✅ Valid token. Role: ${payload.role}` };
  }

  // Check weak secrets (brute force simulation)
  const WEAK_SECRETS = ["secret", "password", "123456", "jwt_secret", "weak", VALID_SECRET];
  for (const s of WEAK_SECRETS) {
    if (simpleHmacSha256(body, s) === parts[2]) {
      if (mode === "vulnerable") {
        return {
          valid: true,
          payload,
          attack: "secret_cracked",
          message: `✅ [VULN] Valid! Secret "${s}" cracked via brute force. Role: ${payload.role}`,
        };
      }
    }
  }

  return { valid: false, payload, message: "❌ Invalid signature" };
}

const VALID_TOKEN = generateToken(VALID_HEADER, USER_PAYLOAD, true);

const ATTACKS = [
  {
    label: "Normal User",
    desc: "Valid token with 'user' role",
    token: generateToken(VALID_HEADER, USER_PAYLOAD, true),
  },
  {
    label: "alg:none",
    desc: "Remove signature, set alg to none",
    token: generateToken({ alg: "none", typ: "JWT" }, ADMIN_PAYLOAD, false),
  },
  {
    label: "alg:None (case)",
    desc: "Try case variations of none",
    token: generateToken({ alg: "None", typ: "JWT" }, ADMIN_PAYLOAD, false),
  },
  {
    label: "Admin Claim",
    desc: "Modify payload to claim admin role",
    token: generateToken(VALID_HEADER, ADMIN_PAYLOAD, true, "wrong_secret"),
  },
  {
    label: "Cracked Secret",
    desc: "Sign with guessed weak secret",
    token: generateToken(VALID_HEADER, ADMIN_PAYLOAD, true, VALID_SECRET),
  },
];

function formatToken(token: string): { header: string; payload: string; sig: string } {
  const [h, p, s] = token.split(".");
  try {
    return {
      header: JSON.stringify(JSON.parse(base64urlDecode(h)), null, 2),
      payload: JSON.stringify(JSON.parse(base64urlDecode(p)), null, 2),
      sig: s || "(none)",
    };
  } catch {
    return { header: h, payload: p, sig: s };
  }
}

function JWTLab() {
  const [token, setToken] = useState(VALID_TOKEN);
  const [secure, setSecure] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<ReturnType<typeof verifyToken> | null>(null);

  const verify = () => {
    const res = verifyToken(token, secure ? "secure" : "vulnerable");
    setResult(res);
    setLogs((p) =>
      [
        { ts: nowTs(), line: `[VERIFY] ${secure ? "SAFE" : "VULN"} mode`, level: "info" },
        {
          ts: nowTs(),
          line: res.message,
          level: res.valid ? (res.attack ? "error" : "ok") : "warn",
        },
        ...(res.attack
          ? [{ ts: nowTs(), line: `ATTACK TYPE: ${res.attack}`, level: "error" as const }]
          : []),
        ...p,
      ].slice(0, 30),
    );

    if (res.valid && res.attack && !secure) {
      toast.error(`🔑 JWT bypassed via ${res.attack}! Role escalated to: ${res.payload?.role}`, {
        duration: 4000,
      });
    }
  };

  const parsed = formatToken(token);

  return (
    <LabFrame title="JWT ATTACK LAB" badge="LAB-09" recorderLab="jwt">
      <p className="text-muted-foreground max-w-3xl">
        JWT (JSON Web Token) authentication can be broken in multiple ways — algorithm confusion
        (alg:none), weak secrets, and claim manipulation. Forge admin tokens!
      </p>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Left: Token Editor */}
        <div className="space-y-4">
          <CyberCard variant={secure ? "cyan" : "magenta"}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
                {secure ? (
                  <ShieldCheck className="h-4 w-4 text-success" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                )}
                {secure ? "Strict Algorithm Validation" : "Vulnerable JWT Verification"}
              </div>
              <button
                onClick={() => setSecure((s) => !s)}
                className="text-xs font-mono px-2 py-1 rounded border border-border hover:border-primary transition-colors"
              >
                {secure ? "Switch to Vuln" : "Switch to Safe"}
              </button>
            </div>

            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              JWT Token (editable)
            </label>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              rows={4}
              className="w-full mt-1 bg-background/60 border border-border rounded px-3 py-2 font-mono text-xs focus:border-primary outline-none resize-none"
            />

            <div className="mt-3 flex flex-wrap gap-1.5">
              {ATTACKS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => setToken(a.token)}
                  title={a.desc}
                  className="text-[10px] font-mono px-2 py-1 rounded bg-muted/50 hover:bg-destructive/10 hover:text-destructive border border-border transition-colors"
                >
                  {a.label}
                </button>
              ))}
            </div>

            <CyberButton
              onClick={verify}
              className="w-full mt-4"
              variant={secure ? "cyan" : "magenta"}
            >
              <Key className="h-4 w-4" /> Verify Token
            </CyberButton>
          </CyberCard>

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <CyberCard
                variant={result.valid && result.attack ? "magenta" : result.valid ? "cyan" : "cyan"}
              >
                <div
                  className={`text-sm font-mono ${result.valid && result.attack && !secure ? "text-destructive" : result.valid ? "text-success" : "text-muted-foreground"}`}
                >
                  {result.message}
                </div>
                {result.valid && result.payload && (
                  <div className="mt-2 text-xs font-mono text-muted-foreground">
                    <div>sub: {result.payload.sub}</div>
                    <div
                      className={
                        result.payload.role === "admin" ? "text-destructive font-bold" : ""
                      }
                    >
                      role: {result.payload.role}
                    </div>
                  </div>
                )}
              </CyberCard>
            </motion.div>
          )}
        </div>

        {/* Right: Token Decoder */}
        <CyberCard variant="cyan">
          <div className="text-xs font-mono uppercase tracking-wider text-primary mb-3">
            // TOKEN DECODER
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[10px] font-mono text-warning mb-1">HEADER (red)</div>
              <pre className="bg-background/60 border border-warning/30 rounded p-2 text-xs font-mono text-warning whitespace-pre-wrap break-all">
                {parsed.header}
              </pre>
            </div>
            <div>
              <div className="text-[10px] font-mono text-primary mb-1">PAYLOAD (purple)</div>
              <pre className="bg-background/60 border border-primary/30 rounded p-2 text-xs font-mono text-primary whitespace-pre-wrap break-all">
                {parsed.payload}
              </pre>
            </div>
            <div>
              <div className="text-[10px] font-mono text-accent mb-1">SIGNATURE (cyan)</div>
              <pre className="bg-background/60 border border-accent/30 rounded p-2 text-xs font-mono text-accent break-all">
                {parsed.sig}
              </pre>
            </div>
          </div>
        </CyberCard>
      </div>

      <LogPanel logs={logs} />

      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            title: "alg:none Attack",
            desc: 'Set the "alg" header to "none" and remove the signature. Vulnerable servers skip verification entirely.',
            color: "magenta" as const,
          },
          {
            title: "Secret Cracking",
            desc: "Weak HMAC secrets can be brute-forced offline using tools like hashcat against known wordlists.",
            color: "magenta" as const,
          },
          {
            title: "Fix",
            desc: "Whitelist allowed algorithms. Use strong secrets (256+ bits). Validate all claims server-side. Use RS256 for distributed systems.",
            color: "cyan" as const,
          },
        ].map((c) => (
          <CyberCard key={c.title} variant={c.color}>
            <div className="text-xs font-mono uppercase tracking-wider text-accent mb-2">
              // {c.title}
            </div>
            <p className="text-sm text-muted-foreground">{c.desc}</p>
          </CyberCard>
        ))}
      </div>
    </LabFrame>
  );
}
