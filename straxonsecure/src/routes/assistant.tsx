import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { askAI } from "@/server/ai";
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  Shield,
  Crosshair,
  BookOpen,
  Copy,
  Check,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Security Assistant — Straxon Secure" },
      {
        name: "description",
        content:
          "STRAXON AI — your elite cybersecurity assistant. Analyze threats, harden systems, and learn attack techniques.",
      },
    ],
  }),
  component: Assistant,
});

type Msg = { role: "user" | "assistant"; content: string };
type Mode = "chat" | "explain" | "architect" | "responder" | "compliance" | "reverse";

const MODES: { key: Mode; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  {
    key: "chat",
    label: "STRAXON AI",
    icon: <Bot className="h-4 w-4" />,
    color: "text-[#ff003c]",
    desc: "General cybersecurity assistant",
  },
  {
    key: "explain",
    label: "Analyst Mode",
    icon: <BookOpen className="h-4 w-4" />,
    color: "text-[#00f3ff]",
    desc: "Explains attacks and defenses",
  },
  {
    key: "architect",
    label: "Architect Mode",
    icon: <Shield className="h-4 w-4" />,
    color: "text-purple-400",
    desc: "Reviews security architecture",
  },
  {
    key: "responder",
    label: "Incident Responder",
    icon: <Crosshair className="h-4 w-4" />,
    color: "text-orange-500",
    desc: "Analyzes logs & plans containment",
  },
  {
    key: "compliance",
    label: "Auditor Mode",
    icon: <Check className="h-4 w-4" />,
    color: "text-emerald-400",
    desc: "Reviews for SOC2/ISO27001 gaps",
  },
  {
    key: "reverse",
    label: "Reverse Engineer",
    icon: <Terminal className="h-4 w-4" />,
    color: "text-yellow-400",
    desc: "Analyzes malware capabilities",
  },
];

const QUICK_PROMPTS: Record<Mode, string[]> = {
  chat: [
    "What are the OWASP Top 10 in 2024?",
    "How do I detect a SQL injection attack?",
    "Explain zero-trust architecture",
    "What is a SSRF vulnerability?",
  ],
  explain: [
    "Explain JWT token attacks and how to prevent them",
    "How does a DDoS amplification attack work?",
    "Explain XSS: stored vs reflected vs DOM-based",
    "What is the kill chain methodology?",
  ],
  architect: [
    "Review: web app with no WAF, single DB, no rate limiting",
    "How do I secure a microservices architecture?",
    "Design a zero-trust network for 50 remote employees",
    "What security controls should every API have?",
  ],
  responder: [
    "Analyze this suspicious Nginx access log",
    "What are the immediate containment steps for ransomware?",
    "How do I hunt for Cobalt Strike beacons?",
    "Investigate a sudden spike in outbound DNS traffic",
  ],
  compliance: [
    "What are the key SOC2 requirements for access control?",
    "How do I achieve ISO27001 compliance for a SaaS?",
    "Review this architecture for HIPAA compliance gaps",
    "What evidence is required for a disaster recovery audit?",
  ],
  reverse: [
    "What does this suspicious PowerShell script do?",
    "Explain how reflective DLL injection works",
    "How can I deobfuscate this JavaScript payload?",
    "Identify persistence mechanisms in this malware report",
  ],
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
    >
      {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function Assistant() {
  const [mode, setMode] = useState<Mode>("chat");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    const userMsg: Msg = { role: "user", content };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setBusy(true);
    try {
      const res = await askAI({
        data: {
          messages: [...messages, userMsg].slice(-20), // Keep last 20 messages for context
          mode,
        },
      });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI error");
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const currentMode = MODES.find((m) => m.key === mode)!;

  return (
    <div className="px-4 lg:px-8 py-8 max-w-4xl mx-auto space-y-6">
      <SectionHeading
        eyebrow="// INTEL"
        title="Straxon AI Assistant"
        description="Your elite cybersecurity AI — powered by Gemini 2.5 Flash. Ask anything, analyze threats, harden architectures."
      />

      {/* Mode Selector */}
      <div className="flex gap-2 flex-wrap">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-mono transition-all ${
              mode === m.key
                ? "bg-white/8 border-white/25 text-white"
                : "border-white/8 text-slate-400 hover:border-white/15 hover:text-slate-300"
            }`}
          >
            <span className={mode === m.key ? m.color : ""}>{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* Chat Window */}
      <CyberCard variant="magenta" className="p-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className={currentMode.color}>{currentMode.icon}</span>
            <div>
              <span className={`font-mono text-sm font-bold ${currentMode.color}`}>
                {currentMode.label}
              </span>
              <span className="text-[10px] font-mono text-slate-400 ml-2">// online</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <span className="text-[10px] font-mono text-slate-400">
                {messages.length} messages
              </span>
            )}
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="p-1.5 rounded hover:bg-white/5 text-slate-400 hover:text-red-400 transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="h-[500px] overflow-y-auto p-4 space-y-4 bg-[#020610]/60">
          {messages.length === 0 && (
            <div className="text-center space-y-5 mt-10">
              <div
                className={`mx-auto w-14 h-14 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center ${currentMode.color}`}
              >
                {currentMode.icon && <span className="scale-150">{currentMode.icon}</span>}
              </div>
              <div>
                <p className="text-slate-300 font-mono text-sm">{currentMode.desc}</p>
                <p className="text-slate-400 text-xs mt-1">
                  Shift+Enter for new line, Enter to send
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {QUICK_PROMPTS[mode].map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="text-xs font-mono px-3 py-2 rounded-lg border border-white/10 hover:border-[#00f3ff]/40 hover:text-[#00f3ff] text-slate-400 transition-all text-left"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`relative group max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-[#00f3ff]/10 border border-[#00f3ff]/20 text-slate-200"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                {m.role === "assistant" ? (
                  <>
                    <div className="prose prose-sm prose-invert max-w-none prose-p:my-1.5 prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-code:text-[#00f3ff] prose-code:bg-black/30 prose-code:px-1 prose-code:rounded prose-headings:text-[#00f3ff] prose-headings:font-mono prose-headings:text-sm">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                    <CopyButton text={m.content} />
                  </>
                ) : (
                  <span className="font-mono">{m.content}</span>
                )}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-slate-400 flex items-center gap-2">
                <span className={`${currentMode.color} animate-pulse`}>{currentMode.icon}</span>
                <span>
                  analyzing<span className="animate-pulse">…</span>
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/8 flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${currentMode.label}…`}
            rows={1}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 font-mono text-sm focus:border-[#00f3ff]/40 outline-none text-slate-200 placeholder:text-slate-600 resize-none max-h-32 transition-colors"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <CyberButton
            type="button"
            variant="magenta"
            onClick={() => send()}
            disabled={busy || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </CyberButton>
        </div>
      </CyberCard>

      {/* Info */}
      <p className="text-center text-[10px] font-mono text-slate-600">
        Powered by Gemini 2.5 Flash · Context window: last 20 messages · For educational use in
        controlled environments
      </p>
    </div>
  );
}
