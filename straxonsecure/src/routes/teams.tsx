import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Trophy, Plus, Copy, LogIn, Medal, Star } from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getGlobalLeaderboard } from "@/server/posture";
import { toast } from "sonner";

export const Route = createFileRoute("/teams")({
  head: () => ({
    meta: [
      { title: "Teams & Leaderboard — Straxon" },
      {
        name: "description",
        content: "Create team workspaces, invite operators, climb the leaderboard.",
      },
    ],
  }),
  component: TeamsPage,
});

interface Team {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
}

interface LeaderRow {
  rank: number;
  userId: string;
  displayName: string;
  totalScore: number;
  level: number;
  isCurrentUser: boolean;
  badges: string[];
}

function TeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [board, setBoard] = useState<LeaderRow[]>([]);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [boardLoading, setBoardLoading] = useState(true);

  const refresh = async () => {
    if (!user) return;
    const [t] = await Promise.all([
      supabase.from("teams").select("*").order("created_at", { ascending: false }),
    ]);
    setTeams((t.data as Team[]) ?? []);
  };

  const refreshBoard = async () => {
    setBoardLoading(true);
    try {
      const res = await getGlobalLeaderboard();
      setBoard((res.leaderboard as LeaderRow[]) ?? []);
    } catch {
    } finally {
      setBoardLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    refreshBoard();
  }, [user]);

  const createTeam = async () => {
    if (!user || !newName.trim()) return;
    const { error } = await supabase
      .from("teams")
      .insert({ name: newName.trim(), owner_id: user.id });
    if (error) return toast.error(error.message);
    // auto-add owner as member
    const { data: t } = await supabase
      .from("teams")
      .select("*")
      .eq("name", newName.trim())
      .eq("owner_id", user.id)
      .single();
    if (t)
      await supabase
        .from("team_members")
        .insert({ team_id: t.id, user_id: user.id, role: "owner" });
    setNewName("");
    toast.success("Team created");
    refresh();
  };

  const joinTeam = async () => {
    if (!user || !joinCode.trim()) return;
    const { data: team, error } = await supabase
      .from("teams")
      .select("id")
      .eq("invite_code", joinCode.trim())
      .maybeSingle();
    if (error || !team) return toast.error("Invalid invite code");
    const { error: jerr } = await supabase
      .from("team_members")
      .insert({ team_id: team.id, user_id: user.id });
    if (jerr) return toast.error(jerr.message);
    setJoinCode("");
    toast.success("Joined team");
    refresh();
  };

  const copyInvite = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Invite code copied");
  };

  if (!user) {
    return (
      <div className="px-4 lg:px-8 py-12 max-w-md mx-auto text-center">
        <CyberCard variant="cyan" className="p-8">
          <Users className="h-10 w-10 text-primary mx-auto mb-3" />
          <h2 className="font-display text-xl mb-3">Sign in to access Teams</h2>
          <a href="/auth">
            <CyberButton variant="cyan">Sign In</CyberButton>
          </a>
        </CyberCard>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-8 max-w-6xl mx-auto space-y-6">
      <SectionHeading
        eyebrow="// COLLAB"
        title="Teams & Leaderboard"
        description="Form a squad, invite operators, and compete on the global lab leaderboard."
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <CyberCard variant="cyan" className="p-6">
          <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4" /> CREATE TEAM
          </div>
          <div className="flex gap-2 mb-6">
            <Input
              placeholder="Team name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="font-mono"
            />
            <CyberButton onClick={createTeam}>Create</CyberButton>
          </div>

          <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
            <LogIn className="h-4 w-4" /> JOIN TEAM
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Invite code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="font-mono"
            />
            <CyberButton variant="magenta" onClick={joinTeam}>
              Join
            </CyberButton>
          </div>
        </CyberCard>

        <CyberCard variant="magenta" className="p-6">
          <div className="text-xs font-mono uppercase tracking-widest text-accent mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" /> YOUR TEAMS
          </div>
          {teams.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No teams yet. Create or join one.
            </p>
          ) : (
            <div className="space-y-2">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between border-b border-border/30 pb-2"
                >
                  <div>
                    <div className="font-display font-semibold">{t.name}</div>
                    <div className="text-xs font-mono text-muted-foreground">
                      CODE: {t.invite_code}
                    </div>
                  </div>
                  <button
                    onClick={() => copyInvite(t.invite_code)}
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
              ))}
            </div>
          )}
        </CyberCard>
      </div>

      <CyberCard variant="cyan" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-mono uppercase tracking-widest text-primary flex items-center gap-2">
            <Trophy className="h-4 w-4" /> GLOBAL LEADERBOARD
          </div>
          <button
            onClick={refreshBoard}
            className="text-xs font-mono text-slate-500 hover:text-[#00f3ff] transition-colors"
          >
            Refresh
          </button>
        </div>
        {boardLoading ? (
          <p className="text-sm text-muted-foreground italic">Loading leaderboard...</p>
        ) : board.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No operators ranked yet. Complete labs to climb the board.
          </p>
        ) : (
          <div className="space-y-2">
            {board.map((row) => (
              <div
                key={row.userId}
                className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                  row.isCurrentUser
                    ? "bg-[#00f3ff]/5 border border-[#00f3ff]/20"
                    : "hover:bg-white/3"
                }`}
              >
                <span
                  className={`font-display text-xl font-bold w-10 ${
                    row.rank === 1
                      ? "text-yellow-400"
                      : row.rank === 2
                        ? "text-slate-300"
                        : row.rank === 3
                          ? "text-orange-400"
                          : "text-muted-foreground"
                  }`}
                >
                  {row.rank === 1
                    ? "🥇"
                    : row.rank === 2
                      ? "🥈"
                      : row.rank === 3
                        ? "🥉"
                        : `#${row.rank}`}
                </span>
                <div className="flex-1">
                  <div className="font-mono flex items-center gap-2">
                    {row.displayName}
                    {row.isCurrentUser && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/20">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">Level {row.level} Operator</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-bold text-[#00f3ff]">
                    {row.totalScore.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">XP</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CyberCard>
    </div>
  );
}
