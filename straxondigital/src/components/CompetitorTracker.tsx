import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crosshair, ShieldAlert, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const CompetitorTracker = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [battleCard, setBattleCard] = useState("");

  const handleAnalyze = async () => {
    if (!competitorUrl.trim()) {
      toast({ title: "URL required", description: "Please enter a competitor URL.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setBattleCard("");
    try {
      const { data, error } = await supabase.functions.invoke("scrape-competitor", {
        body: { competitorUrl, user_id: user?.id },
      });
      if (error) throw error;
      setBattleCard(data.battleCard);
      toast({ title: "Analysis Complete", description: "Competitor Battle Card generated." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Analysis failed", description: err.message || "An error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
          <Crosshair className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Competitor Intelligence</h2>
          <p className="text-muted-foreground text-sm">Analyze competitor URLs and generate RAG-powered Battle Cards.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            Target Competitor
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Competitor Website URL</Label>
              <Input
                placeholder="https://competitor.com"
                value={competitorUrl}
                onChange={(e) => setCompetitorUrl(e.target.value)}
                className="glass"
              />
            </div>
            <div className="pt-4 border-t border-border/40">
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full bg-gradient-primary text-primary-foreground border-0 shadow-glow"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldAlert className="h-4 w-4 mr-2" />}
                {loading ? "Scraping & Analyzing..." : "Generate Battle Card"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="glass p-6 flex flex-col h-full min-h-[400px]">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" /> Intelligence Battle Card
          </h3>
          <div className="flex-1 bg-black/20 border border-border/40 rounded-lg p-4 font-mono text-sm overflow-y-auto whitespace-pre-wrap text-muted-foreground">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-primary/60">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Comparing against your Knowledge Base...</p>
              </div>
            ) : battleCard ? (
              <span className="text-foreground">{battleCard}</span>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50">
                <AlertCircle className="h-8 w-8 mb-4" />
                <p>No battle card generated yet.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
