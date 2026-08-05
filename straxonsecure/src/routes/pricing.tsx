import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Sparkles, CreditCard, IndianRupee, Lock } from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import {
  createStripeCheckout,
  createRazorpayOrder,
  verifyRazorpayPayment,
  developerBypass,
} from "@/server/billing";
import { callAuthed } from "@/lib/serverCall";
import { toast } from "sonner";

// ONLY ONE Route Export (Fixes the build crash)
export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Straxon Secure Pro" },
      {
        name: "description",
        content:
          "7-day free trial. $19/mo or $190/yr for full access to advanced labs, replay theatre, and PDF reports.",
      },
    ],
  }),
  component: PricingPage,
});

declare global {
  interface Window {
    Razorpay: any;
  }
}

const FEATURES_FREE = [
  "Basic attack labs (SQLi, XSS, Brute Force)",
  "SOC dashboard (read-only)",
  "Learning hub",
  "Architecture designer (no save)",
  "AI Assistant (limited)",
];

const FEATURES_PRO = [
  "Everything in Free",
  "Advanced labs: DDoS, Misconfig, all replay scenarios",
  "Attack Replay Theatre with playback controls",
  "PDF report generation (Scanner, Architecture, Replay)",
  "Save unlimited architectures to the cloud",
  "Compliance checker (OWASP/NIST)",
  "Live CVE Threat Intel feed",
  "Team workspaces & leaderboards",
  "Priority AI assistant (Gemini Pro)",
];

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function PricingPage() {
  const { user } = useAuth();
  const { sub, hasAccess, trialActive, paidActive, trialDaysLeft, refresh } = useSubscription();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [busy, setBusy] = useState<string | null>(null);

  const plan = billing === "monthly" ? "pro_monthly" : "pro_yearly";
  const priceUsd = billing === "monthly" ? 19 : 190;
  const priceInr = billing === "monthly" ? 1577 : 15770;

  const startStripe = async () => {
    if (!user) return (window.location.href = "/auth");
    setBusy("stripe");
    try {
      const res = await callAuthed(createStripeCheckout, { plan });
      if (res.error || !res.url) throw new Error(res.error || "Failed");
      window.location.href = res.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Stripe checkout failed");
      setBusy(null);
    }
  };

  const startRazorpay = async () => {
    if (!user) return (window.location.href = "/auth");
    setBusy("razorpay");
    try {
      const ok = await loadRazorpayScript();
      if (!ok) throw new Error("Could not load Razorpay");
      const res = await callAuthed(createRazorpayOrder, { plan });
      if (res.error || !res.order) throw new Error(res.error || "Failed");

      const rzp = new window.Razorpay({
        key: res.keyId,
        order_id: res.order.id,
        amount: res.order.amount,
        currency: res.order.currency,
        name: "Straxon Secure",
        description: billing === "monthly" ? "Pro Monthly" : "Pro Yearly",
        theme: { color: "#00f3ff" },
        prefill: { email: user.email ?? "" },
        handler: async (resp: any) => {
          const verify = await callAuthed(verifyRazorpayPayment, {
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
            plan,
          });
          if (verify.ok) {
            toast.success("Payment verified — Pro activated!");
            await refresh();
            window.location.href = "/billing";
          } else {
            toast.error(verify.error || "Verification failed");
          }
        },
        modal: { ondismiss: () => setBusy(null) },
      });
      rzp.open();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Razorpay failed");
      setBusy(null);
    }
  };

  const startDeveloperBypass = async () => {
    setBusy("dev");
    try {
      localStorage.setItem("dev_pro_override", "true");
      toast.success("Developer Bypass — Pro activated locally!");
      await refresh();
      window.location.href = "/billing";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bypass failed");
    } finally {
      setBusy(null);
    }
  };

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

      {/* CRT SCANLINES & BACKGROUND GLOW */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.025] mix-blend-overlay bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:100%_4px]" />
      <div className="pointer-events-none absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#00f3ff]/10 to-transparent blur-[120px] rounded-full" />

      <div className="px-4 lg:px-8 py-12 max-w-6xl mx-auto w-full relative z-10">
        {/* HEADER */}
        <div className="text-center mb-10">
          <div className="text-xs font-mono tracking-[0.3em] text-[#00f3ff] uppercase mb-4 flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" /> ACCESS TIERS
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">
            <span className="glitch-text-color text-white" data-text="STRAXON PRO">
              STRAXON PRO
            </span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            Start with a 7-day free trial. Cancel anytime. Pay with Stripe (global) or Razorpay
            (India).
          </p>

          {sub && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#020610]/80 border border-white/10 backdrop-blur-md text-xs font-mono">
              {paidActive && (
                <span className="text-[#00f3ff] drop-shadow-[0_0_5px_#00f3ff]">● PRO ACTIVE</span>
              )}
              {trialActive && (
                <span className="text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">
                  ● TRIAL — {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left
                </span>
              )}
              {!hasAccess && <span className="text-slate-500">● TRIAL EXPIRED</span>}
            </div>
          )}
        </div>

        {/* BILLING TOGGLE */}
        <div className="flex justify-center mb-10">
          <div className="bg-[#020610]/80 border border-white/10 backdrop-blur-md rounded-full p-1 inline-flex shadow-xl">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-6 py-2.5 rounded-full text-xs font-mono uppercase tracking-widest transition-all ${
                billing === "monthly"
                  ? "bg-[#00f3ff] text-black shadow-[0_0_15px_rgba(0,243,255,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-6 py-2.5 rounded-full text-xs font-mono uppercase tracking-widest transition-all ${
                billing === "yearly"
                  ? "bg-[#00f3ff] text-black shadow-[0_0_15px_rgba(0,243,255,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Yearly{" "}
              <span
                className={
                  billing === "yearly" ? "text-black font-bold ml-1" : "text-[#00f3ff] ml-1"
                }
              >
                SAVE 17%
              </span>
            </button>
          </div>
        </div>

        {/* PRICING CARDS */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* FREE TIER */}
          <CyberCard variant="plain" className="p-8 md:p-10 border-white/10 shadow-none">
            <div className="text-xs font-mono tracking-widest text-[#00f3ff] uppercase mb-4">
              Base Protocol
            </div>
            <div className="mb-6 flex items-baseline gap-2">
              <span className="font-display text-5xl font-bold text-white">$0</span>
              <span className="text-slate-500 font-mono text-xs uppercase tracking-widest">
                /forever
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              Essential access to get a feel for the platform.
            </p>

            <ul className="space-y-4 mb-10 text-sm text-slate-300">
              {FEATURES_FREE.map((f) => (
                <li key={f} className="flex gap-3 items-start">
                  <Check className="h-5 w-5 text-[#00f3ff] shrink-0" />{" "}
                  <span className="leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              <Link to="/auth">
                <CyberButton
                  variant="ghost"
                  className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300"
                >
                  Current Plan
                </CyberButton>
              </Link>
            </div>
          </CyberCard>

          {/* PRO TIER */}
          <CyberCard
            variant="magenta"
            glow
            className="p-8 md:p-10 border-[#ff003c]/40 shadow-[0_0_40px_rgba(255,0,60,0.1)] relative"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#ff003c]/5 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="text-xs font-mono tracking-widest text-[#ff003c] uppercase font-bold">
                Pro Protocol
              </div>
              <span className="text-[9px] font-mono px-2.5 py-1 rounded bg-[#ff003c]/10 text-[#ff003c] border border-[#ff003c]/30 tracking-widest">
                7-DAY FREE TRIAL
              </span>
            </div>

            <div className="mb-4 flex items-baseline gap-2 relative z-10">
              <span className="font-display text-5xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,0,60,0.3)]">
                ${priceUsd}
              </span>
              <span className="text-slate-400 font-mono text-xs uppercase tracking-widest">
                /{billing === "monthly" ? "mo" : "yr"}
              </span>
            </div>
            <div className="text-xs text-[#ff003c]/80 mb-6 font-mono tracking-wider relative z-10">
              ≈ ₹{priceInr.toLocaleString("en-IN")} via Razorpay
            </div>
            <p className="text-sm text-slate-300 mb-8 leading-relaxed relative z-10">
              Advanced capabilities for serious operators and security teams.
            </p>

            <ul className="space-y-4 mb-10 text-sm text-slate-200 relative z-10">
              {FEATURES_PRO.map((f) => (
                <li key={f} className="flex gap-3 items-start">
                  <Sparkles className="h-5 w-5 text-[#ff003c] shrink-0" />{" "}
                  <span className="leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-3 mt-auto relative z-10">
              <CyberButton
                variant="magenta"
                className="w-full"
                size="lg"
                onClick={startStripe}
                disabled={busy !== null}
              >
                <CreditCard className="h-4 w-4 mr-2" />{" "}
                {busy === "stripe" ? "Redirecting..." : "Pay with Stripe"}
              </CyberButton>
              <CyberButton
                variant="cyan"
                className="w-full"
                size="lg"
                onClick={startRazorpay}
                disabled={busy !== null}
              >
                <IndianRupee className="h-4 w-4 mr-2" />{" "}
                {busy === "razorpay" ? "Loading..." : "Pay with Razorpay"}
              </CyberButton>
              {import.meta.env.DEV && (
                <CyberButton
                  variant="ghost"
                  className="w-full mt-4 text-slate-400 hover:text-white border-dashed"
                  onClick={startDeveloperBypass}
                  disabled={busy !== null}
                >
                  {busy === "dev" ? "Activating..." : "[DEV TEST] Override Pro Tier"}
                </CyberButton>
              )}
            </div>
          </CyberCard>
        </div>

        <p className="text-center text-[10px] font-mono tracking-widest uppercase text-slate-500 mt-12">
          Secure checkout. Cancel anytime from{" "}
          <Link to="/billing" className="text-[#00f3ff] hover:underline">
            Billing Portal
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
