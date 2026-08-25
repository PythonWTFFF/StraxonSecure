import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { ReplayRecorder } from "@/components/labs/ReplayRecorder";
import { DockerLabLauncher } from "@/components/labs/DockerLabLauncher";

export function LabFrame({
  title,
  badge,
  recorderLab,
  dockerLabId,
  children,
}: {
  title: string;
  badge: string;
  recorderLab?: string;
  dockerLabId?: string;
  children: ReactNode;
}) {
  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          to="/labs"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All Labs
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          {dockerLabId && <DockerLabLauncher labId={dockerLabId} />}
          {recorderLab && <ReplayRecorder lab={recorderLab} />}
          <span className="text-[10px] font-mono tracking-widest text-accent border border-accent/40 rounded px-2 py-1">
            {badge}
          </span>
        </div>
      </div>
      <h1 className="font-display text-3xl md:text-4xl font-bold">
        <span className="text-gradient-neon">{title}</span>
      </h1>
      {children}
    </div>
  );
}

export interface LogEntry {
  ts: string;
  line: string;
  level?: string;
}

export function LogPanel({ logs }: { logs: LogEntry[] }) {
  const colors: Record<string, string> = {
    info: "text-muted-foreground",
    warn: "text-warning",
    error: "text-destructive",
    ok: "text-success",
  };
  return (
    <CyberCard variant="cyan" className="p-0 overflow-hidden">
      <div className="px-4 py-2 border-b border-border/50 flex items-center justify-between">
        <span className="text-xs font-mono tracking-wider uppercase text-primary">
          // LIVE LOGS
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">{logs.length} events</span>
      </div>
      <div className="p-3 max-h-72 overflow-y-auto font-mono text-xs space-y-1 bg-background/50">
        {logs.length === 0 && (
          <div className="text-muted-foreground italic">No events yet. Trigger the simulation.</div>
        )}
        {logs.map((l, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-muted-foreground/60 shrink-0">{l.ts}</span>
            <span className={colors[l.level ?? "info"]}>{l.line}</span>
          </div>
        ))}
      </div>
    </CyberCard>
  );
}

export function nowTs() {
  const d = new Date();
  return d.toTimeString().slice(0, 8);
}
