import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Cloud,
  ShieldCheck,
  AlertTriangle,
  Shield,
  CheckCircle2,
  RefreshCw,
  Server,
  XCircle,
} from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { useAuth } from "@/hooks/useAuth";
import { callAuthed } from "@/lib/serverCall";
import { getPostureEvaluations, evaluatePosture } from "@/server/posture";
import { toast } from "sonner";

export const Route = createFileRoute("/posture")({
  head: () => ({
    meta: [
      { title: "Cloud Security Posture — Straxon Secure" },
      { name: "description", content: "CSPM - Continuous Cloud Security Posture Management." },
    ],
  }),
  component: PosturePage,
});

function PosturePage() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [selectedEval, setSelectedEval] = useState<any | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  const loadEvals = async () => {
    try {
      const data = await callAuthed(getPostureEvaluations, undefined);
      setEvaluations(data || []);
      if (!selectedEval && data && data.length > 0) {
        setSelectedEval(data[0]);
      }
    } catch (e) {
      toast.error("Failed to load evaluations");
    }
  };

  useEffect(() => {
    if (user) loadEvals();
  }, [user]);

  const handleEvaluate = async (provider: string) => {
    setEvaluating(true);
    toast.info(`Scanning ${provider} architecture...`);
    try {
      const res = await callAuthed(evaluatePosture, { provider });
      toast.success("Scan complete");
      loadEvals();
      setSelectedEval(res);
    } catch (e: any) {
      toast.error(e.message || "Evaluation failed");
    } finally {
      setEvaluating(false);
    }
  };

  if (!user)
    return <div className="p-12 text-center text-slate-400 font-mono">Sign in to access CSPM.</div>;

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <SectionHeading
        eyebrow="// COMPLIANCE"
        title="Cloud Security Posture"
        description="Continuous evaluation of AWS, Azure, and GCP architectures."
      />

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Left Col: Providers & History */}
        <div className="lg:col-span-1 space-y-6">
          <CyberCard variant="cyan" className="p-4">
            <h3 className="text-xs font-mono uppercase text-[#00f3ff] mb-4">Run Scan</h3>
            <div className="space-y-2">
              <CyberButton
                onClick={() => handleEvaluate("AWS")}
                variant="cyan"
                className="w-full justify-between"
                disabled={evaluating}
              >
                <span>AWS</span> <Cloud className="h-4 w-4" />
              </CyberButton>
              <CyberButton
                onClick={() => handleEvaluate("Azure")}
                variant="ghost"
                className="w-full justify-between"
                disabled={evaluating}
              >
                <span>Azure</span> <Server className="h-4 w-4" />
              </CyberButton>
              <CyberButton
                onClick={() => handleEvaluate("GCP")}
                variant="ghost"
                className="w-full justify-between"
                disabled={evaluating}
              >
                <span>GCP</span> <Cloud className="h-4 w-4" />
              </CyberButton>
            </div>
          </CyberCard>

          <CyberCard variant="plain" className="p-4">
            <h3 className="text-xs font-mono uppercase text-slate-400 mb-4">Scan History</h3>
            {evaluations.length === 0 ? (
              <div className="text-xs text-slate-400 font-mono italic">No scans run.</div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {evaluations.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEval(ev)}
                    className={`w-full text-left p-3 rounded border transition-all flex justify-between items-center ${selectedEval?.id === ev.id ? "bg-[#00f3ff]/10 border-[#00f3ff]/50" : "bg-white/5 border-white/10 hover:border-white/20"}`}
                  >
                    <div>
                      <div className="font-mono text-white text-sm font-bold">
                        {ev.cloud_provider}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        {new Date(ev.evaluated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div
                      className={`text-sm font-mono font-bold ${ev.score >= 80 ? "text-green-400" : ev.score >= 60 ? "text-yellow-400" : "text-red-400"}`}
                    >
                      {ev.score}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CyberCard>
        </div>

        {/* Right Col: Report Viewer */}
        <div className="lg:col-span-3 space-y-6">
          {!selectedEval ? (
            <div className="h-[400px] border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-400 space-y-4">
              <ShieldCheck className="h-12 w-12 opacity-50" />
              <p className="font-mono text-sm">Select a scan history or run a new evaluation.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <CyberCard
                  variant={selectedEval.score >= 80 ? "plain" : "magenta"}
                  className="p-6 col-span-1 flex flex-col items-center justify-center text-center"
                >
                  <div className="relative">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="60"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-white/10"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="60"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={377}
                        strokeDashoffset={377 - (377 * selectedEval.score) / 100}
                        className={
                          selectedEval.score >= 80
                            ? "text-green-500"
                            : selectedEval.score >= 60
                              ? "text-yellow-500"
                              : "text-red-500"
                        }
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-3xl font-display font-bold text-white">
                        {selectedEval.score}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-mono text-sm text-slate-400 mt-4 uppercase tracking-widest">
                    Posture Score
                  </h3>
                </CyberCard>

                <CyberCard variant="plain" className="p-6 col-span-2">
                  <h3 className="font-mono text-lg text-white font-bold mb-4">
                    {selectedEval.cloud_provider} Infrastructure
                  </h3>
                  <div className="grid grid-cols-2 gap-4 font-mono text-sm">
                    <div className="bg-black/40 p-3 rounded border border-white/10">
                      <div className="text-slate-400 text-xs mb-1">Checks Passed</div>
                      <div className="text-xl text-green-400">
                        {selectedEval.findings.filter((f: any) => f.passed).length}
                      </div>
                    </div>
                    <div className="bg-black/40 p-3 rounded border border-white/10">
                      <div className="text-slate-400 text-xs mb-1">Checks Failed</div>
                      <div className="text-xl text-red-400">
                        {selectedEval.findings.filter((f: any) => !f.passed).length}
                      </div>
                    </div>
                    <div className="bg-black/40 p-3 rounded border border-white/10">
                      <div className="text-slate-400 text-xs mb-1">Critical Issues</div>
                      <div className="text-xl text-red-500">
                        {
                          selectedEval.findings.filter(
                            (f: any) => !f.passed && f.severity === "critical",
                          ).length
                        }
                      </div>
                    </div>
                    <div className="bg-black/40 p-3 rounded border border-white/10">
                      <div className="text-slate-400 text-xs mb-1">Compliance Standard</div>
                      <div className="text-lg text-[#00f3ff]">CIS v1.4.0</div>
                    </div>
                  </div>
                </CyberCard>
              </div>

              <CyberCard variant="plain" className="p-6">
                <h3 className="text-sm font-mono text-white font-bold uppercase mb-4">
                  Detailed Findings
                </h3>
                <div className="space-y-2">
                  {selectedEval.findings.map((f: any, i: number) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-3 rounded border ${f.passed ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}
                    >
                      <div className="flex items-center gap-3">
                        {f.passed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <div>
                          <div className="font-mono text-sm text-white">{f.desc}</div>
                          <div className="text-xs font-mono text-slate-400 mt-0.5">{f.id}</div>
                        </div>
                      </div>
                      {!f.passed && (
                        <div
                          className={`px-2 py-1 rounded text-xs font-mono font-bold uppercase ${f.severity === "critical" ? "bg-red-500 text-white" : f.severity === "high" ? "bg-orange-500 text-white" : "bg-yellow-500/20 text-yellow-500"}`}
                        >
                          {f.severity}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CyberCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
