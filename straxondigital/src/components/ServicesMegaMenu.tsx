import { Link } from "react-router-dom";
import { SERVICES, ServiceCategory } from "@/lib/services";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Sparkles, Cpu, TrendingUp, Compass, ArrowRight, Zap } from "lucide-react";

const getCategoryIcon = (category: ServiceCategory) => {
  switch (category) {
    case "ai":
      return Cpu;
    case "engineering":
      return Globe;
    case "growth":
      return TrendingUp;
    case "branding":
      return Sparkles;
    case "strategy":
      return Compass;
    default:
      return Zap;
  }
};

export const ServicesMegaMenu = ({ isOpen }: { isOpen: boolean }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute top-full left-0 mt-2 w-[620px] glass-strong rounded-2xl p-6 shadow-2xl border border-border/50 grid grid-cols-2 gap-x-6 gap-y-4 z-50 backdrop-blur-2xl"
        >
          {SERVICES.slice(0, 8).map((service) => {
            const Icon = getCategoryIcon(service.category);
            return (
              <Link
                key={service.slug}
                to={`/services?service=${service.slug}`}
                className="group flex items-start gap-3 hover:bg-primary/10 p-2.5 rounded-xl transition-colors border border-transparent hover:border-primary/20"
              >
                <div className="h-9 w-9 shrink-0 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors mt-0.5">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {service.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    {service.tagline || service.description}
                  </p>
                </div>
              </Link>
            );
          })}
          
          <div className="col-span-2 pt-3 mt-1 border-t border-border/40 flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-mono uppercase tracking-wider text-[10px]">
              16+ Autonomous Micro-Services
            </span>
            <Link to="/services" className="text-primary font-semibold hover:underline flex items-center gap-1">
              <span>View full catalog</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
