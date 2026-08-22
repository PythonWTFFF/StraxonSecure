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
  Webhook,
  Database,
  CheckCircle2,
} from "lucide-react";
import { callAuthed } from "@/lib/serverCall";
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
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [splunkHec, setSplunkHec] = useState("");
  const [splunkToken, setSplunkToken] = useState("");
  const [testingSplunk, setTestingSplunk] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const anyData = data as any;
        if (anyData?.display_name) setDisplayName(anyData.display_name);
        else setDisplayName(user.email?.split("@")[0] ?? "");
        if (anyData?.avatar_url) setAvatarUrl(anyData.avatar_url);
        if (anyData?.bio) setBio(anyData.bio);
      });

    // Load webhook and splunk from user metadata
    if (user.user_metadata) {
      if (user.user_metadata.slack_webhook_url) {
        setWebhookUrl(user.user_metadata.slack_webhook_url);
      }
      if (user.user_metadata.splunk_hec_url) {
        setSplunkHec(user.user_metadata.splunk_hec_url);
      }
      if (user.user_metadata.splunk_token) {
        setSplunkToken(user.user_metadata.splunk_token);
      }
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Upsert into profiles table
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, display_name: displayName, avatar_url: avatarUrl } as any, {
          onConflict: "id",
        });

      if (error) throw error;

      if (webhookUrl !== undefined || splunkHec !== undefined || splunkToken !== undefined) {
        await supabase.auth.updateUser({
          data: {
            slack_webhook_url: webhookUrl,
            splunk_hec_url: splunkHec,
            splunk_token: splunkToken,
          },
        });
      }

      toast.success("Settings updated successfully");
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const handleTestSplunk = async () => {
    if (!splunkHec || !splunkToken) {
      toast.error("Please enter a valid HEC URL and Token first.");
      return;
    }
    setTestingSplunk(true);
    try {
      const response = await fetch("http://localhost:8082/api/ml/splunk-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hec_url: splunkHec,
          hec_token: splunkToken,
          event_data: { test: "Straxon Connection Test", timestamp: new Date().toISOString() },
        }),
      });
      const res: any = await response.json();
      toast.success(res.message || "Connection successful!");
    } catch (e: any) {
      toast.error(e.message || "Failed to connect to Splunk HEC.");
    } finally {
      setTestingSplunk(false);
    }
  };

  if (loading || !user)
    return <div className="p-8 font-mono text-slate-500">Authenticating...</div>;

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
            onClick={handleSignOut}
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

              <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Avatar URL
                </label>
                <div className="flex items-center gap-3 px-3 py-2 bg-black/20 border border-primary/30 rounded-lg focus-within:border-primary transition-colors">
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-foreground placeholder:text-muted-foreground/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Operator Bio
                </label>
                <div className="flex items-center gap-3 px-3 py-2 bg-black/20 border border-primary/30 rounded-lg focus-within:border-primary transition-colors">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about your security background..."
                    className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-foreground placeholder:text-muted-foreground/30 resize-none h-20"
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

          {/* INTEGRATIONS CARD */}
          <CyberCard variant="ghost" className="bg-[#020610]/80 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-4">
              <Webhook className="h-5 w-5 text-[#ff00ff] drop-shadow-[0_0_8px_rgba(255,0,255,0.6)]" />
              <h2 className="font-display text-lg font-bold">External Integrations</h2>
            </div>

            <div className="space-y-5 max-w-md">
              <p className="text-sm text-muted-foreground mb-4">
                Configure webhooks to receive real-time alerts when the Machine Learning Engine
                detects Critical anomalies.
              </p>
              <div className="space-y-2">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  Slack/Discord Webhook URL
                </label>
                <div className="flex items-center gap-3 px-3 py-2 bg-black/20 border border-[#ff00ff]/30 rounded-lg focus-within:border-[#ff00ff] transition-colors">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-foreground placeholder:text-muted-foreground/30"
                  />
                </div>
              </div>
            </div>
          </CyberCard>

          {/* SIEM Integrations */}
          <CyberCard variant="magenta" className="p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="p-2 bg-fuchsia-500/10 rounded-lg">
                <Database className="h-5 w-5 text-fuchsia-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">SIEM Integrations</h2>
                <p className="text-xs text-slate-400 font-mono">
                  Forward Straxon events to Splunk Enterprise.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                  Splunk HEC URL
                </label>
                <div className="relative">
                  <Database className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="url"
                    value={splunkHec}
                    onChange={(e) => setSplunkHec(e.target.value)}
                    placeholder="https://splunk-heavy-forwarder:8088/services/collector"
                    className="w-full bg-black/40 border border-white/10 rounded px-10 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-fuchsia-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                  HEC Secret Token
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    value={splunkToken}
                    onChange={(e) => setSplunkToken(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full bg-black/40 border border-white/10 rounded px-10 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-fuchsia-500/50"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <p className="text-[10px] text-slate-500 font-mono max-w-[200px]">
                  Requires active Splunk HTTP Event Collector configuration.
                </p>
                <CyberButton
                  variant="outline"
                  onClick={handleTestSplunk}
                  loading={testingSplunk}
                  className="px-4 text-xs hover:bg-fuchsia-500/20 hover:border-fuchsia-500"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  TEST CONNECTION
                </CyberButton>
              </div>
            </div>
          </CyberCard>

          <CyberCard variant="ghost" className="opacity-70">
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-display text-lg font-bold">Password Reset</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Need to change your credentials? We will send a secure password reset link to your
              registered email address.
            </p>
            <CyberButton variant="ghost" onClick={handlePasswordReset}>
              Send Reset Link
            </CyberButton>
          </CyberCard>
        </div>
      </div>
    </div>
  );
}
