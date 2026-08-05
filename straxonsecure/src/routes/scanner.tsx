import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { PremiumGate } from "@/components/PremiumGate";
import {
  ScanLine,
  AlertTriangle,
  CheckCircle2,
  FileDown,
  ShieldAlert,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  History,
  Brain,
} from "lucide-react";
import { runFullScan, generateSARIF, getScanHistory } from "@/server/scanner";
import { askAI } from "@/server/ai";
import { toast } from "sonner";
import { useEffect } from "react";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "DevSecOps Scanner — SAST + Secret Detection" },
      {
        name: "description",
        content:
          "Detect leaked secrets, OWASP vulnerabilities, and risky patterns. Export SARIF reports and get AI remediation.",
      },
    ],
  }),
  component: ScannerPage,
});

const SAMPLE = `// config.js — sample code with issues
const STRIPE = "sk_live_4242aBcDeFgHiJkLmNoPqRsTuVwXyZ";
const AWS_KEY = "AKIAIOSFODNN7EXAMPLE";
const password = "hunter2";
const dbUrl = "postgres://admin:S3cret@db.internal:5432/prod";

// Dangerous patterns
function run(code) { return eval(code); }
app.get('/user', (req, res) => {
  const id = req.query.id;
  db.query("SELECT * FROM users WHERE id = " + id); // SQLi
});

// XSS risk
document.innerHTML = userInput;

// Safe pattern (reference)
const apiKey = process.env.STRIPE_SECRET_KEY;
`;

const SCAN_TYPES = [
  { key: "full", label: "Full Scan", desc: "OWASP + Secrets + SAST" },
  { key: "owasp", label: "OWASP Only", desc: "Top 10 patterns" },
  { key: "secrets", label: "Secrets Only", desc: "API keys & credentials" },
] as const;

const SEV_STYLES: Record<string, string> = {
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  low: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  info: "text-slate-400 bg-slate-500/10 border-slate-500/30",
};

const STAGES = [
  { name: "Lint & Parse", icon: "⚙️" },
  { name: "Secret Scan", icon: "🔑" },
  { name: "OWASP Analysis", icon: "🛡️" },
  { name: "SAST Engine", icon: "🔬" },
];

interface Finding {
  id?: string;
  line: number;
  title: string;
  type?: string;
  severity: string;
  match?: string;
  description?: string;
  fix?: string;
  owasp?: string;
  cwe?: string;
}

interface ScanSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  riskScore: number;
  owaspCategories: string[];
}

