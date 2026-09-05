import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Zap, Plus, Sparkles, AlertTriangle, Loader2, Crown, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatPrice } from "@/lib/services";
import { Link } from "react-router-dom";

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceCents: number;
  badge?: string;
  costPer?: string;
}

const CREDIT_PACKS: CreditPack[] = [
  { id: "starter", name: "Starter Pack", credits: 20, priceCents: 1900, costPer: "$0.95/run" },
  { id: "growth", name: "Growth Pack", credits: 50, priceCents: 3900, badge: "Most Popular", costPer: "$0.78/run" },
  { id: "power", name: "Power Operator", credits: 150, priceCents: 8900, badge: "Best Value", costPer: "$0.59/run" },
];

export const CreditBalanceBadge = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [wsId, setWsId] = useState<string | null>(null);
  const [hasActiveSub, setHasActiveSub] = useState(false);

  const loadCredits = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("workspaces")
      .select("id, credits")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (data) {
      setCredits(data.credits ?? 5);
      setWsId(data.id);
    }

    // Check subscription
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .limit(1);

    setHasActiveSub(!!(subs && subs.length > 0));
  };

  useEffect(() => {
    loadCredits();
    if (!user) return;

    const channel = supabase
      .channel("ws-credits-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "workspaces" },
        () => loadCredits()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Auto-open top-up dialog when credits hit 0
  useEffect(() => {
    if (credits === 0 && !hasActiveSub) {
      setOpen(true);
    }
  }, [credits, hasActiveSub]);

  const buyCredits = async (pack: CreditPack) => {
    if (!user || !wsId) return;
    setPurchasing(pack.id);

    try {
      const current = credits ?? 0;
      const { error } = await supabase
        .from("workspaces")
        .update({ credits: current + pack.credits })
        .eq("id", wsId);

      if (error) throw error;

      setCredits(current + pack.credits);
      toast.success(`+${pack.credits} AI Credits added!`, {
        description: `You now have ${current + pack.credits} automation runs available.`,
      });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to purchase credits");
    } finally {
      setPurchasing(null);
    }
  };

  if (!user || credits === null) return null;

  const isCritical = credits === 0 && !hasActiveSub;
  const isLow = credits <= 3 && !hasActiveSub;

  return (
    <>
      {hasActiveSub ? (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-green-500/10 border border-green-500/20 text-green-400">
          <Crown className="h-3 w-3 fill-green-400 text-green-400" />
          <span>Unlimited Runs</span>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border transition-all cursor-pointer ${
            isCritical
              ? "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse"
              : isLow
              ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
              : "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
          }`}
        >
          {isCritical
            ? <AlertTriangle className="h-3 w-3 fill-red-400 text-red-400" />
            : <Zap className="h-3 w-3 fill-primary text-primary animate-pulse" />
          }
          <span>{isCritical ? "0 Credits Left" : `${credits} Credits`}</span>
          <Plus className="h-3 w-3 opacity-70 ml-0.5" />
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md glass-strong border-primary/30 p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              {isCritical ? (
                <AlertTriangle className="h-4 w-4 text-red-400" />
              ) : (
                <Sparkles className="h-4 w-4 text-primary" />
              )}
              <span className={`text-xs font-mono uppercase tracking-wider ${isCritical ? "text-red-400" : "text-primary"}`}>
                {isCritical ? "⚠️ Credits Depleted" : "SaaS Credit Fuel"}
              </span>
            </div>
            <DialogTitle className="text-xl font-bold">
              {isCritical ? "Top Up to Resume Automations" : "Top Up AI Credits"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isCritical
                ? "You've used all your automation credits. Top up below or upgrade to a subscription for unlimited monthly runs."
                : "Credits power your RAG semantic queries, scheduled jobs, and autonomous workflow executions."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-4">
            {CREDIT_PACKS.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border/50 bg-muted/20 hover:border-primary/40 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{p.name}</span>
                    {p.badge && (
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                        {p.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <span className="text-xs text-primary font-mono font-medium">+{p.credits} Runs</span>
                    {p.costPer && <span className="text-[10px] text-muted-foreground font-mono">{p.costPer}</span>}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => buyCredits(p)}
                  disabled={purchasing !== null}
                  className="bg-gradient-primary text-primary-foreground border-0 shadow-glow text-xs"
                >
                  {purchasing === p.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    `Buy ${formatPrice(p.priceCents)}`
                  )}
                </Button>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 space-y-2">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Crown className="h-3.5 w-3.5 text-primary" /> Go Unlimited with a Subscription
            </p>
            <p className="text-xs text-muted-foreground">Pro plan from $49/mo — unlimited automation runs + scheduled jobs + priority RAG retrieval</p>
            <Button asChild size="sm" variant="outline" className="border-primary/30 text-primary text-xs" onClick={() => setOpen(false)}>
              <Link to="/checkout/saas-growth?tier=pro">
                Upgrade to Pro <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
