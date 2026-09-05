import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, ExternalLink, Sparkles, Zap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createPortalSession } from "@/lib/stripe";

interface Subscription {
  id: string;
  stripe_sub_id: string | null;
  stripe_customer_id: string | null;
  plan_name: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

const statusStyles: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  trialing: "bg-primary/20 text-primary border-primary/30",
  past_due: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  canceled: "bg-muted text-muted-foreground",
  incomplete: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

export const BillingTab = ({ userId }: { userId: string }) => {
  const [subs, setSubs] = useState<Subscription[] | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      setSubs((data as Subscription[]) ?? []);
    };
    load();
    const channel = supabase
      .channel(`subs-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` },
        () => load(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const openPortal = async (customerId?: string | null) => {
    if (!customerId) {
      toast.error("No billing profile found. Please purchase a subscription first.");
      return;
    }
    setLoadingPortal(true);
    try {
      const { url } = await createPortalSession(customerId);
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("Failed to create portal session");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to open billing portal");
    } finally {
      setLoadingPortal(false);
    }
  };

  if (subs === null) {
    return (
      <div className="grid gap-3">
        {[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Manage recurring plans, payment methods, and invoice history.
        </p>
        <Button onClick={() => openPortal(subs[0]?.stripe_customer_id)} disabled={loadingPortal} className="bg-gradient-primary text-primary-foreground border-0 shadow-glow">
          {loadingPortal ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />} Manage billing
          <ExternalLink className="h-3 w-3 ml-2 opacity-60" />
        </Button>
      </div>

      {subs.length === 0 ? (
        <Card className="glass-strong p-12 text-center border-primary/20">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">No active subscriptions</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Upgrade to a recurring plan for ongoing deliverables, priority support, and unlimited automation runs.
          </p>
          <Button asChild className="bg-gradient-primary text-primary-foreground border-0">
            <a href="/services">View plans</a>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {subs.map((s) => (
            <Card key={s.id} className="glass p-5 flex items-start justify-between gap-4 flex-wrap">
              <div className="flex gap-4 items-start">
                <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold">{s.plan_name}</h3>
                    <Badge variant="outline" className={statusStyles[s.status] ?? "bg-muted"}>
                      {s.status}
                    </Badge>
                    {s.cancel_at_period_end && (
                      <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        ends at period
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {s.current_period_end
                      ? `Renews ${new Date(s.current_period_end).toLocaleDateString()}`
                      : "—"}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => openPortal(s.stripe_customer_id)} disabled={loadingPortal}>
                {loadingPortal ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : "Manage"} <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
