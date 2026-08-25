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

  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  // Real-time Game State
  const [systemHealth, setSystemHealth] = useState(100);
  const [lastAction, setLastAction] = useState<string | null>(null);

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
      .then((data) => setMessages(data || []))
      .catch(console.error);

    // Setup Subscription
    const channel = supabase.channel(`warroom_${selectedSession.id}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "warroom_messages",
          filter: `session_id=eq.${selectedSession.id}`,
        },
        (payload) => {
          callAuthed(getMessages, { sessionId: selectedSession.id }).then((data) =>
            setMessages(data || []),
          );
        },
      )
      .on("broadcast", { event: "game_action" }, (payload) => {
        if (payload.payload.action === "attack") {
          setSystemHealth((prev) => Math.max(0, prev - 5));
          setLastAction(`${payload.payload.user} launched an exploit!`);
        } else if (payload.payload.action === "patch") {
          setSystemHealth((prev) => Math.min(100, prev + 5));
          setLastAction(`${payload.payload.user} patched a vulnerability!`);
        }
      })
      .on("presence", { event: "sync" }, () => {
        const newState = channel.presenceState();
        const users = [];
        for (const key in newState) {
          users.push(...(newState[key] as any[]));
        }
        const uniqueUsers = Array.from(new Map(users.map((u) => [u.user_id, u])).values());
        setOnlineUsers(uniqueUsers);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", user.id)
            .single();
          await channel.track({
            user_id: user.id,
            display_name: profile?.display_name || "Operator",
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
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
      setNewTitle("");
      setNewScenario("");
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

  const handleGameAction = async (action: "attack" | "patch") => {
    if (!selectedSession || !user) return;
    const channel = supabase.channel(`warroom_${selectedSession.id}`);
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    // Optimistic local update
    if (action === "attack") {
      setSystemHealth((prev) => Math.max(0, prev - 5));
      setLastAction(`You launched an exploit!`);
    } else {
      setSystemHealth((prev) => Math.min(100, prev + 5));
      setLastAction(`You patched a vulnerability!`);
    }

    // Broadcast to everyone else
    channel.send({
      type: "broadcast",
      event: "game_action",
      payload: { action, user: profile?.display_name || "Operator" },
    });
  };

  if (!user)
    return (
      <div className="p-12 text-center text-slate-400 font-mono">Sign in to access War Rooms.</div>
    );

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <SectionHeading
        eyebrow="// COLLAB"
        title="Incident War Room"
        description="Multiplayer live chat for active threat response and scenario planning."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Col: Sessions */}
        <div className="lg:col-span-1 space-y-6">
          <CyberCard
            variant="cyan"
            className="p-5 bg-[#020610]/80 backdrop-blur-md shadow-[0_0_30px_rgba(0,243,255,0.1)]"
          >
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#00f3ff] mb-5 flex items-center gap-2 border-b border-white/5 pb-2">
              <Plus className="h-4 w-4 drop-shadow-[0_0_8px_rgba(0,243,255,0.6)]" /> NEW SECURE
              COMMS LINK
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                placeholder="Operation Name"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-black/40 h-10 text-sm border-[#00f3ff]/30 focus:border-[#00f3ff] transition-colors"
              />
              <Input
                placeholder="Threat Scenario (e.g. Ransomware)"
                value={newScenario}
                onChange={(e) => setNewScenario(e.target.value)}
                className="bg-black/40 h-10 text-sm border-[#00f3ff]/30 focus:border-[#00f3ff] transition-colors"
              />
              <CyberButton
                type="submit"
                variant="cyan"
                size="sm"
                className="w-full h-10 justify-center"
                disabled={creating}
              >
                Initialize War Room
              </CyberButton>
            </form>
          </CyberCard>

          <CyberCard
            variant="plain"
            className="p-5 bg-[#020610]/80 backdrop-blur-md border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
          >
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2 border-b border-white/5 pb-2">
              <Radio className="h-4 w-4 opacity-70" /> ACTIVE OPERATIONS
            </h3>
            {sessions.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic p-4 text-center bg-black/20 rounded border border-dashed border-white/10">
                No active war rooms.
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSession(s)}
                    className={`w-full text-left p-4 rounded-xl border transition-all shadow-sm ${selectedSession?.id === s.id ? "bg-[#00f3ff]/15 border-[#00f3ff]/60 shadow-[inset_0_0_15px_rgba(0,243,255,0.15)]" : "bg-black/40 border-white/10 hover:border-white/30 hover:bg-black/60"}`}
                  >
                    <div className="font-display font-bold text-white flex justify-between tracking-wide">
                      {s.title}
                      {s.status === "active" && (
                        <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse mt-1.5 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate mt-2 bg-black/50 px-2 py-1 rounded border border-white/5">
                      {s.scenario}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CyberCard>
        </div>

        {/* Right Col: Chat Interface */}
        <div className="lg:col-span-2 space-y-6 h-[650px] flex flex-col">
          {!selectedSession ? (
            <div className="flex-1 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-500 bg-black/20 shadow-inner">
              <Swords className="h-16 w-16 opacity-30 mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
              <p className="font-mono text-sm tracking-widest uppercase">
                Select an Operation to join the comms channel.
              </p>
            </div>
          ) : (
            <CyberCard
              variant="plain"
              className="flex-1 flex flex-col overflow-hidden bg-[#020610]/80 backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/10 bg-black/60 flex justify-between items-center shadow-md">
                <div>
                  <h2 className="font-display text-2xl text-white font-bold flex items-center gap-3">
                    <ShieldAlert className="h-6 w-6 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                    {selectedSession.title}
                  </h2>
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-1 border-l-2 border-red-500/50 pl-2">
                    Operation Scenario:{" "}
                    <span className="text-slate-300">{selectedSession.scenario}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex -space-x-2 mr-2">
                    {onlineUsers.map((u) => (
                      <div
                        key={u.user_id}
                        className="h-7 w-7 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-[10px] font-mono text-white relative shadow-md"
                        title={u.display_name}
                      >
                        {u.display_name.charAt(0).toUpperCase()}
                        <span className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full border border-black shadow-[0_0_5px_rgba(34,197,94,0.8)]" />
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] font-mono bg-red-500/10 text-red-400 px-3 py-1.5 rounded border border-red-500/30 flex items-center gap-2 shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]">
                    <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,1)]" />
                    LIVE ENCRYPTED COMMS
                  </div>
                </div>
              </div>

              {/* Shared Game State Header */}
              <div className="bg-[#020610] p-4 border-b border-white/5 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">
                    Target System Health
                  </span>
                  <span
                    className={`text-[12px] font-mono font-bold ${systemHealth < 30 ? "text-red-500" : systemHealth > 70 ? "text-emerald-400" : "text-yellow-400"}`}
                  >
                    {systemHealth}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 transition-all duration-500 ${systemHealth < 30 ? "bg-red-500" : systemHealth > 70 ? "bg-emerald-500" : "bg-yellow-500"}`}
                    style={{ width: `${systemHealth}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-2">
                    <CyberButton
                      variant="magenta"
                      size="sm"
                      onClick={() => handleGameAction("attack")}
                    >
                      RED: Attack
                    </CyberButton>
                    <CyberButton variant="cyan" size="sm" onClick={() => handleGameAction("patch")}>
                      BLUE: Patch
                    </CyberButton>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 italic truncate max-w-[200px]">
                    {lastAction || "System online. Awaiting engagement."}
                  </span>
                </div>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/40 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="text-center text-[#00f3ff]/50 font-mono text-[10px] mt-10 tracking-widest uppercase p-4 border border-[#00f3ff]/20 bg-[#00f3ff]/5 rounded w-max mx-auto">
                    War Room initialized. Awaiting sitrep from operator.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.user_id === user.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <span className="text-[9px] font-mono text-slate-500 mb-1.5 tracking-widest uppercase bg-black/50 px-2 py-0.5 rounded border border-white/5">
                          {m.profiles?.display_name || "Operator"}
                        </span>
                        <div
                          className={`px-4 py-2.5 rounded-xl max-w-[80%] font-mono text-sm leading-relaxed shadow-sm ${isMe ? "bg-[#00f3ff]/15 text-[#00f3ff] border border-[#00f3ff]/40 rounded-br-none shadow-[inset_0_0_15px_rgba(0,243,255,0.1)]" : "bg-white/5 text-slate-200 border border-white/10 rounded-bl-none shadow-[inset_0_0_15px_rgba(255,255,255,0.02)]"}`}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="p-5 border-t border-white/10 bg-black/60 flex gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
              >
                <Input
                  placeholder="Transmit encrypted message..."
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  className="bg-black/40 border-white/20 font-mono focus-visible:border-[#00f3ff] h-12 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] transition-colors"
                />
                <CyberButton
                  type="submit"
                  variant="cyan"
                  className="px-8 h-12 shadow-[0_0_15px_rgba(0,243,255,0.2)] hover:shadow-[0_0_25px_rgba(0,243,255,0.4)]"
                >
                  <Send className="h-5 w-5" />
                </CyberButton>
              </form>
            </CyberCard>
          )}
        </div>
      </div>
    </div>
  );
}
