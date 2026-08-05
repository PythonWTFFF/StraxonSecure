import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Cpu } from "lucide-react";

const LINES = [
  "$ straxon-engine init",
  "→ loading deliverable pipeline",
  "→ parsing intake_data.json",
  "→ extracting context vectors",
  "→ planning structure (schema-locked)",
  "→ drafting section 1/4",
  "→ drafting section 2/4",
  "→ drafting section 3/4",
  "→ drafting section 4/4",
  "→ self-review pass",
  "→ formatting final JSON",
  "→ writing to orders.generated_content",
  "✓ deliverable ready",
];

interface Props {
  progress: number; // 0–100
}

export const GenerationTerminal = ({ progress }: Props) => {
  const [visibleLines, setVisibleLines] = useState(1);
  const [typed, setTyped] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cap = Math.max(1, Math.min(LINES.length, Math.floor((progress / 100) * LINES.length) + 1));
    if (cap !== visibleLines) setVisibleLines(cap);
  }, [progress, visibleLines]);

  useEffect(() => {
    let cancelled = false;
    const target = LINES[visibleLines - 1] || "";
    setTyped("");
    let i = 0;
    const tick = () => {
      if (cancelled) return;
      if (i <= target.length) {
        setTyped(target.slice(0, i));
        i++;
        setTimeout(tick, 18);
      }
    };
    tick();
    return () => { cancelled = true; };
  }, [visibleLines]);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visibleLines, typed]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl glass-strong border border-primary/30 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40 bg-secondary/40">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 text-center text-xs font-mono text-muted-foreground tracking-wider uppercase flex items-center justify-center gap-2">
          <Cpu className="h-3 w-3 text-primary" /> straxon-engine · live
        </div>
        <span className="text-xs font-mono text-primary">{Math.round(progress)}%</span>
      </div>
      <div
        ref={containerRef}
        className="h-44 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed text-silver/90 bg-[hsl(220_15%_4%)]"
      >
        {LINES.slice(0, visibleLines - 1).map((l, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-primary/60">{String(i + 1).padStart(2, "0")}</span>
            <span>{l}</span>
          </div>
        ))}
        <div className="flex gap-2">
          <span className="text-primary/60">{String(visibleLines).padStart(2, "0")}</span>
          <span>
            {typed}
            <span className="inline-block w-2 h-3 bg-primary ml-0.5 animate-pulse align-middle" />
          </span>
        </div>
      </div>
    </motion.div>
  );
};
