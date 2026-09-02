import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  Copy,
  DollarSign,
  TrendingUp,
  Award,
  Sparkles,
  Share2,
  CheckCircle2,
  Gift,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const AffiliateHub = () => {
  const { user } = useAuth();
  const referralCode = user ? user.id.slice(0, 8).toUpperCase() : "FOUNDER";
  const referralUrl = `https://straxon.digital/?ref=${referralCode}`;

  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success("Affiliate link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl glass-strong p-6 sm:p-10 border-primary/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex items-center gap-2 mb-3">
          <Badge className="bg-gradient-primary text-primary-foreground border-0 shadow-glow font-mono text-xs uppercase tracking-wider">
            30% Lifetime Recurring Commission
          </Badge>
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2">
          Straxon Partner & Affiliate Program
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Recommend Straxon to founders, creators, and agencies. Earn 30% on every one-time deliverable order and recurring monthly subscription for the lifetime of that customer.
        </p>

        {/* Personalized Referral Link */}
        <div className="mt-6 pt-6 border-t border-border/40 max-w-xl">
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-2">
            Your Unique Partner Tracking URL
          </label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={referralUrl}
              className="glass font-mono text-xs text-primary"
            />
            <Button
              onClick={copyLink}
              className="bg-gradient-primary text-primary-foreground border-0 shadow-glow px-5 font-semibold text-xs shrink-0"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1.5" /> Copy Link
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Link Clicks", value: "142", icon: Share2, change: "+18% this week" },
          { label: "Signups Attributed", value: "19", icon: Users, change: "13.3% conversion" },
          { label: "Paid Conversions", value: "6", icon: Award, change: "$2,890 order volume" },
          { label: "Unpaid Commission", value: "$867.00", icon: DollarSign, change: "Payout on 1st of month" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="glass p-5 border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-mono">{stat.label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-gradient">{stat.value}</div>
              <span className="text-[10px] text-green-400 font-mono mt-1 block">{stat.change}</span>
            </Card>
          );
        })}
      </div>

      {/* Program Benefits */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="glass p-6 border-border/50 space-y-2">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <Gift className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-base">Give $50, Get 30%</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your referrals receive an automatic $50 founder credit on their first order using code FOUNDER50.
          </p>
        </Card>

        <Card className="glass p-6 border-border/50 space-y-2">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <TrendingUp className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-base">Recurring SaaS Subscriptions</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Earn month after month as long as your referred users remain subscribed to Pro, Agency, or Enterprise plans.
          </p>
        </Card>

        <Card className="glass p-6 border-border/50 space-y-2">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <DollarSign className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-base">Monthly Automated Payouts</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Direct deposits via Stripe Connect or PayPal on the 1st of every month with zero minimum threshold.
          </p>
        </Card>
      </div>
    </div>
  );
};
