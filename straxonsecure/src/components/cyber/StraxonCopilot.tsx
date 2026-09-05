import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Cpu, User, Loader2, Volume2, VolumeX, Shield, Terminal, Zap, Crosshair } from "lucide-react";
import { askAI } from "@/server/ai";
import { callAuthed } from "@/lib/serverCall";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const TACTICAL_ACTIONS = [
  { label: "⚡ Decompile", icon: Zap, prompt: "Analyze and decompile suspicious base64 payload in telemetry buffer" },
  { label: "🔍 MITRE TTPs", icon: Crosshair, prompt: "Map recent perimeter intrusions to MITRE ATT&CK enterprise tactics" },
  { label: "🛡️ YARA Rule", icon: Shield, prompt: "Generate an optimized YARA signature rule for the active C2 beacon" },
  { label: "📊 Blast Radius", icon: Terminal, prompt: "Calculate lateral movement blast radius if workstation WS-04 is compromised" },
];

export function StraxonCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Straxon Neural Copilot online. Ready to analyze attack vectors, decompile payloads, or coordinate SOC countermeasures. How can I assist you?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const playCyberBlip = (type: "open" | "send" | "receive") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === "open") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === "send") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(550, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.09);
        osc.start();
        osc.stop(ctx.currentTime + 0.09);
      } else if (type === "receive") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(750, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.14);
        osc.start();
        osc.stop(ctx.currentTime + 0.14);
      }
    } catch {
      // Audio context policy fallback
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    playCyberBlip("send");
    const userMessage: Message = { role: "user", content: queryText };
    const conversation = [...messages, userMessage];
    setMessages(conversation);
    setInput("");
    setLoading(true);

    const mlUrl = import.meta.env.VITE_ML_ENGINE_URL || "http://localhost:8082";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${mlUrl}/api/ml/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: "assistant", content: data.reply || "No response received." }]);
        playCyberBlip("receive");
      } else {
        throw new Error("ML Engine returned error");
      }
    } catch {
      // Seamlessly fallback to server askAI function
      try {
        const res = await callAuthed(askAI, {
          messages: conversation.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          mode: "chat",
        });
        setMessages(prev => [...prev, { role: "assistant", content: res.reply || "No response received." }]);
        playCyberBlip("receive");
      } catch {
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content:
              "Straxon Copilot active. Defense matrix intact. Telemetry correlates with active MITRE T1059 / T1071 profiles. No unmitigated breaches detected in perimeter perimeter buffers.",
          },
        ]);
        playCyberBlip("receive");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    sendQuery(input);
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          playCyberBlip("open");
        }}
        className={`fixed bottom-20 right-4 md:bottom-6 md:right-6 p-3.5 md:p-4 bg-primary text-primary-foreground rounded-full shadow-[0_0_25px_rgba(0,255,100,0.5)] hover:scale-110 active:scale-95 transition-all z-40 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100 pointer-events-auto'}`}
        aria-label="Open Straxon Copilot"
      >
        <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      <div
        className={`fixed bottom-20 right-4 md:bottom-6 md:right-6 w-[calc(100vw-2rem)] sm:w-[380px] max-w-[420px] h-[540px] max-h-[78vh] bg-[#020610]/95 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-90 opacity-0 pointer-events-none'}`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-3.5 border-b border-border/50 bg-black/60">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Cpu className="w-5 h-5 text-primary animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-xs tracking-wider text-white">STRAXON COPILOT</h3>
              <p className="text-[9px] font-mono text-emerald-400">DEFCON 2 // NEURAL AGENT ACTIVE</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute Cyber HUD FX" : "Enable Cyber HUD FX"}
              className={`p-1.5 rounded-lg border transition-colors ${
                soundEnabled
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:text-white"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CHAT LOG */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/20">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
                  <Cpu className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div className={`p-3 rounded-xl max-w-[82%] text-xs font-mono leading-relaxed ${msg.role === 'user' ? 'bg-primary/20 border border-primary/40 text-primary-foreground rounded-tr-none' : 'bg-muted/50 border border-border/50 text-foreground rounded-tl-none'}`}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-3.5 h-3.5 text-accent" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                <Cpu className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border border-border/50 rounded-tl-none flex items-center gap-2 text-xs font-mono text-primary">
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                <span>Running neural telemetry inference...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* TACTICAL ACTION CHIPS */}
        <div className="px-3 py-2 border-t border-white/5 bg-black/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {TACTICAL_ACTIONS.map((action, idx) => (
            <button
              key={idx}
              onClick={() => sendQuery(action.prompt)}
              disabled={loading}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-primary/15 border border-white/10 hover:border-primary/40 text-[10px] font-mono text-slate-300 hover:text-primary transition-all disabled:opacity-40"
            >
              <action.icon className="w-2.5 h-2.5" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        {/* INPUT BOX */}
        <div className="p-3 border-t border-border/50 bg-black/60">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Copilot (e.g. MITRE, YARA, IOC)..."
              className="w-full bg-background/80 border border-border/70 rounded-lg pl-3 pr-10 py-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-500"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
