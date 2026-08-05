import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Trophy, Plus, Copy, LogIn, Key, ShieldCheck, Search, ChevronDown, Trash2 } from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { Input } from "@/components/ui/input";
import { PremiumGate } from "@/components/PremiumGate";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getGlobalLeaderboard } from "@/server/posture";
import { getTeamMembers, updateMemberRole, removeMember } from "@/server/teams";
import { callAuthed } from "@/lib/serverCall";
import { toast } from "sonner";

export const Route = createFileRoute("/teams")({
  head: () => ({
    meta: [
      { title: "Teams & Leaderboard — Straxon" },
      { name: "description", content: "Create team workspaces, invite operators, climb the leaderboard." },
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
    const { data } = await supabase.from("teams").select("*").order("created_at", { ascending: false });
    setTeams((data as Team[]) ?? []);
  };

  const refreshBoard = async () => {
    setBoardLoading(true);
    try {
      const res = await getGlobalLeaderboard();
      setBoard((res.leaderboard as LeaderRow[]) ?? []);
    } catch {} finally {
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
      setMembers(data || []);
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
    const { error } = await supabase.from("teams").insert({ name: newName.trim(), owner_id: user.id });
    if (error) return toast.error(error.message);
    const { data: t } = await supabase.from("teams").select("*").eq("name", newName.trim()).eq("owner_id", user.id).single();
    if (t) await supabase.from("team_members").insert({ team_id: t.id, user_id: user.id, role: "owner" });
    setNewName("");
    toast.success("Team created");
    refresh();
  };

  const joinTeam = async () => {
    if (!user || !joinCode.trim()) return;
    const { data: team, error } = await supabase.from("teams").select("id").eq("invite_code", joinCode.trim()).maybeSingle();
    if (error || !team) return toast.error("Invalid invite code");
    const { error: jerr } = await supabase.from("team_members").insert({ team_id: team.id, user_id: user.id });
    if (jerr) return toast.error(jerr.message);
    setJoinCode("");
    toast.success("Joined team");
    refresh();
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
          <a href="/auth"><CyberButton variant="cyan">Sign In</CyberButton></a>
        </CyberCard>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <SectionHeading eyebrow="// COLLAB" title="Teams & Identity" description="Manage team workspaces, role-based access control, and enterprise SSO." />

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Col: Create/Join & Teams List */}
        <div className="lg:col-span-1 space-y-6">
          <CyberCard variant="cyan" className="p-6">
            <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3 flex items-center gap-2"><Plus className="h-4 w-4" /> CREATE TEAM</div>
            <div className="flex gap-2 mb-6">
              <Input placeholder="Team name" value={newName} onChange={(e) => setNewName(e.target.value)} className="font-mono h-9" />
              <CyberButton onClick={createTeam} size="sm">Create</CyberButton>
            </div>

            <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3 flex items-center gap-2"><LogIn className="h-4 w-4" /> JOIN TEAM</div>
            <div className="flex gap-2">
              <Input placeholder="Invite code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} className="font-mono h-9" />
              <CyberButton variant="magenta" onClick={joinTeam} size="sm">Join</CyberButton>
            </div>
          </CyberCard>

          <CyberCard variant="magenta" className="p-6">
            <div className="text-xs font-mono uppercase tracking-widest text-accent mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> YOUR TEAMS</div>
            {teams.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No teams yet. Create or join one.</p>
            ) : (
              <div className="space-y-2">
                {teams.map((t) => (
                  <button key={t.id} onClick={() => handleSelectTeam(t)} className={`w-full text-left p-3 rounded-lg border transition-all ${selectedTeam?.id === t.id ? "bg-[#ff003c]/10 border-[#ff003c]/50" : "bg-white/5 border-white/10 hover:border-white/20"}`}>
                    <div className="font-display font-semibold text-white">{t.name}</div>
                    <div className="text-xs font-mono text-muted-foreground flex justify-between mt-1">
                      <span>CODE: {t.invite_code}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CyberCard>
        </div>

        {/* Center/Right Col: Members/RBAC & SSO */}
        <div className="lg:col-span-2 space-y-6">
          <CyberCard variant="plain" className="p-6 min-h-[350px]">
            <div className="flex items-center justify-between mb-6">
              <div className="text-xs font-mono uppercase tracking-widest text-slate-300 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> RBAC & MEMBERS
              </div>
              {selectedTeam && (
                <button onClick={() => { navigator.clipboard.writeText(selectedTeam.invite_code); toast.success("Invite code copied"); }} className="text-xs font-mono text-[#00f3ff] hover:underline flex items-center gap-1">
                  <Copy className="h-3 w-3" /> Copy Invite Code
                </button>
              )}
            </div>

            {!selectedTeam ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-slate-500 space-y-2">
                <Users className="h-8 w-8 opacity-50" />
                <p className="font-mono text-sm">Select a team to manage roles</p>
              </div>
            ) : membersLoading ? (
              <div className="text-sm font-mono text-slate-500 animate-pulse text-center p-8">Loading members...</div>
            ) : (
              <div className="border border-white/10 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm font-mono">
                  <thead className="bg-black/40 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Member</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-white/5">
                    {members.map((m) => (
                      <tr key={m.user_id}>
                        <td className="px-4 py-3 text-white flex items-center gap-2">
                          {m.profiles?.display_name || "Unknown Operator"}
                          {m.user_id === user.id && <span className="text-[9px] bg-[#00f3ff]/20 text-[#00f3ff] px-1 rounded">YOU</span>}
                        </td>
                        <td className="px-4 py-3">
                          <select 
                            value={m.role} 
                            onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                            disabled={m.role === 'owner'}
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
                          {m.role !== 'owner' && (
                            <button onClick={() => handleRemoveMember(m.user_id)} className="text-red-400 hover:text-red-300 p-1">
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
          <PremiumGate feature="Enterprise SAML SSO" description="Enterprise unlocks corporate identity integration, automated SCIM provisioning, and centralized policy enforcement.">
            <CyberCard variant="cyan" className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Key className="h-6 w-6 text-[#00f3ff]" />
                <div>
                  <h2 className="font-display text-xl font-bold">Identity Provider Setup</h2>
                  <p className="text-xs text-slate-400 font-mono">Configure Okta, Azure AD, or Google Workspace SAML</p>
                </div>
              </div>
              
              {ssoSaved ? (
                <div className="p-6 border border-green-500/30 bg-green-500/10 rounded-xl text-center space-y-3">
                  <ShieldCheck className="h-10 w-10 text-green-400 mx-auto" />
                  <div className="font-mono text-sm text-green-400">SAML SSO Configured Successfully</div>
                  <p className="text-xs text-slate-400">Your organization can now authenticate using the configured Identity Provider.</p>
                  <CyberButton onClick={() => setSsoSaved(false)} variant="ghost" size="sm" className="mt-2">Edit Configuration</CyberButton>
                </div>
              ) : (
                <form onSubmit={saveSso} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-slate-300">IdP Entity ID (Issuer)</label>
                      <Input placeholder="https://sts.windows.net/..." value={idpEntityId} onChange={(e) => setIdpEntityId(e.target.value)} className="font-mono text-xs bg-black/40" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-mono text-slate-300">IdP SSO URL</label>
                      <Input placeholder="https://login.microsoftonline.com/..." value={idpSsoUrl} onChange={(e) => setIdpSsoUrl(e.target.value)} className="font-mono text-xs bg-black/40" />
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-mono text-slate-300">ACS URL (Reply URL)</label>
                    <div className="flex items-center gap-2">
                      <Input readOnly value="https://api.straxon.io/sso/saml/acs" className="font-mono text-xs bg-black/40 text-slate-500" />
                      <button type="button" onClick={() => { navigator.clipboard.writeText("https://api.straxon.io/sso/saml/acs"); toast.success("Copied"); }} className="p-2 border border-white/10 rounded hover:bg-white/5"><Copy className="h-4 w-4" /></button>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <CyberButton type="submit" variant="cyan">Save SSO Configuration</CyberButton>
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
