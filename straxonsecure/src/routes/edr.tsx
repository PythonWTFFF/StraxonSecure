import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Server,
  Activity,
  Terminal,
  Shield,
  ShieldAlert,
  Cpu,
  PowerOff,
  Zap,
  Lock,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import {
  analyzeProcess,
  getEDREndpoints,
  upsertEDREndpoint,
  deleteEDREndpoint,
  updateEndpointStatus,
  getProcessEvents,
} from "@/server/edr";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/edr")({
  head: () => ({
    meta: [{ title: "EDR Agents — Endpoint Detection — Straxon Secure" }],
  }),
  component: EDRPage,
});

type Endpoint = {
  id: string;
  hostname: string;
  ip_address: string;
  os: string;
  status: "healthy" | "suspicious" | "compromised" | "offline";
  last_seen: string;
  agent_version: string;
  tags: string[];
};

type ProcessEvent = {
  id: string;
  processName: string;
  commandLine: string;
  parentProcess: string;
  user: string;
  hash: string;
  timestamp: string;
  status: "running" | "killed";
  malicious?: boolean;
  endpointId?: string;
};

// ── Simulated live processes for selected endpoint ───────────────────────────

const ENDPOINT_PROCESSES: Record<string, ProcessEvent[]> = {
  suspicious: [
    {
      id: "p-1",
      processName: "explorer.exe",
      commandLine: "C:\\Windows\\explorer.exe",
      parentProcess: "userinit.exe",
      user: "DEV\\jdoe",
      hash: "a3f5b9c2d1e8f047",
      timestamp: "",
      status: "running",
    },
    {
      id: "p-2",
      processName: "powershell.exe",
      commandLine:
        "powershell.exe -nop -w hidden -EncodedCommand JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAAgAEkATwAuAE0AZQBtAG8AcgB5AFMAdAByAGUAYQBtACgAWwBDAG8AbgB2AGUAcgB0AF0AOgA6AEYAcgBvAG0AQgBhAHMAZQA2ADQAUwB0AHIAaQBuAGcAKAAiAEgA...",
      parentProcess: "winword.exe",
      user: "DEV\\jdoe",
      hash: "e5c7f1a9b3d2e8f0",
      timestamp: "",
      status: "running",
      malicious: true,
    },
    {
      id: "p-3",
      processName: "cmd.exe",
      commandLine: 'cmd.exe /c "net user /domain"',
      parentProcess: "powershell.exe",
      user: "DEV\\jdoe",
      hash: "c8a4e3f1b9d6e2a7",
      timestamp: "",
      status: "running",
      malicious: true,
    },
  ],
  healthy: [
    {
      id: "p-4",
      processName: "nginx",
      commandLine: "nginx -g 'daemon off;'",
      parentProcess: "systemd",
      user: "root",
      hash: "9b4c1a2f8d3e6c5a",
      timestamp: "",
      status: "running",
    },
    {
      id: "p-5",
      processName: "node",
      commandLine: "node /app/server.js",
      parentProcess: "bash",
      user: "app",
      hash: "7a3e9c1f5d2b8a6e",
      timestamp: "",
      status: "running",
    },
  ],
};

const STATUS_COLORS: Record<string, string> = {
  healthy: "text-success border-success/40",
  suspicious: "text-warning border-warning/40",
  compromised: "text-destructive border-destructive/40",
  offline: "text-muted-foreground border-border",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  healthy: <CheckCircle2 className="h-3.5 w-3.5 text-success" />,
  suspicious: <ShieldAlert className="h-3.5 w-3.5 text-warning animate-pulse" />,
  compromised: <AlertTriangle className="h-3.5 w-3.5 text-destructive" />,
  offline: <PowerOff className="h-3.5 w-3.5 text-muted-foreground" />,
};

// ── Add Endpoint Modal ────────────────────────────────────────────────────────

function AddEndpointModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: Omit<Endpoint, "id" | "last_seen" | "agent_version" | "tags">) => void;
}) {
  const [hostname, setHostname] = useState("");
  const [ip, setIp] = useState("");
  const [os, setOs] = useState("Linux (Ubuntu 22.04)");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-background border border-primary/30 rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold mb-4">Register Endpoint</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-muted-foreground">Hostname</label>
            <input
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              placeholder="e.g. srv-prod-db01"
              className="w-full mt-1 bg-black/40 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground">IP Address</label>
            <input
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="e.g. 10.0.4.52"
              className="w-full mt-1 bg-black/40 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-muted-foreground">Operating System</label>
            <select
              value={os}
              onChange={(e) => setOs(e.target.value)}
              className="w-full mt-1 bg-black/40 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
            >
              <option>Linux (Ubuntu 22.04)</option>
              <option>Linux (Alpine)</option>
              <option>Linux (CentOS 9)</option>
              <option>Windows 11 Enterprise</option>
              <option>Windows Server 2022</option>
              <option>macOS Sonoma</option>
              <option>Unknown</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <CyberButton
            variant="cyan"
            className="flex-1"
            disabled={!hostname.trim() || !ip.trim()}
            onClick={() => {
              onSave({ hostname: hostname.trim(), ip_address: ip.trim(), os, status: "healthy" });
              onClose();
            }}
          >
            Register Agent
          </CyberButton>
          <CyberButton variant="ghost" onClick={onClose}>
            Cancel
          </CyberButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── EDR Main Page ─────────────────────────────────────────────────────────────

function EDRPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [processes, setProcesses] = useState<ProcessEvent[]>([]);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isolating, setIsolating] = useState(false);

  // ── Load endpoints from DB ─────────────────────────────────────────────────
  const loadEndpoints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEDREndpoints();
      const eps = (res.endpoints ?? []) as unknown as Endpoint[];
      setEndpoints(eps);
      if (eps.length > 0 && !selectedEndpoint) {
        setSelectedEndpoint(eps[0]);
      }
    } catch (e: any) {
      toast.error("Failed to load endpoints: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEndpoints();
  }, [loadEndpoints]);

  // ── Simulate live processes for selected endpoint ──────────────────────────
  useEffect(() => {
    if (!selectedEndpoint) return;
    const template =
      selectedEndpoint.status === "suspicious" || selectedEndpoint.status === "compromised"
        ? ENDPOINT_PROCESSES.suspicious
        : ENDPOINT_PROCESSES.healthy;
    setProcesses(
      template.map((p) => ({
        ...p,
        id: p.id + "-" + selectedEndpoint.id,
        timestamp: new Date().toLocaleTimeString(),
        endpointId: selectedEndpoint.id,
      })),
    );
    setAnalysisResult(null);
  }, [selectedEndpoint?.id]);

  // ── Analyze process with AI ────────────────────────────────────────────────
  const handleAnalyze = async (proc: ProcessEvent) => {
    setAnalyzingId(proc.id);
    setAnalysisResult(null);
    try {
      const res = await analyzeProcess({
        data: {
          endpointId: proc.endpointId,
          processName: proc.processName,
          commandLine: proc.commandLine,
          parentProcess: proc.parentProcess,
          user: proc.user,
          hash: proc.hash,
        },
      });
      setAnalysisResult(res.analysis);

      // If threat found, refresh endpoint list to pick up status change
      const tl = res.threat_level as string;
      if (tl === "critical" || tl === "high") {
        await loadEndpoints();
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to analyze process");
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleKill = (id: string) => {
    setProcesses((prev) => prev.map((p) => (p.id === id ? { ...p, status: "killed" } : p)));
    toast.success("SIGKILL sent to process.");
  };

  // ── Isolate host ───────────────────────────────────────────────────────────
  const handleIsolate = async () => {
    if (!selectedEndpoint) return;
    setIsolating(true);
    try {
      await updateEndpointStatus({
        data: { endpointId: selectedEndpoint.id, status: "offline" },
      });
      toast.success(`🔒 ${selectedEndpoint.hostname} isolated from network`);
      await loadEndpoints();
      setSelectedEndpoint((prev) => (prev ? { ...prev, status: "offline" } : null));
    } catch (e: any) {
      toast.error("Failed to isolate: " + e.message);
    } finally {
      setIsolating(false);
    }
  };

  // ── Add endpoint ───────────────────────────────────────────────────────────
  const handleAddEndpoint = async (data: {
    hostname: string;
    ip_address: string;
    os: string;
    status: Endpoint["status"];
  }) => {
    try {
      await upsertEDREndpoint({ data });
      toast.success(`Agent registered: ${data.hostname}`);
      await loadEndpoints();
    } catch (e: any) {
      toast.error("Failed to register agent: " + e.message);
    }
  };

  // ── Delete endpoint ────────────────────────────────────────────────────────
  const handleDeleteEndpoint = async (id: string) => {
    try {
      await deleteEDREndpoint({ data: { endpointId: id } });
      toast.info("Endpoint removed");
      setEndpoints((prev) => prev.filter((ep) => ep.id !== id));
      if (selectedEndpoint?.id === id) setSelectedEndpoint(null);
    } catch (e: any) {
      toast.error("Failed to remove: " + e.message);
    }
  };

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <SectionHeading
          eyebrow="// ENDPOINT SECURITY"
          title="EDR Agent Telemetry"
          description="Monitor live process executions across your fleet. AI-powered analysis detects LOLBins, ransomware, and lateral movement."
        />
        <div className="flex gap-2">
          <CyberButton variant="ghost" onClick={loadEndpoints} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </CyberButton>
          <CyberButton variant="cyan" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" /> Add Endpoint
          </CyberButton>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <AddEndpointModal onClose={() => setShowAddModal(false)} onSave={handleAddEndpoint} />
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* ENDPOINT LIST */}
        <div className="lg:col-span-3 space-y-3">
          <h3 className="font-mono text-xs uppercase text-muted-foreground flex items-center gap-2">
            <Server className="h-4 w-4" /> Active Agents ({endpoints.length})
          </h3>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs p-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : endpoints.length === 0 ? (
            <CyberCard variant="plain" className="text-center py-6">
              <Server className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-xs font-mono text-muted-foreground">No endpoints registered</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-3 text-xs font-mono text-primary hover:underline"
              >
                + Add first endpoint
              </button>
            </CyberCard>
          ) : (
            <div className="space-y-2">
              {endpoints.map((ep) => (
                <div key={ep.id} className="group relative">
                  <button
                    onClick={() => {
                      setSelectedEndpoint(ep);
                      setAnalysisResult(null);
                    }}
                    className={`w-full text-left p-3 rounded-lg border font-mono transition-all ${
                      selectedEndpoint?.id === ep.id
                        ? "bg-primary/20 border-primary"
                        : "bg-black/40 border-border/50 hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-foreground truncate">
                        {ep.hostname}
                      </span>
                      {STATUS_ICONS[ep.status]}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {ep.ip_address} • {ep.os.split(" ")[0]}
                    </div>
                    <div
                      className={`text-[10px] font-mono mt-1 ${STATUS_COLORS[ep.status] || "text-muted-foreground"}`}
                    >
                      {ep.status.toUpperCase()}
                    </div>
                  </button>
                  <button
                    onClick={() => handleDeleteEndpoint(ep.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PROCESS TELEMETRY */}
        <div className="lg:col-span-9 space-y-6">
          {selectedEndpoint ? (
            <CyberCard
              variant={
                selectedEndpoint.status === "suspicious" ||
                selectedEndpoint.status === "compromised"
                  ? "magenta"
                  : "cyan"
              }
            >
              <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-4">
                <div className="flex items-center gap-3">
                  <Cpu className="h-5 w-5 text-primary" />
                  <div>
                    <h2 className="font-display text-lg font-bold">{selectedEndpoint.hostname}</h2>
                    <p className="text-xs font-mono text-muted-foreground">
                      {selectedEndpoint.ip_address} • {selectedEndpoint.os} • Agent v
                      {selectedEndpoint.agent_version}
                    </p>
                  </div>
                </div>
                <CyberButton
                  variant="danger"
                  size="sm"
                  onClick={handleIsolate}
                  disabled={isolating || selectedEndpoint.status === "offline"}
                >
                  {isolating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  {selectedEndpoint.status === "offline" ? "ISOLATED" : "ISOLATE HOST"}
                </CyberButton>
              </div>

              <div className="space-y-3">
                {processes.map((proc) => (
                  <div
                    key={proc.id}
                    className={`p-4 rounded border bg-black/60 relative overflow-hidden ${
                      proc.status === "killed"
                        ? "opacity-50 border-border"
                        : proc.malicious
                          ? "border-warning/50 bg-warning/5"
                          : "border-primary/20"
                    }`}
                  >
                    {proc.malicious && proc.status !== "killed" && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-warning animate-pulse" />
                    )}

                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-primary" />
                          <span className="font-mono text-sm font-bold text-foreground">
                            {proc.processName}
                          </span>
                          {proc.malicious && (
                            <span className="px-2 py-0.5 bg-warning/20 text-warning text-[10px] font-mono rounded">
                              SUSPICIOUS
                            </span>
                          )}
                          {proc.status === "killed" && (
                            <span className="px-2 py-0.5 bg-destructive/20 text-destructive text-[10px] font-mono rounded">
                              TERMINATED
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground mt-1">
                          Parent: {proc.parentProcess} • User: {proc.user}
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground/60">
                        {proc.timestamp}
                      </div>
                    </div>

                    <div className="bg-[#020610] p-2 rounded text-xs font-mono text-slate-300 break-all mb-4 border border-white/5">
                      <span className="text-primary/50 mr-2">$</span>
                      {proc.commandLine}
                    </div>

                    <div className="flex items-center gap-2">
                      <CyberButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAnalyze(proc)}
                        disabled={analyzingId === proc.id || proc.status === "killed"}
                      >
                        {analyzingId === proc.id ? (
                          <Activity className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4 mr-2 text-primary" />
                        )}
                        Analyze with AI
                      </CyberButton>
                      {proc.status !== "killed" && (
                        <button
                          onClick={() => handleKill(proc.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-destructive hover:bg-destructive/20 transition-colors"
                        >
                          <PowerOff className="h-3.5 w-3.5" /> Kill Process
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CyberCard>
          ) : (
            <CyberCard variant="cyan" className="text-center py-20">
              <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <p className="font-mono text-sm text-muted-foreground">
                {endpoints.length === 0
                  ? "Register an endpoint to start monitoring"
                  : "Select an endpoint from the list"}
              </p>
            </CyberCard>
          )}

          {/* AI ANALYSIS RESULTS */}
          <AnimatePresence>
            {analysisResult && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <CyberCard variant="plain" className="border-accent/50 bg-accent/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-5 w-5 text-accent" />
                    <h3 className="font-display text-lg font-bold text-accent">
                      Straxon EDR Intelligence
                    </h3>
                  </div>
                  <div className="prose prose-sm prose-invert max-w-none prose-headings:text-accent prose-headings:font-mono prose-headings:text-sm prose-strong:text-white prose-li:text-slate-300">
                    <ReactMarkdown>{analysisResult}</ReactMarkdown>
                  </div>
                </CyberCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
