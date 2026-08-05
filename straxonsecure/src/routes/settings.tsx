import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  User,
  Settings as SettingsIcon,
  Bell,
  Shield,
  Mail,
  Save,
  Key,
  LogOut,
} from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings & Profile — Straxon Secure" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    // Load display_name from profiles table
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
        else setDisplayName(user.email?.split("@")[0] ?? "");
      });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Upsert into profiles table
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, display_name: displayName }, { onConflict: "id" });

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin + "/auth",
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent to " + user.email);
  };

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  if (loading || !user) return null;

  return (
    <div className="px-4 lg:px-8 py-8 max-w-5xl mx-auto space-y-6">
      <SectionHeading
        eyebrow="// SYSTEM PREFERENCES"
        title="Account Settings"
        description="Manage your profile, adjust notification alerts, and configure security preferences."
      />

      <div className="grid lg:grid-cols-4 gap-6">
        {/* SIDEBAR */}
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono transition-colors bg-primary/10 text-primary border border-primary/20">
            <User className="h-4 w-4" /> Profile Info
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono text-muted-foreground transition-colors hover:bg-white/5 hover:text-white">
            <Bell className="h-4 w-4" /> Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono text-muted-foreground transition-colors hover:bg-white/5 hover:text-white">
            <Shield className="h-4 w-4" /> Security
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive mt-8"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>

        {/* MAIN PANEL */}
        <div className="lg:col-span-3 space-y-6">
          <CyberCard variant="cyan">
            <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-4">
              <SettingsIcon className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-bold">Operator Identity</h2>
            </div>

            <div className="space-y-5 max-w-md">
              <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Email Address
                </label>
                <div className="flex items-center gap-3 px-3 py-2 bg-black/40 border border-border/50 rounded-lg text-muted-foreground cursor-not-allowed">
                  <Mail className="h-4 w-4 opacity-50" />
                  <span className="text-sm font-mono">{user.email}</span>
                </div>
                <p className="text-[10px] text-muted-foreground/60">
                  Email cannot be changed directly.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Display Name (Leaderboard)
                </label>
                <div className="flex items-center gap-3 px-3 py-2 bg-black/20 border border-primary/30 rounded-lg focus-within:border-primary transition-colors">
                  <User className="h-4 w-4 text-primary/50" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. CyberNinja99"
                    className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-foreground placeholder:text-muted-foreground/30"
                  />
                </div>
              </div>

              <CyberButton
                onClick={handleSaveProfile}
                disabled={saving}
                variant="cyan"
                className="w-full justify-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving Data..." : "Save Preferences"}
              </CyberButton>
            </div>
          </CyberCard>

          <CyberCard variant="plain" className="opacity-70">
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-display text-lg font-bold">Password Reset</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Need to change your credentials? We will send a secure password reset link to your
              registered email address.
            </p>
            <CyberButton
              variant="plain"
              onClick={handlePasswordReset}
            >
              Send Reset Link
            </CyberButton>
          </CyberCard>
        </div>
      </div>
    </div>
  );
}
