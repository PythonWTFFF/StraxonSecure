import { Link } from "@tanstack/react-router";
import { Lock, Sparkles, Clock } from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";

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
      <div className="animate-pulse text-xs font-mono text-muted-foreground p-4">
        // Verifying access...
      </div>
    );
  }

  if (hasAccess) {
    return (
      <>
        {trialActive && (
          <div className="mb-4 flex items-center gap-2 text-xs font-mono px-3 py-2 rounded border border-accent/40 bg-accent/5 text-accent">
            <Clock className="h-3.5 w-3.5" />
            <span>
              TRIAL ACTIVE — {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining.{" "}
              <Link to="/pricing" className="underline hover:text-accent/80">
                Upgrade now
              </Link>
            </span>
          </div>
        )}
        {children}
      </>
    );
  }

  const Card = inline ? "div" : CyberCard;
  return (
    <Card className={inline ? "" : "p-8 text-center max-w-2xl mx-auto"}>
      <Lock className="h-10 w-10 text-accent mx-auto mb-3" />
      <div className="text-xs font-mono tracking-[0.3em] text-accent uppercase mb-2">
        // PRO FEATURE LOCKED
      </div>
      <h3 className="font-display text-2xl font-bold mb-2">{feature}</h3>
      {description && <p className="text-sm text-muted-foreground mb-5">{description}</p>}
      <div className="flex flex-wrap justify-center gap-3">
        {!user ? (
          <Link to="/auth">
            <CyberButton variant="cyan" size="lg">
              <Sparkles className="h-4 w-4" /> Start 7-Day Free Trial
            </CyberButton>
          </Link>
        ) : (
          <Link to="/pricing">
            <CyberButton variant="magenta" size="lg">
              <Sparkles className="h-4 w-4" /> Upgrade to Pro
            </CyberButton>
          </Link>
        )}
      </div>
    </Card>
  );
}
