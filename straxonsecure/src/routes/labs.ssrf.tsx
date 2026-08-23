import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ShieldAlert, ShieldCheck, Lock, Unlock } from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { LabFrame, LogPanel, nowTs, type LogEntry } from "@/components/labs/LabFrame";

export const Route = createFileRoute("/labs/ssrf")({
  head: () => ({
    meta: [
      { title: "SSRF Lab — Server-Side Request Forgery — Straxon Secure" },
      {
        name: "description",
        content:
          "Exploit SSRF to access cloud metadata, internal services, and exfiltrate credentials.",
      },
    ],
  }),
  component: SSRFLab,
});

// ─── Simulated internal network responses ───────────────────────────────────

const INTERNAL_RESPONSES: Record<string, { status: number; body: string; sensitive?: boolean }> = {
  "http://169.254.169.254/latest/meta-data/": {
    status: 200,
    body: "ami-id\nami-launch-index\nblock-device-mapping/\nhostname\niam/\ninstance-action\ninstance-id\ninstance-type\nlocal-hostname\nlocal-ipv4\nmac\nnetwork/\nplacement/\npublic-hostname\npublic-ipv4\npublic-keys/\nreservation-id\nsecurity-groups",
  },
  "http://169.254.169.254/latest/meta-data/iam/security-credentials/": {
    status: 200,
    body: "straxon-prod-role",
    sensitive: true,
  },
  "http://169.254.169.254/latest/meta-data/iam/security-credentials/straxon-prod-role": {
    status: 200,
    sensitive: true,
    body: `{\n  "Code": "Success",\n  "Type": "AWS-HMAC",\n  "AccessKeyId": "ASIA_MOCK_AWS_KEY_123",\n  "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",\n  "Token": "AQoXnyc4lcK4w4//////////...[TOKEN]",\n  "Expiration": "2026-08-05T18:06:00Z"\n}`,
  },
  "http://169.254.169.254/latest/user-data": {
    status: 200,
    sensitive: true,
    body: "#!/bin/bash\nexport DB_PASSWORD=prod_db_p@ss_2026!\nexport API_KEY=sk_live_straxon_prod_abc123\napt-get install -y nginx\nservice nginx start",
  },
  "http://internal-db.straxon.local:5432/": {
    status: 200,
    body: "PostgreSQL 14.5\nDatabase: production\nTables: users, subscriptions, payments, secrets",
  },
  "http://internal-api.straxon.local/admin/users": {
    status: 200,
    sensitive: true,
    body: `[{"id":1,"email":"admin@straxon.io","role":"superadmin","password_hash":"$2b$12$..."},{"id":2,"email":"ops@straxon.io","role":"admin"}]`,
  },
  "http://localhost:8080/debug": {
    status: 200,
    sensitive: true,
    body: "DEBUG MODE ACTIVE\nSecret: STRAXON_INTERNAL_KEY_7f2a\nDB: postgresql://admin:secret@localhost/prod\nRedis: redis://:redispass@localhost:6379",
  },
  "http://straxon-flag.internal/": {
    status: 200,
    sensitive: true,
    body: "straxon{ssrf_l34ds_t0_m3t4d4t4_l34k}",
  },
  "https://external-safe.com/api": {
    status: 200,
    body: '{"data": "This is a legitimate external API response", "status": "ok"}',
  },
};

