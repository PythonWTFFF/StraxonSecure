import { createFileRoute } from "@tanstack/react-router";
import { ShieldOff, Activity, AlertTriangle } from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { CyberButton } from "@/components/cyber/CyberButton";
import { startLabSession } from "@/server/labs";
import { callAuthed } from "@/lib/serverCall";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/labs/ransomware")({
  component: RansomwareLab,
});

function RansomwareLab() {
  const [loading, setLoading] = useState(false);
  const [container, setContainer] = useState<any>(null);

  const startLab = async () => {
    setLoading(true);
    try {
      const res = await callAuthed(startLabSession, { labId: "ransomware", mode: "ctf" });
      setContainer(res);
      toast.success("Ransomware Execution Commenced!");
    } catch (e: any) {
      toast.error(e.message || "Failed to launch lab");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <SectionHeading
        eyebrow="// LAB-14"
        title="Ransomware Containment"
        description="Detect and contain a live ransomware outbreak before encryption completes."
      />

      <div className="grid lg:grid-cols-2 gap-8">
        <CyberCard variant="cyan" className="p-6">
          <h2 className="font-display text-2xl text-white mb-4 flex items-center gap-2">
            <ShieldOff className="text-[#00f3ff]" /> Live Outbreak
          </h2>
          <p className="text-slate-400 font-mono text-sm leading-relaxed mb-6">
            This environment will spawn a container executing a simulated ransomware strain. You
            must use EDR telemetry to kill the process and retrieve the decryption key.
          </p>
          {!container ? (
            <CyberButton variant="cyan" onClick={startLab} disabled={loading}>
              {loading ? "Executing Payload..." : "Execute Ransomware Payload"}
            </CyberButton>
          ) : (
            <div className="p-4 bg-black/40 border border-red-500/50 rounded text-red-400 font-mono text-sm animate-pulse">
              CRITICAL: Encryption started on {window.location.hostname}:{container.port}
            </div>
          )}
        </CyberCard>
      </div>
    </div>
  );
}
