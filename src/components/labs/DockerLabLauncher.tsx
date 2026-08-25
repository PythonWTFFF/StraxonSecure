import { useState } from "react";
import { Play, Loader2, Terminal } from "lucide-react";
import { CyberButton } from "@/components/cyber/CyberButton";
import { toast } from "sonner";
import { callAuthed } from "@/lib/serverCall";
import { startLabSession } from "@/server/labs";

export function DockerLabLauncher({ labId }: { labId: string }) {
  const [loading, setLoading] = useState(false);
  const [port, setPort] = useState<number | null>(null);

  const launch = async () => {
    setLoading(true);
    toast.info("Spinning up vulnerable container...");
    try {
      const res = await callAuthed(startLabSession, { labId, mode: "challenge" });
      if (res.containerPort) {
        setPort(res.containerPort);
        toast.success(`Lab live on port ${res.containerPort}`);
      } else {
        toast.error("Failed to start docker container");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to launch lab");
    } finally {
      setLoading(false);
    }
  };

  if (port) {
    return (
      <div className="flex items-center gap-3 bg-accent/10 border border-accent/20 px-3 py-2 rounded-md">
        <Terminal className="h-4 w-4 text-accent" />
        <span className="text-xs font-mono text-accent">Container Live: localhost:{port}</span>
      </div>
    );
  }

  return (
    <CyberButton size="sm" variant="magenta" onClick={launch} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Play className="h-4 w-4 mr-2" />
      )}
      {loading ? "Launching..." : "Launch Real Docker Lab"}
    </CyberButton>
  );
}
