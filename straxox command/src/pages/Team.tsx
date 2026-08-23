import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Users, Shield, Trash2, ChevronDown, CheckCircle2, Clock } from "lucide-react";

const ROLES = ["Owner", "Admin", "Finance", "Sales", "Delivery", "Employee", "ReadOnly"] as const;
type Role = typeof ROLES[number];

const ROLE_CONFIG: Record<string, { color: string; bg: string }> = {
  Owner:    { color: "text-amber-400",  bg: "bg-amber-500/10" },
  Admin:    { color: "text-red-400",    bg: "bg-red-500/10" },
  Finance:  { color: "text-green-400",  bg: "bg-green-500/10" },
  Sales:    { color: "text-cyan-400",   bg: "bg-cyan-500/10" },
  Delivery: { color: "text-indigo-400", bg: "bg-indigo-500/10" },
  Employee: { color: "text-zinc-300",   bg: "bg-zinc-700/40" },
  ReadOnly: { color: "text-zinc-500",   bg: "bg-zinc-800/60" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function Team() {
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "Employee" as Role, password: "" });

  const { data: team = [], isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/team");
      if (!res.ok) throw new Error("Failed to load team");
      return res.json();
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await authFetch("/api/v1/team/invite", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to invite"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      setShowInviteModal(false);
      setForm({ name: "", email: "", role: "Employee", password: "" });
      toast.success("Team member invited!");
    },
    onError: (e: any) => toast.error(e.message || "Failed to invite"),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const res = await authFetch(`/api/v1/team/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["team"] }); setEditingRole(null); toast.success("Role updated"); },
    onError: () => toast.error("Failed to update role"),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/v1/team/${id}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to remove"); }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["team"] }); toast.success("Member removed"); },
    onError: (e: any) => toast.error(e.message || "Failed to remove"),
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm font-mono">Loading team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Team Management</h1>
          <p className="text-zinc-500 text-xs font-mono mt-0.5">{team.length} members in your organization</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-900/30">
          <Plus className="w-4 h-4 mr-2" /> Invite Member
        </Button>
      </div>

      {/* Role Summary */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map((role) => {
          const count = team.filter((m: any) => m.role === role).length;
          if (count === 0) return null;
          const cfg = ROLE_CONFIG[role];
          return (
            <Badge key={role} className={`${cfg.bg} ${cfg.color} border-0 text-xs px-3 py-1`}>
              <Shield className="w-3 h-3 mr-1" />{role}: {count}
            </Badge>
          );
        })}
      </div>

      {/* Team Table */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {team.map((member: any, idx: number) => {
            const roleCfg = ROLE_CONFIG[member.role] || ROLE_CONFIG["Employee"];
            const completedTasks = member.tasks?.filter((t: any) => t.status === "completed").length || 0;
            const totalTasks = member.tasks?.length || 0;
            const inProgressTasks = member.tasks?.filter((t: any) => t.status === "in-progress").length || 0;
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card className="glass-card border-zinc-800 hover:border-zinc-700 transition-all group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: `hsl(${(member.name.charCodeAt(0) * 47) % 360}, 65%, 45%)` }}
                      >
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-zinc-100">{member.name}</span>
                          <Badge className={`${roleCfg.bg} ${roleCfg.color} border-0 text-[10px] px-2`}>
                            <Shield className="w-2.5 h-2.5 mr-1" />{member.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-500 font-mono mt-0.5">{member.email}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5 font-mono">Joined {formatDate(member.createdAt)}</p>
                      </div>

                      {/* Task stats */}
                      <div className="hidden sm:flex items-center gap-4 text-center">
                        <div>
                          <p className="text-sm font-bold text-zinc-200">{totalTasks}</p>
                          <p className="text-[10px] text-zinc-600 font-mono uppercase">Tasks</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-cyan-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{completedTasks}</p>
                          <p className="text-[10px] text-zinc-600 font-mono uppercase">Done</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-blue-400 flex items-center gap-1"><Clock className="w-3 h-3" />{inProgressTasks}</p>
                          <p className="text-[10px] text-zinc-600 font-mono uppercase">Active</p>
                        </div>
                      </div>

                      {/* Role editor */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {editingRole === member.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              defaultValue={member.role}
                              onChange={(e) => updateRoleMutation.mutate({ id: member.id, role: e.target.value })}
                              className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
                            >
                              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <button onClick={() => setEditingRole(null)} className="text-zinc-500 hover:text-zinc-300"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingRole(member.id)}
                            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300 transition-all p-1.5 rounded-lg hover:bg-zinc-800 flex items-center gap-1 text-xs"
                          >
                            <Shield className="w-3.5 h-3.5" /> Role
                          </button>
                        )}
                        <button
                          onClick={() => removeMutation.mutate(member.id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-1.5 rounded-lg hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          {team.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="w-12 h-12 text-zinc-700 mb-4" />
              <p className="text-zinc-400 font-medium">No team members yet</p>
              <p className="text-zinc-600 text-sm mt-1">Invite your first team member to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-md glass-card border border-zinc-700 rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div><h2 className="text-lg font-bold text-zinc-100">Invite Team Member</h2><p className="text-xs text-zinc-500 font-mono mt-0.5">Add someone to your organization</p></div>
                <button onClick={() => setShowInviteModal(false)} className="text-zinc-500 hover:text-zinc-300"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-zinc-400 text-xs mb-1.5 block font-mono uppercase tracking-wider">Full Name *</Label>
                  <Input placeholder="Aryan Sharma" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="bg-zinc-900 border-zinc-700 text-zinc-200 focus:border-violet-500" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs mb-1.5 block font-mono uppercase tracking-wider">Email *</Label>
                  <Input type="email" placeholder="aryan@straxon.com" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="bg-zinc-900 border-zinc-700 text-zinc-200 focus:border-violet-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-zinc-400 text-xs mb-1.5 block font-mono uppercase tracking-wider">Role</Label>
                    <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value as Role }))} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors">
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-zinc-400 text-xs mb-1.5 block font-mono uppercase tracking-wider">Temp Password *</Label>
                    <Input type="password" placeholder="Min 6 chars" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} className="bg-zinc-900 border-zinc-700 text-zinc-200 focus:border-violet-500" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowInviteModal(false)} className="flex-1 text-zinc-400 border border-zinc-700">Cancel</Button>
                <Button onClick={() => {
                  if (!form.name.trim()) return toast.error("Enter a name");
                  if (!form.email.trim()) return toast.error("Enter an email");
                  if (!form.password || form.password.length < 6) return toast.error("Password must be at least 6 characters");
                  inviteMutation.mutate(form);
                }} disabled={inviteMutation.isPending} className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white">
                  {inviteMutation.isPending ? "Inviting..." : "Send Invite"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
