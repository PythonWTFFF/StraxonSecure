import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Trash2, FileDown, Rewind, FastForward } from "lucide-react";
import { Replay, type ReplaySession } from "@/lib/replay";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { generateReplayReport } from "@/lib/pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/replay")({
  head: () => ({
    meta: [
      { title: "Attack Replay — Straxon Secure" },
      {
        name: "description",
        content: "Record and replay your lab sessions with timeline scrubbing.",
      },
    ],
  }),
  component: ReplayGated,
});

import { PremiumGate } from "@/components/PremiumGate";
function ReplayGated() {
  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto">
      <PremiumGate
        feature="Attack Replay Theatre"
        description="Pro unlocks session recording, timeline scrubbing, playback speed controls, and PDF export."
      >
        <ReplayPage />
      </PremiumGate>
    </div>
  );
}

const SEVERITY_COLOR: Record<string, string> = {
  info: "var(--neon-cyan)",
  success: "var(--success)",
  warn: "var(--warning)",
  danger: "var(--destructive)",
};

function ReplayPage() {
  const [sessions, setSessions] = useState<ReplaySession[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const refresh = () => setSessions(Replay.list());
    refresh();
    return Replay.subscribe(refresh);
  }, []);

  const session = useMemo(
    () => sessions.find((s) => s.id === selected) ?? sessions[0],
    [sessions, selected],
  );
  const duration = session ? (session.endedAt ?? Date.now()) - session.startedAt : 0;

  useEffect(() => {
    if (!playing || !session) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) * speed;
      last = now;
      setT((prev) => {
        const next = prev + dt;
        if (next >= duration) {
          setPlaying(false);
          return duration;
        }
        return next;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, session, duration, speed]);

  useEffect(() => {
    setT(0);
    setPlaying(false);
  }, [selected]);

  const visibleEvents = session ? session.events.filter((e) => e.t <= t) : [];

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <SectionHeading
        eyebrow="REPLAY"
        title="Attack Replay Theatre"
        description="Scrub through recorded lab sessions, frame by frame. Export as evidence."
      />

      {sessions.length === 0 ? (
        <CyberCard variant="cyan" className="text-center py-12">
          <div className="font-mono text-muted-foreground">
            No replays yet — open a lab and hit <span className="text-accent">● Record</span>.
          </div>
        </CyberCard>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          <CyberCard variant="cyan" className="lg:col-span-1 p-0">
            <div className="px-4 py-3 border-b border-border/50 text-xs font-mono uppercase text-primary">
              Sessions
            </div>
            <div className="max-h-[560px] overflow-y-auto">
              {sessions.map((s) => {
                const active = session?.id === s.id;
                const dur = ((s.endedAt ?? Date.now()) - s.startedAt) / 1000;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s.id)}
                    className={`w-full text-left px-4 py-3 border-b border-border/30 hover:bg-primary/5 transition-colors ${
                      active ? "bg-primary/10" : ""
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-primary uppercase">{s.lab}</span>
                      <span className="text-muted-foreground">{dur.toFixed(1)}s</span>
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground font-mono">
                      {new Date(s.startedAt).toLocaleString()} • {s.events.length} events
                    </div>
                  </button>
                );
              })}
            </div>
          </CyberCard>

          <CyberCard variant="magenta" className="lg:col-span-2">
            {session && (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <div>
                    <div className="text-xs font-mono uppercase text-accent">
                      {session.lab} · {session.events.length} events
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {new Date(session.startedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <CyberButton size="sm" variant="ghost" onClick={() => setT(0)}>
                      <Rewind className="h-3.5 w-3.5" />
                    </CyberButton>
                    <CyberButton
                      size="sm"
                      variant={playing ? "danger" : "cyan"}
                      onClick={() => {
                        if (t >= duration) setT(0);
                        setPlaying((p) => !p);
                      }}
                    >
                      {playing ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                    </CyberButton>
                    <CyberButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setSpeed((s) => (s >= 4 ? 0.5 : s * 2))}
                    >
                      <FastForward className="h-3.5 w-3.5" /> {speed}x
                    </CyberButton>
                    <CyberButton
                      size="sm"
                      variant="magenta"
                      onClick={() => {
                        generateReplayReport(session);
                        toast.success("PDF report generated");
                      }}
                    >
                      <FileDown className="h-3.5 w-3.5" /> PDF
                    </CyberButton>
                    <CyberButton
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        Replay.remove(session.id);
                        setSelected(null);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </CyberButton>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                    <span>{(t / 1000).toFixed(2)}s</span>
                    <span>{(duration / 1000).toFixed(2)}s</span>
                  </div>
                  <div className="relative h-8 bg-background/40 rounded border border-border overflow-hidden">
                    {/* event markers */}
                    {session.events.map((e, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 w-0.5"
                        style={{
                          left: `${(e.t / Math.max(1, duration)) * 100}%`,
                          background: SEVERITY_COLOR[e.severity ?? "info"],
                          opacity: 0.7,
                        }}
                      />
                    ))}
                    {/* playhead */}
                    <motion.div
                      className="absolute top-0 bottom-0 w-0.5 bg-accent"
                      style={{
                        left: `${(t / Math.max(1, duration)) * 100}%`,
                        boxShadow: "0 0 8px var(--neon-magenta)",
                      }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={duration}
                      value={t}
                      onChange={(e) => {
                        setPlaying(false);
                        setT(Number(e.target.value));
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Event log */}
                <div className="mt-4 max-h-80 overflow-y-auto space-y-1 font-mono text-xs pr-1">
                  {visibleEvents
                    .slice()
                    .reverse()
                    .map((e, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-3 px-3 py-1.5 rounded bg-background/40 border border-border/40"
                      >
                        <span className="text-muted-foreground w-14 shrink-0">
                          {(e.t / 1000).toFixed(2)}s
                        </span>
                        <span
                          className="uppercase font-bold w-14 shrink-0"
                          style={{ color: SEVERITY_COLOR[e.severity ?? "info"] }}
                        >
                          {e.kind}
                        </span>
                        <span className="text-foreground">{e.label}</span>
                      </motion.div>
                    ))}
                </div>
              </>
            )}
          </CyberCard>
        </div>
      )}
    </div>
  );
}
