import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Mail, Send, Sparkles, CheckCircle2, Clock, RefreshCw,
  Loader2, Bell, AlertCircle, History, CheckCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const EmailDigestEngine = ({ workspaceId }: { workspaceId?: string }) => {
  const { user } = useAuth();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [sending, setSending] = useState(false);
  const [digestHistory, setDigestHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [previewContent, setPreviewContent] = useState<any | null>(null);

  useEffect(() => {
    if (user?.email && !recipientEmail) {
      setRecipientEmail(user.email);
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    const { data } = await supabase
      .from("email_digests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setDigestHistory(data || []);
    setLoadingHistory(false);
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const handleSendDigest = async (isTest = false) => {
    if (!recipientEmail.trim()) {
      toast.error("Please enter a valid recipient email");
      return;
    }

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email-digest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          frequency,
          workspaceId,
          isTest,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to trigger email digest");
      }

      setPreviewContent(json.data);
      toast.success(`Executive ${frequency} digest dispatched!`, {
        description: `Delivered to ${recipientEmail}`,
      });
      loadHistory();
    } catch (err: any) {
      toast.error(err.message || "Failed to send digest");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Engine Setup Card */}
      <Card className="glass-strong p-6 sm:p-8 rounded-3xl border-primary/25 relative overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-xs font-mono uppercase tracking-wider text-primary">
                Autonomous Business Briefing Dispatcher
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">AI Email Digest Engine</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Receive hands-free executive summaries of new client leads, completed automations, and portal feedback directly in your inbox on schedule.
            </p>
          </div>

          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-xs py-1 px-3">
            Resend / SMTP Active
          </Badge>
        </div>

        {/* Configuration Row */}
        <div className="grid sm:grid-cols-3 gap-4 pt-2">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block">
              Recipient Work Email
            </label>
            <Input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="founder@agency.com"
              className="glass text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block">
              Dispatch Cadence
            </label>
            <div className="flex rounded-xl bg-muted/25 p-1 border border-border/40">
              {(["daily", "weekly", "monthly"] as const).map((cadence) => (
                <button
                  key={cadence}
                  onClick={() => setFrequency(cadence)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    frequency === cadence
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cadence}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 pt-6 border-t border-border/30 mt-6">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5 text-primary" /> Auto-scheduled for every Monday at 09:00 UTC
          </span>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={sending}
              onClick={() => handleSendDigest(false)}
              className="bg-gradient-primary text-primary-foreground border-0 shadow-glow font-semibold text-xs px-5 h-9"
            >
              {sending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Generating & Sending…
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Send Intelligence Digest Now
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Live Preview Card */}
      {previewContent && (
        <Card className="glass-strong p-6 rounded-3xl border-primary/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Latest Dispatched Digest Preview</h3>
            </div>
            <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-[10px] font-mono">
              Status: Dispatched
            </Badge>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 border border-border/40 space-y-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-muted-foreground">Executive Overview</span>
              <p className="text-xs text-foreground mt-0.5 leading-relaxed">
                {previewContent.executive_summary}
              </p>
            </div>

            {previewContent.highlights && previewContent.highlights.length > 0 && (
              <div>
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Key Traction Highlights</span>
                <ul className="mt-1 space-y-1">
                  {previewContent.highlights.map((h: string, idx: number) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Sent History Table */}
      <Card className="glass-strong p-6 rounded-3xl border-border/40 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            <History className="h-4 w-4 text-primary" /> Dispatch History Log
          </h3>
          <Button variant="ghost" size="sm" onClick={loadHistory} className="h-8 text-xs">
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh
          </Button>
        </div>

        {loadingHistory ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : digestHistory.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No email digests dispatched yet. Click "Send Intelligence Digest Now" above to trigger your first briefing.
          </div>
        ) : (
          <div className="space-y-2">
            {digestHistory.map((d) => (
              <div
                key={d.id}
                className="p-3.5 rounded-2xl bg-muted/15 border border-border/30 flex items-center justify-between gap-3 text-xs flex-wrap"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground capitalize">{d.frequency} Digest</span>
                    <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-primary border-primary/20">
                      {d.recipient_email}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate max-w-md">
                    {d.executive_summary}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {new Date(d.sent_at).toLocaleDateString()}
                  </span>
                  <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-[10px] font-mono">
                    <CheckCheck className="h-3 w-3 mr-1" /> Sent
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
