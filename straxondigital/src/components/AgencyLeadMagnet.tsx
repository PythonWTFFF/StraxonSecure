import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users, Mail, Globe, Download, Copy, CheckCircle2, Sparkles,
  ArrowRight, ShieldCheck, RefreshCw, Send, Trash2, ExternalLink, Code2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface LeadRecord {
  id: string;
  lead_name: string | null;
  lead_email: string;
  lead_website: string | null;
  audit_score: number | null;
  audit_grade: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export const AgencyLeadMagnet = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [wsId, setWsId] = useState<string | null>(null);

  // Quick simulated lead capture test
  const [testName, setTestName] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testWebsite, setTestWebsite] = useState("");
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (user) {
      supabase
        .from("workspaces")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setWsId(data.id);
            loadLeads(data.id);
          }
        });
    }
  }, [user]);

  const loadLeads = async (workspaceId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("agency_leads")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    setLeads((data as LeadRecord[]) || []);
    setLoading(false);
  };

  const handleTestCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim() || !wsId || !user) {
      toast.error("Please provide a valid lead email");
      return;
    }

    setCapturing(true);
    try {
      const randomScore = Math.floor(Math.random() * 45) + 40; // 40-85
      const grade = randomScore >= 80 ? "A" : randomScore >= 65 ? "B" : randomScore >= 50 ? "C" : "D";

      const { error } = await supabase.from("agency_leads").insert({
        workspace_id: wsId,
        user_id: user.id,
        lead_name: testName || null,
        lead_email: testEmail,
        lead_website: testWebsite || null,
        audit_score: randomScore,
        audit_grade: grade,
        status: "new",
        notes: `Simulated lead capture via Lead Magnet Widget on ${new Date().toLocaleDateString()}`,
      });

      if (error) throw error;

      toast.success("Test Lead Captured!", {
        description: `Lead for ${testEmail} logged with ${grade} diagnostic grade.`,
      });

      setTestName("");
      setTestEmail("");
      setTestWebsite("");
      loadLeads(wsId);
    } catch (err: any) {
      toast.error(err.message || "Failed to capture lead");
    } finally {
      setCapturing(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    await supabase.from("agency_leads").update({ status: newStatus }).eq("id", leadId);
    toast.success(`Lead marked as ${newStatus}`);
    if (wsId) loadLeads(wsId);
  };

  const deleteLead = async (leadId: string) => {
    await supabase.from("agency_leads").delete().eq("id", leadId);
    toast.success("Lead removed");
    if (wsId) loadLeads(wsId);
  };

  const exportLeadsCSV = () => {
    if (leads.length === 0) return;
    const header = "Name,Email,Website,Score,Grade,Status,Date\n";
    const rows = leads
      .map(
        (l) =>
          `"${l.lead_name || ""}","${l.lead_email}","${l.lead_website || ""}",${l.audit_score || ""},"${l.audit_grade || ""}","${l.status}","${new Date(l.created_at).toLocaleDateString()}"`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agency-leads-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Leads exported to CSV!");
  };

  const embedSnippet = `<!-- Straxon Agency AI Lead Magnet Widget -->
<div id="straxon-audit-widget" data-workspace="${wsId || "YOUR_WORKSPACE_ID"}"></div>
<script src="${window.location.origin}/widget.js" async defer></script>`;

  return (
    <div className="space-y-8">
      {/* Header & Overview */}
      <Card className="glass-strong p-6 sm:p-8 rounded-3xl border-primary/25 relative overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs font-mono uppercase tracking-wider text-primary">
                Turnkey Client Acquisition
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Agency Lead Magnet & Inbound Capture CRM
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Embed our 5-Axis AI Audit widget directly on your agency website. Visitors audit their site, and high-intent founder leads flow directly into your private CRM.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportLeadsCSV}
              disabled={leads.length === 0}
              className="border-primary/30 text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV ({leads.length})
            </Button>
            {wsId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadLeads(wsId)}
                disabled={loading}
                className="h-8 text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
        </div>

        {/* 2-Column: Embed Code vs Test Simulation */}
        <div className="grid lg:grid-cols-2 gap-6 pt-4 border-t border-border/40">
          {/* Embed Code */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Code2 className="h-3.5 w-3.5 text-primary" /> Website Embed Code
            </h3>
            <p className="text-xs text-muted-foreground">
              Paste this snippet into your Webflow, WordPress, Framer, or custom landing page before the closing <code className="text-primary font-mono">&lt;/body&gt;</code> tag:
            </p>
            <div className="relative">
              <pre className="p-3.5 rounded-xl bg-black/60 border border-border/50 font-mono text-[11px] text-green-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {embedSnippet}
              </pre>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(embedSnippet);
                  setCopiedEmbed(true);
                  toast.success("Embed snippet copied to clipboard!");
                  setTimeout(() => setCopiedEmbed(false), 2000);
                }}
                className="absolute top-2 right-2 h-7 text-xs border-primary/30 bg-background/80"
              >
                {copiedEmbed ? <CheckCircle2 className="h-3 w-3 mr-1 text-green-400" /> : <Copy className="h-3 w-3 mr-1" />}
                {copiedEmbed ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          {/* Test Capture Form */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Test Inbound Lead Capture
            </h3>
            <form onSubmit={handleTestCapture} className="space-y-2.5">
              <div className="grid sm:grid-cols-2 gap-2">
                <Input
                  placeholder="Founder Name"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="glass text-xs"
                />
                <Input
                  placeholder="lead@startup.com"
                  type="email"
                  required
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="glass text-xs"
                />
              </div>
              <Input
                placeholder="https://clientwebsite.com"
                value={testWebsite}
                onChange={(e) => setTestWebsite(e.target.value)}
                className="glass text-xs"
              />
              <Button
                type="submit"
                disabled={capturing || !testEmail.trim()}
                className="w-full bg-gradient-primary text-primary-foreground border-0 shadow-glow font-semibold text-xs h-8"
              >
                {capturing ? "Capturing Lead…" : "Simulate Inbound Lead"}
              </Button>
            </form>
          </div>
        </div>
      </Card>

      {/* Captured Leads Table */}
      <Card className="glass-strong p-6 sm:p-8 rounded-3xl border-primary/20 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-lg sm:text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Captured Agency Inbound Leads ({leads.length})
            </h3>
            <p className="text-xs text-muted-foreground">Prospective clients who ran the 5-axis audit on your site.</p>
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-xs space-y-2">
            <Users className="h-8 w-8 mx-auto opacity-40 text-muted-foreground" />
            <p>No inbound leads captured yet.</p>
            <p className="text-[11px]">Use the test capture form above or embed the widget to start collecting leads.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground uppercase">
                  <th className="py-3 px-3">Lead Contact</th>
                  <th className="py-3 px-3">Website</th>
                  <th className="py-3 px-3">Audit Score</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Captured</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/15 transition-colors">
                    <td className="py-3 px-3 font-sans">
                      <p className="font-semibold text-foreground text-xs">{l.lead_name || "Anonymous Founder"}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{l.lead_email}</p>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground truncate max-w-[160px]">
                      {l.lead_website ? (
                        <a
                          href={l.lead_website.startsWith("http") ? l.lead_website : `https://${l.lead_website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-primary transition-colors inline-flex items-center gap-1"
                        >
                          {l.lead_website.replace(/^https?:\/\//, "")} <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {l.audit_score ? (
                        <Badge
                          variant="outline"
                          className={`font-mono text-[10px] ${
                            l.audit_score >= 70
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : l.audit_score >= 50
                              ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {l.audit_score}/100 (Grade {l.audit_grade})
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={l.status}
                        onChange={(e) => updateLeadStatus(l.id, e.target.value)}
                        className="bg-muted/40 border border-border/50 rounded-lg px-2 py-1 text-[10px] font-mono text-foreground focus:outline-none focus:border-primary"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="converted">Converted</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground font-mono text-[10px]">
                      {new Date(l.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[10px] px-2 text-primary hover:text-primary"
                          onClick={() => {
                            const pitch = `Hi ${l.lead_name || "there"},\n\nWe noticed you ran an audit on ${l.lead_website || "your site"} and scored ${l.audit_score}/100.\n\nWe identified 3 critical conversion bottlenecks costing you potential customers. Would you be open to a 10-minute walkthrough of the fixes?`;
                            navigator.clipboard.writeText(pitch);
                            toast.success("Follow-up pitch copied to clipboard!");
                          }}
                        >
                          <Send className="h-3 w-3 mr-1" /> Copy Pitch
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteLead(l.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
