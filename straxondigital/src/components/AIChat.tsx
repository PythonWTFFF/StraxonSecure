import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AIChat = ({ workspaceId }: { workspaceId: string }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your RAG assistant. Ask me anything based on your Knowledge Base and Brand Brain." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    if (!input.trim() || !workspaceId) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ query: userMsg, workspaceId })
      });

      if (!res.ok) throw new Error("Failed to connect to chat assistant");

      // Handle streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      let done = false;
      while (reader && !done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          
          // OpenAI returns Server-Sent Events (SSE) format: "data: {...}\n\n"
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
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[500px] glass overflow-hidden border-primary/20 shadow-[0_0_30px_hsl(var(--primary)/0.1)]">
      <div className="p-4 bg-primary/5 border-b border-border flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">RAG Assistant</h3>
      </div>
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${m.role === "user" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm whitespace-pre-wrap ${
                m.role === "user" 
                  ? "bg-primary text-primary-foreground rounded-tr-sm" 
                  : "bg-muted rounded-tl-sm"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                <Bot size={16} />
              </div>
              <div className="px-4 py-2 rounded-2xl bg-muted rounded-tl-sm text-sm flex gap-1 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce delay-75" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce delay-150" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 bg-muted/30 border-t border-border flex gap-2">
        <Input 
          placeholder="Ask anything based on your brand..." 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="bg-background"
        />
        <Button onClick={send} disabled={loading || !input.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
