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
          "7-day free trial. Hobby, Pro, and Enterprise tiers for advanced labs, replay theatre, and SOC features.",
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

const FEATURES_HOBBY = [
  "Basic attack labs (SQLi, XSS, Brute Force)",
  "SOC dashboard (read-only)",
  "Learning hub",
  "Architecture designer (no save)",
  "AI Assistant (limited)",
];

const FEATURES_PRO = [
  "Everything in Hobby",
  "Advanced labs: DDoS, Misconfig, all replay scenarios",
  "Attack Replay Theatre with playback controls",
  "PDF report generation",
  "Save unlimited architectures to the cloud",
  "Compliance checker (OWASP/NIST)",
  "Live CVE Threat Intel feed",
];

const FEATURES_ENTERPRISE = [
  "Everything in Pro",
  "Custom dedicated instances",
  "Team workspaces & leaderboards",
  "Priority AI assistant (Gemini Pro)",
  "SSO & Directory Sync",
  "Dedicated Success Manager",
  "White-labeled PDF reports",
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

        {/* LIVE STATS TICKER */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-10">
          {[
            { value: "12,400+", label: "Labs Run Today" },
            { value: "99.9%", label: "Uptime SLA" },
            { value: "1,200+", label: "Pro Operators" },
            { value: "<3s", label: "Avg Threat Detection" },
          ].map((stat) => (
            <div key={stat.label} className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 min-w-[100px]">
              <div className="font-display text-xl md:text-2xl font-bold text-[#00f3ff] drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">{stat.value}</div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* TRUST BADGES */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {["🔐 SOC 2 Compliant", "🛡️ End-to-End Encrypted", "💳 Secure Checkout", "🔄 Cancel Anytime", "🌍 Global + India Payments"].map((badge) => (
            <span key={badge} className="text-[11px] font-mono text-slate-400 border border-white/10 px-3 py-1 rounded-full bg-white/5">
              {badge}
            </span>
          ))}
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
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* HOBBY TIER */}
          <CyberCard variant="plain" className="p-6 md:p-8 border-white/10 shadow-none flex flex-col">
            <div className="text-[10px] font-mono tracking-widest text-[#00f3ff] uppercase mb-4">
              Hobby
            </div>
            <div className="mb-6 flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold text-white">$0</span>
              <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">
                /forever
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-8 leading-relaxed flex-1">
              Essential access to get a feel for the platform.
            </p>

            <ul className="space-y-4 mb-10 text-xs text-slate-300">
              {FEATURES_HOBBY.map((f) => (
                <li key={f} className="flex gap-3 items-start">
                  <Check className="h-4 w-4 text-[#00f3ff] shrink-0" />{" "}
                  <span className="leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              <Link to="/auth">
                <CyberButton
                  variant="ghost"
                  className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs"
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
            className="p-6 md:p-8 border-[#ff003c]/40 shadow-[0_0_40px_rgba(255,0,60,0.1)] relative flex flex-col transform md:-translate-y-4"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#ff003c]/5 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="text-[10px] font-mono tracking-widest text-[#ff003c] uppercase font-bold">
                Pro Protocol
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#ff003c]/10 text-[#ff003c] border border-[#ff003c]/30 tracking-widest">
                POPULAR
              </span>
            </div>

            <div className="mb-4 flex items-baseline gap-2 relative z-10">
              <span className="font-display text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,0,60,0.3)]">
                ${priceUsd}
              </span>
              <span className="text-slate-400 font-mono text-[10px] uppercase tracking-widest">
                /{billing === "monthly" ? "mo" : "yr"}
              </span>
            </div>
            <div className="text-[10px] text-[#ff003c]/80 mb-6 font-mono tracking-wider relative z-10">
              ≈ ₹{priceInr.toLocaleString("en-IN")} via Razorpay
            </div>
            <p className="text-xs text-slate-300 mb-8 leading-relaxed relative z-10 flex-1">
              Advanced capabilities for serious operators and security teams.
            </p>

            <ul className="space-y-4 mb-10 text-xs text-slate-200 relative z-10">
              {FEATURES_PRO.map((f) => (
                <li key={f} className="flex gap-3 items-start">
                  <Sparkles className="h-4 w-4 text-[#ff003c] shrink-0" />{" "}
                  <span className="leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-3 mt-auto relative z-10">
              <CyberButton
                variant="magenta"
                className="w-full text-xs"
                size="sm"
                onClick={startStripe}
                disabled={busy !== null}
              >
                <CreditCard className="h-3 w-3 mr-2" />{" "}
                {busy === "stripe" ? "Redirecting..." : "Pay with Stripe"}
              </CyberButton>
              <CyberButton
                variant="cyan"
                className="w-full text-xs"
                size="sm"
                onClick={startRazorpay}
                disabled={busy !== null}
              >
                <IndianRupee className="h-3 w-3 mr-2" />{" "}
                {busy === "razorpay" ? "Loading..." : "Pay with Razorpay"}
              </CyberButton>
              {import.meta.env.DEV && (
                <CyberButton
                  variant="ghost"
                  className="w-full mt-4 text-slate-400 hover:text-white border-dashed text-xs"
                  onClick={startDeveloperBypass}
                  disabled={busy !== null}
                >
                  {busy === "dev" ? "Activating..." : "[DEV TEST] Override Pro Tier"}
                </CyberButton>
              )}
            </div>
          </CyberCard>

          {/* ENTERPRISE TIER */}
          <CyberCard variant="plain" className="p-6 md:p-8 border-white/10 shadow-none flex flex-col">
            <div className="text-[10px] font-mono tracking-widest text-[#00f3ff] uppercase mb-4">
              Enterprise
            </div>
            <div className="mb-6 flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold text-white">Custom</span>
            </div>
            <p className="text-xs text-slate-400 mb-8 leading-relaxed flex-1">
              For large organizations needing dedicated infrastructure and white-glove support.
            </p>

            <ul className="space-y-4 mb-10 text-xs text-slate-300">
              {FEATURES_ENTERPRISE.map((f) => (
                <li key={f} className="flex gap-3 items-start">
                  <Check className="h-4 w-4 text-[#00f3ff] shrink-0" />{" "}
                  <span className="leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              <CyberButton
                variant="ghost"
                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs"
                onClick={() => {
                  window.location.href = "mailto:sales@straxon.io";
                }}
              >
                Contact Sales
              </CyberButton>
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

        {/* ── TESTIMONIALS ─────────────────────────────── */}
        <div className="mt-24 text-center">
          <div className="text-xs font-mono tracking-[0.3em] text-[#00f3ff] uppercase mb-4">
            What Security Teams Say
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-12">
            Trusted by 1,000+ Operators
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Straxon's attack replay theatre alone is worth the Pro subscription. We run it in every red team debrief.",
                name: "David K.",
                role: "Lead Red Team Operator",
                avatar: 20,
              },
              {
                quote: "The CVE intel feed + compliance checker replaced three separate tools for us. Incredible value.",
                name: "Priya S.",
                role: "CISO, FinTech Startup",
                avatar: 25,
              },
              {
                quote: "Deployed it to the entire SOC team in under an hour. The Razorpay option made billing easy for our India office.",
                name: "Ahmed R.",
                role: "Head of Security Operations",
                avatar: 32,
              },
            ].map((t) => (
              <div
                key={t.name}
                className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md text-left flex flex-col gap-4"
              >
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <img
                    src={`https://i.pravatar.cc/64?img=${t.avatar}`}
                    alt={t.name}
                    className="w-10 h-10 rounded-full border-2 border-white/10"
                  />
                  <div>
                    <div className="text-white text-sm font-medium">{t.name}</div>
                    <div className="text-slate-500 text-xs font-mono">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ ──────────────────────────────────────── */}
        <div className="mt-24 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs font-mono tracking-[0.3em] text-[#00f3ff] uppercase mb-4">
              Got Questions?
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes. You can cancel your subscription at any time from the Billing Portal. You'll retain Pro access until the end of your current billing period — no hidden fees.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes! Every new account starts with a 7-day free trial of Pro features. No credit card required to start. Upgrade only when you're ready.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit/debit cards globally via Stripe. For India-based users, we also support Razorpay (UPI, NetBanking, Wallet, and all Indian cards).",
              },
              {
                q: "Is my data secure on the platform?",
                a: "Absolutely. All data is encrypted at rest and in transit. We use Supabase (Postgres) with Row-Level Security ensuring your data is strictly private to your account. We are SOC 2 compliant.",
              },
              {
                q: "What is the difference between Hobby and Pro?",
                a: "The Hobby tier gives you access to basic labs and a read-only dashboard. Pro unlocks the full platform: advanced labs, attack replay theatre, PDF reports, live CVE feed, compliance checker, and AI Assistant.",
              },
              {
                q: "Can I upgrade from monthly to yearly?",
                a: "Yes. You can switch billing periods from your Billing Portal at any time. When you switch to yearly, you'll immediately save 17% vs. monthly billing.",
              },
            ].map(({ q, a }) => (
              <details
                key={q}
                className="group p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md cursor-pointer select-none"
              >
                <summary className="flex items-center justify-between text-white font-medium text-sm list-none">
                  {q}
                  <span className="ml-4 text-[#00f3ff] text-lg font-mono group-open:rotate-45 transition-transform duration-200">+</span>
                </summary>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* ── Final CTA ─────────────────────────────────── */}
        <div className="mt-24 text-center pb-12">
          <div className="inline-block px-8 py-10 rounded-2xl bg-gradient-to-br from-[#00f3ff]/10 to-[#ff003c]/10 border border-white/10 backdrop-blur-md">
            <h2 className="font-display text-3xl font-bold text-white mb-3">
              Ready to level up your security?
            </h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto text-sm leading-relaxed">
              Join 1,000+ security professionals who use Straxon to train, detect, and defend — faster.
            </p>
            <Link to="/auth">
              <CyberButton variant="cyan" size="lg" className="shadow-[0_0_20px_rgba(0,243,255,0.3)]">
                <Sparkles className="h-4 w-4 mr-2" />
                Start Your Free 7-Day Trial
              </CyberButton>
            </Link>
            <p className="mt-4 text-xs text-slate-600 font-mono">No credit card required.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

