import { Lock, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";

export function PremiumOverlay({ children, featureName }: { children: ReactNode, featureName: string }) {
  const { hasAccess } = useSubscription();

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative group overflow-hidden rounded-xl border border-border/50">
      <div className="pointer-events-none select-none blur-md opacity-30 transition-all duration-500 group-hover:blur-xl">
        {children}
      </div>
      
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-background/40 backdrop-blur-[2px]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/60 border border-primary/20 backdrop-blur-xl rounded-2xl p-6 md:p-8 max-w-sm w-full text-center shadow-[0_0_40px_rgba(0,243,255,0.1)] relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
          
          <div className="mx-auto w-12 h-12 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center mb-4 text-primary relative z-10">
            <Lock className="h-6 w-6" />
          </div>
          
          <h3 className="font-display font-bold text-xl text-foreground mb-2 relative z-10">
            {featureName} Locked
          </h3>
          
          <p className="text-sm text-muted-foreground font-mono mb-6 relative z-10">
            Upgrade to Enterprise to unlock live AI threat streams, advanced labs, and zero-day analytics.
          </p>
          
          <Link 
            to="/pricing" 
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-bold font-mono text-sm rounded-lg shadow-[0_0_15px_rgba(0,243,255,0.4)] transition-all relative z-10"
          >
            <Zap className="h-4 w-4" />
            Upgrade to Pro
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
