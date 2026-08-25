import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { Search, Eye, AlertTriangle, ShieldAlert, Download, Ghost } from "lucide-react";
import { toast } from "sonner";
import { callAuthed } from "@/lib/serverCall";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/darkweb")({
  component: DarkWebMonitor,
});

function DarkWebMonitor() {
  const [query, setQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setIsScanning(true);
    setResults(null);

    try {
      const mlUrl = import.meta.env.VITE_ML_ENGINE_URL || "http://localhost:8082";
      const res = await fetch(`${mlUrl}/api/ml/darkweb-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResults(data);
      toast.error(`Scan complete. Critical exposures found for ${query}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to query Dark Web intelligence feeds.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveReport = async () => {
    if (!results) return;
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await (supabase as any).from("reports").insert({
        user_id: userData.user.id,
        title: `Dark Web Scan: ${query}`,
        report_type: "darkweb_scan",
        content: results,
      });
      if (error) throw error;
      toast.success("Report safely stored in your SOC database.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save report to database.");
    }
  };

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-500/20">
            <Ghost className="h-6 w-6 text-fuchsia-500" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold text-white tracking-wide">
              Dark Web Monitor
            </h1>
            <p className="font-mono text-xs text-slate-400 mt-1 uppercase tracking-widest">
              Threat Intelligence & Credential Leak Tracking
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSaveReport}
            disabled={!results}
            className="print-hidden flex items-center gap-2 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-400 border border-fuchsia-500/50 px-4 py-2 rounded text-sm font-mono transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Save to Database
          </button>
          <button
            onClick={() => window.print()}
            disabled={!results}
            className="print-hidden flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 text-white border border-white/10 px-4 py-2 rounded text-sm font-mono transition-colors disabled:opacity-50"
          >
            <Eye className="h-4 w-4" /> Print PDF
          </button>
        </div>
      </div>

      <CyberCard variant="magenta" className="p-8">
        <form onSubmit={handleScan} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter corporate domain (e.g. straxon.io) or VIP email..."
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-12 pr-4 py-4 text-white font-mono outline-none focus:border-fuchsia-500/50 transition-colors"
            />
          </div>
          <CyberButton
            type="submit"
            variant="primary"
            loading={isScanning}
            className="px-8 bg-fuchsia-500 hover:bg-fuchsia-600 shadow-[0_0_15px_rgba(217,70,239,0.4)] border-none"
          >
            {isScanning ? "SCANNING DEEP WEB..." : "INITIATE SCAN"}
          </CyberButton>
        </form>
      </CyberCard>

      {results && (
        <div className="grid lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-2 space-y-6">
            <CyberCard variant="plain" className="p-6 border-red-500/20 bg-red-500/5">
              <div className="flex items-center gap-3 mb-6 border-b border-red-500/10 pb-4">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                <h3 className="font-mono font-bold text-red-400 uppercase tracking-widest">
                  Exposed Credentials
                </h3>
              </div>

              <div className="space-y-4">
                {results.breaches.map((breach: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-black/40 border border-white/5 p-4 rounded flex items-center justify-between hover:border-red-500/30 transition-colors group"
                  >
                    <div>
                      <h4 className="font-bold text-white font-mono group-hover:text-red-400 transition-colors">
                        {breach.source}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        Exposed: {breach.exposed.join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-slate-500">{breach.date}</div>
                      <div className="text-[10px] uppercase font-bold tracking-widest mt-1 text-red-500 bg-red-500/10 px-2 py-0.5 rounded inline-block">
                        {breach.severity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CyberCard>
          </div>

          <div className="space-y-6">
            <CyberCard variant="plain" className="p-6">
              <h3 className="font-mono text-xs text-slate-400 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">
                Threat Actors Tracking
              </h3>
              {results.threat_actors.length > 0 ? (
                <div className="space-y-3">
                  {results.threat_actors.map((actor: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-black/40 rounded border border-white/5"
                    >
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="font-mono text-sm text-slate-200">{actor}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-mono text-slate-500 italic">
                  No specific APT groups identified for this query.
                </p>
              )}
            </CyberCard>

            <CyberCard variant="teal" className="p-6">
              <h3 className="font-mono text-xs text-slate-400 uppercase tracking-widest mb-4 border-b border-white/10 pb-2">
                Remediation Actions
              </h3>
              <ul className="text-sm font-mono text-slate-300 space-y-3">
                <li className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded-full border border-teal-500 text-teal-500 flex items-center justify-center text-[10px] mt-0.5">
                    1
                  </div>
                  Force password resets for all exposed accounts.
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded-full border border-teal-500 text-teal-500 flex items-center justify-center text-[10px] mt-0.5">
                    2
                  </div>
                  Enforce strict MFA policies across the domain.
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-4 w-4 rounded-full border border-teal-500 text-teal-500 flex items-center justify-center text-[10px] mt-0.5">
                    3
                  </div>
                  Deploy EDR agents to monitor for lateral movement using compromised creds.
                </li>
              </ul>
            </CyberCard>
          </div>
        </div>
      )}
    </div>
  );
}
