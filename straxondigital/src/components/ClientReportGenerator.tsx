import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Sparkles, Copy, ExternalLink, Trash2,
  CheckCircle2, Clock, Loader2, Eye, Building2, User,
  Calendar, Layers,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatPrice } from "@/lib/services";

export const ClientReportGenerator = ({ workspaceId }: { workspaceId?: string }) => {
  const { user } = useAuth();
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [reportPeriod, setReportPeriod] = useState("Current Month");
  const [agencyName, setAgencyName] = useState("Straxon Partner Agency");
  const [customNotes, setCustomNotes] = useState("");

  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const loadReports = async () => {
    if (!user) return;
    setLoadingReports(true);
    const { data } = await supabase
      .from("client_reports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setReports(data || []);
    setLoadingReports(false);
  };

  useEffect(() => {
    loadReports();
  }, [user]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      toast.error("Please enter a client name");
      return;
    }

    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-client-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          clientName: clientName.trim(),
          clientCompany: clientCompany.trim(),
          clientEmail: clientEmail.trim(),
          reportPeriod: reportPeriod.trim(),
          agencyName: agencyName.trim(),
          customNotes: customNotes.trim(),
          workspaceId,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to generate client report");
      }

      toast.success(`Executive Report generated for ${clientName}!`, {
        description: "White-label shareable link is ready.",
      });

      setClientName("");
      setClientCompany("");
      setClientEmail("");
      setCustomNotes("");
      loadReports();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const copyReportLink = (shareToken: string) => {
    const url = `${window.location.origin}/report/${shareToken}`;
    navigator.clipboard.writeText(url);
    toast.success("Client report link copied to clipboard!");
  };

  const deleteReport = async (id: string) => {
    await supabase.from("client_reports").delete().eq("id", id);
    toast.success("Report deleted");
    loadReports();
  };

  return (
    <div className="space-y-6">
      {/* Generator Card */}
      <Card className="glass-strong p-6 sm:p-8 rounded-3xl border-primary/25 relative overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-xs font-mono uppercase tracking-wider text-primary">
                White-Label Client Retention Machine
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Client Monthly Report Auto-Generator</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Turn autonomous deliverables and hours saved into executive monthly ROI reports. Impress enterprise clients and retain retainers at higher rates.
            </p>
          </div>

          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-xs py-1 px-3">
            Public White-Label Link
          </Badge>
        </div>

        {/* Builder Form */}
        <form onSubmit={handleGenerate} className="space-y-4 pt-2">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                Client Contact Name
              </label>
              <Input
                placeholder="e.g. Sarah Connor"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="glass text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                Client Company / Brand
              </label>
              <Input
                placeholder="e.g. Cyberdyne Ventures"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
                className="glass text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                Report Period
              </label>
              <Input
                placeholder="e.g. October 2026"
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                className="glass text-xs"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                Your Agency Brand Name
              </label>
              <Input
                placeholder="e.g. Apex Autonomous Media"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="glass text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                Client Email (Optional)
              </label>
              <Input
                type="email"
                placeholder="client@company.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="glass text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
              Custom Strategic Notes or Highlights (Optional)
            </label>
            <Textarea
              placeholder="e.g. Focused heavily on high-intent B2B search clusters and revamped their outbound sequencer."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="glass text-xs min-h-[70px]"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={generating || !clientName.trim()}
              className="bg-gradient-primary text-primary-foreground border-0 shadow-glow font-semibold text-xs px-6"
            >
              {generating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Synthesizing Report…
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Generate White-Label Report
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Published Reports List */}
      <Card className="glass-strong p-6 rounded-3xl border-border/40 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Published Client Reports ({reports.length})
          </h3>
          <Button variant="ghost" size="sm" onClick={loadReports} className="h-8 text-xs">
            Refresh
          </Button>
        </div>

        {loadingReports ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No client reports generated yet. Fill out the form above to produce your first executive monthly performance report.
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 rounded-2xl bg-muted/15 border border-border/30 flex items-center justify-between gap-4 flex-wrap hover:border-primary/40 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-foreground">{rep.client_name}</span>
                    {rep.client_company && (
                      <span className="text-xs text-muted-foreground">({rep.client_company})</span>
                    )}
                    <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-primary border-primary/20">
                      {rep.report_period}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                    <span>{rep.deliverables_completed} deliverables</span>
                    <span>•</span>
                    <span>{rep.automation_hours_saved} hrs saved</span>
                    <span>•</span>
                    <span className="text-green-400 font-semibold">{formatPrice(rep.estimated_content_value_cents)} value</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="glass text-xs h-8"
                    onClick={() => copyReportLink(rep.share_token)}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy Link
                  </Button>
                  <Button
                    size="sm"
                    asChild
                    className="bg-primary/20 hover:bg-primary/30 text-primary text-xs h-8"
                  >
                    <a href={`/report/${rep.share_token}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" /> View Report
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteReport(rep.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
