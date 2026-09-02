import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sparkles, Zap, Play, CheckCircle2, Clock, Terminal, Webhook, Download, Copy, Search,
  ShieldCheck, Cpu, Layers, Loader2, History, Calendar, Globe, RefreshCw, Trash2, AlertCircle,
  ChevronRight, Brain, TrendingUp, Mail, Eye, Database, Wifi, WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AutomationJobDef {
  id: string;
  name: string;
  category: "growth" | "strategy" | "engineering" | "ai" | "outreach";
  description: string;
  turnaround: string;
  creditsCost: number;
  sampleInput: string;
  icon: React.ElementType;
}

const AUTOMATIONS_CATALOG: AutomationJobDef[] = [
  {
    id: "social-weekly", name: "Autonomous 7-Day Social Content Batch", category: "growth",
    description: "Draws from your Brand Brain & Knowledge Base to auto-produce 7 platform-specific, ready-to-publish posts for LinkedIn, Twitter/X, and Instagram.",
    turnaround: "~15s", creditsCost: 1, icon: Sparkles,
    sampleInput: "Focus on this week's update: We shipped autonomous AI automations with real RAG retrieval and Brand Brain voice enforcement.",
  },
  {
    id: "seo-cluster", name: "Autonomous SEO Keyword & Cluster Plan", category: "growth",
    description: "Evaluates your brand context, groups high-volume keywords by intent, and generates a content cluster roadmap with pillar article angles.",
    turnaround: "~20s", creditsCost: 1, icon: Search,
    sampleInput: "Target domain: B2B automated agency software and AI career optimization tools for founders and solopreneurs.",
  },
  {
    id: "brand-compliance", name: "Brand Brain Voice & Compliance Auditor", category: "ai",
    description: "Audits any copy against your Brand Brain tone sliders and dos/donts. Scores 0-100 and delivers a compliant rewrite.",
    turnaround: "~10s", creditsCost: 1, icon: ShieldCheck,
    sampleInput: "Hey guys! We are super thrilled to offer you a crazy 50% discount right now! Don't miss out on this insane limited time deal!",
  },
  {
    id: "outreach-engine", name: "Executive Investor & Enterprise Pitch Pack", category: "strategy",
    description: "Synthesizes your traction data and Brand Brain to produce 3 hyper-targeted outreach sequence variants for investors or enterprise prospects.",
    turnaround: "~15s", creditsCost: 1, icon: TrendingUp,
    sampleInput: "Targeting Seed-stage SaaS angels. We have $28k MRR, 18% MoM growth, and 120 paying clients. Round size: $1.5M.",
  },
  {
    id: "cold-email-sequencer", name: "AI Cold Email & Follow-up Sequencer", category: "outreach",
    description: "Generates a 5-email cold outreach sequence with pattern interrupts, social proof, and escalating urgency targeting your specified ICP.",
    turnaround: "~12s", creditsCost: 1, icon: Mail,
    sampleInput: "ICP: Head of Marketing at B2B SaaS companies with 10-50 employees. Goal: book a demo for our autonomous agency platform.",
  },
  {
    id: "competitor-intelligence", name: "B2B Competitor Intelligence Scout", category: "strategy",
    description: "Profiles 3-5 key competitors with positioning analysis, strengths, weaknesses, and a counter-positioning strategy for your brand.",
    turnaround: "~18s", creditsCost: 1, icon: Eye,
    sampleInput: "We are an autonomous digital agency platform for founders. Identify our main competitors and suggest a counter-positioning strategy.",
  },
  {
    id: "saas-architecture", name: "SaaS Technical Architecture Spec Builder", category: "engineering",
    description: "Generates a full production-ready SaaS architecture spec: tech stack, database schema, API matrix, security model, and scaling plan.",
    turnaround: "~25s", creditsCost: 1, icon: Database,
    sampleInput: "Build a SaaS platform for freelance designers to manage clients, proposals, and deliverables with Stripe billing and Supabase backend.",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  growth: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  strategy: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  engineering: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  ai: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  outreach: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const SCHEDULE_OPTIONS = [
  { value: "daily", label: "Daily", cron: "0 9 * * *" },
  { value: "weekly", label: "Weekly (Monday)", cron: "0 9 * * 1" },
  { value: "monthly", label: "Monthly (1st)", cron: "0 9 1 * *" },
];

interface RunRecord {
  id: string;
  job_name: string;
  status: string;
  trigger_type: string;
  rag_chunks_used: number;
  brand_brain_injected: boolean;
  tokens_used: number;
  duration_ms: number;
  created_at: string;
  output_content: string | null;
  webhook_dispatched: boolean;
}

export const AutomationsHub = ({ workspaceId }: { workspaceId?: string }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("runner");
  const [selectedJob, setSelectedJob] = useState<AutomationJobDef>(AUTOMATIONS_CATALOG[0]);
  const [promptInput, setPromptInput] = useState(selectedJob.sampleInput);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [jobOutput, setJobOutput] = useState<string | null>(null);
  const [runMeta, setRunMeta] = useState<{ ragChunks: number; tokens: number; durationMs: number; brandBrain: boolean } | null>(null);
  const [runHistory, setRunHistory] = useState<RunRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  // Schedule state
  const [schedFrequency, setSchedFrequency] = useState("weekly");
  const [schedInput, setSchedInput] = useState("");
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [executingSchedules, setExecutingSchedules] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const logsRef = useRef<HTMLDivElement>(null);

  // Get workspace ID from user if not passed as prop
  const [wsId, setWsId] = useState<string | null>(workspaceId || null);

  useEffect(() => {
    if (!workspaceId && user) {
      supabase.from("workspaces").select("id").eq("owner_id", user.id).limit(1).maybeSingle()
        .then(({ data }) => { if (data) setWsId(data.id); });
    }
  }, [user, workspaceId]);

  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

  const handleSelectJob = (job: AutomationJobDef) => {
    setSelectedJob(job);
    setPromptInput(job.sampleInput);
    setJobOutput(null);
    setLogs([]);
    setProgress(0);
    setRunMeta(null);
  };

  const runAutomation = async () => {
    if (!promptInput.trim()) return;
    setRunning(true);
    setProgress(8);
    setJobOutput(null);
    setRunMeta(null);
    setLogs(["[0.0s] Initializing autonomous worker thread..."]);

    // Simulate progressive log steps
    const logSteps = [
      { p: 22, delay: 350, text: "[0.3s] Vectorizing prompt & querying pgvector semantic index..." },
      { p: 40, delay: 500, text: "[0.8s] Fusing Brand Brain voice guidelines and constraint rules..." },
      { p: 58, delay: 450, text: "[1.3s] Executing OpenAI gpt-4o-mini with structured schema output..." },
      { p: 78, delay: 500, text: "[1.8s] Parsing and validating structured deliverable..." },
      { p: 88, delay: 350, text: "[2.2s] Formatting output and dispatching webhooks..." },
    ];

    for (const step of logSteps) {
      await new Promise(r => setTimeout(r, step.delay));
      setProgress(step.p);
      setLogs(prev => [...prev, step.text]);
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-automation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          jobId: selectedJob.id,
          workspaceId: wsId,
          input: promptInput,
          triggerType: "manual",
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || "Automation failed");
      }

      setProgress(100);
      setLogs(prev => [...prev, `[done] Job completed in ${(result.duration_ms / 1000).toFixed(1)}s. ${result.rag_chunks_used} RAG chunks used. ${result.tokens_used} tokens.`]);
      setJobOutput(result.output);
      setRunMeta({
        ragChunks: result.rag_chunks_used,
        tokens: result.tokens_used,
        durationMs: result.duration_ms,
        brandBrain: result.brand_brain_injected,
      });
      toast.success(`${selectedJob.name} completed!`, {
        description: `${result.rag_chunks_used} RAG chunks · ${result.tokens_used} tokens · ${(result.duration_ms / 1000).toFixed(1)}s`,
      });
      // Refresh run history
      if (activeTab === "history" || wsId) loadRunHistory();
    } catch (err: any) {
      setProgress(0);
      setLogs(prev => [...prev, `[error] ${err.message}`]);
      toast.error(err.message || "Automation failed");
    } finally {
      setRunning(false);
    }
  };

  const loadRunHistory = async () => {
    if (!wsId) return;
    setLoadingHistory(true);
    const { data } = await supabase
      .from("automation_runs")
      .select("*")
      .eq("workspace_id", wsId)
      .order("created_at", { ascending: false })
      .limit(20);
    setRunHistory((data as RunRecord[]) || []);
    setLoadingHistory(false);
  };

  const loadSchedules = async () => {
    if (!wsId) return;
    const { data } = await supabase
      .from("automation_schedules")
      .select("*")
      .eq("workspace_id", wsId)
      .order("created_at", { ascending: false });
    setSchedules(data || []);
  };

  useEffect(() => {
    if (activeTab === "history") loadRunHistory();
    if (activeTab === "schedule") loadSchedules();
  }, [activeTab, wsId]);

  const saveSchedule = async () => {
    if (!wsId || !schedInput.trim() || !user) return;
    setSavingSchedule(true);
    const cronOpt = SCHEDULE_OPTIONS.find(o => o.value === schedFrequency);
    const { error } = await supabase.from("automation_schedules").insert({
      workspace_id: wsId,
      user_id: user.id,
      job_id: selectedJob.id,
      job_name: selectedJob.name,
      frequency: schedFrequency,
      cron_pattern: cronOpt?.cron,
      input_payload: { input: schedInput },
      enabled: true,
      next_run_at: new Date(Date.now() + 86400000).toISOString(),
    });
    setSavingSchedule(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Schedule created! This job will run automatically.");
    loadSchedules();
  };

  const executeScheduledJobs = async () => {
    if (!wsId) return;
    setExecutingSchedules(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/execute-scheduled-jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ workspaceId: wsId }),
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        throw new Error(result.error || "Execution failed");
      }

      if (result.processed === 0) {
        toast.info("No schedules due for execution right now.");
      } else {
        toast.success(`Executed ${result.processed} scheduled job(s)!`, {
          description: `${result.successful} succeeded. Next run dates computed automatically.`,
        });
      }
      loadSchedules();
      loadRunHistory();
    } catch (err: any) {
      toast.error(err.message || "Failed to execute schedules");
    } finally {
      setExecutingSchedules(false);
    }
  };

  const deleteSchedule = async (id: string) => {
    await supabase.from("automation_schedules").delete().eq("id", id);
    loadSchedules();
  };

  const toggleSchedule = async (id: string, enabled: boolean) => {
    await supabase.from("automation_schedules").update({ enabled: !enabled }).eq("id", id);
    loadSchedules();
  };

  const copyOutput = () => {
    if (!jobOutput) return;
    navigator.clipboard.writeText(jobOutput);
    toast.success("Output copied to clipboard");
  };

  const downloadOutput = () => {
    if (!jobOutput) return;
    const blob = new Blob([jobOutput], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedJob.id}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Output downloaded");
  };

  const filteredCatalog = categoryFilter === "all"
    ? AUTOMATIONS_CATALOG
    : AUTOMATIONS_CATALOG.filter(j => j.category === categoryFilter);

  const webhookUrl = wsId
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-automation`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="h-4 w-4 text-primary" />
            <p className="text-xs font-mono uppercase tracking-[0.25em] text-primary">/ Autonomous Jobs Engine 2.0</p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">On-Demand & Scheduled Automations</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Trigger autonomous AI workflows grounded in your Brand Brain & indexed Knowledge Base.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono py-1 px-2.5">
            1 Credit / Execution
          </Badge>
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 font-mono py-1 px-2.5">
            {AUTOMATIONS_CATALOG.length} Jobs Available
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Left: Job Catalog */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" /> Catalog ({filteredCatalog.length})
            </h3>
          </div>

          {/* Category Filter */}
          <div className="flex gap-1 flex-wrap">
            {["all", "growth", "strategy", "engineering", "ai", "outreach"].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all ${
                  categoryFilter === cat
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredCatalog.map((job) => {
              const isSelected = selectedJob.id === job.id;
              const Icon = job.icon;
              return (
                <div
                  key={job.id}
                  onClick={() => handleSelectJob(job)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-primary/10 border-primary shadow-glow ring-1 ring-primary/40"
                      : "glass hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      {job.name}
                    </h4>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">{job.turnaround}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed ml-5">{job.description}</p>
                  <div className="mt-2 ml-5">
                    <Badge variant="outline" className={`text-[9px] font-mono uppercase ${CATEGORY_COLORS[job.category]}`}>
                      {job.category}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          <Card className="glass p-4 border-border/50 text-xs text-muted-foreground flex items-center gap-2.5">
            <Brain className="h-4 w-4 text-primary shrink-0" />
            <span>All outputs inherit Brand Brain voice, mission, and palette rules automatically.</span>
          </Card>
        </div>

        {/* Right: Runner, Schedule, Webhook, History */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="glass">
              <TabsTrigger value="runner"><Play className="h-3.5 w-3.5 mr-1.5" />Run</TabsTrigger>
              <TabsTrigger value="schedule"><Calendar className="h-3.5 w-3.5 mr-1.5" />Schedule</TabsTrigger>
              <TabsTrigger value="webhook"><Webhook className="h-3.5 w-3.5 mr-1.5" />Webhook</TabsTrigger>
              <TabsTrigger value="history"><History className="h-3.5 w-3.5 mr-1.5" />Run History</TabsTrigger>
            </TabsList>

            {/* ===== RUN TAB ===== */}
            <TabsContent value="runner" className="mt-4">
              <Card className="glass-strong p-6 border-primary/20 space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-primary" /> {selectedJob.name}
                    </h3>
                    <span className="text-xs text-muted-foreground font-mono">Autonomous Execution Studio · {selectedJob.turnaround}</span>
                  </div>
                  <Button
                    onClick={runAutomation}
                    disabled={running || !promptInput.trim()}
                    className="bg-gradient-primary text-primary-foreground border-0 shadow-glow text-xs font-semibold px-5"
                  >
                    {running ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Running…</>
                    ) : (
                      <><Play className="h-3.5 w-3.5 mr-1.5 fill-current" />Run Automation</>
                    )}
                  </Button>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Job Context & Parameters
                  </label>
                  <Textarea
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="Enter parameters or instructions for this run..."
                    rows={3}
                    className="glass text-xs font-mono"
                  />
                </div>

                {/* Progress */}
                {running && (
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between text-xs font-mono text-primary">
                      <span>Executing Autonomous Pipeline...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                )}

                {/* Live Terminal */}
                {logs.length > 0 && (
                  <div ref={logsRef} className="rounded-xl p-3 bg-black/80 border border-border/60 font-mono text-[11px] text-green-400 space-y-0.5 max-h-36 overflow-y-auto">
                    {logs.map((log, i) => (
                      <div key={i} className={log.startsWith("[error]") ? "text-red-400" : log.startsWith("[done]") ? "text-cyan-400" : ""}>
                        {log}
                      </div>
                    ))}
                    {running && <div className="inline-block animate-pulse">▋</div>}
                  </div>
                )}

                {/* Run Metadata */}
                {runMeta && !running && (
                  <div className="flex gap-3 flex-wrap pt-1">
                    <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground bg-muted/20 px-2 py-1 rounded-full">
                      <Database className="h-3 w-3 text-primary" /> {runMeta.ragChunks} RAG chunks
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-full ${runMeta.brandBrain ? "bg-green-500/10 text-green-400" : "bg-muted/20 text-muted-foreground"}`}>
                      <Brain className="h-3 w-3" /> {runMeta.brandBrain ? "Brand Brain active" : "Brand Brain not configured"}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground bg-muted/20 px-2 py-1 rounded-full">
                      <Zap className="h-3 w-3 text-primary" /> {runMeta.tokens} tokens
                    </div>
                    <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground bg-muted/20 px-2 py-1 rounded-full">
                      <Clock className="h-3 w-3" /> {(runMeta.durationMs / 1000).toFixed(1)}s
                    </div>
                  </div>
                )}

                {/* Output */}
                {jobOutput && (
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-primary flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> Generated Deliverable
                      </span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={copyOutput} className="h-7 text-xs">
                          <Copy className="h-3 w-3 mr-1" />Copy
                        </Button>
                        <Button variant="ghost" size="sm" onClick={downloadOutput} className="h-7 text-xs">
                          <Download className="h-3 w-3 mr-1" />Download
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-xl p-4 bg-muted/20 border border-border/40 text-xs font-mono whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
                      {jobOutput}
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* ===== SCHEDULE TAB ===== */}
            <TabsContent value="schedule" className="mt-4">
              <Card className="glass-strong p-6 border-primary/20 space-y-5">
                <div>
                  <h3 className="font-semibold text-base flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-primary" /> Automated Job Scheduler
                  </h3>
                  <p className="text-xs text-muted-foreground">Schedule "{selectedJob.name}" to run automatically on a recurring basis.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1.5">Frequency</label>
                    <div className="flex gap-2">
                      {SCHEDULE_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setSchedFrequency(opt.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${schedFrequency === opt.value ? "bg-primary text-primary-foreground border-primary shadow-glow" : "border-border/50 text-muted-foreground hover:border-primary/40"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono mt-1">
                      Cron: {SCHEDULE_OPTIONS.find(o => o.value === schedFrequency)?.cron}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1.5">Recurring Job Context</label>
                    <Textarea
                      value={schedInput}
                      onChange={e => setSchedInput(e.target.value)}
                      placeholder="What should this recurring run focus on? E.g. 'Weekly product updates and feature announcements'"
                      rows={3}
                      className="glass text-xs font-mono"
                    />
                  </div>

                  <Button
                    onClick={saveSchedule}
                    disabled={savingSchedule || !schedInput.trim()}
                    className="bg-gradient-primary text-primary-foreground border-0 shadow-glow text-xs font-semibold"
                  >
                    {savingSchedule ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5 mr-1.5" />}
                    Schedule This Automation
                  </Button>
                </div>

                {schedules.length > 0 && (
                  <div className="pt-4 border-t border-border/40 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        Active Schedules ({schedules.length})
                      </h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={executeScheduledJobs}
                        disabled={executingSchedules}
                        className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
                      >
                        {executingSchedules ? (
                          <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Running Schedules…</>
                        ) : (
                          <><Play className="h-3 w-3 mr-1.5 fill-current" />Execute Due Schedules Now</>
                        )}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {schedules.map(sched => (
                        <div key={sched.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{sched.job_name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {sched.frequency} · {sched.run_count || 0} runs · {sched.enabled ? "Active" : "Paused"}
                              {sched.next_run_at && ` · Next: ${new Date(sched.next_run_at).toLocaleDateString()}`}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => toggleSchedule(sched.id, sched.enabled)} className="h-7 text-xs">
                              {sched.enabled ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteSchedule(sched.id)} className="h-7 text-xs text-destructive hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl p-3 bg-muted/15 border border-border/30 text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1.5 text-foreground font-medium">
                        <Clock className="h-3.5 w-3.5 text-primary" /> Automated Cron Webhook Trigger
                      </div>
                      <p className="text-[11px]">
                        To run recurring jobs automatically without logging in, trigger our automated endpoint via cron-job.org, Vercel Cron, or GitHub Actions:
                      </p>
                      <pre className="text-[10px] font-mono text-primary/80 overflow-x-auto p-1.5 bg-black/40 rounded border border-border/30">
                        {`POST ${import.meta.env.VITE_SUPABASE_URL}/functions/v1/execute-scheduled-jobs`}
                      </pre>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* ===== WEBHOOK TAB ===== */}
            <TabsContent value="webhook" className="mt-4">
              <Card className="glass-strong p-6 border-primary/20 space-y-5">
                <div>
                  <h3 className="font-semibold text-base flex items-center gap-2 mb-1">
                    <Globe className="h-4 w-4 text-primary" /> External Webhook Trigger Center
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Trigger any automation from external tools like Zapier, Make, n8n, or custom systems using a simple HTTP POST request.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1.5">Webhook Endpoint URL</label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={webhookUrl || "Sign in and set up a workspace to get your webhook URL"}
                        className="glass font-mono text-xs text-primary"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { if (webhookUrl) { navigator.clipboard.writeText(webhookUrl); toast.success("Webhook URL copied!"); } }}
                        className="shrink-0 border-primary/30"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/70 border border-border/60 p-4">
                    <p className="text-xs font-mono text-muted-foreground mb-2">Example cURL request:</p>
                    <pre className="text-[11px] font-mono text-green-400 whitespace-pre-wrap overflow-x-auto">{`curl -X POST "${webhookUrl || "YOUR_WEBHOOK_URL"}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \\
  -d '{
    "jobId": "${selectedJob.id}",
    "workspaceId": "${wsId || "YOUR_WORKSPACE_ID"}",
    "input": "Your job context and parameters here",
    "triggerType": "webhook"
  }'`}</pre>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { tool: "Zapier", desc: "Use the 'Webhooks by Zapier' action to trigger on any Zap event." },
                      { tool: "Make (Integromat)", desc: "Use an HTTP module with POST method in any Make scenario." },
                      { tool: "n8n", desc: "Use the HTTP Request node with POST body in any n8n workflow." },
                      { tool: "Custom Code", desc: "Any language: fetch/axios/requests — standard HTTP POST." },
                    ].map(item => (
                      <div key={item.tool} className="p-3 rounded-xl bg-muted/10 border border-border/40 text-xs">
                        <p className="font-semibold text-foreground mb-1">{item.tool}</p>
                        <p className="text-muted-foreground">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl p-3 bg-primary/5 border border-primary/20 flex items-start gap-2.5">
                    <Webhook className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground">
                      <span className="text-foreground font-medium">Outbound webhooks</span>: Configure your Zapier / Make / n8n endpoint in the{" "}
                      <span className="text-primary">Workspace → Integrations</span> tab to automatically receive completed job outputs.
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* ===== HISTORY TAB ===== */}
            <TabsContent value="history" className="mt-4">
              <Card className="glass-strong p-6 border-primary/20 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" /> Automation Run History
                  </h3>
                  <Button variant="ghost" size="sm" onClick={loadRunHistory} disabled={loadingHistory} className="h-7">
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingHistory ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                {loadingHistory ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : runHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>No runs yet. Execute your first automation above.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[480px] overflow-y-auto">
                    {runHistory.map(run => (
                      <div key={run.id} className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${run.status === "completed" ? "bg-green-400" : run.status === "running" ? "bg-primary animate-pulse" : "bg-red-400"}`} />
                            <span className="text-sm font-medium">{run.job_name}</span>
                            <Badge variant="outline" className="text-[10px] font-mono capitalize">
                              {run.trigger_type}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">{new Date(run.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex gap-3 flex-wrap text-[10px] font-mono text-muted-foreground">
                          <span className={run.brand_brain_injected ? "text-green-400" : ""}><Brain className="inline h-3 w-3 mr-0.5" />{run.brand_brain_injected ? "Brand Brain" : "No Brain"}</span>
                          <span><Database className="inline h-3 w-3 mr-0.5" />{run.rag_chunks_used} chunks</span>
                          <span><Zap className="inline h-3 w-3 mr-0.5" />{run.tokens_used} tokens</span>
                          <span><Clock className="inline h-3 w-3 mr-0.5" />{(run.duration_ms / 1000).toFixed(1)}s</span>
                          {run.webhook_dispatched && <span className="text-cyan-400"><Webhook className="inline h-3 w-3 mr-0.5" />Webhook sent</span>}
                        </div>
                        {run.output_content && (
                          <div className="mt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] text-muted-foreground px-2"
                              onClick={() => { navigator.clipboard.writeText(run.output_content!); toast.success("Output copied"); }}
                            >
                              <Copy className="h-3 w-3 mr-1" />Copy Output
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
