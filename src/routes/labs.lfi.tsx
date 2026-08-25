import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, ShieldAlert, ShieldCheck, FileText } from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { LabFrame, LogPanel, nowTs, type LogEntry } from "@/components/labs/LabFrame";

export const Route = createFileRoute("/labs/lfi")({
  head: () => ({
    meta: [
      { title: "LFI Lab — Local File Inclusion — Straxon Secure" },
      {
        name: "description",
        content:
          "Exploit path traversal and local file inclusion vulnerabilities to read arbitrary server files.",
      },
    ],
  }),
  component: LFILab,
});

const FILES: Record<string, { content: string; sensitive?: boolean }> = {
  "home.php": { content: "<h1>Welcome to StraxonApp</h1><p>Your portal is ready.</p>" },
  "about.php": { content: "<h1>About Us</h1><p>StraxonApp is a secure enterprise platform.</p>" },
  "../../../../etc/passwd": {
    content:
      "root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:/var/www:/usr/sbin/nologin\nadmin:x:1000:1000:/home/admin:/bin/bash",
    sensitive: true,
  },
  "../../../../etc/shadow": {
    content:
      "root:$6$rounds=4096$xyz$hash:18000:0:99999:7:::\nadmin:$6$rounds=4096$abc$hash:18000:0:99999:7:::",
    sensitive: true,
  },
  "../../../var/www/html/config.php": {
    content:
      '<?php\n$db = "mysql:host=localhost;dbname=app";\n$user = "root";\n$pass = "Str0ng_Pr0d_P4ss!";\n$secret = "APP_SECRET_KEY_93kd82";\n?>',
    sensitive: true,
  },
  "../../proc/self/environ": {
    content:
      "APACHE_RUN_USER=www-data\nDB_PASSWORD=prod_secret_2026\nAWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfi\nAPP_ENV=production",
    sensitive: true,
  },
  "../flag.txt": { content: "straxon{l0c4l_f1l3_1nclus10n_p4th_tr4v3rs4l}", sensitive: true },
  "../../../../windows/win.ini": {
    content:
      "; for 16-bit app support\n[fonts]\n[extensions]\n[mci extensions]\n[files]\n[Mail]\nMAPI=1",
    sensitive: true,
  },
  "../../../../windows/system32/drivers/etc/hosts": {
    content:
      "127.0.0.1 localhost\n::1 localhost\n10.0.0.1 internal-db.corp.local\n10.0.0.2 admin-panel.corp.local",
    sensitive: true,
  },
};

// Normalize path traversal
function normalizePath(input: string): string {
  // Remove null bytes
  let path = input.replace(/\0/g, "");
  // Decode URL encoding
  path = path.replace(/%2e/gi, ".").replace(/%2f/gi, "/").replace(/%5c/gi, "\\");
  // Handle double-encoded
  path = path.replace(/%252e/gi, ".").replace(/%252f/gi, "/");
  return path;
}

