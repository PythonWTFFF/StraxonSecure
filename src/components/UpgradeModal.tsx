/**
 * UpgradeModal — shown when a free/trial user tries to access Pro features
 * or when trial expires. Drives paid conversion.
 */
import { Link } from "@tanstack/react-router";
import { X, Crown, Zap, ShieldCheck, Sparkles, Lock, ArrowRight, Check, TrendingUp } from "lucide-react";
import { CyberButton } from "@/components/cyber/CyberButton";
import { useSubscription } from "@/hooks/useSubscription";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  /** Which feature the user tried to access */
  featureName?: string;
}

const PRO_PERKS = [
  { icon: Zap, text: "Advanced Labs: DDoS, Misconfig, all replay scenarios" },
  { icon: ShieldCheck, text: "Attack Replay Theatre with full playback controls" },
  { icon: Sparkles, text: "PDF Report Generation & Scheduled Email Delivery" },
  { icon: Crown, text: "Live CVE Threat Intel Feed & AI Assistant (Pro)" },
  { icon: Lock, text: "Compliance Checker (OWASP / NIST / ISO 27001)" },
];

export function UpgradeModal({ open, onClose, featureName }: UpgradeModalProps) {
  const { trialActive, trialDaysLeft } = useSubscription();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0d0f1a] border border-[#ff003c]/30 rounded-2xl shadow-[0_0_60px_rgba(255,0,60,0.15)] overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-[#ff003c]/60 to-transparent" />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-40 rounded-full bg-[#ff003c]/10 blur-[60px] pointer-events-none" />

        {/* Social proof top strip */}
        <div className="bg-[#ff003c]/5 border-b border-[#ff003c]/20 px-6 py-2 flex items-center justify-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-[#ff003c] shrink-0" />
          <span className="text-[11px] font-mono text-slate-400">
            🔥 <span className="text-[#ff003c] font-bold">Pro users</span> detected 3× more threats this week
          </span>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-10 right-4 z-10 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#ff003c]/10 border border-[#ff003c]/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,0,60,0.2)]">
              <Crown className="w-8 h-8 text-[#ff003c]" />
            </div>

            {trialActive ? (
              <>
                <div className="text-xs font-mono tracking-widest text-yellow-400 mb-2 uppercase">
                  ⏱ {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left in trial
                </div>
                <h2 className="font-display text-2xl font-bold text-white mb-2">
                  Unlock Full Pro Access
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                  Your trial is ending soon. Upgrade now to keep all your data and unlock every Pro feature.
                </p>
              </>
            ) : featureName ? (
              <>
                <div className="text-xs font-mono tracking-widest text-[#ff003c] mb-2 uppercase">
                  🔒 Pro Feature
                </div>
                <h2 className="font-display text-2xl font-bold text-white mb-2">
                  {featureName} Requires Pro
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                  Upgrade to Straxon Pro to access this feature and everything below.
                </p>
              </>
            ) : (
              <>
                <div className="text-xs font-mono tracking-widest text-[#ff003c] mb-2 uppercase">
                  🚀 Go Pro
                </div>
                <h2 className="font-display text-2xl font-bold text-white mb-2">
                  Supercharge Your Security Platform
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                  Upgrade to Pro and unlock the full power of Straxon Secure.
                </p>
              </>
            )}
          </div>

          {/* Perks list */}
          <ul className="space-y-3 mb-6 stagger-children">
            {PRO_PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-[#ff003c]/10 border border-[#ff003c]/20 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-[#ff003c]" />
                </div>
                <span className="text-slate-300 leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>

          {/* Pricing teaser */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-display font-bold text-white">$19</span>
              <span className="text-slate-400 font-mono text-sm">/month</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-mono">
              Save 17% yearly
            </span>
          </div>
          <div className="flex justify-center mb-4">
            <span className="text-xs text-slate-500 font-mono">or ₹1,577/mo via Razorpay</span>
          </div>

          {/* Payment provider logos */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">Secure payment via</span>
            <span className="text-[11px] font-mono font-bold text-slate-400 border border-white/10 px-2 py-0.5 rounded">
              Stripe
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-[11px] font-mono font-bold text-slate-400 border border-white/10 px-2 py-0.5 rounded">
              Razorpay
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Link to="/pricing" onClick={onClose} className="block">
              <CyberButton variant="magenta" className="w-full justify-center text-base font-semibold h-12">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
                <ArrowRight className="w-4 h-4 ml-2" />
              </CyberButton>
            </Link>
            <button
              onClick={onClose}
              className="w-full text-xs font-mono text-slate-500 hover:text-slate-400 transition-colors py-2"
            >
              Continue with limited access →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
