import { useEffect, useState } from "react";
import { Circle, Square, Play } from "lucide-react";
import { Replay } from "@/lib/replay";
import { CyberButton } from "@/components/cyber/CyberButton";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export function ReplayRecorder({ lab }: { lab: string }) {
  const [recording, setRecording] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const i = setInterval(() => {
      const cur = Replay.current();
      setRecording(!!cur && cur.lab === lab);
      setCount(cur?.events.length ?? 0);
    }, 400);
    return () => clearInterval(i);
  }, [lab]);

  const start = () => {
    Replay.start(lab);
    setRecording(true);
    toast.success("Recording started — interact with the lab.");
  };

  const stop = () => {
    const s = Replay.stop();
    setRecording(false);
    if (s) toast.success(`Saved replay (${s.events.length} events)`);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!recording ? (
        <CyberButton size="sm" variant="magenta" onClick={start}>
          <Circle className="h-3.5 w-3.5 fill-current" /> Record
        </CyberButton>
      ) : (
        <CyberButton size="sm" variant="danger" onClick={stop}>
          <Square className="h-3.5 w-3.5 fill-current" /> Stop ({count})
        </CyberButton>
      )}
      <Link to="/replay">
        <CyberButton size="sm" variant="ghost">
          <Play className="h-3.5 w-3.5" /> Replays
        </CyberButton>
      </Link>
    </div>
  );
}
