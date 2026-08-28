import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Cpu, User, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function StraxonCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I am Straxon Copilot. How can I assist you with your security analysis today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const mlUrl = import.meta.env.VITE_ML_ENGINE_URL || "http://localhost:8082";
    
    try {
      const res = await fetch(`${mlUrl}/api/ml/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: "assistant", content: data.reply || "No response received." }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Error: The ML Engine returned a bad response." }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: Unable to reach ML Engine. (${e.message})` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-primary text-primary-foreground rounded-full shadow-[0_0_20px_rgba(0,255,100,0.4)] hover:scale-110 transition-transform z-50 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        aria-label="Open Straxon Copilot"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <div
        className={`fixed bottom-6 right-6 w-[380px] h-[550px] max-h-[85vh] bg-[#020610]/95 backdrop-blur-xl border border-primary/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-90 opacity-0 pointer-events-none'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-black/40">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            <h3 className="font-mono font-bold text-sm tracking-wide">STRAXON COPILOT</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-primary/20">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`p-3 rounded-xl max-w-[80%] text-sm font-mono leading-relaxed ${msg.role === 'user' ? 'bg-primary/20 border border-primary/40 text-primary-foreground rounded-tr-none' : 'bg-muted/50 border border-border/50 text-foreground rounded-tl-none'}`}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-accent" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4 text-primary" />
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border border-border/50 rounded-tl-none flex items-center">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border/50 bg-black/40">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Copilot to analyze..."
              className="w-full bg-background border border-border rounded-lg pl-4 pr-12 py-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:bg-primary/10 rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
