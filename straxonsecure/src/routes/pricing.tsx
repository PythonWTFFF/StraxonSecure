import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check,
  Sparkles,
  CreditCard,
  IndianRupee,
  Lock,
  Calculator,
  TrendingUp,
  ShieldCheck,
  Server,
  Eye,
  HelpCircle,
  ChevronDown,
  Plus,
} from "lucide-react";
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
      { title: "Pricing & Enterprise Add-ons — Straxon Secure Pro" },
      {
        name: "description",
        content:
          "7-day free trial. Hobby, Pro, and Enterprise tiers with autonomous PTaaS, dedicated SOC tenants, and threat intelligence.",
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

const ENTERPRISE_ADDONS = [
  {
    id: "ptaas",
    name: "Autonomous PTaaS Red-Team Agent",
    badge: "AI RED-TEAM",
    icon: ShieldCheck,
    price: 299,
    description: "24/7 continuous autonomous penetration testing bot with automated MITRE ATT&CK exploit path generation and safe validation.",
    benefits: ["Zero-day vulnerability validation", "Automated GitHub remediation PRs", "Blast-radius simulation graphs"],
  },
  {
    id: "soc_tenant",
    name: "Dedicated Enterprise SOC Tenant",
    badge: "ISOLATED SIEM",
    icon: Server,
    price: 499,
    description: "High-throughput sovereign SIEM cluster with 1-year immutable hot telemetry retention and custom sigma rule ingestion.",
    benefits: ["Sub-second federated threat hunting", "Full multi-tenant RBAC & audit logs", "Dedicated NVMe ingestion pipeline"],
  },
  {
    id: "darkweb_vip",
    name: "Executive Dark Web Radar & CISO Shield",
    badge: "VIP INTEL",
    icon: Eye,
    price: 199,
    description: "Real-time deep web surveillance scraping Tor hidden services, private Telegram broker channels, and infostealer dumps.",
    benefits: ["C-Suite credential leak alerts", "VIP domain typosquatting detection", "Rapid takedown legal coordinator"],
  },
];

const CISO_FAQS = [
  {
    q: "How does Straxon guarantee Zero-Trust data privacy & residency?",
    a: "Straxon is SOC 2 Type II certified and ISO 27001 aligned. All telemetry in transit is protected with TLS 1.3, and data at rest is encrypted using customer-managed AWS KMS keys (AES-256-GCM). We offer sovereign VPC deployments in US, EU (Frankfurt), and APAC (Mumbai/Singapore) regions to satisfy GDPR, HIPAA, and DPDP compliances.",
  },
  {
    q: "Can Autonomous PTaaS be safely run against production workloads?",
    a: "Yes. Our PTaaS engine features real-time defensive rate limiting, safe payload nonces, and an emergency instantaneous abort killswitch. Non-destructive vulnerability profiling is separated from active exploitation, which requires strict CISO policy sign-off.",
  },
  {
    q: "What SLAs are provided for Enterprise SOC customers?",
    a: "Enterprise subscribers receive a contractually guaranteed 99.99% uptime SLA, sub-second telemetry ingestion latency, and 15-minute response times from Straxon Tier 3 Incident Commanders during active P1 incidents.",
  },
  {
    q: "Does Straxon integrate into our current SIEM / SOAR tech stack?",
    a: "Yes. Straxon provides bi-directional webhooks and pre-built native connectors for Splunk Enterprise, Datadog, Microsoft Sentinel, Elastic SIEM, CrowdStrike Falcon, and Jira Service Management.",
  },
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
  const [roiEndpoints, setRoiEndpoints] = useState(50);
  const [roiPentests, setRoiPentests] = useState(2);
  const [selectedAddons, setSelectedAddons] = useState<string[]>(["ptaas"]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const addonTotalMonthly = selectedAddons.reduce((sum, id) => {
    const item = ENTERPRISE_ADDONS.find((a) => a.id === id);
    return sum + (item ? item.price : 0);
  }, 0);

  const basePricePerMonth = billing === "monthly" ? 19 : Math.round(190 / 12);
  const totalStackPerMonth = basePricePerMonth + addonTotalMonthly;

  const traditionalCost = roiEndpoints * 120 + roiPentests * 12000;
  const straxonCost = billing === "monthly" ? 19 * 12 : 190;
  const annualSavings = Math.max(0, traditionalCost - straxonCost);
  const roiPercentage = Math.round((annualSavings / straxonCost) * 100);

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

        {/* ENTERPRISE HIGH-TICKET ADD-ONS SELECTION */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-xs font-mono tracking-[0.25em] text-[#ff003c] uppercase mb-2 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> ADVANCED CAPABILITIES
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
              Enterprise Defense Add-Ons
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto mt-2">
              Extend your Straxon Pro instance with mission-critical autonomous agents, dedicated sovereign SOC infrastructure, and VIP intelligence feeds.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {ENTERPRISE_ADDONS.map((addon) => {
              const isSelected = selectedAddons.includes(addon.id);
              const Icon = addon.icon;
              return (
                <div
                  key={addon.id}
                  onClick={() => toggleAddon(addon.id)}
                  className={`cursor-pointer rounded-2xl p-6 border transition-all duration-300 relative flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#00f3ff]/5 border-[#00f3ff] shadow-[0_0_25px_rgba(0,243,255,0.2)]"
                      : "bg-[#020610]/80 border-white/10 hover:border-white/25"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono tracking-widest px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#00f3ff]">
                        {addon.badge}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-[#00f3ff] border-[#00f3ff] text-black"
                            : "border-white/20 bg-black/40"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="p-2 rounded-lg bg-white/5 text-[#00f3ff]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-display font-bold text-sm text-white leading-snug">
                        {addon.name}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      {addon.description}
                    </p>

                    <div className="space-y-2 mb-6">
                      {addon.benefits.map((b, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] text-slate-300">
                          <Check className="w-3 h-3 text-[#00f3ff] shrink-0" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-baseline justify-between">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">ADD-ON PRICE</span>
                    <div className="text-right">
                      <span className="text-lg font-bold text-white">${addon.price}</span>
                      <span className="text-xs text-slate-500 font-mono"> / mo</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DYNAMIC BUNDLE CHECKOUT BAR */}
          <div className="mt-6 p-4 md:p-6 rounded-2xl bg-gradient-to-r from-[#00f3ff]/10 via-[#020610] to-[#ff003c]/10 border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-slate-300">
                Custom Enterprise Configuration:{" "}
                <span className="text-[#00f3ff] font-bold">
                  Pro Tier + {selectedAddons.length} Add-on{selectedAddons.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Billed {billing === "monthly" ? "monthly" : "annually"} • Instant zero-trust cloud provisioning
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-right">
                <span className="text-xs text-slate-400 font-mono block">Estimated Total:</span>
                <span className="text-2xl font-black text-white">${totalStackPerMonth}</span>
                <span className="text-xs text-slate-500 font-mono"> / mo</span>
              </div>
              <CyberButton
                variant="cyan"
                size="md"
                onClick={startStripe}
                disabled={busy !== null}
                className="shadow-[0_0_20px_rgba(0,243,255,0.4)] whitespace-nowrap"
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                Deploy Enterprise Stack
              </CyberButton>
            </div>
          </div>
        </div>

        {/* INTERACTIVE ENTERPRISE ROI & BREAKEVEN CALCULATOR */}
        <div className="mt-16 max-w-4xl mx-auto">
          <CyberCard variant="cyan" glow className="p-6 md:p-10 border-[#00f3ff]/30 bg-[#020610]/90 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-lg bg-[#00f3ff]/10 border border-[#00f3ff]/30 text-[#00f3ff]">
                <Calculator className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl md:text-2xl font-bold text-white tracking-wide">
                  SaaS ROI & Breakeven Calculator
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Quantify your cost reduction vs legacy external pentest vendors & manual EDR tools
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-slate-300">Protected Endpoints:</span>
                    <span className="text-[#00f3ff] font-bold">{roiEndpoints} Nodes</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={roiEndpoints}
                    onChange={(e) => setRoiEndpoints(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#00f3ff]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>10 Nodes</span>
                    <span>500 Nodes</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-2">
                    <span className="text-slate-300">Annual Manual Audits / Pentests:</span>
                    <span className="text-[#ff003c] font-bold">{roiPentests} / year</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={roiPentests}
                    onChange={(e) => setRoiPentests(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#ff003c]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>1 Audit</span>
                    <span>10 Audits</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Traditional Vendor Spend:</span>
                    <span className="text-slate-200">${traditionalCost.toLocaleString()}/yr</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Straxon Pro Investment:</span>
                    <span className="text-[#00f3ff]">${straxonCost.toLocaleString()}/yr</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-b from-[#00f3ff]/10 via-transparent to-[#ff003c]/10 border border-white/10 flex flex-col justify-center text-center space-y-4">
                <div className="text-[10px] font-mono text-[#00f3ff] uppercase tracking-widest">
                  PROJECTED ANNUAL SAVINGS
                </div>
                <div className="font-display text-4xl md:text-5xl font-black text-white drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">
                  ${annualSavings.toLocaleString()}
                </div>
                <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mx-auto">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>+{roiPercentage.toLocaleString()}% Est. ROI</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Plus mitigation against the average $4.45M cost of an uncontained enterprise data breach.
                </p>
                <CyberButton
                  variant="magenta"
                  size="sm"
                  className="mt-2 w-full text-xs shadow-[0_0_20px_rgba(255,0,60,0.3)]"
                  onClick={startStripe}
                  disabled={busy !== null}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Claim Your Pro Savings
                </CyberButton>
              </div>
            </div>
          </CyberCard>
        </div>

        {/* CISO & EXECUTIVE ENTERPRISE FAQ */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-xs font-mono tracking-[0.25em] text-[#00f3ff] uppercase mb-2 flex items-center justify-center gap-1.5">
              <HelpCircle className="h-4 w-4" /> DUE DILIGENCE & COMPLIANCE
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
              CISO & Enterprise FAQ
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto mt-2">
              Everything your security, legal, and procurement teams need to clear Straxon for enterprise deployment.
            </p>
          </div>

          <div className="space-y-3">
            {CISO_FAQS.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-[#020610]/80 overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                  >
                    <span className="font-mono text-xs md:text-sm font-semibold text-slate-200">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#00f3ff] shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs font-mono text-slate-400 leading-relaxed border-t border-white/5 bg-black/20">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
