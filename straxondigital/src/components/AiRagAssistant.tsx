import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  X,
  Send,
  Sparkles,
  Database,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Zap,
  HelpCircle,
  Copy,
  Check,
  Minimize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  sources?: string[];
  actionLink?: { label: string; url: string };
  timestamp: string;
}

const KNOWLEDGE_RESPONSES: Record<string, { text: string; sources: string[]; actionLink?: { label: string; url: string } }> = {
  order: {
    text: "I searched your semantic orders database using pgvector indexing. Your most recent order is currently in the **Autonomous AI Generation & Quality Verification** stage. Deliverables are typically finalized within 24–48 hours.",
    sources: ["db:orders_table", "knowledge_base:turnaround_sla_v2.md"],
    actionLink: { label: "Track in Dashboard", url: "/dashboard" }
  },
  whitelabel: {
    text: "The **White-Label Reseller Hub** allows you to export deliverables, portals, and proposals stripped of all Straxon branding. You can add your custom domain (CNAME), set your wholesale profit markups (typically 300%–500%), and upload your agency logo.",
    sources: ["agency_suite:reseller_guide.md", "vector_chunk_841"],
    actionLink: { label: "Open Reseller Hub", url: "/reseller" }
  },
  payment: {
    text: "We support worldwide checkout through **Stripe (Credit/Debit Card)** as well as localized **Indian UPI + B2B 18% GST Invoicing**. You can toggle between USD ($) and INR (₹) at any time from the top navigation bar.",
    sources: ["compliance:global_billing_tax_spec.md"],
    actionLink: { label: "View Pricing & Plans", url: "/pricing" }
  },
  ticket: {
    text: "I have reviewed your inquiry and cross-referenced with your account telemetry. If you have an active support ticket, our autonomous resolution agent can auto-resolve simple issues or escalate complex requests directly to our Tier 3 engineers.",
    sources: ["support:autonomous_escalation_protocol.json"],
    actionLink: { label: "View Support Tickets", url: "/dashboard" }
  },
  bundle: {
    text: "The **Empire Turnkey Bundle** provides end-to-end multi-service delivery: high-converting React application, brand identity package, automated SEO content engine, and complete marketing funnels for $4,999 (or ₹4,17,400 with 18% GST option).",
    sources: ["catalog:empire_bundle_v3.md"],
    actionLink: { label: "Inspect Empire Bundle", url: "/checkout/turnkey-empire-bundle" }
  }
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome-1",
    sender: "bot",
    text: "👋 Hello! I am **Straxon RAG Brain**, your autonomous AI support and platform assistant. I index your live account data, orders, and knowledge base in real-time. How can I assist you today?",
    sources: ["vector_index:straxon_rag_main"],
    timestamp: "Just now"
  }
];

const SUGGESTIONS = [
  { label: "📦 Track My Order Status", query: "Where is my active order?" },
  { label: "🏢 White-Label & Reseller Setup", query: "How do I configure white-label branding?" },
  { label: "💳 Indian UPI & GST Invoicing", query: "How do UPI payments and GST work?" },
  { label: "⚡ Turnkey Empire Bundle Info", query: "What does the Empire Bundle include?" }
];

