import { Link } from "react-router-dom";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { ArrowUpRight, Check, Clock, Sparkles, SlidersHorizontal } from "lucide-react";
import { ServiceDef, formatPrice } from "@/lib/services";
import { Button } from "@/components/ui/button";
import { MouseEvent } from "react";

interface ServiceCardProps {
  service: ServiceDef;
  index?: number;
  onCustomize?: (service: ServiceDef) => void;
}

export const ServiceCard = ({
  service,
  index = 0,
  onCustomize,
}: ServiceCardProps) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.04, duration: 0.5 }}
      className="h-full"
    >
      <div
        onMouseMove={handleMouseMove}
        className="group relative h-full flex flex-col justify-between rounded-2xl glass p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant overflow-hidden border border-border/60 hover:border-primary/40"
      >
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                450px circle at ${mouseX}px ${mouseY}px,
                hsl(var(--primary) / 0.15),
                transparent 80%
              )
            `,
          }}
        />
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-luxury pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {service.category}
              </span>
              {service.popular && (
                <span className="text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" /> Popular
                </span>
              )}
            </div>
            <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
              <Clock className="h-3 w-3 text-primary" /> {service.turnaround}
            </span>
          </div>

          <h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors">
            {service.name}
          </h3>
          <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
            {service.tagline}
          </p>

          <ul className="space-y-1.5 mb-6">
            {service.features.slice(0, 4).map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 pt-4 border-t border-border/50">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-xs text-muted-foreground block font-mono">From</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gradient">
                  {formatPrice(service.priceCents)}
                </span>
                {service.cadence && (
                  <span className="text-xs text-muted-foreground">{service.cadence}</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCustomize ? onCustomize(service) : null}
              className="border-primary/30 hover:bg-primary/10 text-xs flex items-center justify-center gap-1.5 w-full"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" /> Customize
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-gradient-primary text-primary-foreground border-0 text-xs shadow-glow hover:opacity-90 w-full"
            >
              <Link to={`/checkout/${service.slug}`}>
                Order <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