function RiskGauge({ score }: { score: number }) {
  const color =
    score >= 75
      ? "text-red-400"
      : score >= 40
        ? "text-orange-400"
        : score >= 20
          ? "text-yellow-400"
          : "text-green-400";
  const bg =
    score >= 75
      ? "bg-red-500"
      : score >= 40
        ? "bg-orange-500"
        : score >= 20
          ? "bg-yellow-500"
          : "bg-green-500";
  return (
    <div className="flex items-center gap-3">
      <div className={`font-display text-4xl font-bold ${color}`}>{score}</div>
      <div className="flex-1">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">
          Risk Score
        </div>
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full ${bg} transition-all duration-700`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ScannerPage() {
  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <SectionHeading
        eyebrow="// DEVSECOPS"
        title="Code Security Scanner"
        description="SAST engine + secret detection + OWASP Top 10 analysis. Backed by AI remediation and SARIF export."
      />
      <PremiumGate
        feature="DevSecOps Scanner"
        description="Pro unlocks full SAST analysis, SARIF exports, scan history, and AI-powered remediation."
      >
        <ScannerRunner />
      </PremiumGate>
    </div>
  );
}

function ScannerRunner() {
  const [code, setCode] = useState(SAMPLE);
  const [filename, setFilename] = useState("paste.js");
  const [scanType, setScanType] = useState<"full" | "owasp" | "secrets">("full");
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [stage, setStage] = useState(-1);
  const [scanning, setScanning] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await getScanHistory();
      setHistory(res.scans ?? []);
    } catch {}
  };

  const runScan = async () => {
    if (!code.trim()) return toast.error("Paste some code first");
    setFindings(null);
    setSummary(null);
    setAiAnalysis(null);
    setScanning(true);

    // Animate pipeline stages
    for (let i = 0; i < STAGES.length; i++) {
      setStage(i);
      await new Promise((r) => setTimeout(r, 600 + i * 200));
    }

    try {
      const res = await runFullScan({
        data: { code, filename, scanType },
      });
      setFindings(res.findings as Finding[]);
      setSummary(res.summary as ScanSummary);
      setScanId(res.scanId ?? null);
      setStage(STAGES.length);
      loadHistory();
      if ((res.summary as ScanSummary).total === 0) {
        toast.success("✅ Clean scan — no issues found!");
      } else {
        toast.warning(`⚠️ ${(res.summary as ScanSummary).total} issues found`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan failed");
      setStage(-1);
    } finally {
      setScanning(false);
    }
  };

  const exportSARIF = async () => {
    if (!scanId) return toast.error("Run a scan first");
    try {
      const res = await generateSARIF({ data: { scanId } });
      const blob = new Blob([JSON.stringify(res.sarif, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `straxon-scan-${Date.now()}.sarif`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("SARIF report downloaded");
    } catch {
      toast.error("SARIF export failed");
    }
  };

  const analyzeWithAI = async () => {
    if (!findings || findings.length === 0) return;
    setAnalyzing(true);
    try {
      const topFindings = findings
        .slice(0, 10)
        .map(
          (f) =>
            `- [${f.severity.toUpperCase()}] Line ${f.line}: ${f.title} — ${f.description ?? f.fix ?? ""}`,
        )
        .join("\n");

      const res = await askAI({
        data: {
          messages: [
            {
              role: "user",
              content: `You are a DevSecOps expert. Analyze these code security findings and provide a prioritized remediation plan:\n\nFile: ${filename}\nRisk Score: ${summary?.riskScore}/100\n\nFindings:\n${topFindings}\n\nProvide:\n## 🔴 Critical Actions (do immediately)\n## 🟠 High Priority Fixes\n## 🔵 Best Practice Improvements\n## 🛡️ Prevention Checklist\n\nBe specific and actionable. Reference OWASP where applicable.`,
            },
          ],
          mode: "explain",
        },
      });
      setAiAnalysis(res.reply);
    } catch {
      toast.error("AI analysis failed — check GEMINI_API_KEY");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          {SCAN_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setScanType(t.key)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                scanType === t.key
                  ? "bg-[#00f3ff]/10 border-[#00f3ff]/40 text-[#00f3ff]"
                  : "border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="filename.js"
          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-mono text-slate-300 outline-none focus:border-[#00f3ff]/40 w-36"
        />
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="ml-auto flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-[#00f3ff] transition-colors"
        >
          <History className="h-3.5 w-3.5" />
          History ({history.length})
        </button>
      </div>

      {/* Scan History */}
      {showHistory && history.length > 0 && (
        <CyberCard variant="plain" className="p-4">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">
            Recent Scans
          </div>
          <div className="space-y-2">
            {history.slice(0, 5).map((s: any) => (
              <div key={s.id} className="flex items-center gap-3 text-xs font-mono text-slate-400">
                <span className="text-slate-500">
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
                <span className="text-slate-300">{s.filename}</span>
                <span
                  className={`${(s.findings?.length ?? 0) > 0 ? "text-orange-400" : "text-green-400"}`}
                >
                  {s.findings?.length ?? 0} findings
                </span>
              </div>
            ))}
          </div>
        </CyberCard>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Code Input */}
        <CyberCard variant="cyan" className="p-0 overflow-hidden">
          <div className="px-4 py-2 border-b border-white/8 flex items-center justify-between">
            <span className="text-xs font-mono text-[#00f3ff]">// SOURCE CODE</span>
            <span className="text-[10px] font-mono text-slate-500">
              {code.split("\n").length} lines
            </span>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-80 bg-transparent p-3 font-mono text-xs outline-none resize-none text-slate-300 placeholder:text-slate-600"
            placeholder="Paste your code here..."
          />
          <div className="p-3 border-t border-white/8">
            <CyberButton onClick={runScan} disabled={scanning} className="w-full">
              {scanning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <ScanLine className="h-4 w-4" />
              )}
              {scanning ? "Scanning..." : "Run Security Scan"}
            </CyberButton>
          </div>
        </CyberCard>

        {/* Pipeline + Summary */}
        <div className="space-y-4">
          <CyberCard variant="magenta" className="p-5">
            <div className="text-[10px] font-mono text-[#ff003c] uppercase tracking-widest mb-4">
              // CI/CD PIPELINE
            </div>
            <div className="space-y-3">
              {STAGES.map((s, i) => {
                const status = stage > i ? "ok" : stage === i ? "run" : "wait";
                return (
                  <div key={s.name} className="flex items-center gap-3 text-sm font-mono">
                    <span
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs transition-all ${
                        status === "ok"
                          ? "bg-green-500/20 text-green-400 ring-1 ring-green-500/30"
                          : status === "run"
                            ? "bg-[#00f3ff]/20 text-[#00f3ff] animate-pulse ring-1 ring-[#00f3ff]/40"
                            : "bg-white/5 text-slate-600"
                      }`}
                    >
                      {status === "ok" ? "✓" : s.icon}
                    </span>
                    <span className={status === "wait" ? "text-slate-600" : "text-slate-300"}>
                      {s.name}
                    </span>
                    {status === "run" && (
                      <span className="text-xs text-[#00f3ff] animate-pulse">running…</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CyberCard>

          {/* Summary */}
          {summary && (
            <CyberCard variant="cyan" className="p-5 space-y-4">
              <RiskGauge score={summary.riskScore} />
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Critical", val: summary.critical, color: "text-red-400" },
                  { label: "High", val: summary.high, color: "text-orange-400" },
                  { label: "Medium", val: summary.medium, color: "text-yellow-400" },
                  { label: "Low", val: summary.low, color: "text-blue-400" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className={`font-display text-xl font-bold ${s.color}`}>{s.val}</div>
                    <div className="text-[9px] font-mono text-slate-500 uppercase">{s.label}</div>
                  </div>
                ))}
              </div>
              {summary.owaspCategories.length > 0 && (
                <div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-1">
                    OWASP Categories
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {summary.owaspCategories.map((c) => (
                      <span
                        key={c}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[#00f3ff]/20 text-[#00f3ff] bg-[#00f3ff]/5"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 flex-wrap pt-1">
                <CyberButton
                  size="sm"
                  variant="magenta"
                  onClick={analyzeWithAI}
                  disabled={analyzing || (findings?.length ?? 0) === 0}
                >
                  {analyzing ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Brain className="h-3.5 w-3.5" />
                  )}
                  AI Remediation
                </CyberButton>
                {scanId && (
                  <CyberButton size="sm" variant="ghost" onClick={exportSARIF}>
                    <FileDown className="h-3.5 w-3.5" /> SARIF Export
                  </CyberButton>
                )}
              </div>
            </CyberCard>
          )}

          {findings?.length === 0 && (
            <CyberCard variant="plain" className="p-5 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 font-mono text-sm">Clean scan — 0 findings</p>
            </CyberCard>
          )}
        </div>
      </div>

      {/* AI Analysis Panel */}
      {(analyzing || aiAnalysis) && (
        <CyberCard variant="magenta" className="p-6">
          <div className="text-[10px] font-mono text-[#ff003c] uppercase tracking-widest mb-3 flex items-center gap-2">
            <Brain className="h-3.5 w-3.5" /> STRAXON AI — REMEDIATION PLAN
          </div>
          {analyzing ? (
            <div className="flex items-center gap-3 text-sm font-mono text-slate-400 py-4">
              <RefreshCw className="h-5 w-5 text-[#ff003c] animate-spin" />
              Analyzing findings...
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-[#ff003c] prose-headings:font-mono prose-headings:text-sm prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white">
              <ReactMarkdown>{aiAnalysis!}</ReactMarkdown>
            </div>
          )}
        </CyberCard>
      )}

      {/* Findings List */}
      {findings && findings.length > 0 && (
        <CyberCard variant="magenta" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#ff003c]" />
              <span className="text-xs font-mono text-[#ff003c] uppercase tracking-widest">
                {findings.length} Findings
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {findings.map((f, idx) => {
              const key = f.id ?? `${idx}`;
              const isOpen = expanded === key;
              return (
                <div
                  key={key}
                  className={`rounded-xl border overflow-hidden transition-all ${
                    SEV_STYLES[f.severity] ?? SEV_STYLES.info
                  }`}
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : key)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/3 transition-colors"
                  >
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold uppercase">{f.severity}</span>
                        <span className="text-sm font-mono text-slate-200">{f.title}</span>
                        <span className="text-[10px] font-mono text-slate-500">line {f.line}</span>
                        {f.owasp && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-current/30 bg-current/5">
                            {f.owasp}
                          </span>
                        )}
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 space-y-2 border-t border-current/10">
                      {f.match && (
                        <pre className="mt-2 text-xs font-mono bg-black/30 p-2 rounded overflow-x-auto text-red-300">
                          {f.match}
                        </pre>
                      )}
                      {f.description && <p className="text-xs text-slate-400">{f.description}</p>}
                      {f.fix && (
                        <div className="text-xs font-mono">
                          <span className="text-[#00f3ff]">FIX → </span>
                          <span className="text-slate-300">{f.fix}</span>
                        </div>
                      )}
                      {f.cwe && (
                        <a
                          href={`https://cwe.mitre.org/data/definitions/${f.cwe.replace("CWE-", "")}.html`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[9px] font-mono text-slate-500 hover:text-[#00f3ff] underline"
                        >
                          {f.cwe} ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CyberCard>
      )}
    </div>
  );
}
