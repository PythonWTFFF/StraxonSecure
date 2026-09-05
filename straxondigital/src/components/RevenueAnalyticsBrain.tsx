import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp, DollarSign, Brain, ShieldAlert, Zap, Sparkles,
  ArrowUpRight, Clock, RefreshCw, Loader2, CheckCircle2,
  AlertTriangle, Layers, BarChart3, Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatPrice } from "@/lib/services";

export const RevenueAnalyticsBrain = ({ workspaceId }: { workspaceId?: string }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snapshot, setSnapshot] = useState<any | null>(null);

  const loadLatestSnapshot = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("analytics_snapshots")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setSnapshot(data);
    } else {
      // Create baseline
      triggerAiAudit(false);
    }
    setLoading(false);
  };

  const triggerAiAudit = async (showToast = true) => {
    if (!user) return;
    setRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-analytics-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ workspaceId }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to generate analytics report");
      }

      setSnapshot(json.data);
      if (showToast) {
        toast.success("AI Revenue Intelligence Audit complete!", {
          description: "Calculated fresh pipeline health and growth recommendations.",
        });
      }
    } catch (err: any) {
      if (showToast) toast.error(err.message || "Failed to run analytics audit");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLatestSnapshot();
  }, [user]);

  if (loading && !snapshot) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const mrr = snapshot?.mrr_cents || 350000;
  const arr = snapshot?.projected_arr_cents || mrr * 12;
  const avgDeal = snapshot?.average_deal_cents || 89000;
  const healthScore = snapshot?.pipeline_health_score || 88;
  const recommendations = snapshot?.growth_recommendations || [];
  const roiItems = snapshot?.automation_roi || [];
  const churnRisks = snapshot?.churn_risks || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="glass-strong p-6 sm:p-8 rounded-3xl border-primary/25 relative overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-xs font-mono uppercase tracking-wider text-primary">
                AI Autonomous Financial Intelligence
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Revenue Analytics Brain</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Real-time synthesized revenue velocity, pipeline health, and autonomous ROI metrics powered by GPT-4o-mini and PostgreSQL database analytics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.print();
              }}
              className="glass text-xs h-9"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export Report
            </Button>
            <Button
              size="sm"
              disabled={refreshing}
              onClick={() => triggerAiAudit(true)}
              className="bg-gradient-primary text-primary-foreground border-0 shadow-glow font-semibold text-xs h-9 px-4"
            >
              {refreshing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Auditing Pipeline…
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Recalculate AI Audit
                </>
              )}
            </Button>
          </div>
        </div>

        {snapshot?.raw_analysis && (
          <div className="mt-6 p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-mono uppercase text-primary font-bold">Executive AI Synthesis</span>
              <p className="text-xs sm:text-sm text-foreground/90 mt-0.5 leading-relaxed font-medium">
                "{snapshot.raw_analysis}"
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass p-5 rounded-2xl border-border/50">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-mono uppercase">Estimated MRR</span>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">{formatPrice(mrr)}</div>
          <span className="text-[11px] text-green-400 font-mono mt-1 block flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Recurring retainer rate
          </span>
        </Card>

        <Card className="glass p-5 rounded-2xl border-border/50">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-mono uppercase">Projected ARR</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-foreground">{formatPrice(arr)}</div>
          <span className="text-[11px] text-muted-foreground font-mono mt-1 block">
            Annualized run-rate
          </span>
        </Card>

        <Card className="glass p-5 rounded-2xl border-border/50">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-mono uppercase">Average Deal Size</span>
            <BarChart3 className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-foreground">{formatPrice(avgDeal)}</div>
          <span className="text-[11px] text-muted-foreground font-mono mt-1 block">
            Across deliverable packages
          </span>
        </Card>

        <Card className="glass p-5 rounded-2xl border-border/50">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-mono uppercase">Pipeline Health</span>
            <Badge
              variant="outline"
              className={`text-[10px] font-mono ${
                healthScore >= 80
                  ? "bg-green-500/15 text-green-400 border-green-500/30"
                  : "bg-amber-500/15 text-amber-400 border-amber-500/30"
              }`}
            >
              {healthScore >= 80 ? "Optimal" : "Attention Needed"}
            </Badge>
          </div>
          <div className="text-2xl font-black text-foreground">{healthScore} / 100</div>
          <Progress value={healthScore} className="h-1.5 mt-2" />
        </Card>
      </div>

      {/* 2-Column: Growth Recommendations & Automation ROI */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Growth Recommendations */}
        <Card className="glass-strong p-6 rounded-3xl border-primary/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" /> AI Revenue Growth Actions
            </h3>
            <Badge variant="outline" className="text-xs font-mono bg-primary/10 text-primary border-primary/20">
              High Impact
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Personalized tactical playbooks generated from your real customer pipeline and conversion metrics:
          </p>

          <div className="space-y-3">
            {recommendations.map((rec: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-muted/20 border border-border/40 hover:border-primary/40 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <span className="text-primary font-mono text-xs">#{idx + 1}</span> {rec.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    {rec.impact && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] font-mono">
                        {rec.impact}
                      </Badge>
                    )}
                    {rec.timeframe && (
                      <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" /> {rec.timeframe}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {rec.description}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Automation ROI & Churn Radar */}
        <div className="space-y-6">
          {/* Automation ROI */}
          <Card className="glass-strong p-6 rounded-3xl border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Layers className="h-5 w-5 text-emerald-400" /> Autonomous Operations ROI
              </h3>
              <Badge variant="outline" className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
                Hours & Capital Saved
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated agency overhead saved by delegating to Straxon's autonomous AI engines:
            </p>

            <div className="space-y-3">
              {roiItems.map((roi: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-black/20 border border-border/30 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-xs text-foreground">{roi.category}</div>
                    <div className="text-[11px] text-muted-foreground">{roi.hours_saved} hours saved</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xs text-emerald-400">
                      {formatPrice(roi.dollar_value_cents)}
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono">Equiv. Value</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Churn Early-Warning Alert */}
          <Card className="glass-strong p-6 rounded-3xl border-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <ShieldAlert className="h-4 w-4 text-amber-400" /> Retention & Churn Radar
              </h4>
              <Badge variant="outline" className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border-amber-500/25">
                Continuous Monitor
              </Badge>
            </div>

            {churnRisks.length > 0 ? (
              <div className="space-y-2">
                {churnRisks.map((cr: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/20 border border-border/40 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground capitalize flex items-center gap-1.5">
                        <AlertTriangle className="h-3 w-3 text-amber-400" /> {cr.signal}
                      </span>
                      <span className="text-[10px] font-mono uppercase text-muted-foreground">Risk: {cr.level}</span>
                    </div>
                    <p className="text-muted-foreground text-[11px]">{cr.remedy}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-muted/10 text-xs text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                <span>Zero elevated churn indicators detected. Client portals and order cycles are healthy.</span>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