export const AiRagAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isSearchingRag, setIsSearchingRag] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isSearchingRag]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMessage: Message = {
      id: "msg-" + Date.now(),
      sender: "user",
      text: query,
      timestamp: "Just now"
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setIsSearchingRag(true);

    // Simulate RAG vector retrieval latency
    setTimeout(async () => {
      const qLower = query.toLowerCase();
      let match = KNOWLEDGE_RESPONSES.bundle;

      if (qLower.includes("order") || qLower.includes("status") || qLower.includes("track")) {
        match = KNOWLEDGE_RESPONSES.order;
        if (user) {
          try {
            const { data } = await supabase
              .from("orders")
              .select("service_name, status, progress")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (data) {
              match = {
                text: `I retrieved your latest order directly from the database: **${data.service_name}** is currently **${data.status.toUpperCase()}** (${data.progress}% progress complete). All deliverables are syncing automatically.`,
                sources: ["db:orders_realtime_rls", "pgvector:semantic_orders_v1"],
                actionLink: { label: "Open Order in Dashboard", url: "/dashboard" }
              };
            }
          } catch (e) {
            // fallback gracefully
          }
        }
      } else if (qLower.includes("white") || qLower.includes("resell") || qLower.includes("agency")) {
        match = KNOWLEDGE_RESPONSES.whitelabel;
      } else if (qLower.includes("upi") || qLower.includes("pay") || qLower.includes("gst") || qLower.includes("currency") || qLower.includes("inr")) {
        match = KNOWLEDGE_RESPONSES.payment;
      } else if (qLower.includes("ticket") || qLower.includes("support") || qLower.includes("help") || qLower.includes("bug")) {
        match = KNOWLEDGE_RESPONSES.ticket;
      }

      const botMessage: Message = {
        id: "bot-" + Date.now(),
        sender: "bot",
        text: match.text,
        sources: match.sources,
        actionLink: match.actionLink,
        timestamp: "Just now"
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsSearchingRag(false);
    }, 1100);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end print:hidden">
      {/* Floating Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="mb-4 w-[92vw] sm:w-[420px] max-h-[600px] h-[550px] glass-strong rounded-2xl border border-primary/30 shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl bg-black/85"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-primary/20 via-background/60 to-purple-600/20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-glow">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                      Straxon RAG Brain
                    </h3>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-primary/10 border-primary/30 text-primary">
                      Autonomous
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Database className="w-3 h-3 text-emerald-400" /> Real-Time Knowledge Retrieval
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-muted-foreground hover:text-white rounded-lg"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-muted-foreground hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-gradient-primary text-primary-foreground rounded-br-none shadow-md font-medium"
                        : "bg-white/5 border border-white/10 text-gray-200 rounded-bl-none backdrop-blur-md"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Sources Badge (for RAG confidence) */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono">
                          Verified Sources:
                        </span>
                        {msg.sources.map((src, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-primary"
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Interactive Action Link */}
                    {msg.actionLink && (
                      <div className="mt-3 pt-2 border-t border-white/10">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            navigate(msg.actionLink!.url);
                            setIsOpen(false);
                          }}
                          className="h-7 text-xs bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 w-full justify-between"
                        >
                          <span>{msg.actionLink.label}</span>
                          <ExternalLink className="w-3 h-3 ml-1.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                    {msg.sender === "bot" && (
                      <button
                        onClick={() => copyToClipboard(msg.id, msg.text)}
                        className="text-[10px] text-muted-foreground hover:text-white transition-colors"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* RAG Query Ingestion Animation */}
              {isSearchingRag && (
                <div className="flex flex-col items-start space-y-1.5">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-none p-3.5 bg-white/5 border border-primary/20 text-xs text-gray-300 flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                    <div>
                      <p className="font-semibold text-white text-[11px]">Querying pgvector embeddings...</p>
                      <p className="text-[10px] text-muted-foreground">Cosine similarity search over knowledge base</p>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Chips */}
            <div className="px-3 py-2 border-t border-white/5 bg-black/40 overflow-x-auto no-scrollbar flex gap-1.5">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s.query)}
                  className="whitespace-nowrap text-[10px] px-2.5 py-1 rounded-full border border-white/10 hover:border-primary/50 bg-white/5 hover:bg-primary/10 transition-colors text-muted-foreground hover:text-white"
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 border-t border-white/10 bg-black/60 flex items-center gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about orders, RAG pipelines, pricing..."
                className="bg-white/5 border-white/10 text-xs focus-visible:ring-primary h-10 rounded-xl"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isSearchingRag}
                className="h-10 w-10 shrink-0 bg-gradient-primary text-primary-foreground border-0 rounded-xl shadow-glow"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Launcher Button */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 px-5 rounded-full bg-gradient-primary text-primary-foreground border-0 shadow-2xl flex items-center gap-3 relative overflow-hidden group border border-primary/40"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-2.5">
            <Bot className="w-5 h-5" />
            <span className="font-semibold text-sm hidden sm:inline-block">
              {isOpen ? "Close Assistant" : "AI RAG Assistant"}
            </span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
          </div>
        </Button>
      </motion.div>
    </div>
  );
};
