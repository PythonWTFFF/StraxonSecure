import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { CyberCard } from "./CyberCard";
import { Terminal as TerminalIcon } from "lucide-react";

interface WebTerminalProps {
  url?: string; // WebSocket URL (e.g. ws://localhost:8082/api/ml/terminal)
}

export function WebTerminal({ url = "ws://localhost:8082/api/ml/terminal" }: WebTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"Fira Code", monospace',
      fontSize: 12,
      theme: {
        background: "#020610",
        foreground: "#00d4ff",
        cursor: "#ff003c",
        black: "#000000",
        red: "#ff003c",
        green: "#00ff9d",
        yellow: "#f1fa8c",
        blue: "#00d4ff",
        magenta: "#aa00ff",
        cyan: "#8be9fd",
        white: "#ffffff",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    termInstance.current = term;

    // Connect to WebSocket
    const connectWS = () => {
      term.writeln(
        "\\x1b[36m[StraxonSecure]\\x1b[0m Initializing secure uplink to attack container...",
      );
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        term.writeln("\\x1b[32m[StraxonSecure]\\x1b[0m Uplink established.");
      };

      ws.onmessage = (event) => {
        // Write raw data from backend to terminal
        term.write(event.data);
      };

      ws.onclose = () => {
        term.writeln(
          "\\r\\n\\x1b[31m[StraxonSecure]\\x1b[0m Connection closed. Reconnecting in 5 seconds...",
        );
        setTimeout(connectWS, 5000);
      };

      ws.onerror = (e) => {
        term.writeln("\\r\\n\\x1b[31m[StraxonSecure]\\x1b[0m Connection error.");
      };

      // Send keystrokes to backend
      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });
    };

    connectWS();

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (wsRef.current) {
        wsRef.current.close();
      }
      term.dispose();
    };
  }, [url]);

  return (
    <CyberCard
      variant="cyan"
      className="p-0 overflow-hidden flex flex-col h-full bg-[#020610] min-h-[400px]"
    >
      <div className="flex items-center gap-2 p-3 border-b border-white/5 bg-black/40">
        <TerminalIcon className="h-4 w-4 text-[#00d4ff]" />
        <h3 className="font-mono text-xs font-bold text-white uppercase tracking-widest">
          Interactive Shell (Target Env)
        </h3>
        <div className="ml-auto flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff9d] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff9d]"></span>
          </span>
          <span className="text-[9px] font-mono text-[#00ff9d] uppercase tracking-wider">
            Connected
          </span>
        </div>
      </div>
      <div className="flex-1 w-full h-full p-2" ref={terminalRef} style={{ minHeight: "300px" }} />
    </CyberCard>
  );
}
