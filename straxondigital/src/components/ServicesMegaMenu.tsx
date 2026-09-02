import { Link } from "react-router-dom";
import { SERVICES } from "@/lib/services";
import { motion, AnimatePresence } from "framer-motion";

export const ServicesMegaMenu = ({ isOpen }: { isOpen: boolean }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="absolute top-full left-0 mt-2 w-[600px] glass-strong rounded-2xl p-6 shadow-2xl border border-border/50 grid grid-cols-2 gap-x-8 gap-y-6 z-50"
        >
          {SERVICES.slice(0, 8).map((service) => (
            <Link
              key={service.slug}
              to={`/services?service=${service.slug}`}
              className="group flex gap-3 hover:bg-primary/5 p-2 rounded-xl transition-colors"
            >
              <div className="h-10 w-10 shrink-0 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <service.icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {service.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {service.shortDesc || service.description}
                </p>
              </div>
            </Link>
          ))}
          
          <div className="col-span-2 pt-4 mt-2 border-t border-border/40 flex justify-between items-center">
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
              16+ Autonomous Micro-Services
            </span>
            <Link to="/services" className="text-sm text-primary font-semibold hover:underline">
              View all services &rarr;
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
