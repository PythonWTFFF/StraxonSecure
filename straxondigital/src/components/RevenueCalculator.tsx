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
  const [margin, setMargin] = useState([65]); // Profit Margin

  const projection = useMemo(() => {
    const monthlyDollars = (visitors[0] * (conversion[0] / 100)) * aov[0];
    const currentProfit = monthlyDollars * (margin[0] / 100);
    const annualProfit = currentProfit * 12;

    const liftDollars = monthlyDollars * 1.85; // hypothetical Straxon lift
    const straxonMargin = Math.min(95, margin[0] + 15); // Straxon automations increase margin by 15%
    const liftedProfit = liftDollars * (straxonMargin / 100);

    return {
      currentCents: Math.round(monthlyDollars * 100),
      currentProfitCents: Math.round(currentProfit * 100),
      liftedCents: Math.round(liftDollars * 100),
      liftedProfitCents: Math.round(liftedProfit * 100),
      annualProfitCents: Math.round(annualProfit * 100),
      annualLiftedProfitCents: Math.round(liftedProfit * 12 * 100),
      straxonMargin,
    };
  }, [visitors, aov, conversion, margin]);

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
        <Field label="Current Profit Margin" value={`${margin[0]}%`}>
          <Slider value={margin} onValueChange={setMargin} min={10} max={90} step={5} />
        </Field>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3.5">
        <div className="rounded-xl bg-secondary/40 p-4 border border-white/5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-mono">Today (Status Quo)</p>
          <motion.p
            key={projection.currentProfitCents}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="text-xl sm:text-2xl font-bold mt-1 text-gray-300"
          >
            {formatPrice(projection.currentProfitCents)}<span className="text-xs font-normal text-muted-foreground">/mo profit</span>
          </motion.p>
          <p className="text-[10px] text-muted-foreground mt-1">@ {margin[0]}% margin</p>
        </div>
        <div className="rounded-xl bg-gradient-luxury p-4 border border-primary/30 shadow-glow relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
          <div className="relative z-10">
            <p className="text-[11px] text-primary uppercase tracking-wider font-mono font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> With Straxon Engine
            </p>
            <motion.p
              key={projection.liftedProfitCents}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="text-xl sm:text-2xl font-extrabold mt-1 text-gradient"
            >
              {formatPrice(projection.liftedProfitCents)}<span className="text-xs font-normal text-muted-foreground">/mo profit</span>
            </motion.p>
            <p className="text-[10px] text-primary/80 mt-1">@ {projection.straxonMargin}% automated margin</p>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
        <span>Estimated Annual Net Profit Lift:</span>
        <span className="text-emerald-400 font-bold font-mono text-base bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-400/20 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
          +{formatPrice(projection.annualLiftedProfitCents - projection.annualProfitCents)}
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
