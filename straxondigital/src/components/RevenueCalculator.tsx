import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import { useCurrency } from "@/context/CurrencyContext";
import { Sparkles, TrendingUp } from "lucide-react";

export const RevenueCalculator = () => {
  const { formatPrice, currency } = useCurrency();
  const [visitors, setVisitors] = useState([5000]);
  const [aov, setAov] = useState([149]);
  const [conversion, setConversion] = useState([2.5]);

  const projection = useMemo(() => {
    const monthlyDollars = (visitors[0] * (conversion[0] / 100)) * aov[0];
    const annualDollars = monthlyDollars * 12;
    const liftDollars = monthlyDollars * 1.85; // hypothetical Straxon lift
    return {
      currentCents: Math.round(monthlyDollars * 100),
      liftedCents: Math.round(liftDollars * 100),
      annualCents: Math.round(annualDollars * 100),
      annualLiftedCents: Math.round(liftDollars * 12 * 100),
    };
  }, [visitors, aov, conversion]);

  return (
    <div className="glass-strong rounded-2xl p-6 sm:p-8 border border-primary/30 shadow-2xl relative overflow-hidden">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Revenue & Profit Projection
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Live modeling based on conversion optimization</p>
        </div>
        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider font-semibold">
          {currency} Mode
        </span>
      </div>

      <div className="space-y-6">
        <Field label="Monthly Visitors" value={visitors[0].toLocaleString()}>
          <Slider value={visitors} onValueChange={setVisitors} min={500} max={100000} step={500} />
        </Field>
        <Field label="Average Order Value" value={formatPrice(aov[0] * 100)}>
          <Slider value={aov} onValueChange={setAov} min={20} max={2000} step={10} />
        </Field>
        <Field label="Conversion Rate" value={`${conversion[0].toFixed(1)}%`}>
          <Slider value={conversion} onValueChange={setConversion} min={0.5} max={10} step={0.1} />
        </Field>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3.5">
        <div className="rounded-xl bg-secondary/40 p-4 border border-white/5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-mono">Today (Status Quo)</p>
          <motion.p
            key={projection.currentCents}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="text-xl sm:text-2xl font-bold mt-1 text-gray-300"
          >
            {formatPrice(projection.currentCents)}<span className="text-xs font-normal text-muted-foreground">/mo</span>
          </motion.p>
        </div>
        <div className="rounded-xl bg-gradient-luxury p-4 border border-primary/30 shadow-glow">
          <p className="text-[11px] text-primary uppercase tracking-wider font-mono font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> With Straxon Engine
          </p>
          <motion.p
            key={projection.liftedCents}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="text-xl sm:text-2xl font-extrabold mt-1 text-gradient"
          >
            {formatPrice(projection.liftedCents)}<span className="text-xs font-normal text-muted-foreground">/mo</span>
          </motion.p>
        </div>
      </div>
      <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
        <span>Estimated Annual Gross Lift:</span>
        <span className="text-emerald-400 font-bold font-mono text-sm">
          +{formatPrice(projection.annualLiftedCents - projection.annualCents)}
        </span>
      </div>
    </div>
  );
};

const Field = ({ label, value, children }: { label: string; value: string; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="font-mono text-xs font-semibold text-primary">{value}</span>
    </div>
    {children}
  </div>
);
