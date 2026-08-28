import { Link } from "react-router-dom";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import { ServiceDef, formatPrice } from "@/lib/services";
import { MouseEvent } from "react";

export const ServiceCard = ({ service, index = 0 }: { service: ServiceDef; index?: number }) => {
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
      transition={{ delay: index * 0.05, duration: 0.5 }}
      className="h-full"
    >
      <Link
        to={`/checkout/${service.slug}`}
        onMouseMove={handleMouseMove}
        className="group block relative h-full rounded-2xl glass p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant overflow-hidden"
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
          <div className="flex items-start justify-between mb-4">
            <span className="text-[10px] uppercase tracking-widest font-mono px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {service.tier}
            </span>
            <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:rotate-45 transition-all" />
          </div>
          <h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors">{service.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">{service.tagline}</p>
          <ul className="space-y-1.5 mb-6">
            {service.features.slice(0, 3).map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <div className="flex items-baseline gap-1 pt-4 border-t border-border/50">
            <span className="text-2xl font-bold text-gradient">{formatPrice(service.priceCents)}</span>
            {service.cadence && <span className="text-sm text-muted-foreground">{service.cadence}</span>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
