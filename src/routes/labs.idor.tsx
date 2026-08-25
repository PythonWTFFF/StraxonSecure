import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, ShieldAlert, ShieldCheck, Lock, Database } from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { LabFrame, LogPanel, nowTs, type LogEntry } from "@/components/labs/LabFrame";
import { toast } from "sonner";

export const Route = createFileRoute("/labs/idor")({
  head: () => ({
    meta: [
      { title: "IDOR Lab — Insecure Direct Object Reference — Straxon Secure" },
      {
        name: "description",
        content:
          "Exploit IDOR vulnerabilities to access other users' data by manipulating object references.",
      },
    ],
  }),
  component: IDORLab,
});

// ─── Simulated database ──────────────────────────────────────────────────────

const CURRENT_USER = { id: 42, name: "Alice", email: "alice@straxon.io", role: "user" };

const USERS_DB: Record<
  number,
  {
    id: number;
    name: string;
    email: string;
    role: string;
    ssn?: string;
    balance?: number;
    address?: string;
  }
> = {
  1: {
    id: 1,
    name: "Super Admin",
    email: "root@straxon.io",
    role: "superadmin",
    ssn: "XXX-XX-0001",
    balance: 9999999,
    address: "1 Root Street",
  },
  10: {
    id: 10,
    name: "Bob Admin",
    email: "bob@straxon.io",
    role: "admin",
    ssn: "XXX-XX-0010",
    balance: 500000,
    address: "10 Admin Ave",
  },
  42: {
    id: 42,
    name: "Alice",
    email: "alice@straxon.io",
    role: "user",
    ssn: "XXX-XX-0042",
    balance: 1240,
    address: "42 User Lane",
  },
  43: {
    id: 43,
    name: "Charlie",
    email: "charlie@straxon.io",
    role: "user",
    ssn: "XXX-XX-0043",
    balance: 380,
    address: "43 User Lane",
  },
  99: {
    id: 99,
    name: "Secret Bot",
    email: "bot@internal.io",
    role: "system",
    ssn: "XXX-XX-0099",
    balance: 0,
    address: "Internal Network",
  },
};

const ORDERS_DB: Record<
  number,
  { id: number; user_id: number; product: string; amount: number; status: string }[]
> = {
  42: [
    { id: 1001, user_id: 42, product: "Pro Plan Monthly", amount: 1900, status: "completed" },
    { id: 1002, user_id: 42, product: "CTF Pack", amount: 4900, status: "pending" },
  ],
  43: [{ id: 2001, user_id: 43, product: "Starter Plan", amount: 900, status: "completed" }],
  1: [
    { id: 3001, user_id: 1, product: "Enterprise License", amount: 99900, status: "completed" },
    { id: 3002, user_id: 1, product: "Custom SOC Bundle", amount: 250000, status: "active" },
  ],
  10: [{ id: 4001, user_id: 10, product: "Admin Tools", amount: 5000, status: "completed" }],
};

const DOCS_DB: Record<
  number,
  { id: number; user_id: number; name: string; content: string; classification: string }[]
> = {
  42: [
    {
      id: 5001,
      user_id: 42,
      name: "alice_profile.pdf",
      content: "Alice's user document",
      classification: "private",
    },
  ],
  1: [
    {
      id: 9001,
      user_id: 1,
      name: "master_admin_keys.pdf",
      content: "straxon{1ns3cur3_d1r3ct_0bj3ct_r3f3r3nc3}",
      classification: "top-secret",
    },
    {
      id: 9002,
      user_id: 1,
      name: "prod_database_creds.pdf",
      content: "DB: prod.straxon.io\nUser: root\nPass: Pr0d_S3cr3t!",
      classification: "top-secret",
    },
  ],
};

type ResourceType = "profile" | "orders" | "documents";

function fetchResource(userId: number, resource: ResourceType, secure: boolean) {
  if (secure && userId !== CURRENT_USER.id) {
    return {
      allowed: false,
      reason: "Authorization check failed: you can only access your own resources",
    };
  }

  switch (resource) {
    case "profile":
      return { allowed: true, data: USERS_DB[userId] ?? { error: "User not found" } };
    case "orders":
      return { allowed: true, data: ORDERS_DB[userId] ?? [] };
    case "documents":
      return { allowed: true, data: DOCS_DB[userId] ?? [] };
  }
}

