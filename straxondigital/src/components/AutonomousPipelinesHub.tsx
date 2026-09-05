import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Rocket, Mic, Search, Play, CheckCircle2, Copy, Download,
  Layers, Loader2, Sparkles, Brain, Clock, Zap, History, Database,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PipelineDef {
  id: string;
  name: string;
  badge: string;
  description: string;
  steps: string[];
  sampleInput: string;
  icon: React.ElementType;
}

const PIPELINES_CATALOG: PipelineDef[] = [
  {
    id: "gtm-launchpad",
    name: "Autonomous Go-To-Market Launchpad",
    badge: "5 Sequential Steps",
    description: "Executes an entire multi-agent go-to-market pipeline in sequence: Positioning & UVP → 3 ICP Personas → 5 Cold Outreach Emails → 7-Day Social Launch Blitz → High-Converting Landing Page Copywire.",
    steps: [
      "1. UVP & Positioning Architecture",
      "2. ICP Personas & Pain Points",
      "3. 5-Email Cold Outbound Sequence",
      "4. 7-Day Social Launch Blitz",
      "5. Conversion Landing Page Copywire",
    ],
    sampleInput: "Product: Straxon Labs Digital — an autonomous AI agency platform for tech founders. $149/mo subscription replaces traditional $8k/mo agencies with 24-hour delivery.",
    icon: Rocket,
  },
  {
    id: "voice-agent-deploy",
    name: "AI Voice Agent State Machine & Script Suite",
    badge: "4 Sequential Steps",
    description: "Builds a complete, production-ready Voice AI agent: Acoustic Persona Guidelines → Inbound Qualification Tree → Outbound Cold Call Pitch with 5 Objection Handlers → Vapi / Retell AI JSON Payload.",
    steps: [
      "1. Voice Persona & Acoustic Spec",
      "2. Inbound Qualification State Machine",
      "3. Outbound Pitch & 5 Objection Handlers",
      "4. Vapi / Retell AI JSON Config Payload",
    ],
    sampleInput: "Business: Dental & Aesthetic Practice scheduling bookings, handling appointment cancellations, and qualifying prospective cosmetic patients for $3,000+ treatments.",
    icon: Mic,
  },
  {
    id: "seo-authority-blitz",
    name: "SEO Topical Authority Blitz",
    badge: "3 Sequential Steps",
    description: "Dominates organic search: Commercial Intent Keyword Discovery → 3 Comprehensive Pillar Article Blueprints with Schema → Meta Title & Description Matrix for Top 10 Pages.",
    steps: [
      "1. Commercial Keyword Cluster Discovery",
      "2. 3 Pillar Article Blueprints & Schema",
      "3. Meta Title & Description Matrix (10 URLs)",
    ],
    sampleInput: "Target Niche: AI automated agency services, autonomous deliverables software, and programmatic SEO software for B2B founders.",
    icon: Search,
  },
];

