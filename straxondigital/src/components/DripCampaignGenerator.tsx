import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const DripCampaignGenerator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leadProfile, setLeadProfile] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState("");

  const handleGenerate = async () => {
    if (!leadProfile.trim() || !goal.trim()) {
      toast({ title: "Fields required", description: "Please enter lead profile and goal.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setCampaign("");
    try {
      const { data, error } = await supabase.functions.invoke("generate-drip-campaign", {
        body: { leadProfile, goal, user_id: user?.id },
      });
      if (error) throw error;
      setCampaign(data.campaign);
      toast({ title: "Campaign Generated", description: "Your email sequence is ready." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Generation failed", description: err.message || "An error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Automated Drip Campaigns</h2>
          <p className="text-muted-foreground text-sm">Generate multi-step email sequences based on your Knowledge Base.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            Targeting & Goals
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Lead Profile / Persona</Label>
              <Input
                placeholder="e.g., E-commerce Founders doing $10k/mo"
                value={leadProfile}
                onChange={(e) => setLeadProfile(e.target.value)}
                className="glass"
              />
            </div>
            <div className="space-y-2">
              <Label>Campaign Goal</Label>
              <Input
                placeholder="e.g., Book a discovery call"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="glass"
              />
            </div>
            <div className="pt-4 border-t border-border/40">
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-gradient-primary text-primary-foreground border-0 shadow-glow"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                {loading ? "Drafting Sequence..." : "Generate Drip Campaign"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="glass p-6 flex flex-col h-full min-h-[400px]">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" /> Sequence Output
          </h3>
          <div className="flex-1 bg-black/20 border border-border/40 rounded-lg p-4 font-mono text-sm overflow-y-auto whitespace-pre-wrap text-muted-foreground">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-primary/60">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Analyzing Knowledge Base...</p>
              </div>
            ) : campaign ? (
              <span className="text-foreground">{campaign}</span>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50">
                <AlertCircle className="h-8 w-8 mb-4" />
                <p>No campaign generated yet.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
