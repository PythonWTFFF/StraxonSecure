import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { Server, Activity, Play, Globe } from "lucide-react";
import { toast } from "sonner";
import { SectionHeading } from "@/components/cyber/SectionHeading";

export const Route = createFileRoute("/labs/juiceshop")({
  component: JuiceShopLab,
});

function JuiceShopLab() {
  const [port, setPort] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startLab = async () => {
    setLoading(true);
    toast.info("Spinning up isolated Docker container...");
    try {
      const rawUrl = import.meta.env.VITE_ML_ENGINE_URL || "http://localhost:8082";
      const res = await fetch(`${rawUrl}/api/ml/lab/juiceshop`, { method: "POST" });
      const data = await res.json();

      if (data.status === "running") {
        setPort(data.port);
        toast.success(`Lab initialized on port ${data.port}!`);
      } else {
        toast.error(`Failed: ${data.message}`);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to communicate with ML Engine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <SectionHeading
        title="Web Vulnerability Lab"
        eyebrow="OWASP Juice Shop"
        description="Exploit real-world web vulnerabilities in an isolated containerized environment."
      />

      {!port ? (
        <CyberCard className="p-12 flex flex-col items-center justify-center text-center bg-[#020610]">
          <div className="h-16 w-16 rounded-full bg-fuchsia-500/10 flex items-center justify-center border border-fuchsia-500/20 mb-6">
            <Server className="h-8 w-8 text-fuchsia-500" />
          </div>
          <h3 className="font-display text-2xl font-bold text-white mb-2">
            Initialize Target Environment
          </h3>
          <p className="text-sm text-slate-400 max-w-md mb-8">
            This will instruct the backend to dynamically spawn a new, isolated OWASP Juice Shop
            Docker container and map an ephemeral port for you to attack.
          </p>
          <button
            onClick={startLab}
            disabled={loading}
            className="flex items-center gap-2 bg-fuchsia-500 text-black font-mono font-bold text-sm px-8 py-3 rounded hover:bg-fuchsia-400 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Activity className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            {loading ? "SPINNING UP..." : "LAUNCH LAB"}
          </button>
        </CyberCard>
      ) : (
        <CyberCard className="p-1 h-[800px] border-fuchsia-500/30 overflow-hidden relative group">
          <div className="absolute top-2 right-2 bg-black/80 px-3 py-1 rounded text-xs font-mono text-fuchsia-400 border border-fuchsia-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
            Port mapping: 0.0.0.0:{port} -{">"} 3000
          </div>
          <iframe
            src={`http://localhost:${port}`}
            className="w-full h-full rounded bg-white"
            title="Juice Shop Environment"
          />
        </CyberCard>
      )}
    </div>
  );
}
