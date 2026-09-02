import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Shield, ArrowRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/context/CurrencyContext";

interface PlanDef {
  id: string;
  name: string;
  badge?: string;
  popular?: boolean;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  creditsPerMonth: number;
  features: string[];
  cta: string;
}

const PLANS: PlanDef[] = [
  {
    id: "free",
    name: "Starter Trial",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Explore the autonomous agency catalog and test deliverables.",
    creditsPerMonth: 5,
    features: [
      "5 one-time AI automation credits",
      "Standard delivery queue",
      "1 Brand Brain profile",
      "Full access to 16+ services catalog",
      "Community support",
    ],
    cta: "Start Free",
  },
  {
    id: "pro",
    name: "Pro Operator",
    popular: true,
    badge: "Most Popular",
    monthlyPrice: 49,
    annualPrice: 39,
    description: "For founders, solopreneurs, and creators shipping continuously.",
    creditsPerMonth: 50,
    features: [
      "50 recurring AI credits / month",
      "Full RAG semantic knowledge base search",
      "Priority 24-hour delivery queue",
      "3 Brand Brain profiles",
      "Outbound Webhooks (Zapier, Make, n8n)",
      "1 Free revision per order",
      "Email support within 24h",
    ],
    cta: "Launch Pro Plan",
  },
  {
    id: "agency",
    name: "Agency & Growth",
    badge: "High Scale",
    monthlyPrice: 149,
    annualPrice: 119,
    description: "For agencies and scale-ups managing multiple brands and client accounts.",
    creditsPerMonth: 250,
    features: [
      "250 recurring AI credits / month",
      "Unlimited Brand Brain profiles",
      "Autonomous scheduled jobs runner",
      "White-label client preview links",
      "Instant webhook auto-dispatch",
      "Priority operator review on all orders",
      "Direct Slack / Telegram VIP channel",
    ],
    cta: "Get Agency Scale",
  },
  {
    id: "enterprise",
    name: "Enterprise Empire",
    badge: "Dedicated",
    monthlyPrice: 399,
    annualPrice: 319,
    description: "Custom fine-tuned models, unlimited throughput, and dedicated engineering.",
    creditsPerMonth: 1000,
    features: [
      "1,000+ credits / month (or unlimited)",
      "Custom vector embedding ingestion & fine-tuning",
      "Dedicated senior human operator oversight",
      "99.9% SLA & 12h rush guarantee",
      "Custom API endpoints & SSO",
      "Quarterly strategy roadmap reviews",
    ],
    cta: "Contact Enterprise",
  },
];

export const SaaSPricingSection = () => {
  const [annual, setAnnual] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice, currency } = useCurrency();

  const handleSelectPlan = (plan: PlanDef) => {
    if (!user) {
      navigate(`/auth?redirect=/pricing`);
      return;
    }
    if (plan.id === "free") {
      navigate("/dashboard");
    } else if (plan.id === "enterprise") {
      navigate("/contact");
    } else if (plan.id === "agency") {
      navigate(`/checkout/conversion-website?tier=agency&billing=${annual ? "annual" : "monthly"}`);
    } else {
      navigate(`/checkout/conversion-website?tier=pro&billing=${annual ? "annual" : "monthly"}`);
    }
  };

  return (
    <section className="py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-3">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-mono uppercase tracking-wider text-primary">Predictable SaaS Economics</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3">
          Scalable Plans for <span className="text-gradient">Ambitious Operators</span>
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Supercharge your operations with monthly recurring automation credits, full RAG semantic search, and priority turnaround.
        </p>

        {/* Billing Switch */}
        <div className="mt-6 inline-flex items-center gap-3 p-1.5 rounded-full glass border border-border/60">
          <button
            onClick={() => setAnnual(false)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              !annual ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              annual ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Annual Billing</span>
            <Badge variant="outline" className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30">
              Save 20%
            </Badge>
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {PLANS.map((plan) => {
          const price = annual ? plan.annualPrice : plan.monthlyPrice;
          return (
            <Card
              key={plan.id}
              className={`p-6 flex flex-col justify-between transition-all duration-300 relative rounded-2xl ${
                plan.popular
                  ? "glass-strong border-primary shadow-glow ring-1 ring-primary/40 -translate-y-1"
                  : "glass border-border/60 hover:border-primary/30"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-primary text-primary-foreground border-0 shadow-glow font-mono text-[10px] uppercase tracking-wider py-0.5 px-3">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{plan.description}</p>
                </div>

                <div className="mb-6 pt-3 border-t border-border/40">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-gradient">{formatPrice(price * 100)}</span>
                    <span className="text-xs text-muted-foreground font-mono">/ month</span>
                  </div>
                  {annual && plan.monthlyPrice > 0 && (
                    <span className="text-[11px] text-muted-foreground block font-mono mt-0.5">
                      Billed annually ({formatPrice(price * 12 * 100)}/yr)
                    </span>
                  )}
                  <div className="mt-2 inline-flex items-center gap-1 text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                    <Zap className="h-3 w-3 fill-primary" /> {plan.creditsPerMonth} AI Credits / mo
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6 text-xs text-muted-foreground">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={() => handleSelectPlan(plan)}
                className={`w-full text-xs font-semibold ${
                  plan.popular
                    ? "bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90"
                    : "border-primary/30 hover:bg-primary/10"
                }`}
                variant={plan.popular ? "default" : "outline"}
              >
                {plan.cta} <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
