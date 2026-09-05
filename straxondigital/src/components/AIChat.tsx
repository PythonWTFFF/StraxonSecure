import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot, User, Send, Sparkles, Copy, Download, Trash2, Brain,
  Globe, Upload, FileText, Search, CheckCircle2, Loader2, ChevronRight,
  MessageSquare, Database, Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: Array<{ id: number; source: string; similarity: number; preview: string }>;
  ragChunks?: number;
}

const QUICK_CHIPS = [
  "Summarize my brand voice",
  "What SEO keywords should I target?",
  "Draft a LinkedIn post",
  "Describe my target audience",
  "What are my brand dos and don'ts?",
  "Give me 5 content ideas",
];

export const AIChat = ({ workspaceId }: { workspaceId: string }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your RAG assistant powered by your Knowledge Base and Brand Brain. Ask me anything — I'll retrieve semantically relevant context from your indexed documents to give you grounded, brand-aligned answers.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCitations, setShowCitations] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (overrideInput?: string) => {
    const query = (overrideInput ?? input).trim();
    if (!query || !workspaceId) return;

    const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, { role: "user", content: query }]);
    setInput("");
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ query, workspaceId, history }),
      });

      if (!res.ok) throw new Error("Failed to connect to chat assistant");

      // Parse citation metadata from response headers
      let citations: Message["citations"] = [];
      let ragChunks = 0;
      try {
        const citHeader = res.headers.get("X-RAG-Citations");
        if (citHeader) citations = JSON.parse(decodeURIComponent(citHeader));
        ragChunks = parseInt(res.headers.get("X-RAG-Chunks-Used") || "0", 10);
      } catch { /* ignore */ }

      // Handle streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      const newMsgIdx = messages.length + 1;
      setMessages(prev => [...prev, { role: "assistant", content: "", citations, ragChunks }]);

      let done = false;
      while (reader && !done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices[0]?.delta?.content || "";
                if (content) {
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    const last = newMsgs[newMsgs.length - 1];
                    last.content += content;
                    return newMsgs;
                  });
                }
              } catch { /* ignore partial chunk parse errors */ }
            }
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const exportConversation = () => {
    const text = messages.map(m => `${m.role.toUpperCase()}:\n${m.content}`).join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rag-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Conversation exported");
  };

  const clearConversation = () => {
    setMessages([{
      role: "assistant",
      content: "Conversation cleared. Ask me anything — I'll retrieve from your Knowledge Base and Brand Brain.",
    }]);
    toast.success("Conversation cleared");
  };

  return (
    <Card className="flex flex-col h-[600px] glass overflow-hidden border-primary/20 shadow-[0_0_40px_hsl(var(--primary)/0.08)]">
      {/* Header */}
      <div className="p-4 bg-primary/5 border-b border-border flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">RAG Assistant</h3>
            <p className="text-[10px] text-muted-foreground font-mono">Semantic · Brand-aware · Multi-turn</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={exportConversation} title="Export conversation">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearConversation} title="Clear conversation">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Quick Chips */}
      {messages.length <= 1 && (
        <div className="px-4 pt-3 pb-1 flex gap-1.5 flex-wrap shrink-0">
          {QUICK_CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => send(chip)}
              disabled={loading}
              className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                m.role === "user" ? "bg-primary/20 text-primary" : "bg-gradient-to-br from-primary/30 to-primary/10 text-primary"
              }`}>
                {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`group max-w-[82%] space-y-1`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted/50 rounded-tl-sm"
                }`}>
                  {m.content}
                </div>

                {/* Metadata row */}
                {m.role === "assistant" && m.content && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {(m.ragChunks ?? 0) > 0 && (
                      <button
                        onClick={() => setShowCitations(showCitations === i ? null : i)}
                        className="flex items-center gap-1 text-[10px] font-mono text-primary/70 hover:text-primary bg-primary/5 border border-primary/20 rounded-full px-2 py-0.5 transition-all"
                      >
                        <Database className="h-2.5 w-2.5" />
                        {m.ragChunks} sources
                        <ChevronRight className={`h-2.5 w-2.5 transition-transform ${showCitations === i ? "rotate-90" : ""}`} />
                      </button>
                    )}
                    <button
                      onClick={() => copyMessage(m.content)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-2.5 w-2.5" /> Copy
                    </button>
                  </div>
                )}

                {/* Citations panel */}
                {showCitations === i && m.citations && m.citations.length > 0 && (
                  <div className="rounded-xl bg-muted/20 border border-border/50 p-3 space-y-2 max-w-full">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Sources Retrieved</p>
                    {m.citations.map(c => (
                      <div key={c.id} className="text-[10px] space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-mono">[Source {c.id}]</span>
                          <span className="text-muted-foreground truncate max-w-[160px]">{c.source}</span>
                          <Badge variant="outline" className="text-[9px] bg-green-500/10 text-green-400 border-green-500/20 font-mono">
                            {c.similarity}% match
                          </Badge>
                        </div>
                        <p className="text-muted-foreground pl-4 italic leading-relaxed">{c.preview}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10 text-primary">
                <Bot size={16} />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-muted/50 rounded-tl-sm text-sm flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0.15s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 bg-muted/20 border-t border-border flex gap-2 shrink-0">
        <Input
          ref={inputRef}
          placeholder="Ask anything based on your brand..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          className="bg-background text-sm"
          disabled={loading}
        />
        <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon" className="bg-gradient-primary border-0 shadow-glow shrink-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </Card>
  );
};

// ===== KNOWLEDGE BASE UPLOAD COMPONENT (file, text, URL) =====
interface KBUploadProps {
  workspaceId: string;
  onSuccess?: () => void;
}

export const KnowledgeBaseUpload = ({ workspaceId, onSuccess }: KBUploadProps) => {
  const [mode, setMode] = useState<"text" | "url">("text");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const readFileAsText = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = e => res(e.target?.result as string);
      reader.onerror = rej;
      reader.readAsText(file);
    });

  const processContent = async (textContent: string, sourceType: string, title?: string, sourceUrl?: string) => {
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          workspaceId,
          ...(sourceUrl ? { url: sourceUrl } : { content: textContent }),
          sourceType,
          metadata: { title: title || "Uploaded Document" },
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to process");
      toast.success(`✅ Indexed ${result.chunksProcessed} chunks from "${result.title || title}"`, {
        description: `${result.charCount?.toLocaleString()} characters processed via ${result.sourceType}`,
      });
      setContent(""); setUrl("");
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message || "Failed to process document");
    } finally {
      setUploading(false);
    }
  };

  const handleFileDrop = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const supportedTypes = ["text/plain", "text/markdown", "application/json", "text/csv", "text/x-markdown"];
    if (!supportedTypes.some(t => file.type.includes(t) || file.name.endsWith(".md") || file.name.endsWith(".txt") || file.name.endsWith(".json") || file.name.endsWith(".csv"))) {
      toast.error("Unsupported file type. Use .txt, .md, .json, or .csv");
      return;
    }
    const text = await readFileAsText(file);
    await processContent(text, "file_upload", file.name);
  };

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-muted/30 rounded-xl border border-border/50">
        {[
          { value: "text", label: "Paste / File", icon: FileText },
          { value: "url", label: "Web URL", icon: Globe },
        ].map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setMode(value as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {mode === "text" ? (
        <>
          {/* File Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFileDrop(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              dragOver ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/50 hover:bg-muted/20"
            }`}
          >
            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Drop <span className="text-foreground font-medium">.txt, .md, .json, .csv</span> or click to browse</p>
            <input ref={fileRef} type="file" accept=".txt,.md,.json,.csv,text/plain,text/markdown,application/json" className="hidden"
              onChange={e => handleFileDrop(e.target.files)} />
          </div>

          <p className="text-[10px] text-muted-foreground text-center">— or paste text below —</p>

          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Paste brand guidelines, product specs, FAQs, or any document text..."
            className="min-h-[120px] glass font-mono text-xs"
          />

          <Button
            onClick={() => processContent(content, "manual", undefined)}
            disabled={uploading || !content.trim()}
            className="w-full bg-gradient-primary text-primary-foreground border-0 shadow-glow text-xs font-semibold"
          >
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Vectorize & Index into Knowledge Base
          </Button>
        </>
      ) : (
        <>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1.5">Public URL to Ingest</label>
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://docs.yoursite.com/brand-guidelines"
                className="glass font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Works with documentation pages, blog posts, landing pages, and public markdown files.</p>
            </div>
            <Button
              onClick={() => processContent("", "url_scrape", undefined, url)}
              disabled={uploading || !url.trim()}
              className="w-full bg-gradient-primary text-primary-foreground border-0 shadow-glow text-xs font-semibold"
            >
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Globe className="h-4 w-4 mr-2" />}
              Scrape & Vectorize URL
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

// ===== VECTOR SEMANTIC SEARCH PLAYGROUND =====
interface VectorPlaygroundProps {
  workspaceId: string;
}

export const VectorPlayground = ({ workspaceId }: VectorPlaygroundProps) => {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Array<{ id: string; content: string; metadata: any; similarity: number }>>([]);
  const [threshold, setThreshold] = useState(0.3);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      // Use the chat assistant endpoint to get embedding and search — just pass the query
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({ query, workspaceId, history: [{ role: "user", content: "__PLAYGROUND_SEARCH_ONLY__" }] }),
      });
      const citHeader = res.headers.get("X-RAG-Citations");
      if (citHeader) {
        const parsed = JSON.parse(decodeURIComponent(citHeader));
        setResults(parsed.filter((r: any) => r.similarity >= threshold * 100));
      } else {
        setResults([]);
        toast.info("No matching documents found above threshold");
      }
      // Cancel the stream since we only need the headers
      await res.body?.cancel();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="Enter a test query to inspect vector similarity..."
            className="glass text-xs"
          />
          <Button onClick={search} disabled={searching || !query.trim()} size="sm" className="bg-gradient-primary border-0 shadow-glow shrink-0">
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono">Threshold: {Math.round(threshold * 100)}%</span>
          <input
            type="range" min={0.1} max={0.9} step={0.05}
            value={threshold}
            onChange={e => setThreshold(parseFloat(e.target.value))}
            className="flex-1 accent-primary"
          />
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground">{results.length} chunks matched above {Math.round(threshold * 100)}% similarity</p>
          {results.map((r, i) => (
            <div key={i} className="p-3 rounded-xl bg-muted/20 border border-border/40 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-muted-foreground truncate">{r.source || "Knowledge Base"}</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${r.similarity}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-primary shrink-0">{r.similarity}%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{r.preview}</p>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !searching && (
        <div className="text-center py-6 text-muted-foreground text-xs">
          <Search className="h-6 w-6 mx-auto mb-2 opacity-40" />
          <p>Enter a query above to test semantic similarity against your indexed documents.</p>
        </div>
      )}
    </div>
  );
};