function simulateSSRF(
  url: string,
  allowList?: string[],
): {
  allowed: boolean;
  response: { status: number; body: string; sensitive?: boolean } | null;
  reason?: string;
} {
  // Safe mode: check allowlist
  if (allowList) {
    const allowed = allowList.some((pattern) => url.startsWith(pattern));
    if (!allowed) {
      return { allowed: false, reason: `URL not in allowlist: ${url}`, response: null };
    }
  }

  // Check internal/cloud metadata
  const normalized = url.toLowerCase();

  // Bypass attempts
  const bypassPatterns = [
    /169\.254\.169\.254/,
    /localhost/,
    /127\.\d+\.\d+\.\d+/,
    /::1/,
    /0\.0\.0\.0/,
    /\.internal/,
    /\.local/,
    /10\.\d+\.\d+\.\d+/,
    /192\.168\.\d+\.\d+/,
    /172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/,
  ];

  const isInternal = bypassPatterns.some((p) => p.test(url));

  // Direct match
  const exactMatch = INTERNAL_RESPONSES[url];
  if (exactMatch) return { allowed: true, response: exactMatch };

  // Prefix match
  for (const [key, val] of Object.entries(INTERNAL_RESPONSES)) {
    if (url.startsWith(key.replace(/\/$/, ""))) {
      return { allowed: true, response: val };
    }
  }

  if (isInternal) {
    return {
      allowed: true,
      response: {
        status: 200,
        body: "Connection refused\n(Internal service not found)",
        sensitive: false,
      },
    };
  }

  // External
  return {
    allowed: true,
    response: {
      status: 200,
      body: `HTTP/1.1 200 OK\nContent-Type: text/html\n\n<html>External response from ${url}</html>`,
    },
  };
}

const PAYLOADS = [
  {
    label: "Normal URL",
    value: "https://external-safe.com/api",
    desc: "Legitimate external request",
  },
  {
    label: "Cloud Metadata",
    value: "http://169.254.169.254/latest/meta-data/",
    desc: "AWS EC2 metadata endpoint",
  },
  {
    label: "IAM Credentials",
    value: "http://169.254.169.254/latest/meta-data/iam/security-credentials/straxon-prod-role",
    desc: "Steal IAM credentials",
  },
  {
    label: "User Data",
    value: "http://169.254.169.254/latest/user-data",
    desc: "EC2 user-data (may contain secrets)",
  },
  {
    label: "Internal DB",
    value: "http://internal-db.straxon.local:5432/",
    desc: "Access internal database",
  },
  {
    label: "Internal Admin",
    value: "http://internal-api.straxon.local/admin/users",
    desc: "Access internal admin API",
  },
  {
    label: "Localhost Debug",
    value: "http://localhost:8080/debug",
    desc: "Internal debug endpoint",
  },
  { label: "Capture Flag", value: "http://straxon-flag.internal/", desc: "Capture the flag!" },
];

