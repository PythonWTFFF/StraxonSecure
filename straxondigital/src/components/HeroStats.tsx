import { AnimatedCounter } from "./AnimatedCounter";

export const HeroStats = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 border-t border-border/40 pt-8">
      <div>
        <div className="text-3xl font-bold font-mono text-foreground flex items-center">
          <AnimatedCounter value={1.2} prefix="₹" suffix="Cr+" decimals={1} duration={2.5} />
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Platform GMV</p>
      </div>
      <div>
        <div className="text-3xl font-bold font-mono text-foreground flex items-center">
          <AnimatedCounter value={2841} suffix="+" duration={2} />
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Active Clients</p>
      </div>
      <div>
        <div className="text-3xl font-bold font-mono text-foreground flex items-center">
          <AnimatedCounter value={14} suffix="k+" duration={2.2} />
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Deliverables</p>
      </div>
      <div>
        <div className="text-3xl font-bold font-mono text-foreground flex items-center">
          <AnimatedCounter value={99.99} suffix="%" decimals={2} duration={2} />
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">SLA Uptime</p>
      </div>
    </div>
  );
};
