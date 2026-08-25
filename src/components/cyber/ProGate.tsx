import React from "react";
import { Lock, Crown } from "lucide-react";
import { CyberButton } from "./CyberButton";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "@tanstack/react-router";

interface ProGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  featureName?: string;
  blurLevel?: "sm" | "md" | "lg";
}

export function ProGate({
  children,
  fallback,
  featureName = "Premium Feature",
  blurLevel = "md",
}: ProGateProps) {
  const { hasAccess, loading } = useSubscription();

  if (loading) {
    return <div className="animate-pulse bg-black/20 rounded-xl h-32 w-full" />;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // If a custom fallback is provided, render it instead of the blurred overlay
  if (fallback) {
    return <>{fallback}</>;
  }

  const blurClasses = {
    sm: "blur-[2px]",
    md: "blur-[4px]",
    lg: "blur-md",
  };

  return (
    <div className="relative group overflow-hidden rounded-xl">
      {/* Blurred Children Content */}
      <div
        className={`transition-all duration-500 opacity-60 pointer-events-none select-none ${blurClasses[blurLevel]}`}
      >
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-background/40 backdrop-blur-[2px] border border-primary/20 rounded-xl transition-all duration-300 group-hover:bg-background/60">
        <div className="bg-black/80 border border-primary/40 rounded-xl p-6 text-center max-w-sm mx-auto shadow-[0_0_30px_rgba(0,243,255,0.15)] transform transition-transform group-hover:scale-105">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/30">
            <Crown className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <h3 className="font-display font-bold text-lg text-white mb-2">{featureName}</h3>
          <p className="text-sm font-mono text-muted-foreground mb-6">
            Upgrade to Pro to unlock advanced AI analytics, zero-day threat intelligence, and
            automated playbooks.
          </p>
          <Link to="/pricing">
            <CyberButton variant="cyan" className="w-full">
              <Lock className="h-4 w-4 mr-2" /> Unlock Pro Access
            </CyberButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
