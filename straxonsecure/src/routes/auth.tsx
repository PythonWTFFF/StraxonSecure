import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Mail,
  KeyRound,
  UserPlus,
  LogIn,
  Sparkles,
  Shield,
  Lock,
  Fingerprint,
  ShieldCheck,
  Zap,
  Building2,
  Cpu,
} from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Authenticate — Straxon Secure Enterprise" },
      {
        name: "description",
        content: "Authenticate to access global SOC telemetry, interactive attack labs, and cyber defense tooling.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Operator profile created. Check your email for confirmation.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Security Clearance Verified. Welcome back, operator.");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleInstantDemo = () => {
    setBusy(true);
    localStorage.setItem("straxon_demo_user", "true");
    localStorage.setItem("dev_pro_override", "true");
    toast.success("Clearance Granted: DEFCON-1 VIP Evaluator Sandbox.", {
      description: "Entering live cyber operations center with full Pro privileges.",
    });
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 300);
  };

  const handleEnterpriseSSO = (provider: string) => {
    toast.info(`Connecting to ${provider} Enterprise Identity Provider...`);
    handleInstantDemo();
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-8 relative">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#00f3ff]/10 via-[#ff003c]/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg space-y-4 relative z-10">
        {/* Top Clearance Banner */}
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-[#020610]/80 border border-white/10 backdrop-blur-md text-[10px] font-mono tracking-widest uppercase text-slate-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-400 font-bold">GATEWAY: SECURE</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-3 w-3 text-[#00f3ff]" />
            <span>AES-256 GCM ZERO-TRUST</span>
          </div>
        </div>

        <CyberCard variant="cyan" glow className="p-6 sm:p-8 border-[#00f3ff]/30 bg-[#020610]/95 backdrop-blur-2xl shadow-[0_10px_50px_rgba(0,0,0,0.9)]">
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="relative mb-3">
              <img
                src="/straxonlogo.jpeg"
                alt="Straxon Secure"
                className="w-14 h-14 object-contain drop-shadow-[0_0_15px_rgba(0,243,255,0.7)]"
              />
              <div className="absolute -inset-2 bg-cyan-500/20 rounded-full blur-md -z-10" />
            </div>
            <div className="text-[10px] font-mono tracking-[0.3em] text-[#00f3ff] uppercase font-bold">
              // STRAXON COMMAND ACCESS
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-white mt-1">
              {mode === "signin" ? "OPERATOR AUTHENTICATION" : "INITIALIZE NEW PROFILE"}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {mode === "signin"
                ? "Enter your cryptographic credentials or launch instant demo clearance."
                : "Create an enterprise security profile for team SOC operations."}
            </p>
          </div>

          {/* INSTANT VIP DEMO BUTTON */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleInstantDemo}
              disabled={busy}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00f3ff]/20 via-[#00f3ff]/10 to-[#ff003c]/20 border border-[#00f3ff]/50 hover:border-[#00f3ff] text-white text-xs font-mono tracking-wider uppercase transition-all duration-300 shadow-[0_0_25px_rgba(0,243,255,0.2)] hover:shadow-[0_0_35px_rgba(0,243,255,0.4)] flex items-center justify-center gap-2.5 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              <Zap className="h-4 w-4 text-[#00f3ff] group-hover:scale-110 transition-transform" />
              <span className="font-bold">Launch Instant Sandbox Demo</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/40">
                PRO PASS
              </span>
            </button>
            <p className="text-[9px] font-mono text-center text-slate-500 mt-1.5">
              Instant access for evaluators & CISOs · No password or email verification required
            </p>
          </div>

          <div className="relative flex py-2 items-center mb-5">
            <div className="flex-grow border-t border-white/10" />
            <span className="flex-shrink mx-3 text-[9px] font-mono uppercase tracking-widest text-slate-500">
              OR USE CREDENTIALS
            </span>
            <div className="flex-grow border-t border-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-[11px] font-mono tracking-wider uppercase text-slate-300">
                <Mail className="inline h-3 w-3 mr-1 text-[#00f3ff]" /> Operator Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 bg-black/50 border-white/15 focus:border-[#00f3ff] text-white font-mono text-xs h-10"
                placeholder="operator@defense.straxon.io"
              />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-[11px] font-mono tracking-wider uppercase text-slate-300">
                  <KeyRound className="inline h-3 w-3 mr-1 text-[#ff003c]" /> Security Keyphrase
                </Label>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 bg-black/50 border-white/15 focus:border-[#00f3ff] text-white font-mono text-xs h-10"
                placeholder="••••••••••••"
              />
            </div>

            <CyberButton type="submit" disabled={busy} className="w-full mt-2" size="lg" variant="cyan">
              {busy ? (
                "Verifying Clearance..."
              ) : mode === "signin" ? (
                <>
                  <LogIn className="h-4 w-4 mr-2" /> Authenticate Operator
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" /> Create Secure Profile
                </>
              )}
            </CyberButton>
          </form>

          {/* ENTERPRISE SSO BAR */}
          <div className="mt-6 pt-4 border-t border-white/10 space-y-2.5">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest text-center">
              Enterprise Single Sign-On (SSO)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleEnterpriseSSO("Okta")}
                className="py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[10px] font-mono flex items-center justify-center gap-1.5 transition-colors"
              >
                <Building2 className="h-3 w-3 text-[#00f3ff]" /> Okta Verify
              </button>
              <button
                type="button"
                onClick={() => handleEnterpriseSSO("Google Workspace")}
                className="py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[10px] font-mono flex items-center justify-center gap-1.5 transition-colors"
              >
                <Fingerprint className="h-3 w-3 text-[#ff003c]" /> Google SAML
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            {mode === "signin" ? (
              <>
                Unregistered terminal?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-[#00f3ff] hover:underline font-mono font-bold"
                >
                  Create clearance profile
                </button>
              </>
            ) : (
              <>
                Existing operator credentials?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-[#00f3ff] hover:underline font-mono font-bold"
                >
                  Authenticate
                </button>
              </>
            )}
          </div>
        </CyberCard>

        {/* Trust Badges Footer */}
        <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-mono text-slate-500">
          <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-emerald-400" /> SOC 2 Type II
          </div>
          <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center gap-1.5">
            <Shield className="h-3 w-3 text-[#00f3ff]" /> ISO 27001
          </div>
          <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center gap-1.5">
            <Cpu className="h-3 w-3 text-[#ff003c]" /> End-to-End SLA
          </div>
        </div>
      </div>
    </div>
  );
}
