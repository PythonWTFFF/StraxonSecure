import { Link } from "@tanstack/react-router";
import { Lock, Sparkles, Clock, ShieldAlert, Zap } from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

interface Props {
  feature: string;
  description?: string;
  children: React.ReactNode;
  inline?: boolean;
}

export function PremiumGate({ feature, description, children, inline = false }: Props) {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading, trialActive, trialDaysLeft } = useSubscription();

  if (authLoading || loading) {
    return (
      <div className="animate-pulse text-xs font-mono text-muted-foreground p-4 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
        // Verifying cryptographic access...
      </div>
    );
  }

  if (hasAccess) {
    return (
      <>
        {trialActive && (
          <div className="mb-4 flex items-center justify-between text-xs font-mono px-4 py-2.5 rounded border border-accent/40 bg-accent/5 text-accent shadow-[0_0_15px_rgba(255,0,60,0.15)]">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 animate-pulse" />
              <span>
                <strong>TRIAL ACTIVE</strong> — {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""}{" "}
                remaining.
              </span>
            </div>
            <Link to="/pricing" className="underline hover:text-accent/80 font-bold tracking-wide">
              UPGRADE NOW →
            </Link>
          </div>
        )}
        {children}
      </>
    );
  }

  if (inline) {
    return (
      <div className="p-6 text-center border-2 border-dashed border-accent/30 rounded-lg bg-black/40 backdrop-blur">
        <Lock className="h-6 w-6 text-accent mx-auto mb-2" />
        <h4 className="text-sm font-bold text-white mb-3">{feature} is locked</h4>
        <Link to={user ? "/pricing" : "/auth"}>
          <CyberButton variant="magenta" size="sm">
            <Zap className="h-3 w-3 mr-1" /> Upgrade
          </CyberButton>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto"
    >
      <CyberCard className="p-10 text-center relative overflow-hidden bg-[#020610]/80 backdrop-blur-md border-accent/60 shadow-[0_0_40px_rgba(255,0,60,0.15)]">
        {/* Animated background flare */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 border border-accent/30 mb-6">
            <ShieldAlert className="h-8 w-8 text-accent" />
          </div>

          <div className="text-[10px] font-mono tracking-[0.4em] text-accent font-bold mb-3">
            // ACCESS DENIED //
          </div>

          <h3 className="font-display text-3xl font-bold mb-4 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            {feature}
          </h3>

          <p className="text-slate-300 mb-8 max-w-lg mx-auto leading-relaxed">
            {description ||
              "This module requires elevated privileges. Upgrade your clearance to access advanced attack vectors, real-time SOC capabilities, and CISO-level reporting."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!user ? (
              <Link to="/auth" className="w-full sm:w-auto">
                <CyberButton variant="cyan" size="lg" className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" /> Start 7-Day Free Trial
                </CyberButton>
              </Link>
            ) : (
              <Link to="/pricing" className="w-full sm:w-auto">
                <CyberButton
                  variant="magenta"
                  size="lg"
                  className="w-full shadow-[0_0_20px_rgba(255,0,60,0.4)]"
                >
                  <Zap className="h-4 w-4 mr-2" /> Upgrade to Pro Clearance
                </CyberButton>
              </Link>
            )}
          </div>
        </div>
      </CyberCard>
    </motion.div>
  );
}
