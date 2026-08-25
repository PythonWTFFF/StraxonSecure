import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { CyberCard } from "@/components/cyber/CyberCard";
import { ShieldAlert, Users, Server, Activity, Database, Key } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Command Center — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDashboard,
});

interface Profile {
  id: string;
  display_name: string | null;
  role: string;
  created_at: string;
}

function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate({ to: "/auth", replace: true });
      return;
    }

    const checkAdmin = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error || data?.role !== "admin") {
          setIsAdmin(false);
          toast.error("Unauthorized. Admin clearance required.");
          navigate({ to: "/dashboard", replace: true });
        } else {
          setIsAdmin(true);
          fetchSystemData();
        }
      } catch (err) {
        setIsAdmin(false);
        navigate({ to: "/dashboard", replace: true });
      }
    };

    checkAdmin();
  }, [user, authLoading, navigate]);

  const fetchSystemData = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
        
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      toast.error(`Failed to load system data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || isAdmin === null || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4 text-primary font-mono text-sm">
          <ShieldAlert className="w-8 h-8 animate-pulse text-destructive" />
          // VERIFYING CLEARANCE LEVEL...
        </div>
      </div>
    );
  }

  if (!isAdmin) return null; // Fallback, should have navigated

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <SectionHeading
          eyebrow="// SYSTEM COMMAND"
          title="Admin Override"
          description="Global platform telemetry and user management."
        />
        <div className="px-4 py-2 bg-destructive/10 border border-destructive/30 rounded-md flex items-center gap-2 text-destructive font-mono text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(255,0,0,0.2)]">
          <Key className="w-4 h-4" /> Root Access Granted
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CyberCard className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 font-mono text-xs mb-1">TOTAL USERS</p>
              <h3 className="text-3xl font-display font-bold text-white">{users.length}</h3>
            </div>
            <Users className="w-6 h-6 text-blue-500/50" />
          </div>
        </CyberCard>
        
        <CyberCard className="p-6 border-l-4 border-l-green-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 font-mono text-xs mb-1">SYSTEM STATUS</p>
              <h3 className="text-3xl font-display font-bold text-green-400">NOMINAL</h3>
            </div>
            <Activity className="w-6 h-6 text-green-500/50" />
          </div>
        </CyberCard>
        
        <CyberCard className="p-6 border-l-4 border-l-purple-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 font-mono text-xs mb-1">DB CONNECTIONS</p>
              <h3 className="text-3xl font-display font-bold text-white">42</h3>
            </div>
            <Database className="w-6 h-6 text-purple-500/50" />
          </div>
        </CyberCard>

        <CyberCard className="p-6 border-l-4 border-l-orange-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 font-mono text-xs mb-1">ACTIVE NODES</p>
              <h3 className="text-3xl font-display font-bold text-white">8/8</h3>
            </div>
            <Server className="w-6 h-6 text-orange-500/50" />
          </div>
        </CyberCard>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Registered Operators
        </h3>
        <div className="rounded-xl border border-border/50 bg-black/40 overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 border-b border-border/50 text-xs font-mono text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Operator ID</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Display Name</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Clearance (Role)</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">Joined At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-mono">
                      No users found. Ensure public.profiles table is populated.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {u.id.substring(0, 8)}...{u.id.substring(u.id.length - 6)}
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        {u.display_name || "Unknown Operator"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono border ${
                          u.role === 'admin' 
                            ? 'bg-destructive/10 text-destructive border-destructive/20' 
                            : 'bg-primary/10 text-primary border-primary/20'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
