import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Swords, Send, Plus, Users, Radio, ShieldAlert } from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getWarrooms, createWarroom, getMessages, sendMessage } from "@/server/warroom";
import { callAuthed } from "@/lib/serverCall";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/warroom")({
  head: () => ({
    meta: [
      { title: "War Room — Straxon Secure" },
      { name: "description", content: "Multiplayer Incident Response War Rooms." },
    ],
  }),
  component: WarRoomPage,
});

function WarRoomPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  
  const [newTitle, setNewTitle] = useState("");
  const [newScenario, setNewScenario] = useState("");
  const [creating, setCreating] = useState(false);

  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadSessions = async () => {
    try {
      const data = await callAuthed(getWarrooms, undefined);
      setSessions(data || []);
    } catch (e: any) {
      toast.error("Failed to load war rooms");
    }
  };

  useEffect(() => {
    if (user) loadSessions();
  }, [user]);

  // Handle Realtime Messages
  useEffect(() => {
    if (!selectedSession || !user) return;
    
    // Initial Load
    callAuthed(getMessages, { sessionId: selectedSession.id })
      .then(data => setMessages(data || []))
      .catch(console.error);

    // Setup Subscription
    const sub = supabase
      .channel(`warroom_${selectedSession.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'warroom_messages',
        filter: `session_id=eq.${selectedSession.id}`
      }, payload => {
        // Fetch full message with profile manually or just append if we have logic.
        // Easiest is just to re-fetch or optimistically trust the payload and show "Someone"
        // Let's just reload to get the fresh display name (inefficient but works for MVP)
        callAuthed(getMessages, { sessionId: selectedSession.id }).then(data => setMessages(data || []));
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [selectedSession, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newScenario) return;
    setCreating(true);
    try {
      const s = await callAuthed(createWarroom, { title: newTitle, scenario: newScenario });
      toast.success("War Room deployed");
      loadSessions();
      setSelectedSession(s);
      setNewTitle(""); setNewScenario("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession || !msgInput.trim()) return;
    
    const content = msgInput.trim();
    setMsgInput(""); // Optimistic clear

    try {
      await callAuthed(sendMessage, { sessionId: selectedSession.id, content });
    } catch (e: any) {
      toast.error("Failed to send message");
      setMsgInput(content); // Revert
    }
  };

  if (!user) return <div className="p-12 text-center text-slate-400 font-mono">Sign in to access War Rooms.</div>;

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <SectionHeading eyebrow="// COLLAB" title="Incident War Room" description="Multiplayer live chat for active threat response and scenario planning." />

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Col: Sessions */}
        <div className="lg:col-span-1 space-y-6">
          <CyberCard variant="cyan" className="p-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#00f3ff] mb-4 flex items-center gap-2"><Plus className="h-4 w-4"/> New Session</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input placeholder="Operation Name" value={newTitle} onChange={e=>setNewTitle(e.target.value)} className="bg-black/40 h-8 text-sm" />
              <Input placeholder="Scenario (e.g. Ransomware)" value={newScenario} onChange={e=>setNewScenario(e.target.value)} className="bg-black/40 h-8 text-sm" />
              <CyberButton type="submit" variant="cyan" size="sm" className="w-full" disabled={creating}>Deploy Room</CyberButton>
            </form>
          </CyberCard>

          <CyberCard variant="plain" className="p-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Radio className="h-4 w-4"/> Active Rooms</h3>
            {sessions.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic">No active war rooms.</div>
            ) : (
              <div className="space-y-2">
                {sessions.map(s => (
                  <button key={s.id} onClick={() => setSelectedSession(s)} className={`w-full text-left p-3 rounded border transition-all ${selectedSession?.id === s.id ? 'bg-[#00f3ff]/10 border-[#00f3ff]/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                    <div className="font-display font-bold text-white flex justify-between">
                      {s.title}
                      {s.status === 'active' && <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse mt-1.5" />}
                    </div>
                    <div className="text-xs text-slate-400 font-mono truncate">{s.scenario}</div>
                  </button>
                ))}
              </div>
            )}
          </CyberCard>
        </div>

        {/* Right Col: Chat Interface */}
        <div className="lg:col-span-2 space-y-6 h-[600px] flex flex-col">
          {!selectedSession ? (
            <div className="flex-1 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-500">
              <Swords className="h-12 w-12 opacity-50 mb-4" />
              <p className="font-mono text-sm">Select a War Room to join the channel.</p>
            </div>
          ) : (
            <CyberCard variant="plain" className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-white/10 bg-black/40 flex justify-between items-center">
                <div>
                  <h2 className="font-display text-xl text-white font-bold flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                    {selectedSession.title}
                  </h2>
                  <p className="text-xs font-mono text-slate-400">Scenario: {selectedSession.scenario}</p>
                </div>
                <div className="text-xs font-mono bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">
                  LIVE SECURE COMMS
                </div>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('/grid.svg')] bg-center bg-cover bg-no-repeat bg-fixed">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-500 font-mono text-sm mt-10">Room initialized. Awaiting sitrep.</div>
                ) : (
                  messages.map(m => {
                    const isMe = m.user_id === user.id;
                    return (
                      <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] font-mono text-slate-500 mb-1">{m.profiles?.display_name || 'Operator'}</span>
                        <div className={`px-4 py-2 rounded-lg max-w-[80%] font-mono text-sm ${isMe ? 'bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/30 rounded-br-none' : 'bg-white/10 text-slate-200 border border-white/10 rounded-bl-none'}`}>
                          {m.content}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-black/40 flex gap-2">
                <Input 
                  placeholder="Transmit encrypted message..." 
                  value={msgInput} 
                  onChange={e => setMsgInput(e.target.value)}
                  className="bg-black/60 border-white/20 font-mono focus-visible:border-[#00f3ff]"
                />
                <CyberButton type="submit" variant="cyan" className="px-6">
                  <Send className="h-4 w-4" />
                </CyberButton>
              </form>
            </CyberCard>
          )}
        </div>
      </div>
    </div>
  );
}
