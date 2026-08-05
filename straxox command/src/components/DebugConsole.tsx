import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogEntry {
  time: string;
  type: "state" | "api" | "info" | "warn" | "error";
  msg: string;
}

const typeColors: Record<string, string> = {
  state: "text-primary",
  api: "text-secondary",
  info: "text-info",
  warn: "text-warning",
  error: "text-destructive",
};

// Global log bus
const logListeners: Set<(entry: LogEntry) => void> = new Set();

export function debugLog(type: LogEntry["type"], msg: string) {
  const entry: LogEntry = {
    time: new Date().toLocaleTimeString("en-US", { hour12: false }),
    type,
    msg,
  };
  logListeners.forEach((fn) => fn(entry));
}

export function DebugConsole() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [...prev.slice(-200), entry]);
  }, []);

  useEffect(() => {
    logListeners.add(addLog);
    return () => { logListeners.delete(addLog); };
  }, [addLog]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/30"
        >
          <div className="bg-[hsl(222,47%,3%)] backdrop-blur-xl">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
                <Terminal className="w-3.5 h-3.5 text-primary ml-2" />
                <span className="text-[10px] font-mono text-primary uppercase tracking-wider">
                  System Diagnostics · {logs.length} entries
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setLogs([])} className="text-muted-foreground hover:text-foreground p-1 h-6 w-6">
                  <Trash2 className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1 h-6 w-6">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div ref={scrollRef} className="h-48 overflow-auto p-3 font-mono text-[11px] space-y-0.5">
              {logs.length === 0 && (
                <div className="text-muted-foreground/50">
                  {">"} Diagnostics initialized. Monitoring state changes...
                </div>
              )}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-muted-foreground/50 flex-shrink-0">{log.time}</span>
                  <span className={`font-bold flex-shrink-0 w-12 uppercase ${typeColors[log.type]}`}>
                    [{log.type}]
                  </span>
                  <span className="text-foreground/80">{log.msg}</span>
                </div>
              ))}
              <div className="text-muted-foreground/30 animate-pulse-glow">▌</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