function SSRFLab() {
  const [url, setUrl] = useState("https://example.com/api");
  const [secure, setSecure] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [response, setResponse] = useState<{
    status: number;
    body: string;
    sensitive?: boolean;
  } | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  const ALLOWLIST = ["https://external-safe.com", "https://api.external-trusted.com"];

  const run = () => {
    const result = simulateSSRF(url, secure ? ALLOWLIST : undefined);

    if (!result.allowed) {
      setBlocked(true);
      setBlockReason(result.reason ?? "Blocked");
      setResponse(null);
      setLogs((p) =>
        [
          { ts: nowTs(), line: `[BLOCKED] Request denied: ${result.reason}`, level: "ok" },
          { ts: nowTs(), line: `URL: ${url}`, level: "info" },
          ...p,
        ].slice(0, 30),
      );
      return;
    }

    setBlocked(false);
    setResponse(result.response);

    const isSensitive = result.response?.sensitive ?? false;
    setLogs((p) =>
      [
        {
          ts: nowTs(),
          line: `[${secure ? "SAFE" : "VULN"}] Fetching: ${url}`,
          level: isSensitive ? "error" : "info",
        },
        {
          ts: nowTs(),
          line: `HTTP ${result.response?.status} — ${isSensitive ? "⚠️ SENSITIVE DATA EXPOSED" : "OK"}`,
          level: isSensitive ? "error" : "ok",
        },
        ...p,
      ].slice(0, 30),
    );
  };

  return (
    <LabFrame title="SERVER-SIDE REQUEST FORGERY" badge="LAB-07" recorderLab="ssrf">
      <p className="text-muted-foreground max-w-3xl">
        A URL fetcher takes user-supplied URLs and fetches them server-side. Abuse this to pivot to
        internal services and cloud metadata endpoints — including AWS IAM credentials!
      </p>

      <div className="grid lg:grid-cols-2 gap-4">
        <CyberCard variant={secure ? "cyan" : "magenta"}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
              {secure ? (
                <ShieldCheck className="h-4 w-4 text-success" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-destructive" />
              )}
              {secure ? "URL Allowlist Active" : "No Validation — Vulnerable"}
            </div>
            <button
              onClick={() => setSecure((s) => !s)}
              className="text-xs font-mono px-2 py-1 rounded border border-border hover:border-primary transition-colors"
            >
              {secure ? "Switch to Vuln" : "Switch to Safe"}
            </button>
          </div>

          {secure && (
            <div className="mb-3 p-2 rounded bg-success/10 border border-success/30 text-xs font-mono text-success">
              Allowlist: {ALLOWLIST.join(", ")}
            </div>
          )}

          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Target URL
          </label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full mt-1 bg-background/60 border border-border rounded px-3 py-2 font-mono text-sm focus:border-primary outline-none"
          />

          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {PAYLOADS.map((p) => (
              <button
                key={p.label}
                onClick={() => setUrl(p.value)}
                title={p.desc}
                className="text-[10px] font-mono px-2 py-1.5 rounded bg-muted/50 hover:bg-destructive/10 hover:text-destructive border border-border transition-colors text-left truncate"
              >
                {p.label}
              </button>
            ))}
          </div>

          <CyberButton onClick={run} className="w-full mt-4" variant={secure ? "cyan" : "magenta"}>
            <Globe className="h-4 w-4" /> Fetch URL
          </CyberButton>
        </CyberCard>

        <CyberCard variant="cyan" className="p-0 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-background/50">
            {blocked ? (
              <Lock className="h-4 w-4 text-success" />
            ) : (
              <Unlock className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-xs font-mono text-muted-foreground">HTTP Response</span>
          </div>
          <div className="p-4 min-h-48 font-mono text-xs">
            <AnimatePresence mode="wait">
              {blocked ? (
                <motion.div
                  key="blocked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-success"
                >
                  <div className="font-bold mb-2">🛡️ REQUEST BLOCKED</div>
                  <div className="text-muted-foreground">{blockReason}</div>
                </motion.div>
              ) : response ? (
                <motion.div key="response" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div
                    className={`mb-2 font-bold ${response.sensitive ? "text-destructive" : "text-success"}`}
                  >
                    HTTP {response.status} {response.sensitive && "— ⚠️ SENSITIVE DATA LEAKED"}
                  </div>
                  <pre
                    className={`whitespace-pre-wrap break-all ${response.sensitive ? "text-warning" : "text-foreground/80"}`}
                  >
                    {response.body}
                  </pre>
                </motion.div>
              ) : (
                <span className="text-muted-foreground italic">// Response appears here</span>
              )}
            </AnimatePresence>
          </div>
        </CyberCard>
      </div>

      <LogPanel logs={logs} />

      <div className="grid md:grid-cols-2 gap-4">
        <CyberCard variant="magenta">
          <div className="text-xs font-mono uppercase tracking-wider text-accent mb-2">
            // IMPACT
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              • <span className="text-warning">AWS credential theft</span> via IMDSv1 metadata
            </li>
            <li>• Internal service enumeration and data exfiltration</li>
            <li>• Port scanning internal network from server</li>
            <li>• Bypassing firewall rules (server is trusted)</li>
          </ul>
        </CyberCard>
        <CyberCard variant="cyan">
          <div className="text-xs font-mono uppercase tracking-wider text-primary mb-2">// FIX</div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Strict URL allowlist — only allow known-safe domains</li>
            <li>• Block requests to RFC1918 + link-local (169.254.x.x)</li>
            <li>• Enable IMDSv2 (token-based, not accessible via SSRF)</li>
            <li>• Resolve DNS first, check IP before fetching</li>
            <li>• Disable unnecessary URL fetch features</li>
          </ul>
        </CyberCard>
      </div>
    </LabFrame>
  );
}
