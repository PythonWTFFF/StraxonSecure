import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CreditCard, Calendar, AlertTriangle, Receipt, Crown, ShieldAlert } from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { cancelSubscription } from "@/server/billing";
import { callAuthed } from "@/lib/serverCall";
import { toast } from "sonner";

// ONLY ONE Route Export
export const Route = createFileRoute("/billing")({
  head: () => ({ meta: [{ title: "Billing — Straxon Secure" }] }),
  component: BillingPage,
});

interface Payment {
  id: string;
  provider: string;
  amount_cents: number;
  currency: string;
  status: string;
  description: string | null;
  created_at: string;
}

function BillingPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { sub, hasAccess, trialActive, paidActive, trialDaysLeft, loading, refresh } =
    useSubscription();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setPayments((data as Payment[]) ?? []));
  }, [user]);

  const handleCancel = async () => {
    if (!confirm("Cancel subscription at end of period?")) return;
    setBusy(true);
    try {
      await callAuthed(cancelSubscription, undefined as any);
      toast.success("Subscription will end at period close.");
      await refresh();
    } catch {
      toast.error("Could not cancel");
    } finally {
      setBusy(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="p-8 font-mono text-xs text-slate-500 animate-pulse">
        // Loading billing data...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#020610] text-slate-300 font-sans selection:bg-[#00f3ff] selection:text-black overflow-hidden flex flex-col">
      {/* GLITCH CSS INJECTION */}
      <style>{`
        .glitch-text-color { position: relative; display: inline-block; font-weight: 900; }
        .glitch-text-color::before, .glitch-text-color::after {
          content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: transparent;
          -webkit-text-fill-color: transparent; background-clip: text; -webkit-background-clip: text;
        }
        .glitch-text-color::before {
          left: 2px; background-image: linear-gradient(to right, #00f3ff, #3b82f6, #ff003c);
          text-shadow: -1px 0 rgba(255, 0, 60, 0.5); clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
          animation: glitch-anim-1 2.5s infinite linear alternate-reverse;
        }
        .glitch-text-color::after {
          left: -2px; background-image: linear-gradient(to right, #00f3ff, #3b82f6, #ff003c);
          text-shadow: 1px 0 rgba(0, 243, 255, 0.5); clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
          animation: glitch-anim-2 3s infinite linear alternate-reverse;
        }
        @keyframes glitch-anim-1 {
          0% { clip-path: inset(20% 0 80% 0); transform: translate(-1px, 0.5px); }
          20% { clip-path: inset(60% 0 10% 0); transform: translate(1px, -0.5px); }
          40% { clip-path: inset(40% 0 50% 0); transform: translate(-1px, 1px); }
          60% { clip-path: inset(80% 0 5% 0); transform: translate(1px, -1px); }
          80% { clip-path: inset(10% 0 70% 0); transform: translate(-0.5px, 0.5px); }
          100% { clip-path: inset(30% 0 50% 0); transform: translate(0.5px, -0.5px); }
        }
        @keyframes glitch-anim-2 {
          0% { clip-path: inset(10% 0 60% 0); transform: translate(1px, -0.5px); }
          20% { clip-path: inset(30% 0 20% 0); transform: translate(-1px, 0.5px); }
          40% { clip-path: inset(70% 0 10% 0); transform: translate(1px, 1px); }
          60% { clip-path: inset(20% 0 50% 0); transform: translate(-1px, -1px); }
          80% { clip-path: inset(50% 0 30% 0); transform: translate(0.5px, 0.5px); }
          100% { clip-path: inset(5% 0 80% 0); transform: translate(-0.5px, -0.5px); }
        }
      `}</style>

      {/* CRT SCANLINES */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.025] mix-blend-overlay bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:100%_4px]" />

      <div className="px-4 lg:px-8 py-8 max-w-5xl mx-auto w-full space-y-6 relative z-10">
        <header className="flex-none flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div>
            <h1 className="text-xl md:text-3xl font-display tracking-tight flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 md:h-8 md:w-8 text-[#00f3ff]" />
              <span className="glitch-text-color text-white" data-text="BILLING & SUBSCRIPTION">
                BILLING & SUBSCRIPTION
              </span>
            </h1>
            <p className="text-[9px] sm:text-[10px] font-mono text-slate-500 mt-1.5 uppercase tracking-[0.2em]">
              // ACCOUNT MANAGEMENT
            </p>
          </div>
        </header>

        <CyberCard
          variant={paidActive ? "magenta" : "cyan"}
          glow
          className={`p-6 border ${paidActive ? "border-[#ff003c]/40 bg-[#020610]/90 shadow-[0_0_30px_rgba(255,0,60,0.1)]" : "border-[#00f3ff]/40 bg-[#020610]/80"}`}
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div
                className={`text-xs font-mono tracking-widest uppercase ${paidActive ? "text-[#ff003c]" : "text-[#00f3ff]"}`}
              >
                CURRENT PLAN
              </div>
              <div className="flex items-center gap-3 mt-2">
                {paidActive && (
                  <Crown className="h-6 w-6 text-[#ff003c] drop-shadow-[0_0_8px_#ff003c]" />
                )}
                <span className="font-display text-3xl font-bold text-white">
                  {paidActive
                    ? sub?.plan === "pro_yearly"
                      ? "Pro Yearly"
                      : "Pro Monthly"
                    : trialActive
                      ? "Free Trial"
                      : "Free"}
                </span>
              </div>
              <div className="mt-4 text-xs text-slate-400 space-y-2 font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 tracking-widest">STATUS:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-widest border ${hasAccess ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}
                  >
                    {sub?.status || "INACTIVE"}
                  </span>
                </div>
                {trialActive && (
                  <div className="text-yellow-400 flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" /> TRIAL ENDS IN {trialDaysLeft} DAY
                    {trialDaysLeft !== 1 ? "S" : ""}
                  </div>
                )}
                {sub?.current_period_end && (
                  <div className="text-slate-300">
                    <span className="text-slate-500 tracking-widest mr-2">RENEWS:</span>
                    {new Date(sub.current_period_end).toLocaleDateString()}
                  </div>
                )}
                {sub?.cancel_at_period_end && (
                  <div className="text-[#ff003c] flex items-center gap-2 mt-2 bg-[#ff003c]/10 px-3 py-1.5 rounded border border-[#ff003c]/30 inline-flex">
                    <AlertTriangle className="h-3 w-3" /> CANCELS AT PERIOD END
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3 min-w-[140px]">
              {!paidActive && (
                <Link to="/pricing" className="w-full">
                  <CyberButton variant="magenta" className="w-full">
                    Upgrade to Pro
                  </CyberButton>
                </Link>
              )}
              {paidActive && !sub?.cancel_at_period_end && (
                <CyberButton
                  variant="ghost"
                  className="w-full bg-[#020610]/50 border-slate-700 text-slate-300 hover:text-[#ff003c] hover:border-[#ff003c]"
                  onClick={handleCancel}
                  disabled={busy}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" /> Cancel Plan
                </CyberButton>
              )}
            </div>
          </div>
        </CyberCard>

        <div className="grid md:grid-cols-2 gap-6">
          <CyberCard variant="cyan" className="p-6 bg-[#020610]/80 border-white/5">
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#00f3ff] mb-6 pb-3 border-b border-white/5">
              <Receipt className="h-4 w-4" /> PAYMENT HISTORY
            </div>
            {payments.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono tracking-widest">
                NO PAYMENTS RECORDED.
              </p>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border-b border-white/5 pb-3 text-sm hover:bg-white/5 p-2 rounded transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-black/40 border border-white/5">
                        <Calendar className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <div className="font-mono text-slate-300 text-[11px]">
                          {new Date(p.created_at).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                          {p.description ?? p.provider}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-white text-sm">
                        {p.currency === "inr" ? "₹" : "$"}
                        {(p.amount_cents / 100).toFixed(2)}
                      </div>
                      <div className="text-[9px] text-green-400 uppercase tracking-widest mt-0.5">
                        {p.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CyberCard>

          <CyberCard variant="cyan" className="p-6 bg-[#020610]/80 border-white/5">
            <div className="text-xs font-mono tracking-widest uppercase text-[#00f3ff] mb-6 pb-3 border-b border-white/5 flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> PAYMENT METHODS
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Manage your card on file securely via the Stripe portal using your email receipts.
              Razorpay payments are processed as one-time transactions per period.
            </p>
          </CyberCard>
        </div>
      </div>
    </div>
  );
}
