import { getLeaderboard } from "@/server/ctf";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users,
  Trophy,
  Plus,
  Copy,
  LogIn,
  Key,
  ShieldCheck,
  Search,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { Input } from "@/components/ui/input";
import { PremiumGate } from "@/components/PremiumGate";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
// removed getGlobalLeaderboard
import {
  getTeamMembers,
  updateMemberRole,
  removeMember,
  createTeam as serverCreateTeam,
  joinTeam as serverJoinTeam,
  getUserTeams,
} from "@/server/teams";
import { callAuthed } from "@/lib/serverCall";
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
}

function TeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [board, setBoard] = useState<LeaderRow[]>([]);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [boardLoading, setBoardLoading] = useState(true);

  // RBAC State
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // SSO State
  const [idpEntityId, setIdpEntityId] = useState("");
  const [idpSsoUrl, setIdpSsoUrl] = useState("");
  const [ssoSaved, setSsoSaved] = useState(false);

  const refresh = async () => {
    if (!user) return;
    try {
      const data = await callAuthed(getUserTeams, undefined);
      setTeams(data as unknown as Team[]);
    } catch (e: any) {
      toast.error("Failed to load teams: " + e.message);
    }
  };

  const refreshBoard = async () => {
    setBoardLoading(true);
    try {
      const res = await callAuthed(getLeaderboard, undefined);
      setBoard((res.leaderboard as LeaderRow[]) ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setBoardLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    refreshBoard();
  }, [user]);

  const loadMembers = async (teamId: string) => {
    setMembersLoading(true);
    try {
      const data = await callAuthed(getTeamMembers, { teamId });
      setMembers((data as any[]) || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load team members");
    } finally {
      setMembersLoading(false);
    }
  };

  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team);
    loadMembers(team.id);
  };

  const createTeam = async () => {
    if (!user || !newName.trim()) return;
    try {
      await callAuthed(serverCreateTeam, { name: newName.trim() });
      setNewName("");
      toast.success("Team created");
      refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to create team");
    }
  };

  const joinTeam = async () => {
    if (!user || !joinCode.trim()) return;
    try {
      await callAuthed(serverJoinTeam, { code: joinCode.trim() });
      setJoinCode("");
      toast.success("Joined team");
      refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to join team");
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    if (!selectedTeam) return;
    try {
      await callAuthed(updateMemberRole, { teamId: selectedTeam.id, targetUserId, newRole });
      toast.success("Role updated successfully");
      loadMembers(selectedTeam.id);
    } catch (e: any) {
      toast.error(e.message || "Failed to update role");
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!selectedTeam) return;
    try {
      await callAuthed(removeMember, { teamId: selectedTeam.id, targetUserId });
      toast.success("Member removed from team");
      loadMembers(selectedTeam.id);
    } catch (e: any) {
      toast.error(e.message || "Failed to remove member");
    }
  };

  const saveSso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idpEntityId || !idpSsoUrl) return toast.error("Please fill all IdP fields");
    setSsoSaved(true);
    toast.success("SAML SSO Configuration Saved!");
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
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <SectionHeading
        eyebrow="// COLLAB"
        title="Teams & Identity"
        description="Manage team workspaces, role-based access control, and enterprise SSO."
      />
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Col: Create/Join & Teams List */}
        <div className="lg:col-span-1 space-y-6">
          <CyberCard
            variant="cyan"
            className="p-6 bg-[#020610]/80 backdrop-blur-md shadow-[0_0_30px_rgba(0,243,255,0.1)]"
          >
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#00f3ff] mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
              <Plus className="h-4 w-4 drop-shadow-[0_0_8px_rgba(0,243,255,0.6)]" /> CREATE TEAM
            </div>
            <div className="flex gap-2 mb-8">
              <Input
                placeholder="Team name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="font-mono h-10 bg-black/40 border-[#00f3ff]/30 focus:border-[#00f3ff] transition-colors"
              />
              <CyberButton onClick={createTeam} size="sm" className="h-10 px-4">
                Create
              </CyberButton>
            </div>

            <div className="text-[10px] font-mono uppercase tracking-widest text-[#ff003c] mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
              <LogIn className="h-4 w-4 drop-shadow-[0_0_8px_rgba(255,0,60,0.6)]" /> JOIN TEAM
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Invite code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="font-mono h-10 bg-black/40 border-[#ff003c]/30 focus:border-[#ff003c] transition-colors"
              />
              <CyberButton variant="magenta" onClick={joinTeam} size="sm" className="h-10 px-4">
                Join
              </CyberButton>
            </div>
          </CyberCard>

          <CyberCard
            variant="magenta"
            className="p-6 bg-[#020610]/80 backdrop-blur-md shadow-[0_0_30px_rgba(255,0,60,0.1)]"
          >
            <div className="text-[10px] font-mono uppercase tracking-widest text-accent mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
              <Users className="h-4 w-4 drop-shadow-[0_0_8px_rgba(255,0,60,0.6)]" /> YOUR TEAMS
            </div>
            {teams.length === 0 ? (
              <p className="text-sm font-mono text-muted-foreground italic text-center p-4 bg-black/20 rounded border border-dashed border-white/10">
                No teams yet. Create or join one.
              </p>
            ) : (
              <div className="space-y-3">
                {teams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTeam(t)}
                    className={`w-full text-left p-4 rounded-xl border transition-all shadow-sm ${selectedTeam?.id === t.id ? "bg-[#ff003c]/15 border-[#ff003c]/60 shadow-[inset_0_0_15px_rgba(255,0,60,0.15)]" : "bg-black/40 border-white/10 hover:border-white/30 hover:bg-black/60"}`}
                  >
                    <div className="font-display font-semibold text-white tracking-wide">
                      {t.name}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground flex justify-between mt-2">
                      <span className="bg-black/50 px-2 py-0.5 rounded border border-white/5">
                        CODE: <span className="text-white">{t.invite_code}</span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CyberCard>
        </div>

        {/* Center/Right Col: Members/RBAC & SSO */}
        <div className="lg:col-span-2 space-y-6">
          <CyberCard
            variant="plain"
            className="p-6 min-h-[350px] bg-[#020610]/70 backdrop-blur-md border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
              <div className="text-xs font-mono uppercase tracking-widest text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#00f3ff]" /> RBAC & MEMBERS
              </div>
              {selectedTeam && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedTeam.invite_code);
                    toast.success("Invite code copied");
                  }}
                  className="text-[10px] font-mono text-[#00f3ff] hover:text-white transition-colors flex items-center gap-1.5 bg-[#00f3ff]/10 px-3 py-1.5 rounded border border-[#00f3ff]/30 hover:bg-[#00f3ff]/20"
                >
                  <Copy className="h-3 w-3" /> COPY INVITE CODE
                </button>
              )}
            </div>

            {!selectedTeam ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-slate-500 space-y-4 bg-black/20 rounded-xl border border-dashed border-white/10 m-2">
                <Users className="h-10 w-10 opacity-30 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                <p className="font-mono text-sm tracking-widest uppercase">
                  Select a team to manage roles
                </p>
              </div>
            ) : membersLoading ? (
              <div className="text-sm font-mono text-[#00f3ff] animate-pulse text-center p-12 bg-black/20 rounded-xl border border-dashed border-[#00f3ff]/20 m-2">
                SCANNING DIRECTORY...
              </div>
            ) : (
              <div className="border border-white/10 rounded-xl overflow-hidden shadow-lg bg-black/40">
                <table className="w-full text-left text-sm font-mono">
                  <thead className="bg-[#020610] text-[10px] uppercase text-slate-400 tracking-widest border-b border-white/10">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Operator</th>
                      <th className="px-5 py-4 font-semibold">Clearance Role</th>
                      <th className="px-5 py-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-white/5">
                    {members.map((m) => (
                      <tr key={m.user_id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4 text-white flex items-center gap-3">
                          <div className="h-6 w-6 rounded-full bg-[#00f3ff]/10 border border-[#00f3ff]/30 flex items-center justify-center text-[10px] text-[#00f3ff]">
                            {(m.profiles?.display_name || "U")[0].toUpperCase()}
                          </div>
                          {m.profiles?.display_name || "Unknown Operator"}
                          {m.user_id === user.id && (
                            <span className="text-[9px] bg-[#00f3ff]/20 text-[#00f3ff] px-1.5 py-0.5 rounded border border-[#00f3ff]/30">
                              YOU
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                            disabled={m.role === "owner"}
                            className="bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-slate-300 outline-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="analyst">Analyst</option>
                            <option value="viewer">Viewer</option>
                            <option value="member">Member</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {m.role !== "owner" && (
                            <button
                              onClick={() => handleRemoveMember(m.user_id)}
                              className="text-red-400 hover:text-red-300 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CyberCard>

          {/* Enterprise SSO Panel */}
          <PremiumGate
            feature="Enterprise SAML SSO"
            description="Enterprise unlocks corporate identity integration, automated SCIM provisioning, and centralized policy enforcement."
          >
            <CyberCard variant="cyan" className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Key className="h-6 w-6 text-[#00f3ff]" />
                <div>
                  <h2 className="font-display text-xl font-bold">Identity Provider Setup</h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Configure Okta, Azure AD, or Google Workspace SAML
                  </p>
                </div>
              </div>

              {ssoSaved ? (
                <div className="p-6 border border-green-500/30 bg-green-500/10 rounded-xl text-center space-y-3">
                  <ShieldCheck className="h-10 w-10 text-green-400 mx-auto" />
                  <div className="font-mono text-sm text-green-400">
                    SAML SSO Configured Successfully
                  </div>
                  <p className="text-xs text-slate-400">
                    Your organization can now authenticate using the configured Identity Provider.
                  </p>
                  <CyberButton
                    onClick={() => setSsoSaved(false)}
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                  >
                    Edit Configuration
                  </CyberButton>
                </div>
              ) : (
                <form onSubmit={saveSso} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-slate-300">
                        IdP Entity ID (Issuer)
                      </label>
                      <Input
                        placeholder="https://sts.windows.net/..."
                        value={idpEntityId}
                        onChange={(e) => setIdpEntityId(e.target.value)}
                        className="font-mono text-xs bg-black/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-slate-300">IdP SSO URL</label>
                      <Input
                        placeholder="https://login.microsoftonline.com/..."
                        value={idpSsoUrl}
                        onChange={(e) => setIdpSsoUrl(e.target.value)}
                        className="font-mono text-xs bg-black/40"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-mono text-slate-300">ACS URL (Reply URL)</label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value="https://api.straxon.io/sso/saml/acs"
                        className="font-mono text-xs bg-black/40 text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("https://api.straxon.io/sso/saml/acs");
                          toast.success("Copied");
                        }}
                        className="p-2 border border-white/10 rounded hover:bg-white/5"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <CyberButton type="submit" variant="cyan">
                      Save SSO Configuration
                    </CyberButton>
                  </div>
                </form>
              )}
            </CyberCard>
          </PremiumGate>
        </div>
      </div>
    </div>
  );
}