export const AutonomousPipelinesHub = ({ workspaceId }: { workspaceId?: string }) => {
  const { user } = useAuth();
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineDef>(PIPELINES_CATALOG[0]);
  const [inputPrompt, setInputPrompt] = useState(selectedPipeline.sampleInput);
  const [running, setRunning] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stepLogs, setStepLogs] = useState<string[]>([]);
  const [compiledResult, setCompiledResult] = useState<string | null>(null);
  const [stepResults, setStepResults] = useState<Record<string, string>>({});
  const [activeResultTab, setActiveResultTab] = useState("compiled");
  const [wsId, setWsId] = useState<string | null>(workspaceId || null);

  useEffect(() => {
    if (!workspaceId && user) {
      supabase
        .from("workspaces")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setWsId(data.id);
        });
    }
  }, [user, workspaceId]);

  const handleSelectPipeline = (pipe: PipelineDef) => {
    setSelectedPipeline(pipe);
    setInputPrompt(pipe.sampleInput);
    setCompiledResult(null);
    setStepResults({});
    setStepLogs([]);
    setProgress(0);
    setActiveStepIndex(0);
  };

  const runPipeline = async () => {
    if (!inputPrompt.trim() || !wsId) return;

    setRunning(true);
    setProgress(5);
    setCompiledResult(null);
    setStepResults({});
    setStepLogs([`[0.0s] Initializing ${selectedPipeline.name} orchestrator...`]);
    setActiveStepIndex(0);

    // Progressive step simulation ticker
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 6;
      });
    }, 900);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-pipeline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          pipelineId: selectedPipeline.id,
          workspaceId: wsId,
          input: inputPrompt,
        }),
      });

      const result = await res.json();
      clearInterval(timer);

      if (!res.ok || result.error) {
        throw new Error(result.error || "Pipeline execution failed");
      }

      setProgress(100);
      setActiveStepIndex(selectedPipeline.steps.length);
      setCompiledResult(result.compiled_deliverable);
      setStepResults(result.step_results || {});
      setStepLogs((prev) => [
        ...prev,
        `[done] All ${selectedPipeline.steps.length} steps completed in ${(result.duration_ms / 1000).toFixed(1)}s!`,
      ]);

      toast.success(`${selectedPipeline.name} Complete!`, {
        description: `Generated master deliverable with ${result.rag_chunks_used} RAG chunks and ${result.tokens_used} tokens.`,
      });
    } catch (err: any) {
      clearInterval(timer);
      setProgress(0);
      setStepLogs((prev) => [...prev, `[error] ${err.message}`]);
      toast.error(err.message || "Pipeline execution failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Rocket className="h-4 w-4 text-primary" />
            <p className="text-xs font-mono uppercase tracking-[0.25em] text-primary">
              / Autonomous AI Multi-Step Chains
            </p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Multi-Step AI Pipeline Studio</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Chain multiple specialized AI agents together to generate complete, multi-asset client campaigns in under 45 seconds.
          </p>
        </div>

        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/25 font-mono py-1 px-3">
          Cascading Context Memory
        </Badge>
      </div>

      {/* 2-Column: Pipeline selector vs Runner */}
      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        {/* Left: Pipelines Catalog */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" /> Multi-Step Recipes ({PIPELINES_CATALOG.length})
          </h3>

          <div className="space-y-2.5">
            {PIPELINES_CATALOG.map((pipe) => {
              const isSelected = selectedPipeline.id === pipe.id;
              const Icon = pipe.icon;
              return (
                <div
                  key={pipe.id}
                  onClick={() => handleSelectPipeline(pipe)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-primary/10 border-primary shadow-glow ring-1 ring-primary/40"
                      : "glass hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <Icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      {pipe.name}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed ml-5 mb-2">
                    {pipe.description}
                  </p>
                  <div className="ml-5 flex items-center justify-between">
                    <Badge variant="outline" className="text-[9px] font-mono bg-primary/10 text-primary border-primary/20">
                      {pipe.badge}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          <Card className="glass p-4 border-border/40 text-xs text-muted-foreground space-y-1.5">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> How Cascading Chains Work:
            </p>
            <p className="text-[11px] leading-relaxed">
              Output from Step 1 feeds directly into Step 2, refining ICP targets, which then write targeted outbound copy. The resulting package is fully unified.
            </p>
          </Card>
        </div>

        {/* Right: Pipeline Execution Workspace */}
        <div className="space-y-4">
          <Card className="glass-strong p-6 border-primary/20 space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <selectedPipeline.icon className="h-4 w-4 text-primary" /> {selectedPipeline.name}
                </h3>
                <span className="text-xs text-muted-foreground font-mono">Sequential Multi-Agent Execution</span>
              </div>

              <Button
                onClick={runPipeline}
                disabled={running || !inputPrompt.trim()}
                className="bg-gradient-primary text-primary-foreground border-0 shadow-glow font-semibold text-xs px-5"
              >
                {running ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Executing Pipeline…
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                    Run Autonomous Pipeline
                  </>
                )}
              </Button>
            </div>

            {/* Input Context */}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1.5">
                Business & Campaign Parameters
              </label>
              <Textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Describe your business, offer, or target goals..."
                rows={3}
                className="glass text-xs font-mono"
              />
            </div>

            {/* Step Sequence Bar */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-xs font-mono text-muted-foreground">
                <span>Execution Steps ({selectedPipeline.steps.length})</span>
                {running && <span className="text-primary">{progress}%</span>}
              </div>

              {running && <Progress value={progress} className="h-1.5" />}

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                {selectedPipeline.steps.map((stepName, i) => {
                  const isDone = compiledResult || activeStepIndex > i;
                  const isCurrent = running && activeStepIndex === i;
                  return (
                    <div
                      key={stepName}
                      className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border transition-all ${
                        isDone
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : isCurrent
                          ? "bg-primary/15 text-primary border-primary animate-pulse"
                          : "bg-muted/15 text-muted-foreground border-border/40"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                      ) : (
                        <span className="h-3.5 w-3.5 rounded-full border border-border/50 text-[10px] flex items-center justify-center font-mono shrink-0">
                          {i + 1}
                        </span>
                      )}
                      <span className="truncate">{stepName}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Step Logs */}
            {stepLogs.length > 0 && (
              <div className="rounded-xl p-3 bg-black/80 border border-border/60 font-mono text-[11px] text-green-400 space-y-0.5 max-h-28 overflow-y-auto">
                {stepLogs.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
            )}

            {/* Output Display with Step Tabs */}
            {compiledResult && (
              <div className="space-y-3 pt-3 border-t border-border/40">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-green-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Compiled Master Deliverable Ready
                  </span>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(compiledResult);
                        toast.success("Master deliverable copied!");
                      }}
                      className="h-7 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([compiledResult], { type: "text/plain" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${selectedPipeline.id}-master-${Date.now()}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success("Master deliverable downloaded!");
                      }}
                      className="h-7 text-xs"
                    >
                      <Download className="h-3 w-3 mr-1" /> Download
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl p-4 sm:p-6 bg-muted/20 border border-border/40 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
                  {compiledResult}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