function IDORLab() {
  const [userId, setUserId] = useState(42);
  const [resource, setResource] = useState<ResourceType>("profile");
  const [secure, setSecure] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<any>(null);
  const [blocked, setBlocked] = useState(false);

  const fetch_ = () => {
    const res = fetchResource(userId, resource, secure);
    setBlocked(!res.allowed);

    if (!res.allowed) {
      setResult(null);
      setLogs((p) =>
        [
          { ts: nowTs(), line: `GET /api/${resource}/${userId}`, level: "info" },
          { ts: nowTs(), line: `⛔ 403 Forbidden — ${res.reason}`, level: "ok" },
          ...p,
        ].slice(0, 30),
      );
      return;
    }

    setResult(res.data);
    const isSensitive = userId !== CURRENT_USER.id;
    setLogs((p) =>
      [
        { ts: nowTs(), line: `GET /api/${resource}/${userId}`, level: "info" },
        {
          ts: nowTs(),
          line: `200 OK — ${isSensitive ? "⚠️ IDOR! Accessing another user's data!" : "Own data returned"}`,
          level: isSensitive ? "error" : "ok",
        },
        ...p,
      ].slice(0, 30),
    );

    if (isSensitive && !secure) {
      toast.error(`🔓 IDOR exploited! Accessed user ${userId}'s ${resource}`, { duration: 4000 });
    }
  };

  const knownIds = [1, 10, 42, 43, 99];

  return (
    <LabFrame title="INSECURE DIRECT OBJECT REFERENCE" badge="LAB-12" recorderLab="idor">
      <p className="text-muted-foreground max-w-3xl">
        The API uses user IDs as object references without authorization checks. Change the ID in
        the URL to access other users' profiles, orders, and sensitive documents.
      </p>

      <div className="bg-background/60 border border-border rounded p-3 font-mono text-xs">
        <span className="text-muted-foreground">// You are logged in as: </span>
        <span className="text-primary">Alice (user_id=42)</span>
        {"\n"}
        <span className="text-muted-foreground">// Fetching: </span>
        <span className={userId !== 42 && !secure ? "text-destructive" : "text-success"}>
          GET /api/{resource}/{userId}
        </span>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <CyberCard variant={secure ? "cyan" : "magenta"}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
              {secure ? (
                <ShieldCheck className="h-4 w-4 text-success" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-destructive" />
              )}
              {secure ? "Auth Check: ENABLED" : "No Auth Check — Vulnerable"}
            </div>
            <button
              onClick={() => setSecure((s) => !s)}
              className="text-xs font-mono px-2 py-1 rounded border border-border hover:border-primary transition-colors"
            >
              {secure ? "Switch to Vuln" : "Switch to Safe"}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                User ID
              </label>
              <input
                type="number"
                value={userId}
                onChange={(e) => setUserId(Number(e.target.value))}
                className="w-full mt-1 bg-background/60 border border-border rounded px-3 py-2 font-mono text-sm focus:border-primary outline-none"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {knownIds.map((id) => (
                  <button
                    key={id}
                    onClick={() => setUserId(id)}
                    className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${id === 42 ? "border-success/50 text-success" : "border-destructive/50 text-destructive hover:bg-destructive/10"}`}
                  >
                    id={id}
                    {id === 42 && " (you)"}
                    {id === 1 && " (admin!)"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Resource
              </label>
              <div className="mt-2 flex gap-2">
                {(["profile", "orders", "documents"] as ResourceType[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setResource(r)}
                    className={`text-[10px] font-mono px-3 py-1.5 rounded border transition-colors ${resource === r ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <CyberButton
            onClick={fetch_}
            className="w-full mt-4"
            variant={secure ? "cyan" : "magenta"}
          >
            <Database className="h-4 w-4" /> Fetch Resource
          </CyberButton>
        </CyberCard>

        <CyberCard variant="cyan" className="p-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 bg-background/50">
            {blocked ? (
              <Lock className="h-4 w-4 text-success" />
            ) : (
              <Users className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-xs font-mono text-muted-foreground">API Response</span>
            {result && userId !== 42 && !secure && (
              <span className="text-[10px] text-destructive border border-destructive/40 rounded px-1.5 py-0.5 font-mono">
                IDOR!
              </span>
            )}
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
                  {
                    'HTTP/1.1 403 Forbidden\n{\n  "error": "Access denied",\n  "message": "You can only access your own resources"\n}'
                  }
                </motion.div>
              ) : result ? (
                <motion.pre
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`whitespace-pre-wrap break-all ${userId !== 42 && !secure ? "text-warning" : "text-foreground/80"}`}
                >
                  {JSON.stringify(result, null, 2)}
                </motion.pre>
              ) : (
                <span className="text-muted-foreground italic">// API response appears here</span>
              )}
            </AnimatePresence>
          </div>
        </CyberCard>
      </div>

      <LogPanel logs={logs} />

      <div className="grid md:grid-cols-2 gap-4">
        <CyberCard variant="magenta">
          <div className="text-xs font-mono uppercase tracking-wider text-accent mb-2">
            // WHY IT'S CRITICAL
          </div>
          <p className="text-sm text-muted-foreground">
            IDOR was the <span className="text-destructive">#1 bug bounty finding</span> in
            2023-2025. By incrementing IDs in API calls, attackers can access any user's data —
            including admin documents, financial records, and PII.
          </p>
        </CyberCard>
        <CyberCard variant="cyan">
          <div className="text-xs font-mono uppercase tracking-wider text-primary mb-2">// FIX</div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              • Always verify{" "}
              <code className="text-primary">session.user_id === resource.user_id</code>
            </li>
            <li>• Use UUIDs instead of sequential IDs (still validate!)</li>
            <li>• Implement object-level authorization middleware</li>
            <li>• Test all API endpoints with different user tokens</li>
            <li>• Log and alert on access pattern anomalies</li>
          </ul>
        </CyberCard>
      </div>
    </LabFrame>
  );
}
