import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const ReviewEngine = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientEmail, setClientEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const handleHarvest = async () => {
    if (!clientEmail.trim()) {
      toast({ title: "Email required", description: "Please enter the client's email.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setStatusMsg("");
    try {
      const { data, error } = await supabase.functions.invoke("harvest-reviews", {
        body: { clientEmail, user_id: user?.id },
      });
      if (error) throw error;
      setStatusMsg(data.message);
      toast({ title: "Harvest Initiated", description: "Review sequence deployed." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Action failed", description: err.message || "An error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
          <Star className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Automated Review Harvester</h2>
          <p className="text-muted-foreground text-sm">Automatically extract 5-star testimonials from satisfied clients.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            Target Client
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Client Email Address</Label>
              <Input
                type="email"
                placeholder="client@company.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="glass"
              />
            </div>
            <div className="pt-4 border-t border-border/40">
              <Button
                onClick={handleHarvest}
                disabled={loading}
                className="w-full bg-gradient-primary text-primary-foreground border-0 shadow-glow"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                {loading ? "Deploying Sequence..." : "Send Review Harvest Sequence"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="glass p-6 flex flex-col h-full min-h-[400px]">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" /> Harvest Status
          </h3>
          <div className="flex-1 bg-black/20 border border-border/40 rounded-lg p-4 font-mono text-sm flex flex-col items-center justify-center text-muted-foreground">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-primary/60">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Generating personalized review request...</p>
              </div>
            ) : statusMsg ? (
              <span className="text-green-400 text-center">{statusMsg}</span>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50">
                <AlertCircle className="h-8 w-8 mb-4" />
                <p>No active harvest operations.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
