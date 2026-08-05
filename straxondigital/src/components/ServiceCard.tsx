import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import { ServiceDef, formatPrice } from "@/lib/services";

export const ServiceCard = ({ service, index = 0 }: { service: ServiceDef; index?: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
    >
      <Link
        to={`/checkout/${service.slug}`}
        className="group block relative h-full rounded-2xl glass p-6 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
      >
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-luxury pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <span className="text-[10px] uppercase tracking-widest font-mono px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {service.tier}
            </span>
            <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:rotate-45 transition-all" />
          </div>
          <h3 className="text-xl font-semibold mb-1">{service.name}</h3>
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
