import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText, Sparkles, Download, CheckCircle2, Clock,
  ArrowRight, ShieldCheck, Zap, Layers, DollarSign,
  TrendingUp, Award,
} from "lucide-react";
import { formatPrice } from "@/lib/services";

export const ReportView = () => {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchReport = async () => {
      setLoading(true);
      try {
        const { data, error: fetchErr } = await supabase
          .from("client_reports")
          .select("*")
          .eq("share_token", token)
          .maybeSingle();

        if (fetchErr || !data) {
          throw new Error("Report not found or link has expired.");
        }

        setReport(data);

        // Increment view count asynchronously
        supabase
          .from("client_reports")
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq("id", data.id)
          .then();
      } catch (err: any) {
        setError(err.message || "Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-mono text-muted-foreground">Loading Executive Performance Report…</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <Card className="glass-strong p-8 max-w-md w-full border-border/50 text-center space-y-4">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Report Not Available</h2>
          <p className="text-xs text-muted-foreground">{error || "The requested client report could not be found."}</p>
          <Button asChild className="bg-primary text-primary-foreground text-xs">
            <Link to="/">Return to Homepage</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border/40 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-xs">
              Verified Executive Client Briefing
            </Badge>
          </div>

          <Button
            size="sm"
            onClick={() => window.print()}
            className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" /> Print / Save PDF
          </Button>
        </div>

        {/* Agency White-Label Header */}
        <div className="p-8 sm:p-10 rounded-3xl glass-strong border border-primary/20 relative overflow-hidden space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-primary block mb-1">
                Prepared by {report.agency_name}
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Monthly Performance Report
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Delivered for <strong className="text-foreground">{report.client_name}</strong>
                {report.client_company && ` (${report.client_company})`}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-mono uppercase text-muted-foreground block">Reporting Cycle</span>
              <span className="text-lg font-bold font-mono text-primary">{report.report_period}</span>
            </div>
          </div>

          {/* 3 Core Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-black/30 border border-border/30 text-center">
              <span className="text-xs font-mono uppercase text-muted-foreground">Deliverables Completed</span>
              <div className="text-2xl font-extrabold text-foreground mt-1">
                {report.deliverables_completed}
              </div>
              <span className="text-[10px] text-green-400 font-mono">100% On-Time SLA</span>
            </div>

            <div className="p-4 rounded-2xl bg-black/30 border border-border/30 text-center">
              <span className="text-xs font-mono uppercase text-muted-foreground">Operational Hours Saved</span>
              <div className="text-2xl font-extrabold text-foreground mt-1">
                {report.automation_hours_saved} hrs
              </div>
              <span className="text-[10px] text-primary font-mono">Autonomous Execution</span>
            </div>

            <div className="p-4 rounded-2xl bg-black/30 border border-border/30 text-center">
              <span className="text-xs font-mono uppercase text-muted-foreground">Commercial Asset Value</span>
              <div className="text-2xl font-extrabold text-foreground mt-1">
                {formatPrice(report.estimated_content_value_cents)}
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">Delivered ROI</span>
            </div>
          </div>
        </div>

        {/* Executive Narrative */}
        <Card className="glass-strong p-6 sm:p-8 rounded-3xl border-border/50 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Executive Overview
          </h2>
          <div className="text-sm text-foreground/90 leading-relaxed space-y-3 whitespace-pre-line font-normal">
            {report.executive_narrative}
          </div>
        </Card>

        {/* Deliverable Items Completed */}
        {report.deliverable_items && report.deliverable_items.length > 0 && (
          <Card className="glass-strong p-6 sm:p-8 rounded-3xl border-border/50 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Completed Assets & Deliverables
            </h2>

            <div className="space-y-2">
              {report.deliverable_items.map((item: any, i: number) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-muted/15 border border-border/30 flex items-center justify-between gap-4 flex-wrap text-xs"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground text-sm block">{item.name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        Verified & Archived · {new Date(item.completed_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-[10px]">
                      {item.status || "Delivered"}
                    </Badge>
                    <span className="text-muted-foreground">
                      {formatPrice(item.market_value_cents || 85000)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 2-Column: Key Achievements vs Next Month Recommendations */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Key Achievements */}
          {report.top_achievements && (
            <Card className="glass-strong p-6 rounded-3xl border-border/50 space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" /> Key Milestone Achievements
              </h3>
              <ul className="space-y-2.5">
                {report.top_achievements.map((ach: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2.5 leading-relaxed">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{ach}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Next Month Recommendations */}
          {report.next_month_recommendations && (
            <Card className="glass-strong p-6 rounded-3xl border-primary/20 space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-400" /> Strategic Priorities (Next Cycle)
              </h3>
              <ul className="space-y-2.5">
                {report.next_month_recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2.5 leading-relaxed">
                    <ArrowRight className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-border/30 text-xs text-muted-foreground">
          <p>
            Autonomous Deliverables & Analytics compiled for {report.client_name} by {report.agency_name}.
          </p>
        </div>
      </div>
    </div>
  );
};
export default ReportView;
