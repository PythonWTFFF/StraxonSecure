import { motion, AnimatePresence } from "framer-motion";
import { useScrollBehavior } from "@/hooks/useScrollBehavior";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const IdleHint = () => {
  const { isIdle, idleDuration, dynamicCTA, scrollDepth } = useScrollBehavior();
  
  const showHint = isIdle && idleDuration > 4000;
  
  const ctaLink = scrollDepth === "top" 
    ? "/projects" 
    : scrollDepth === "middle" 
    ? "/projects" 
    : "/contact";

  return (
    <AnimatePresence>
      {showHint && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: "spring", damping: 20 }}
          className="fixed bottom-8 right-8 z-50 max-w-xs"
        >
          <Link
            to={ctaLink}
            className="group flex items-center gap-3 rounded-2xl border border-primary/30 bg-card/90 backdrop-blur-xl px-5 py-4 shadow-2xl transition-all hover:border-primary/60 hover:box-glow"
          >
            <div className="flex-1">
              <p className="text-[10px] font-mono text-primary/60 tracking-widest uppercase mb-1">
                System Hint
              </p>
              <p className="text-sm font-semibold text-foreground">{dynamicCTA}</p>
            </div>
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="h-4 w-4 text-primary" />
            </motion.div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IdleHint;
