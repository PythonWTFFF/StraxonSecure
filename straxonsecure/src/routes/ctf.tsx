import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Flag, Terminal, Trophy, ChevronRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getChallenges, submitFlag } from "@/server/ctf";
import { callAuthed } from "@/lib/serverCall";

export const Route = createFileRoute("/ctf")({
  head: () => ({
    meta: [
      { title: "Capture The Flag — Straxon Secure" },
      { name: "description", content: "Compete in live cybersecurity challenges." },
    ],
  }),
  component: CTFPage,
});

function CTFPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChal, setSelectedChal] = useState<any | null>(null);
  const [flagInput, setFlagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadChallenges = async () => {
    try {
      const data = await callAuthed(getChallenges, undefined);
      setChallenges(data || []);
    } catch (e: any) {
      toast.error("Failed to load challenges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadChallenges();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChal || !flagInput.trim()) return;

    setSubmitting(true);
    try {
      const res = await callAuthed(submitFlag, {
        challengeId: selectedChal.id,
        flag: flagInput.trim()
      });
      toast.success(`Flag accepted! +${res.pointsAwarded} points`);
      setFlagInput("");
      loadChallenges(); // Refresh solved status
    } catch (e: any) {
      toast.error(e.message || "Invalid flag");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="px-4 py-12 text-center text-slate-400 font-mono text-sm">
        Sign in to access CTF challenges.
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <SectionHeading eyebrow="// OFFENSIVE" title="Capture The Flag" description="Test your skills against live vulnerable targets and climb the leaderboard." />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Col: Challenge List */}
        <div className="lg:col-span-1 space-y-4">
          <CyberCard variant="plain" className="p-4">
            <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">Active Challenges</h3>
            {loading ? (
              <div className="animate-pulse text-xs text-slate-500">Loading...</div>
            ) : challenges.length === 0 ? (
              <div className="text-xs text-slate-500">No challenges available.</div>
            ) : (
              <div className="space-y-2">
                {challenges.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedChal(c); setFlagInput(""); }}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group ${
                      selectedChal?.id === c.id ? "bg-[#ff003c]/10 border-[#ff003c]/50" : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Terminal className={`h-4 w-4 ${c.isSolved ? "text-green-400" : "text-slate-400"}`} />
                      <span className={`font-mono text-sm ${c.isSolved ? "text-green-400 line-through opacity-50" : "text-slate-200"}`}>{c.title}</span>
                    </div>
                    <span className="text-xs font-mono text-[#ff003c] font-bold">{c.points}p</span>
                  </button>
                ))}
              </div>
            )}
          </CyberCard>
        </div>

        {/* Right Col: Challenge Details */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedChal ? (
            <div className="h-[400px] border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-500 space-y-4">
              <Flag className="h-12 w-12 opacity-50" />
              <p className="font-mono text-sm">Select a challenge to begin</p>
            </div>
          ) : (
            <CyberCard variant={selectedChal.isSolved ? "plain" : "magenta"} className="p-6">
              <div className="flex items-center justify-between border-b border-border/50 pb-4 mb-4">
                <div>
                  <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                    {selectedChal.title}
                    {selectedChal.isSolved && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                  </h2>
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">{selectedChal.category} • {selectedChal.points} Points</span>
                </div>
              </div>
              
              <div className="prose prose-invert prose-sm font-mono max-w-none text-slate-300 mb-8">
                {selectedChal.description}
              </div>

              {selectedChal.isSolved ? (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded text-green-400 font-mono text-sm text-center">
                  You have already solved this challenge!
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-slate-400 uppercase">Submit Flag</label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="flag{...}" 
                        value={flagInput} 
                        onChange={(e) => setFlagInput(e.target.value)}
                        className="font-mono bg-black/40 border-[#ff003c]/30 focus-visible:border-[#ff003c]"
                      />
                      <CyberButton type="submit" variant="magenta" disabled={submitting}>
                        {submitting ? "Checking..." : "Submit"}
                      </CyberButton>
                    </div>
                  </div>
                </form>
              )}
            </CyberCard>
          )}
        </div>
      </div>
    </div>
  );
}
