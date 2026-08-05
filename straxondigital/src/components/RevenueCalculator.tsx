import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";

export const RevenueCalculator = () => {
  const [visitors, setVisitors] = useState([5000]);
  const [aov, setAov] = useState([149]);
  const [conversion, setConversion] = useState([2.5]);

  const projection = useMemo(() => {
    const monthly = (visitors[0] * (conversion[0] / 100)) * aov[0];
    const annual = monthly * 12;
    const lift = monthly * 1.85; // hypothetical Straxon lift
    return {
      current: Math.round(monthly),
      lifted: Math.round(lift),
      annual: Math.round(annual),
      annualLifted: Math.round(lift * 12),
    };
  }, [visitors, aov, conversion]);

  return (
    <div className="glass-strong rounded-2xl p-6 sm:p-8 border-glow">
      <div className="flex items-baseline justify-between mb-6">
        <h3 className="text-lg sm:text-xl font-semibold">Revenue Projection</h3>
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Live</span>
      </div>

      <div className="space-y-6">
        <Field label="Monthly visitors" value={visitors[0].toLocaleString()}>
          <Slider value={visitors} onValueChange={setVisitors} min={500} max={100000} step={500} />
        </Field>
        <Field label="Average order value" value={`$${aov[0]}`}>
          <Slider value={aov} onValueChange={setAov} min={20} max={2000} step={10} />
        </Field>
        <Field label="Conversion rate" value={`${conversion[0].toFixed(1)}%`}>
          <Slider value={conversion} onValueChange={setConversion} min={0.5} max={10} step={0.1} />
        </Field>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-secondary/40 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Today</p>
          <motion.p
            key={projection.current}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold mt-1"
          >${projection.current.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span></motion.p>
        </div>
        <div className="rounded-xl bg-gradient-luxury p-4 border border-primary/20">
          <p className="text-xs text-primary uppercase tracking-wider">With Straxon</p>
          <motion.p
            key={projection.lifted}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold mt-1 text-gradient"
          >${projection.lifted.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span></motion.p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Est. annual lift: <span className="text-primary font-semibold">+${(projection.annualLifted - projection.annual).toLocaleString()}</span>
      </p>
    </div>
  );
};

const Field = ({ label, value, children }: { label: string; value: string; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-semibold text-primary">{value}</span>
    </div>
    {children}
  </div>
);
