import { createFileRoute } from "@tanstack/react-router";
import { CyberCard } from "@/components/cyber/CyberCard";
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
const WebTerminal = lazy(() =>
  import("@/components/cyber/WebTerminal").then((m) => ({ default: m.WebTerminal })),
);
import { Terminal } from "lucide-react";

export const Route = createFileRoute("/labs/terminal")({
  component: TerminalLab,
});

function TerminalLab() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center border border-[#00d4ff]/20">
          <Terminal className="h-6 w-6 text-[#00d4ff]" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-wide">
            Interactive Shell Environment
          </h1>
          <p className="font-mono text-xs text-slate-400 mt-1 uppercase tracking-widest">
            Module: LAB-00-TERM // Real-time Docker Session
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="h-[500px] w-full flex items-center justify-center border border-[#00d4ff]/20 bg-black/50 text-slate-500 font-mono text-xs rounded-lg shadow-lg">
                  Initializing Xterm...
                </div>
              }
            >
              <WebTerminal />
            </Suspense>
          </ErrorBoundary>
        </div>
        <div className="space-y-4">
          <CyberCard variant="cyan">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-2">
              Objective
            </h3>
            <p className="text-sm font-sans text-slate-300 leading-relaxed mb-4">
              This terminal provides a direct, interactive bash session inside an isolated container
              running on the ML Engine.
            </p>

            <h3 className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-2">
              MITRE ATT&CK Mapping
            </h3>
            <div className="bg-black/30 p-3 rounded border border-white/5 mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono font-bold text-white">T1059.004</span>
                <span className="text-[10px] bg-red-500/20 text-red-400 px-2 rounded">
                  Execution
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans">
                Command and Scripting Interpreter: Unix Shell
              </p>
            </div>

            <h3 className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-2">
              Available Commands
            </h3>
            <ul className="text-xs font-mono text-slate-400 space-y-2">
              <li>
                <span className="text-[#00d4ff]">whoami</span> - Check permissions
              </li>
              <li>
                <span className="text-[#00d4ff]">ls -la</span> - List directory
              </li>
              <li>
                <span className="text-[#00d4ff]">cat /etc/os-release</span> - OS Info
              </li>
              <li>
                <span className="text-[#00d4ff]">ping 8.8.8.8</span> - Network Test
              </li>
            </ul>
          </CyberCard>
        </div>
      </div>
    </div>
  );
}
