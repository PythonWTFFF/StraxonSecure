import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import {
  Package,
  ShieldAlert,
  GitBranch,
  Github,
  Search,
  CheckCircle,
  Download,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/supply-chain")({
  component: SupplyChainDashboard,
});

type Vulnerability = {
  id: string;
  package: string;
  version: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  cvss: number;
  description: string;
  remediation: string;
};

// Removed MOCK_DB - Now using live OSV.dev API

const SAMPLE_PACKAGE = `{
  "name": "vulnerable-app",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "^4.17.15",
    "axios": "0.21.1",
    "express": "~4.16.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}`;

function SupplyChainDashboard() {
  const [input, setInput] = useState(SAMPLE_PACKAGE);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<Vulnerability[] | null>(null);

  const scanDependencies = async () => {
    setIsScanning(true);
    setResults(null);

    try {
      const pkg = JSON.parse(input);
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

      const queries = Object.entries(deps).map(([name, version]) => {
        // Strip semver characters for basic API matching
        const cleanVersion = (version as string).replace(/^[\\^~>=<]+/, "");
        return {
          package: { name, ecosystem: "npm" },
          version: cleanVersion,
        };
      });

      if (queries.length === 0) {
        setResults([]);
        setIsScanning(false);
        return;
      }

      // Query OSV.dev Batch API
      const res = await fetch("https://api.osv.dev/v1/querybatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queries }),
      });

      const data = await res.json();
      const findings: Vulnerability[] = [];

      data.results?.forEach((result: any, index: number) => {
        if (result.vulns && result.vulns.length > 0) {
          const q = queries[index];
          result.vulns.forEach((vuln: any) => {
            // Map OSV response to our UI format
            const cvssScore = vuln.severity?.[0]?.score
              ? parseFloat(vuln.severity[0].score.match(/[0-9.]+/)?.[0] || "5.0")
              : 5.0;
            const severity =
              cvssScore >= 9.0
                ? "Critical"
                : cvssScore >= 7.0
                  ? "High"
                  : cvssScore >= 4.0
                    ? "Medium"
                    : "Low";

            findings.push({
              id: vuln.aliases?.[0] || vuln.id,
              package: q.package.name,
              version: q.version,
              severity,
              cvss: cvssScore,
              description: vuln.summary || vuln.details?.substring(0, 150) + "...",
              remediation: "Review OSV Advisory: " + vuln.id,
            });
          });
        }
      });

      // Deduplicate by ID
      const uniqueFindings = Array.from(new Map(findings.map((item) => [item.id, item])).values());

      setResults(uniqueFindings.sort((a, b) => b.cvss - a.cvss));
    } catch (e) {
      alert("Invalid JSON format or API error");
      console.error(e);
    }
    setIsScanning(false);
  };

  const criticalCount = results?.filter((r) => r.severity === "Critical").length || 0;
  const highCount = results?.filter((r) => r.severity === "High").length || 0;
  const riskScore = results ? Math.min(100, criticalCount * 25 + highCount * 10 + 10) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
          <Package className="h-6 w-6 text-indigo-500" />
        </div>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold text-white tracking-wide">
            Supply Chain Security
          </h1>
          <p className="font-mono text-xs text-slate-400 mt-1 uppercase tracking-widest">
            SCA (Software Composition Analysis)
          </p>
        </div>
        <CyberButton variant="outline" className="print-hidden" onClick={() => window.print()}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </CyberButton>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <CyberCard variant="indigo" className="p-4 bg-[#020610]">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
              <Github className="h-4 w-4 text-slate-400" />
              <h3 className="font-mono text-xs font-bold text-white uppercase tracking-widest">
                Target Repository
              </h3>
            </div>

            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1 block">
              Paste package.json
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-[300px] bg-black/40 border border-white/10 rounded font-mono text-xs text-slate-300 p-3 mb-4 custom-scrollbar focus:border-indigo-500"
              spellCheck={false}
            />

            <CyberButton
              variant="indigo"
              className="w-full justify-center"
              onClick={scanDependencies}
              disabled={isScanning}
            >
              {isScanning ? "SCANNING DEPS..." : "ANALYZE SUPPLY CHAIN"}
              <Search className="h-4 w-4 ml-2" />
            </CyberButton>
          </CyberCard>

          {results && (
            <CyberCard className="p-4 bg-black/60 border border-indigo-500/20">
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative">
                  <div className="text-5xl font-display font-bold text-white z-10 relative">
                    {riskScore}
                  </div>
                  <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                </div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-2">
                  Overall Risk Score
                </div>
              </div>
            </CyberCard>
          )}
        </div>

        <div className="lg:col-span-8">
          <CyberCard className="p-5 h-full bg-[#020610]">
            <div className="flex items-center gap-2 mb-6">
              <ShieldAlert className="h-5 w-5 text-indigo-400" />
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest">
                Vulnerability Report
              </h3>
              {results && (
                <span className="ml-auto text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30">
                  {results.length} CVEs Detected
                </span>
              )}
            </div>

            {isScanning ? (
              <div className="flex flex-col items-center justify-center h-[300px] gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
                <div className="font-mono text-xs text-slate-400 uppercase tracking-widest animate-pulse">
                  Cross-referencing NVD Database...
                </div>
              </div>
            ) : !results ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-slate-500">
                <GitBranch className="h-12 w-12 mb-4 opacity-20" />
                <div className="font-mono text-xs uppercase tracking-widest">
                  No scan data. Run an analysis.
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-emerald-500">
                <CheckCircle className="h-16 w-16 mb-4 opacity-80" />
                <div className="font-mono text-sm uppercase tracking-widest font-bold text-emerald-400">
                  Zero Vulnerabilities Detected
                </div>
                <div className="text-xs mt-2 text-emerald-500/70">
                  Your software supply chain is secure.
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {results.map((cve, i) => (
                  <div
                    key={i}
                    className="bg-black/40 border border-white/5 rounded-lg p-4 flex flex-col gap-3 hover:border-indigo-500/30 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-widest ${
                            cve.severity === "Critical"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : cve.severity === "High"
                                ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          }`}
                        >
                          {cve.severity} (CVSS: {cve.cvss})
                        </span>
                        <span className="font-mono text-xs text-white font-bold">{cve.id}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                        {cve.package} {cve.version}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 font-sans leading-relaxed">
                      {cve.description}
                    </p>
                    <div className="mt-2 bg-indigo-950/30 border border-indigo-500/20 rounded p-2 flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-indigo-400" />
                      <span className="text-xs font-mono text-indigo-300">
                        Remediation: {cve.remediation}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CyberCard>
        </div>
      </div>
    </div>
  );
}
