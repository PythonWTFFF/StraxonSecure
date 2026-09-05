import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Zap, Target, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order } from "@/types/database";
import { Link } from "react-router-dom";
import { SERVICES } from "@/lib/services";

export const DashboardUpsell = ({ orders }: { orders: Order[] | null }) => {
  if (!orders || orders.length === 0) return null;

  // Determine the best upsell based on completed orders
  const completedOrders = orders.filter((o) => o.status === "completed");
  if (completedOrders.length === 0) return null;

  // Simplified AI recommendation engine
  let recommendedSlug = "automation-credits";
  let reason = "Scale your operations with autonomous credits.";
  let headline = "Supercharge Your Growth";
  let icon = <Zap className="h-5 w-5 text-yellow-400" />;

  const latestOrder = completedOrders[0].service_name.toLowerCase();

  if (latestOrder.includes("landing") || latestOrder.includes("website")) {
    recommendedSlug = "drip-campaign";
    headline = "Convert More Traffic";
    reason = "Your new website is live. Add an Automated Email Drip Sequence to convert visitors into buyers.";
    icon = <Target className="h-5 w-5 text-rose-400" />;
  } else if (latestOrder.includes("seo") || latestOrder.includes("content")) {
    recommendedSlug = "brand-identity";
    headline = "Dominate Your Niche";
    reason = "You have the traffic. Upgrade your Brand Identity to ensure those visitors trust you instantly.";
    icon = <Sparkles className="h-5 w-5 text-purple-400" />;
  } else {
    recommendedSlug = "autonomous-pipeline";
    headline = "Automate Everything";
    reason = "You've seen what we can do. Upgrade to a full Autonomous AI Pipeline to run your business on autopilot.";
    icon = <ArrowUpRight className="h-5 w-5 text-green-400" />;
  }

  const recommendedService = SERVICES.find((s) => s.slug === recommendedSlug) || SERVICES[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mb-8 p-1 rounded-2xl bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 opacity-50 blur-xl group-hover:opacity-100 transition-opacity" />
      <div className="relative bg-background/95 backdrop-blur-xl rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-primary/10">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center shrink-0 border border-border/50">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-mono uppercase tracking-wider text-primary">AI Growth Recommendation</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-1">{headline}</h3>
            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
              {reason}
            </p>
          </div>
        </div>
        <div className="shrink-0 w-full md:w-auto flex flex-col gap-2">
          <Button asChild size="lg" className="w-full bg-gradient-primary text-primary-foreground border-0 shadow-glow">
            <Link to={`/checkout/${recommendedService.slug}`}>
              Add {recommendedService.name} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="text-[10px] text-center text-muted-foreground font-mono">
            {recommendedService.delivery} turnaround
          </p>
        </div>
      </div>
    </motion.div>
  );
};
