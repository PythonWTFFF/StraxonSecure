import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Radar, Target, ShieldAlert, Sparkles, Copy, Download,
  CheckCircle2, ArrowRight, Loader2, Globe, FileText, Database,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const CompetitiveRadar = ({ workspaceId }: { workspaceId: string }) => {
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [yourOffer, setYourOffer] = useState("");
  const [saveToKb, setSaveToKb] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState("");
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitorUrl.trim()) {
      toast.error("Enter a competitor URL or domain");
      return;
    }

    setScanning(true);
    setProgress(15);
    setProgressStep("Fetching and parsing competitor website...");
    setAnalysis(null);
    setMarkdown(null);

    const ticker = setInterval(() => {
      setProgress((p) => (p < 85 ? p + 12 : p));
    }, 700);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-competitor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          url: competitorUrl,
          yourProduct: yourOffer,
          workspaceId,
          saveToKnowledgeBase: saveToKb,
        }),
      });

      const result = await res.json();
      clearInterval(ticker);

      if (!res.ok || result.error) {
        throw new Error(result.error || "Failed to analyze competitor");
      }

      setProgress(100);
      setProgressStep("Battlecard generated successfully!");
      setAnalysis(result.data);
      setMarkdown(result.markdown);

      toast.success(`Competitive Battlecard Ready for ${result.data?.competitor_name || "Competitor"}!`, {
        description: saveToKb
          ? "Intel automatically indexed into your workspace Knowledge Base (RAG)."
          : undefined,
      });
    } catch (err: any) {
      clearInterval(ticker);
      setProgress(0);
      toast.error(err.message || "Failed to scan competitor");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-strong p-6 sm:p-8 rounded-3xl border-primary/25 relative overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Radar className="h-4 w-4 text-primary" />
              <span className="text-xs font-mono uppercase tracking-wider text-primary">
                Live URL Intelligence & Battlecards
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Competitive Radar Studio</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Enter any competitor's URL. Our AI scrapes their website, extracts pricing and positioning vulnerabilities, and constructs a lethal sales battlecard with counter-pitches.
            </p>
          </div>

          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-xs py-1 px-3">
            Real-Time URL Scraper
          </Badge>
        </div>

        {/* Form */}
        <form onSubmit={handleScan} className="space-y-4 pt-2">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                Competitor URL or Domain
              </label>
              <Input
                placeholder="https://competitor.com"
                value={competitorUrl}
                onChange={(e) => setCompetitorUrl(e.target.value)}
                className="glass text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                Your Product or Positioning (optional)
              </label>
              <Input
                placeholder="e.g. 24h autonomous digital deliverables engine"
                value={yourOffer}
                onChange={(e) => setYourOffer(e.target.value)}
                className="glass text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={saveToKb}
                onChange={(e) => setSaveToKb(e.target.checked)}
                className="rounded border-border/50 text-primary focus:ring-0 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Database className="h-3 w-3 text-primary" /> Auto-index into Knowledge Base for RAG retrieval
              </span>
            </label>

            <Button
              type="submit"
              disabled={scanning || !competitorUrl.trim()}
              className="bg-gradient-primary text-primary-foreground border-0 shadow-glow font-semibold text-xs px-6"
            >
              {scanning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Scanning Competitor…
                </>
              ) : (
                <>
                  <Target className="h-3.5 w-3.5 mr-1.5" />
                  Deconstruct Competitor
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Scanning progress */}
        {scanning && (
          <div className="space-y-2 pt-6 border-t border-border/40 max-w-lg mx-auto text-center">
            <div className="flex justify-between text-xs font-mono text-primary">
              <span>{progressStep}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div className="space-y-6 pt-6 border-t border-border/40">
            {/* Header Result */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-muted/20 border border-border/40">
              <div>
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Deconstructed Target</span>
                <h3 className="text-lg font-bold text-foreground">{analysis.competitor_name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{analysis.competitor_positioning}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (markdown) {
                      navigator.clipboard.writeText(markdown);
                      toast.success("Battlecard copied to clipboard!");
                    }
                  }}
                  className="h-8 text-xs"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy Battlecard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (markdown) {
                      const blob = new Blob([markdown], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `battlecard-${analysis.competitor_name}-${Date.now()}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success("Battlecard downloaded!");
                    }
                  }}
                  className="h-8 text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1" /> Download
                </Button>
              </div>
            </div>

            {/* Counter-Pitch Hero Box */}
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-primary font-semibold flex items-center gap-1">
                <Sparkles className="h-3 w-3 fill-primary" /> Recommended Counter-Positioning Pitch
              </span>
              <p className="text-xs sm:text-sm font-medium text-foreground italic">
                "{analysis.counter_positioning_pitch}"
              </p>
            </div>

            {/* 3-Column: Vulnerabilities vs Battlecards vs SEO Gaps */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Pricing & Operational Vulnerabilities */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-semibold">
                  <ShieldAlert className="h-3.5 w-3.5" /> Pricing & Weaknesses
                </h4>
                <div className="space-y-2">
                  {analysis.pricing_vulnerabilities?.map((v: string, i: number) => (
                    <div key={i} className="text-xs text-muted-foreground leading-relaxed p-2 rounded-lg bg-black/30 border border-border/30">
                      • {v}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sales Objection Kill-Points */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-green-400 flex items-center gap-1.5 font-semibold">
                  <Target className="h-3.5 w-3.5" /> Sales Kill-Points
                </h4>
                <div className="space-y-2">
                  {analysis.sales_battlecards?.map((b: any, i: number) => (
                    <div key={i} className="text-xs p-2 rounded-lg bg-black/30 border border-border/30 space-y-1">
                      <p className="text-[11px] text-primary font-medium">"{b.objection}"</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">→ {b.lethal_counter}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Uncontested SEO Gaps */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-primary flex items-center gap-1.5 font-semibold">
                  <Globe className="h-3.5 w-3.5" /> Keyword Gaps
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.seo_keyword_gaps?.map((k: string, i: number) => (
                    <Badge
                      key={i}
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(k);
                        toast.success(`Copied "${k}"!`);
                      }}
                      className="cursor-pointer text-[10px] font-mono bg-muted/30 border-border/50 hover:border-primary/40 transition-colors"
                    >
                      {k}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