function readFile(
  input: string,
  secure: boolean,
): { content: string | null; sensitive?: boolean; blocked?: boolean } {
  const path = normalizePath(input);

  if (secure) {
    // Safe: only allow specific filenames, no traversal
    const allowed = /^[a-zA-Z0-9_-]+\.php$/;
    if (!allowed.test(path) || path.includes("..") || path.includes("/") || path.includes("\\")) {
      return { content: null, blocked: true };
    }
  }

  // Exact match
  const file = FILES[path];
  if (file) return { content: file.content, sensitive: file.sensitive };

  // Fuzzy match (handle encoded variants)
  for (const [key, val] of Object.entries(FILES)) {
    if (path.includes(key.replace(/\.\.\//g, "")) && key !== path) {
      return { content: val.content, sensitive: val.sensitive };
    }
  }

  return {
    content: `include(): Failed to open stream: No such file or directory in /var/www/html/index.php\ninclude(${path}): failed to open stream: no such file or directory`,
  };
}

const PAYLOADS = [
  { label: "Normal", value: "home.php", desc: "Normal page include" },
  { label: "About", value: "about.php", desc: "Another normal include" },
  { label: "../../../etc/passwd", value: "../../../../etc/passwd", desc: "Read Linux users file" },
  { label: "../etc/shadow", value: "../../../../etc/shadow", desc: "Read password hashes" },
  {
    label: "Config.php",
    value: "../../../var/www/html/config.php",
    desc: "Read app config with DB password",
  },
  {
    label: "/proc/environ",
    value: "../../proc/self/environ",
    desc: "Read process environment (secrets!)",
  },
  { label: "Capture Flag", value: "../flag.txt", desc: "Get the CTF flag" },
  { label: "URL Encoded", value: "....//....//etc/passwd", desc: "Bypass filter with encoding" },
  {
    label: "Windows hosts",
    value: "../../../../windows/system32/drivers/etc/hosts",
    desc: "Windows path traversal",
  },
];

function LFILab() {
  const [input, setInput] = useState("home.php");
  const [secure, setSecure] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [sensitive, setSensitive] = useState(false);

  const run = () => {
    const result = readFile(input, secure);
    setBlocked(result.blocked ?? false);
    setSensitive(result.sensitive ?? false);
    setFileContent(result.blocked ? null : result.content);

    setLogs((p) =>
      [
        {
          ts: nowTs(),
          line: `[${secure ? "SAFE" : "VULN"}] include("${input}")`,
          level: result.blocked ? "ok" : result.sensitive ? "error" : "info",
        },
        {
          ts: nowTs(),
          line: result.blocked
            ? "⛔ Path traversal blocked — allowlist enforced"
            : result.sensitive
              ? "🚨 SENSITIVE FILE READ!"
              : `File loaded (${result.content?.length ?? 0} bytes)`,
          level: result.blocked ? "ok" : result.sensitive ? "error" : "ok",
        },
        ...p,
      ].slice(0, 30),
    );
  };

  return (
    <LabFrame title="LOCAL FILE INCLUSION" badge="LAB-10" recorderLab="lfi">
      <p className="text-muted-foreground max-w-3xl">
        A PHP application uses a <code className="text-primary font-mono">page</code> parameter to
        include files. Use path traversal sequences (
        <code className="text-accent font-mono">../</code>) to break out of the web root and read
        arbitrary system files.
      </p>

      <div className="bg-background/60 border border-border rounded p-3 font-mono text-xs text-muted-foreground">
        <span className="text-muted-foreground/60">// Vulnerable code: </span>
        <span className="text-destructive">{`<?php include($_GET['page']); ?>`}</span>
        {"\n"}
        <span className="text-muted-foreground/60">// URL: </span>
        <span className="text-primary">{`https://app.straxon.io/index.php?page=${input}`}</span>
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
              {secure ? "Allowlist Validation" : "Raw include() — Vulnerable"}
            </div>
            <button
              onClick={() => setSecure((s) => !s)}
              className="text-xs font-mono px-2 py-1 rounded border border-border hover:border-primary"
            >
              {secure ? "Switch to Vuln" : "Switch to Safe"}
            </button>
          </div>

          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Page parameter
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full mt-1 bg-background/60 border border-border rounded px-3 py-2 font-mono text-sm focus:border-primary outline-none"
          />

          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {PAYLOADS.map((p) => (
              <button
                key={p.label}
                onClick={() => setInput(p.value)}
                title={p.desc}
                className="text-[10px] font-mono px-2 py-1.5 rounded bg-muted/50 hover:bg-destructive/10 hover:text-destructive border border-border transition-colors text-left truncate"
              >
                {p.label}
              </button>
            ))}
          </div>

          <CyberButton onClick={run} className="w-full mt-4" variant={secure ? "cyan" : "magenta"}>
            <FolderOpen className="h-4 w-4" /> Include File
          </CyberButton>
        </CyberCard>

        <CyberCard variant="cyan" className="p-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 bg-background/50">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">File Contents</span>
            {sensitive && (
              <span className="text-[10px] font-mono text-destructive border border-destructive/40 rounded px-1.5 py-0.5">
                SENSITIVE
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
                  🛡️ ACCESS DENIED{"\n"}Only allowed filenames are permitted.{"\n"}No path traversal
                  sequences accepted.
                </motion.div>
              ) : fileContent !== null ? (
                <motion.pre
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`whitespace-pre-wrap break-all ${sensitive ? "text-warning" : "text-foreground/80"}`}
                >
                  {fileContent}
                </motion.pre>
              ) : (
                <span className="text-muted-foreground italic">// File content appears here</span>
              )}
            </AnimatePresence>
          </div>
        </CyberCard>
      </div>

      <LogPanel logs={logs} />

      <div className="grid md:grid-cols-2 gap-4">
        <CyberCard variant="magenta">
          <div className="text-xs font-mono uppercase tracking-wider text-accent mb-2">
            // ATTACK CHAIN
          </div>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>
              Identify file inclusion parameter (<code className="text-primary">?page=</code>)
            </li>
            <li>
              Test with <code className="text-accent">../</code> sequences to traverse directories
            </li>
            <li>
              Target sensitive files: <code className="text-warning">/etc/passwd</code>, config
              files
            </li>
            <li>
              Escalate to <code className="text-destructive">RCE</code> via log poisoning or PHP
              wrappers
            </li>
          </ol>
        </CyberCard>
        <CyberCard variant="cyan">
          <div className="text-xs font-mono uppercase tracking-wider text-primary mb-2">// FIX</div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Strict allowlist of permitted filenames</li>
            <li>
              • Never pass user input to <code className="text-primary">include/require</code>
            </li>
            <li>
              • Use <code className="text-primary">basename()</code> to strip directory components
            </li>
            <li>
              • Set <code className="text-primary">open_basedir</code> in PHP config
            </li>
            <li>• Map page names to file paths in a lookup table</li>
          </ul>
        </CyberCard>
      </div>
    </LabFrame>
  );
}
