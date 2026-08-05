import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { LabFrame, LogPanel, nowTs, type LogEntry } from "@/components/labs/LabFrame";
import { ShieldCheck, ShieldAlert, Database } from "lucide-react";
import { Replay } from "@/lib/replay";

export const Route = createFileRoute("/labs/sqli")({
  head: () => ({
    meta: [
      { title: "SQL Injection Lab — Straxon Secure" },
      {
        name: "description",
        content: "Hands-on SQL injection lab with tautology, UNION, and comment bypass.",
      },
    ],
  }),
  component: SQLiLab,
});

const USERS_TABLE = [
  { id: 1, username: "admin", email: "admin@straxon.io", role: "admin", secret_balance: 999999 },
  { id: 2, username: "alice", email: "alice@straxon.io", role: "user", secret_balance: 1240 },
  { id: 3, username: "bob", email: "bob@straxon.io", role: "user", secret_balance: 380 },
];

function vulnerableQuery(input: string) {
  return `SELECT id, username, email, role FROM users WHERE username = '${input}' AND password = 'hunter2'`;
}

function safeQuery(input: string) {
  return `SELECT id, username, email, role FROM users WHERE username = $1 AND password = $2 -- params: ['${input.replace(/'/g, "''")}', 'hunter2']`;
}

function executeVuln(input: string) {
  const q = input.toLowerCase();
  if (q.includes("' or '1'='1") || q.includes("' or 1=1")) return USERS_TABLE;
  if (q.includes("union select")) {
    return USERS_TABLE.map((u) => ({ ...u, leaked: u.secret_balance }));
  }
  if (q.includes("--") || q.includes("#")) {
    const cleanUser = input.split(/--|#/)[0].replace(/'/g, "").trim();
    return USERS_TABLE.filter((u) => u.username === cleanUser);
  }
  return USERS_TABLE.filter((u) => u.username === input);
}

function executeSafe(input: string) {
  return USERS_TABLE.filter((u) => u.username === input);
}

function SQLiLab() {
  const [input, setInput] = useState("admin");
  const [secure, setSecure] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [results, setResults] = useState<any[]>([]);

  const run = () => {
    const query = secure ? safeQuery(input) : vulnerableQuery(input);
    const data = secure ? executeSafe(input) : executeVuln(input);
    setResults(data);
    const breach = data.length > 1 && !secure;
    Replay.push({
      kind: secure ? "exec" : "attack",
      label: `${secure ? "SAFE" : "VULN"} query → ${data.length} row(s) | input="${input}"`,
      severity: breach ? "danger" : secure ? "success" : "info",
      data: { input, secure, rows: data.length },
    });
    const newLogs: LogEntry[] = [
      {
        ts: nowTs(),
        line: `[${secure ? "SAFE" : "VULN"}] Query executed`,
        level: secure ? "ok" : "warn",
      },
      { ts: nowTs(), line: `> ${query}`, level: "info" },
      {
        ts: nowTs(),
        line: `Returned ${data.length} row(s)${breach ? " — possible breach!" : ""}`,
        level: breach ? "error" : "ok",
      },
    ];
    setLogs((prev) => [...newLogs, ...prev].slice(0, 20));
  };

  const PAYLOADS = [
    { label: "Normal", value: "admin" },
    { label: "Tautology", value: "' OR '1'='1" },
    { label: "Comment bypass", value: "admin' --" },
    { label: "UNION", value: "' UNION SELECT id, username, email, role FROM users --" },
  ];

  return (
    <LabFrame title="SQL INJECTION" badge="LAB-01" recorderLab="sqli">
      <p className="text-muted-foreground max-w-3xl">
        Try injection payloads against a vulnerable login. Toggle "Secure mode" to see how
        parameterized queries neutralize the same input.
      </p>

      <div className="grid lg:grid-cols-2 gap-4">
        <CyberCard variant={secure ? "cyan" : "magenta"}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
              {secure ? (
                <>
                  <ShieldCheck className="h-4 w-4 text-success" /> Parameterized
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4 text-destructive" /> Concatenation (vulnerable)
                </>
              )}
            </div>
            <button
              onClick={() => setSecure((s) => !s)}
              className="text-xs font-mono px-2 py-1 rounded border border-border hover:border-primary"
            >
              {secure ? "Switch to Vuln" : "Switch to Safe"}
            </button>
          </div>

          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Username input
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full mt-1 bg-background/60 border border-border rounded px-3 py-2 font-mono text-sm focus:border-primary outline-none"
          />

          <div className="mt-3 flex flex-wrap gap-1.5">
            {PAYLOADS.map((p) => (
              <button
                key={p.label}
                onClick={() => setInput(p.value)}
                className="text-[10px] font-mono px-2 py-1 rounded bg-muted/50 hover:bg-primary/10 hover:text-primary border border-border"
              >
                {p.label}
              </button>
            ))}
          </div>

          <CyberButton onClick={run} className="w-full mt-4" variant={secure ? "cyan" : "magenta"}>
            <Database className="h-4 w-4" /> Execute Query
          </CyberButton>

          <div className="mt-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
              Generated SQL
            </div>
            <pre className="bg-background/60 border border-border rounded p-3 text-[11px] font-mono whitespace-pre-wrap break-all text-foreground/90">
              {secure ? safeQuery(input) : vulnerableQuery(input)}
            </pre>
          </div>
        </CyberCard>

        <CyberCard variant="cyan">
          <div className="text-xs font-mono uppercase tracking-wider text-primary mb-3">
            DB Response — {results.length} row(s)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="text-left p-2">id</th>
                  <th className="text-left p-2">username</th>
                  <th className="text-left p-2">email</th>
                  <th className="text-left p-2">role</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-border/30">
                    <td className="p-2">{r.id}</td>
                    <td className="p-2 text-primary">{r.username}</td>
                    <td className="p-2">{r.email}</td>
                    <td className="p-2">
                      <span
                        className={
                          r.role === "admin"
                            ? "text-destructive font-bold"
                            : "text-muted-foreground"
                        }
                      >
                        {r.role}
                      </span>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground italic">
                      No results
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CyberCard>
      </div>

      <LogPanel logs={logs} />

      <CyberCard variant="magenta">
        <div className="text-xs font-mono uppercase tracking-wider text-accent mb-2">// FIX</div>
        <p className="text-sm text-muted-foreground">
          Always use <span className="text-accent font-mono">parameterized queries</span> (prepared
          statements). Never concatenate user input into SQL. Apply least-privilege DB roles, and
          use an ORM that escapes by default.
        </p>
      </CyberCard>
    </LabFrame>
  );
}
