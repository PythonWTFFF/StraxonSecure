import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  ShieldAlert,
  ExternalLink,
  RefreshCw,
  AlertOctagon,
  Search,
  Brain,
  X,
  TrendingUp,
  Shield,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { Input } from "@/components/ui/input";
import { fetchThreatIntel, analyzeCVE, searchCVEs } from "@/server/threatIntel";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/threat-Intel")({
  head: () => ({
    meta: [
      { title: "Threat Intelligence — Live CVE Feed + AI Analysis" },
      {
        name: "description",
        content:
          "Real-time CVE feed from NVD with AI-powered vulnerability analysis, MITRE ATT&CK mapping, and actionable mitigations.",
      },
    ],
  }),
  component: ThreatIntelPage,
});

interface CveItem {
  cve_id: string;
  severity: string;
  cvss_score: number | null;
  title: string;
  description: string;
  published_at: string;
  source_url: string;
}

const SEV_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-500/15 text-red-400 border-red-500/40",
  HIGH: "bg-orange-500/15 text-orange-400 border-orange-500/40",
  MEDIUM: "bg-yellow-500/15 text-yellow-400 border-yellow-500/40",
  LOW: "bg-blue-500/15 text-blue-400 border-blue-500/40",
  UNKNOWN: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

const SEV_GLOW: Record<string, string> = {
  CRITICAL: "shadow-[0_0_20px_rgba(239,68,68,0.15)]",
  HIGH: "shadow-[0_0_20px_rgba(249,115,22,0.12)]",
  MEDIUM: "shadow-[0_0_20px_rgba(234,179,8,0.1)]",
  LOW: "shadow-[0_0_20px_rgba(59,130,246,0.1)]",
  UNKNOWN: "",
};

function CvssBar({ score }: { score: number | null }) {
  if (score === null) return null;
  const pct = (score / 10) * 100;
  const color =
    score >= 9
      ? "bg-red-500"
      : score >= 7
        ? "bg-orange-500"
        : score >= 4
          ? "bg-yellow-500"
          : "bg-blue-500";
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-slate-400">{score}/10</span>
    </div>
  );
}

