import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BUNDLES, formatPrice } from "@/lib/services";
import { Package, Check, ArrowRight, Sparkles, Clock, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export const BundlesSection = () => {
  return (
    <section className="py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-3">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-mono uppercase tracking-wider text-primary">
            Turnkey High-Impact Suites
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3">
          All-in-One <span className="text-gradient">Empire Bundles</span>
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Stop piecing individual services together. Our turnkey suites combine website, brand identity, pitch deck, and growth engines at massive multi-service discounts.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {BUNDLES.map((bundle, idx) => (
          <motion.div
            key={bundle.slug}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            className="h-full"
          >
            <Card
              className={`p-6 sm:p-7 flex flex-col justify-between h-full rounded-2xl relative transition-all duration-300 ${
                bundle.popular
                  ? "glass-strong border-primary shadow-glow ring-1 ring-primary/40 -translate-y-1.5"
                  : "glass border-border/60 hover:border-primary/30"
              }`}
            >
              {bundle.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-primary text-primary-foreground border-0 shadow-glow font-mono text-[10px] uppercase tracking-wider py-0.5 px-3">
                    {bundle.badge}
                  </Badge>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1.5 text-primary">
                    <Package className="h-3.5 w-3.5" /> Turnkey Suite
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {bundle.turnaround}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-foreground mb-1">{bundle.name}</h3>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                  {bundle.tagline}
                </p>

                <div className="pt-3 pb-5 border-t border-border/40">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-gradient">
                      {formatPrice(bundle.bundlePriceCents)}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {bundle.cadence || "total"}
                    </span>
                    <span className="text-xs text-muted-foreground line-through font-mono ml-auto">
                      Value {formatPrice(bundle.originalPriceCents)}
                    </span>
                  </div>
                  <span className="text-[11px] text-green-400 font-mono block mt-1">
                    ✓ Instant Savings: {formatPrice(bundle.savingsCents)}
                  </span>
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                    Included in this suite:
                  </p>
                  <ul className="space-y-2 text-xs text-foreground/90">
                    {bundle.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40">
                <Button
                  asChild
                  className={`w-full text-xs font-semibold ${
                    bundle.popular
                      ? "bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90"
                      : "border-primary/30 hover:bg-primary/10"
                  }`}
                  variant={bundle.popular ? "default" : "outline"}
                >
                  <Link to={`/checkout/${bundle.slug}`}>
                    Claim Empire Bundle <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
                <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground font-mono mt-2.5">
                  <ShieldCheck className="h-3 w-3 text-green-400" /> 14-Day Money-Back Guarantee
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
