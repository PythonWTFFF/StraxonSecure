import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { PremiumGate } from "@/components/PremiumGate";
import {
  Globe,
  Search,
  ShieldAlert,
  Zap,
  Network,
  Activity,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { callAuthed } from "@/lib/serverCall";
import { getTargets, addTarget, getFindings } from "@/server/easm";

export const Route = createFileRoute("/easm")({
  head: () => ({
    meta: [
      { title: "EASM | External Attack Surface — Straxon Secure" },
      { name: "description", content: "Discover exposed assets, subdomains, and open ports." },
    ],
  }),
  component: EASMDashboard,
});

function EASMDashboard() {
  const { user } = useAuth();
  const [targets, setTargets] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<any | null>(null);
  const [findings, setFindings] = useState<any[]>([]);

  const [newDomain, setNewDomain] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isLoadingFindings, setIsLoadingFindings] = useState(false);

  useEffect(() => {
    if (user) loadTargets();
  }, [user]);

  useEffect(() => {
    if (selectedTarget) {
      loadFindings(selectedTarget.id);

      // Poll findings if it's currently scanning
      let interval: any;
      if (selectedTarget.status === "scanning" || selectedTarget.status === "pending") {
        interval = setInterval(() => {
          loadTargets(false); // Silent reload
          loadFindings(selectedTarget.id, false);
        }, 5000);
      }
      return () => clearInterval(interval);
    }
  }, [selectedTarget]);

  const loadTargets = async (showLoading = true) => {
    try {
      const data = await callAuthed(getTargets, undefined);
      setTargets(data || []);

      // Update selected target status if it changed
      if (selectedTarget) {
        const updated = data.find((t: any) => t.id === selectedTarget.id);
        if (updated && updated.status !== selectedTarget.status) {
          setSelectedTarget(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadFindings = async (targetId: string, showLoading = true) => {
    if (showLoading) setIsLoadingFindings(true);
    try {
      const data = await callAuthed(getFindings, { targetId });
      setFindings(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingFindings(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    setIsAdding(true);
    try {
      const target = await callAuthed(addTarget, { domain: newDomain.trim() });
      setTargets([target, ...targets]);
      setSelectedTarget(target);
      setNewDomain("");
      toast.success("Domain added! Recon initiated.");
    } catch (e: any) {
      toast.error(e.message || "Failed to add domain");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <SectionHeading
        eyebrow="// OSINT RECON"
        title="External Attack Surface"
        description="Discover unmanaged assets, exposed ports, and subdomains tied to your infrastructure."
      />

      <PremiumGate
        feature="EASM Recon Engine"
        description="Pro unlocks continuous OSINT mapping, certificate transparency scanning, and active port fingerprinting."
      >
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Sidebar: Target List */}
          <div className="lg:col-span-1 space-y-4">
            <CyberCard variant="plain" className="p-4">
              <form onSubmit={handleAddDomain} className="flex gap-2">
                <input
                  type="text"
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm font-mono outline-none focus:border-[#00f3ff]"
                />
                <button
                  type="submit"
                  disabled={isAdding}
                  className="bg-[#00f3ff]/20 text-[#00f3ff] px-3 rounded hover:bg-[#00f3ff]/30 transition-colors flex items-center justify-center"
                >
                  {isAdding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </button>
              </form>
            </CyberCard>

            <div className="space-y-2">
              <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest pl-1">
                Tracked Domains
              </h3>
              {targets.length === 0 ? (
                <div className="text-xs text-slate-500 font-mono italic p-4 text-center">
                  No targets added yet
                </div>
              ) : (
                targets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTarget(t)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group ${
                      selectedTarget?.id === t.id
                        ? "bg-[#00f3ff]/10 border-[#00f3ff]/50"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Globe
                        className={`h-4 w-4 ${selectedTarget?.id === t.id ? "text-[#00f3ff]" : "text-slate-400"}`}
                      />
                      <span className="font-mono text-sm truncate max-w-[140px] text-slate-200">
                        {t.domain}
                      </span>
                    </div>
                    {t.status === "scanning" && (
                      <Activity className="h-3 w-3 text-yellow-400 animate-pulse" />
                    )}
                    {t.status === "completed" && <ShieldCheck className="h-3 w-3 text-green-400" />}
                    {t.status === "failed" && <ShieldAlert className="h-3 w-3 text-red-400" />}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Area: Findings Dashboard */}
          <div className="lg:col-span-3">
            {!selectedTarget ? (
              <div className="h-[500px] border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-500 space-y-4">
                <Network className="h-12 w-12 opacity-50" />
                <p className="font-mono text-sm">
                  Select or add a domain to view the attack surface
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Target Header */}
                <CyberCard
                  variant={selectedTarget.status === "scanning" ? "cyan" : "plain"}
                  className="p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                        {selectedTarget.domain}
                      </h2>
                      <p className="text-slate-400 text-sm mt-1 font-mono">
                        Status:{" "}
                        <span
                          className={
                            selectedTarget.status === "scanning"
                              ? "text-yellow-400 animate-pulse"
                              : selectedTarget.status === "completed"
                                ? "text-green-400"
                                : "text-slate-400"
                          }
                        >
                          {selectedTarget.status.toUpperCase()}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-mono text-[#00f3ff]">{findings.length}</div>
                      <div className="text-xs text-slate-500 uppercase tracking-widest">
                        Assets Discovered
                      </div>
                    </div>
                  </div>
                </CyberCard>

                {/* Findings Grid */}
                {isLoadingFindings ? (
                  <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#00f3ff]" />
                  </div>
                ) : findings.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 font-mono text-sm border border-dashed border-white/10 rounded-xl">
                    {selectedTarget.status === "scanning"
                      ? "Recon in progress... discovering assets..."
                      : "No exposed assets found."}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {findings.map((f) => (
                      <div
                        key={f.id}
                        className="p-4 rounded-lg bg-black/40 border border-white/10 relative group hover:border-white/20 transition-colors"
                      >
                        {/* Severity Indicator */}
                        <div
                          className={`absolute top-0 left-0 w-1 h-full rounded-l-lg ${
                            f.severity === "critical"
                              ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                              : f.severity === "high"
                                ? "bg-orange-500"
                                : f.severity === "medium"
                                  ? "bg-yellow-500"
                                  : f.severity === "low"
                                    ? "bg-blue-400"
                                    : "bg-slate-600"
                          }`}
                        />

                        <div className="pl-3 flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase">
                            {f.finding_type === "subdomain" && (
                              <Globe className="h-3 w-3 text-blue-400" />
                            )}
                            {f.finding_type === "open_port" && (
                              <Zap className="h-3 w-3 text-yellow-400" />
                            )}
                            {f.finding_type}
                          </div>
                          <div className="font-mono text-sm text-slate-200 truncate break-all">
                            {f.value}
                          </div>

                          {f.finding_type === "open_port" && f.details && (
                            <div className="mt-2 text-[10px] text-slate-500 font-mono">
                              Port {f.details.port} open on {f.details.host}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </PremiumGate>
    </div>
  );
}
