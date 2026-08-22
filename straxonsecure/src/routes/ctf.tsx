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
  const { user, loading: authLoading } = useAuth();
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
    if (authLoading) return;
    loadChallenges();
  }, [authLoading]);

  // Helper to map category to MITRE ATT&CK
  const getMitreMapping = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("web") || cat.includes("xss") || cat.includes("sqli")) {
      return { id: "T1190", name: "Exploit Public-Facing Application", tactic: "Initial Access" };
    }
    if (cat.includes("crypto")) {
      return { id: "T1552", name: "Unsecured Credentials", tactic: "Credential Access" };
    }
    if (cat.includes("forensics") || cat.includes("reverse")) {
      return { id: "T1005", name: "Data from Local System", tactic: "Collection" };
    }
    return { id: "T1059", name: "Command and Scripting Interpreter", tactic: "Execution" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChal || !flagInput.trim()) return;

    setSubmitting(true);
    try {
      const res = await callAuthed(submitFlag, {
        challengeId: selectedChal.id,
        flag: flagInput.trim(),
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
      <SectionHeading
        eyebrow="// OFFENSIVE"
        title="Capture The Flag"
        description="Test your skills against live vulnerable targets and climb the leaderboard."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Col: Challenge List */}
        <div className="lg:col-span-1 space-y-4">
          <CyberCard
            variant="plain"
            className="p-5 bg-[#020610]/80 backdrop-blur-md border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
          >
            <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-5 border-b border-white/5 pb-2 flex items-center gap-2">
              <Terminal className="h-4 w-4 opacity-70" /> ACTIVE BOUNTIES
            </h3>
            {loading ? (
              <div className="animate-pulse text-xs text-[#ff003c] font-mono text-center p-4 bg-black/20 rounded border border-dashed border-[#ff003c]/20">
                SCANNING NETWORK...
              </div>
            ) : challenges.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic p-4 text-center bg-black/20 rounded border border-dashed border-white/10">
                No challenges available.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {challenges.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedChal(c);
                      setFlagInput("");
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all shadow-sm flex items-center justify-between group ${
                      selectedChal?.id === c.id
                        ? "bg-[#ff003c]/15 border-[#ff003c]/60 shadow-[inset_0_0_15px_rgba(255,0,60,0.15)]"
                        : "bg-black/40 border-white/10 hover:border-white/30 hover:bg-black/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center border ${c.isSolved ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-white/5 border-white/10 text-slate-400 group-hover:text-[#ff003c] group-hover:border-[#ff003c]/30"}`}
                      >
                        {c.isSolved ? (
                          <CheckCircle2 className="h-4 w-4 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]" />
                        ) : (
                          <Terminal className="h-4 w-4" />
                        )}
                      </div>
                      <span
                        className={`font-mono text-sm tracking-wide ${c.isSolved ? "text-green-400 line-through opacity-50" : "text-white"}`}
                      >
                        {c.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono bg-black/50 px-2 py-1 rounded border border-white/5 text-[#ff003c] drop-shadow-[0_0_5px_rgba(255,0,60,0.5)]">
                      {c.points}P
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CyberCard>
        </div>

        {/* Right Col: Challenge Details */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedChal ? (
            <div className="h-[500px] border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-500 space-y-4 bg-[#020610]/40 shadow-inner">
              <Flag className="h-16 w-16 opacity-30 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
              <p className="font-mono text-sm tracking-widest uppercase">
                Select a target to view intel
              </p>
            </div>
          ) : (
            <CyberCard
              variant={selectedChal.isSolved ? "plain" : "magenta"}
              className="p-8 bg-[#020610]/80 backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden"
            >
              {/* Background accent */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff003c]/5 blur-[100px] pointer-events-none" />

              <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-6 relative z-10">
                <div>
                  <h2 className="text-3xl font-display font-bold text-white flex items-center gap-3 tracking-wide">
                    {selectedChal.title}
                    {selectedChal.isSolved && (
                      <CheckCircle2 className="h-6 w-6 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                    )}
                  </h2>
                  <div className="mt-3 flex gap-2">
                    <span className="text-[9px] font-mono uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/10">
                      CAT: {selectedChal.category}
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-widest bg-[#ff003c]/10 text-[#ff003c] px-2 py-1 rounded border border-[#ff003c]/30 flex items-center gap-1 drop-shadow-[0_0_5px_rgba(255,0,60,0.5)]">
                      <Trophy className="h-3 w-3" /> {selectedChal.points} POINTS
                    </span>
                  </div>
                </div>
              </div>
              <div className="prose prose-invert prose-sm font-mono max-w-none text-slate-300 mb-6 leading-relaxed bg-black/40 p-6 rounded-xl border border-white/5 shadow-inner relative z-10">
                {selectedChal.description}
              </div>

              {/* MITRE ATT&CK Mapping */}
              <div className="bg-black/30 p-4 rounded-xl border border-white/5 mb-10 relative z-10">
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-3">
                  Enterprise Framework Coverage
                </h3>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-mono font-bold text-white">
                    {getMitreMapping(selectedChal.category).id}
                  </span>
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                    {getMitreMapping(selectedChal.category).tactic}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-sans">
                  {getMitreMapping(selectedChal.category).name}
                </p>
              </div>

              {selectedChal.isSolved ? (
                <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 font-mono text-sm text-center shadow-[inset_0_0_20px_rgba(74,222,128,0.1)] relative z-10">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <ShieldAlert className="h-5 w-5 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                  </div>
                  TARGET COMPROMISED. FLAG CAPTURED.
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 bg-black/60 p-6 rounded-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative z-10"
                >
                  <div className="space-y-3">
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Terminal className="h-3 w-3 text-[#ff003c] drop-shadow-[0_0_5px_rgba(255,0,60,0.5)]" />{" "}
                      SUBMIT CAPTURED FLAG
                    </label>
                    <div className="flex gap-3">
                      <Input
                        placeholder="flag{...}"
                        value={flagInput}
                        onChange={(e) => setFlagInput(e.target.value)}
                        className="font-mono bg-black/40 border-white/20 focus-visible:border-[#ff003c] h-12 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] transition-colors text-[#ff003c]"
                      />
                      <CyberButton
                        type="submit"
                        variant="magenta"
                        disabled={submitting}
                        className="px-8 h-12 shadow-[0_0_15px_rgba(255,0,60,0.2)] hover:shadow-[0_0_25px_rgba(255,0,60,0.4)]"
                      >
                        {submitting ? "Analyzing..." : "Submit"}
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
