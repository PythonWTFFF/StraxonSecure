import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LineChart, Play, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const PricingOptimizer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");

  const handleOptimize = async () => {
    setLoading(true);
    setAnalysis("");
    try {
      const { data, error } = await supabase.functions.invoke("optimize-pricing", {
        body: { user_id: user?.id },
      });
      if (error) throw error;
      setAnalysis(data.analysis);
      toast({ title: "Optimization Complete", description: "Pricing strategy analyzed." });
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
          <LineChart className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Pricing Optimizer</h2>
          <p className="text-muted-foreground text-sm">Dynamically adjust your service pricing based on market demand and order volume.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            Pricing Engine Controls
          </h3>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This engine analyzes your historical conversion rates, active RAG competitor data, and current operational bandwidth to suggest optimal price points that maximize profit margins without sacrificing conversion volume.
            </p>
            <div className="pt-4 border-t border-border/40">
              <Button
                onClick={handleOptimize}
                disabled={loading}
                className="w-full bg-gradient-primary text-primary-foreground border-0 shadow-glow"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {loading ? "Running Market Analysis..." : "Run AI Price Optimization"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="glass p-6 flex flex-col h-full min-h-[400px]">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" /> Optimization Report
          </h3>
          <div className="flex-1 bg-black/20 border border-border/40 rounded-lg p-4 font-mono text-sm overflow-y-auto whitespace-pre-wrap text-muted-foreground">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-primary/60">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Analyzing competitor pricing & elasticity...</p>
              </div>
            ) : analysis ? (
              <span className="text-foreground">{analysis}</span>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50">
                <AlertCircle className="h-8 w-8 mb-4" />
                <p>No pricing analysis run yet.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