function ThreatIntelPage() {
  const [items, setItems] = useState<CveItem[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [cached, setCached] = useState(false);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, string>>({});
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchThreatIntel();
      setItems((res.items as CveItem[]) ?? []);
      setCached(res.cached);
    } catch {
      toast.error("Failed to load threat feed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Auto-refresh every 10 minutes to get latest CVEs from NVD
    const interval = setInterval(load, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  const handleSearch = async () => {
    if (!search.trim()) return load();
    setSearching(true);
    try {
      const res = await searchCVEs({ data: { query: search, severity: filter as any } });
      setItems((res.items as CveItem[]) ?? []);
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleAnalyze = async (cve: CveItem) => {
    if (analysis[cve.cve_id]) {
      setExpanded(expanded === cve.cve_id ? null : cve.cve_id);
      return;
    }
    setAnalyzing(cve.cve_id);
    setExpanded(cve.cve_id);
    try {
      const res = await analyzeCVE({
        data: {
          cveId: cve.cve_id,
          description: cve.description,
          severity: cve.severity,
          cvssScore: cve.cvss_score,
        },
      });
      setAnalysis((prev) => ({ ...prev, [cve.cve_id]: res.analysis }));
    } catch {
      toast.error("AI analysis failed — check GEMINI_API_KEY");
      setExpanded(null);
    } finally {
      setAnalyzing(null);
    }
  };

  const filtered = filter === "ALL" ? items : items.filter((i) => i.severity === filter);

  const counts = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.severity] = (acc[i.severity] ?? 0) + 1;
    return acc;
  }, {});

  const critCount = counts["CRITICAL"] ?? 0;
  const highCount = counts["HIGH"] ?? 0;

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <SectionHeading
          eyebrow="// LIVE CVE FEED"
          title="Threat Intelligence"
          description="Real-time vulnerability feed from NVD with AI-powered analysis and MITRE ATT&CK mapping."
        />
        <CyberButton variant="cyan" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Feed
        </CyberButton>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CyberCard variant="plain" className="p-4 flex items-center gap-3 border-red-500/20">
          <Zap className="h-6 w-6 text-red-400 shrink-0" />
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Critical
            </div>
            <div className="font-display text-2xl font-bold text-red-400">{critCount}</div>
          </div>
        </CyberCard>
        <CyberCard variant="plain" className="p-4 flex items-center gap-3 border-orange-500/20">
          <ShieldAlert className="h-6 w-6 text-orange-400 shrink-0" />
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              High
            </div>
            <div className="font-display text-2xl font-bold text-orange-400">{highCount}</div>
          </div>
        </CyberCard>
        <CyberCard variant="plain" className="p-4 flex items-center gap-3 border-cyan-500/20">
          <TrendingUp className="h-6 w-6 text-[#00f3ff] shrink-0" />
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Total
            </div>
            <div className="font-display text-2xl font-bold text-[#00f3ff]">{items.length}</div>
          </div>
        </CyberCard>
        <CyberCard variant="plain" className="p-4 flex items-center gap-3 border-purple-500/20">
          <Shield className="h-6 w-6 text-purple-400 shrink-0" />
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              AI Ready
            </div>
            <div className="font-display text-2xl font-bold text-purple-400">
              {Object.keys(analysis).length}
            </div>
          </div>
        </CyberCard>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search CVE IDs or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 font-mono bg-white/5 border-white/10"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                load();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <CyberButton variant="cyan" onClick={handleSearch} disabled={searching}>
          {searching ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Search
        </CyberButton>
      </div>

      {/* Severity Tabs */}
      <div className="flex flex-wrap gap-2">
        {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest transition-all border ${
              filter === s
                ? s === "ALL"
                  ? "bg-[#00f3ff] text-black border-[#00f3ff]"
                  : SEV_COLORS[s] + " font-bold"
                : "text-slate-500 border-white/10 hover:border-white/20 hover:text-slate-300"
            }`}
          >
            {s} {s !== "ALL" && `(${counts[s] ?? 0})`}
          </button>
        ))}
      </div>

      {cached && (
        <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/60 inline-block" />
          Showing cached data {!items.length && "— NVD unreachable"}
        </div>
      )}

      {/* CVE List */}
      <div className="space-y-3">
        {loading && items.length === 0 && (
          <div className="text-center py-16 text-slate-500 font-mono text-sm">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-[#00f3ff]/50" />
            // Fetching live CVE feed from NVD...
          </div>
        )}

        {filtered.map((cve) => {
          const isExpanded = expanded === cve.cve_id;
          const hasAnalysis = !!analysis[cve.cve_id];
          const isAnalyzing = analyzing === cve.cve_id;

          return (
            <div
              key={cve.cve_id}
              className={`rounded-xl border bg-[#020610]/80 backdrop-blur transition-all ${
                SEV_GLOW[cve.severity] ?? ""
              } ${isExpanded ? "border-white/20" : "border-white/8 hover:border-white/15"}`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert
                    className={`h-5 w-5 shrink-0 mt-0.5 ${
                      cve.severity === "CRITICAL"
                        ? "text-red-400"
                        : cve.severity === "HIGH"
                          ? "text-orange-400"
                          : cve.severity === "MEDIUM"
                            ? "text-yellow-400"
                            : "text-blue-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <a
                        href={cve.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono font-bold text-[#00f3ff] hover:underline inline-flex items-center gap-1 text-sm"
                      >
                        {cve.cve_id} <ExternalLink className="h-3 w-3" />
                      </a>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                          SEV_COLORS[cve.severity] ?? SEV_COLORS.UNKNOWN
                        }`}
                      >
                        {cve.severity}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(cve.published_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <CvssBar score={cve.cvss_score} />
                    <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {cve.description}
                    </p>
                  </div>

                  {/* AI Analyze Button */}
                  <button
                    onClick={() => handleAnalyze(cve)}
                    disabled={isAnalyzing}
                    className={`shrink-0 flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${
                      hasAnalysis
                        ? "border-purple-500/40 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20"
                        : "border-white/10 text-slate-400 bg-white/5 hover:border-[#00f3ff]/40 hover:text-[#00f3ff]"
                    }`}
                  >
                    {isAnalyzing ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Brain className="h-3.5 w-3.5" />
                    )}
                    {isAnalyzing ? "Analyzing..." : hasAnalysis ? "AI Analysis" : "Analyze"}
                    {hasAnalysis &&
                      (isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </button>
                </div>
              </div>

              {/* AI Analysis Panel */}
              {isExpanded && (
                <div className="border-t border-white/8 p-4">
                  {isAnalyzing ? (
                    <div className="flex items-center gap-3 text-sm font-mono text-slate-400 py-4">
                      <Brain className="h-5 w-5 text-purple-400 animate-pulse" />
                      STRAX-INTEL is analyzing {cve.cve_id}...
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none prose-headings:font-mono prose-headings:text-[#00f3ff] prose-headings:text-sm prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white">
                      <div className="text-[10px] font-mono text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Brain className="h-3.5 w-3.5" />
                        STRAX-INTEL AI ANALYSIS
                      </div>
                      <ReactMarkdown>{analysis[cve.cve_id]}</ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500 font-mono text-sm flex flex-col items-center gap-3">
            <AlertOctagon className="h-10 w-10 text-slate-600" />
            No CVEs match this filter.
          </div>
        )}
      </div>
    </div>
  );
}
