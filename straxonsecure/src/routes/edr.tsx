import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { CyberCard } from "@/components/cyber/CyberCard";
import {
  Server,
  ShieldAlert,
  Activity,
  PowerOff,
  Lock,
  TerminalSquare,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/edr")({
  component: AgentDashboard,
});

type Agent = {
  agent_id: string;
  hostname: string;
  os: string;
  last_seen: number;
  risk_score: number;
};

type ProcessEvent = {
  id: string;
  processName: string;
  commandLine: string;
  agent_id: string;
  hostname: string;
  severity: "low" | "medium" | "high" | "critical";
  type: string;
  timestamp: number;
};

function AgentDashboard() {
  const [liveFeed, setLiveFeed] = useState<ProcessEvent[]>([]);
  const { limits } = useSubscription();
  const { session } = useAuth();
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Poll for agents list using TanStack Query
  const { data: agents = [] } = useQuery({
    queryKey: ["edr-agents"],
    queryFn: async () => {
      const rawUrl = import.meta.env.VITE_ML_ENGINE_URL || "http://127.0.0.1:8082";
      const res = await fetch(`${rawUrl}/api/ml/agents`);
      if (!res.ok) throw new Error("Failed to fetch agents");
      const data = await res.json();
      return data.agents || [];
    },
    refetchInterval: 5000, // Poll every 5s
  });

  // WebSocket for Live Telemetry
  useEffect(() => {
    if (!session?.access_token) return;

    const rawUrl = import.meta.env.VITE_ML_ENGINE_URL || "http://127.0.0.1:8082";
    const wsUrl =
      rawUrl.replace("http://", "ws://").replace("https://", "wss://") + "/api/ml/edr-stream";

    const ws = new WebSocket(wsUrl, ["supabase", session.access_token]);

    ws.onopen = () => {
      console.log("[EDR] Connected to telemetry stream");
      toast.success("Live EDR Stream Connected", {
        description: "Ingesting real-time process telemetry from agents.",
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.processName && data.agent_id) {
          setLiveFeed((prev) => {
            const updated = [...prev, { ...data, timestamp: Date.now() }];
            return updated.slice(-100); // Keep last 100 events
          });
        }
      } catch (e) {
        console.error("Failed to parse WS msg", e);
      }
    };

    ws.onerror = (err) => console.error("[EDR] WS Error:", err);
    ws.onclose = () => console.log("[EDR] WS Closed");

    return () => {
      ws.close();
    };
  }, [session?.access_token]);

  // Auto-scroll feed
  useEffect(() => {
    if (feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [liveFeed]);

  const allowedAgents = agents.slice(0, limits.max_edr_hosts);
  const exceededCount = Math.max(0, agents.length - limits.max_edr_hosts);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
          <Server className="h-6 w-6 text-teal-500" />
        </div>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold text-white tracking-wide">
            Endpoint Detection & Response
          </h1>
          <p className="font-mono text-xs text-slate-400 mt-1 uppercase tracking-widest">
            Agent Management & Live Telemetry
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Agents */}
        <div className="lg:col-span-2 space-y-6">
          {agents.length === 0 ? (
            <CyberCard className="p-12 flex flex-col items-center justify-center text-center bg-[#020610] h-64">
              <Activity className="h-12 w-12 text-slate-600 mb-4 animate-pulse" />
              <h3 className="font-mono text-lg text-slate-300 mb-2">No Active Agents</h3>
              <p className="text-sm text-slate-500 max-w-md">
                Download the Bash EDR agent and run it on your local machine to register an
                endpoint.
              </p>
              <div className="mt-6 bg-black/40 border border-white/5 p-4 rounded font-mono text-xs text-teal-400">
                ./straxon-agent.sh API_KEY
              </div>
            </CyberCard>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {allowedAgents.map((agent: any) => (
                <CyberCard
                  key={agent.agent_id}
                  variant={agent.risk_score > 5 ? "magenta" : "teal"}
                  className="p-5 bg-[#020610] flex flex-col gap-4"
                >
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span
                          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${agent.risk_score > 5 ? "bg-fuchsia-400" : "bg-teal-400"}`}
                        ></span>
                        <span
                          className={`relative inline-flex rounded-full h-2 w-2 ${agent.risk_score > 5 ? "bg-fuchsia-500" : "bg-teal-500"}`}
                        ></span>
                      </span>
                      <span className="font-mono font-bold text-white tracking-widest">
                        {agent.hostname}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-mono text-[10px] border px-2 py-0.5 rounded uppercase ${agent.risk_score > 5 ? "text-fuchsia-500 border-fuchsia-500/30 bg-fuchsia-500/10" : "text-teal-500 border-teal-500/30 bg-teal-500/10"}`}
                      >
                        {agent.os}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 border border-white/5 rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert className="h-4 w-4 text-slate-400" />
                        <span className="font-mono text-[10px] text-slate-500 uppercase">
                          Risk Score
                        </span>
                      </div>
                      <div className="flex items-end gap-2">
                        <span
                          className={`font-display text-2xl font-bold ${agent.risk_score > 5 ? "text-fuchsia-400" : "text-teal-400"}`}
                        >
                          {agent.risk_score.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-black/40 border border-white/5 rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-slate-400" />
                        <span className="font-mono text-[10px] text-slate-500 uppercase">
                          Last Seen
                        </span>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className="font-mono text-sm text-slate-300">
                          {Math.max(0, Math.floor(Date.now() / 1000 - agent.last_seen))}s ago
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between items-center text-xs font-mono text-slate-500">
                    <span>ID: {agent.agent_id.slice(0, 8)}...</span>
                    <button
                      onClick={() => toast.success("Isolate command queued (mock)")}
                      className="flex items-center gap-1 font-mono text-[10px] text-red-500 border border-red-500/30 bg-red-500/10 px-2 py-0.5 rounded uppercase hover:bg-red-500/30 transition-colors"
                    >
                      <PowerOff className="h-3 w-3" /> Isolate Host
                    </button>
                  </div>
                </CyberCard>
              ))}

              {exceededCount > 0 && (
                <CyberCard
                  variant="plain"
                  className="p-8 flex flex-col items-center justify-center text-center bg-black/50 border-dashed border-white/20"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-white mb-2">
                    Host Limit Reached
                  </h3>
                  <p className="text-sm text-slate-400 max-w-sm mb-6">
                    {exceededCount} additional agent{exceededCount > 1 ? "s" : ""} attempting to
                    connect.
                  </p>
                  <Link to="/pricing">
                    <button className="bg-primary text-black font-mono font-bold text-sm px-6 py-2 rounded shadow-[0_0_15px_rgba(0,243,255,0.4)] hover:shadow-[0_0_25px_rgba(0,243,255,0.6)] transition-all">
                      UPGRADE
                    </button>
                  </Link>
                </CyberCard>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Telemetry Matrix Feed */}
        <div className="lg:col-span-1 h-[600px] flex flex-col">
          <CyberCard className="flex-1 flex flex-col overflow-hidden bg-[#020610]">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <TerminalSquare className="h-4 w-4 text-teal-500" />
                <h3 className="font-display font-bold text-white tracking-wide">LIVE TELEMETRY</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                <span className="text-[10px] font-mono text-teal-500 uppercase">Streaming</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[10px] bg-black/60 custom-scrollbar">
              {liveFeed.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                  <Activity className="h-8 w-8 animate-pulse opacity-50" />
                  <p>Awaiting process execution events...</p>
                </div>
              ) : (
                liveFeed.map((ev, i) => {
                  const isAlert = ev.severity === "high" || ev.severity === "critical";
                  return (
                    <div
                      key={ev.id + i}
                      className={`p-2 rounded border border-white/5 bg-black/40 transition-all duration-300 animate-in fade-in slide-in-from-right-4 ${isAlert ? "border-fuchsia-500/30" : "border-teal-500/10"}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span
                          className={`font-bold ${isAlert ? "text-fuchsia-400" : "text-teal-400"}`}
                        >
                          {ev.processName}
                        </span>
                        <span className="text-slate-500">
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-slate-400 truncate mb-1" title={ev.commandLine}>
                        <span className="text-slate-600 mr-1">$</span>
                        {ev.commandLine}
                      </div>
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="text-slate-500">{ev.hostname}</span>
                        {isAlert && (
                          <span className="flex items-center gap-1 text-fuchsia-500 bg-fuchsia-500/10 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            {ev.type.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={feedEndRef} />
            </div>
          </CyberCard>
        </div>
      </div>
    </div>
  );
}
