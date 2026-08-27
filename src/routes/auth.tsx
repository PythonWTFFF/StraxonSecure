import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CyberButton } from "@/components/cyber/CyberButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Mail, KeyRound, UserPlus, LogIn, ShieldCheck,
  Zap, Lock, ArrowLeft, Send, RefreshCw, Eye, EyeOff,
} from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Authentication — Straxon Secure" },
      { name: "description", content: "Sign in to access labs, save architectures, and track progress." },
    ],
  }),
  component: AuthPage,
});

type AuthMode = "signin" | "signup" | "forgot" | "check-email" | "reset-password";

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  // Handle email confirmation callback & password reset callback from Supabase email links
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setMode("reset-password");
    } else if (hash.includes("access_token")) {
      // Email confirmation success — Supabase sets the session via hash
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          toast.success("Email confirmed! Welcome to Straxon Secure.", { duration: 4000 });
          navigate({ to: "/dashboard" });
        }
      });
    }
  }, [navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (password.length < 8) {
          toast.error("Password must be at least 8 characters.", { duration: 4000 });
          return;
        }
        if (password !== confirmPassword) {
          toast.error("Passwords do not match.", { duration: 4000 });
          return;
        }
        const org_id = crypto.randomUUID();
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: { org_id },
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });
        if (error) throw error;
        // If email confirmation is disabled in Supabase, user is signed in immediately
        if (data.session) {
          toast.success("Account created! Welcome to Straxon Secure.");
          navigate({ to: "/dashboard" });
        } else {
          setMode("check-email");
          setResendCooldown(60);
        }

      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;
        toast.success("Welcome back, operator.");
        navigate({ to: "/dashboard" });

      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        setMode("check-email");
        setResendCooldown(60);

      } else if (mode === "reset-password") {
        if (password.length < 8) {
          toast.error("Password must be at least 8 characters.", { duration: 4000 });
          return;
        }
        if (password !== confirmPassword) {
          toast.error("Passwords do not match.", { duration: 4000 });
          return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success("Password updated successfully! Redirecting...");
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      const msg: string = err?.message ?? "Authentication failed";
      if (msg.includes("Invalid login credentials") || msg.includes("invalid_credentials")) {
        toast.error("Wrong email or password. No account? Click 'Sign up here'.", { duration: 6000 });
      } else if (msg.includes("Email not confirmed")) {
        toast.error("Please confirm your email first. Check your inbox (and spam folder).", { duration: 7000 });
        setMode("check-email");
      } else if (msg.includes("User already registered")) {
        toast.error("This email is already registered. Try signing in instead.", { duration: 5000 });
        setMode("signin");
      } else if (msg.includes("Password should be")) {
        toast.error("Password is too weak. Use at least 8 characters.", { duration: 5000 });
      } else if (msg.includes("rate")) {
        toast.error("Too many attempts. Please wait a moment and try again.", { duration: 5000 });
      } else {
        toast.error(msg, { duration: 5000 });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      toast.success("Confirmation email resent! Check your inbox.");
      setResendCooldown(60);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to resend.");
    } finally {
      setBusy(false);
    }
  };

  // ── Check-email screen ─────────────────────────────────────────────────────
  if (mode === "check-email") {
    const isReset = !confirmPassword; // heuristic: forgot-password flow
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto animate-pulse-glow">
            <Mail className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold">Check Your Email</h1>
          <p className="text-muted-foreground leading-relaxed">
            We sent a secure link to{" "}
            <span className="text-primary font-mono">{email || "your email"}</span>.<br />
            Click the link in the email to{" "}
            {isReset ? "reset your password" : "confirm your account"}.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-300 text-left">
            <strong>Didn't get it?</strong> Check your <strong>spam / junk folder</strong>. It may take a minute to arrive.
          </div>
          {!isReset && (
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || busy}
              className="flex items-center gap-2 mx-auto text-sm text-primary/80 hover:text-primary transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend confirmation email"}
            </button>
          )}
          <button
            onClick={() => { setMode("signin"); setPassword(""); setConfirmPassword(""); }}
            className="text-primary hover:underline text-sm font-medium flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background selection:bg-primary/30">
      {/* ── Left Panel: Form ─────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24 relative z-10">
        <div className="w-full max-w-[420px] space-y-7">
          {/* Logo & Heading */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-3 mb-6">
              <img
                src="/straxonlogo.jpeg"
                alt="Straxon Secure Logo"
                className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]"
              />
              <span className="font-display font-bold text-xl tracking-tight">Straxon Secure</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              {mode === "forgot" ? "Reset Password" : mode === "reset-password" ? "New Password" : mode === "signin" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {mode === "forgot"
                ? "Enter your email and we'll send a secure reset link."
                : mode === "reset-password"
                ? "Set your new password below."
                : mode === "signin"
                ? "Enter your credentials to access the terminal."
                : "Initialize your operator profile and secure your assets."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field (hidden on reset-password) */}
            {mode !== "reset-password" && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-mono tracking-wider uppercase text-foreground/80 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary" /> Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted/20 border-border/50 focus:border-primary/50 transition-all font-mono h-11 pl-4"
                  placeholder="operator@example.com"
                />
              </div>
            )}

            {/* Password field */}
            {mode !== "forgot" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-mono tracking-wider uppercase text-foreground/80 flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-primary" /> Password
                  </Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs text-primary/70 hover:text-primary transition-colors font-mono"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    required
                    minLength={mode === "signin" ? 1 : 8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-muted/20 border-border/50 focus:border-primary/50 transition-all font-mono h-11 pl-4 pr-10"
                    placeholder={mode === "signin" ? "••••••••" : "Min. 8 characters"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === "signup" && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {password.length === 0 ? "Choose a strong password" : password.length < 8 ? `${8 - password.length} more characters needed` : "✓ Password length OK"}
                  </p>
                )}
              </div>
            )}

            {/* Confirm Password field (signup + reset) */}
            {(mode === "signup" || mode === "reset-password") && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-mono tracking-wider uppercase text-foreground/80 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-primary" /> Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`bg-muted/20 border-border/50 focus:border-primary/50 transition-all font-mono h-11 pl-4 ${
                    confirmPassword && confirmPassword !== password ? "border-red-500/60" : confirmPassword && confirmPassword === password ? "border-green-500/60" : ""
                  }`}
                  placeholder="Re-enter password"
                />
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-xs text-red-400 font-mono">Passwords do not match</p>
                )}
              </div>
            )}

            <CyberButton
              type="submit"
              disabled={busy || (mode === "signup" && (password.length < 8 || password !== confirmPassword))}
              className="w-full h-11 mt-2 text-base font-semibold tracking-wide"
              size="lg"
            >
              {busy ? "Processing..." : mode === "signin" ? (
                <><LogIn className="h-4 w-4 mr-2" /> Sign In</>
              ) : mode === "signup" ? (
                <><UserPlus className="h-4 w-4 mr-2" /> Create Account</>
              ) : mode === "reset-password" ? (
                <><KeyRound className="h-4 w-4 mr-2" /> Set New Password</>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Send Reset Link</>
              )}
            </CyberButton>
          </form>

          {/* Toggle links */}
          <div className="text-center text-sm text-muted-foreground pt-1 space-y-2">
            {mode === "forgot" ? (
              <button
                onClick={() => setMode("signin")}
                className="text-primary font-medium hover:underline transition-colors flex items-center gap-1.5 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>
            ) : mode === "signin" ? (
              <p>
                Don't have an account?{" "}
                <button
                  onClick={() => { setMode("signup"); setPassword(""); setConfirmPassword(""); }}
                  className="text-primary font-medium hover:underline hover:text-primary/80 transition-colors"
                >
                  Sign up here
                </button>
              </p>
            ) : mode === "signup" ? (
              <p>
                Already have an account?{" "}
                <button
                  onClick={() => { setMode("signin"); setConfirmPassword(""); }}
                  className="text-primary font-medium hover:underline hover:text-primary/80 transition-colors"
                >
                  Sign in instead
                </button>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Premium Visual ──────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0c] items-center justify-center overflow-hidden border-l border-border/30">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="absolute left-0 right-0 top-0 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-30 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/10 opacity-40 blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-lg p-12 flex flex-col gap-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-medium tracking-wide w-fit">
            <ShieldCheck className="w-3.5 h-3.5" /> Enterprise Grade Security
          </div>

          <h2 className="text-4xl xl:text-5xl font-display font-bold leading-tight text-white">
            Secure your infrastructure with confidence.
          </h2>

          <p className="text-lg text-slate-400 leading-relaxed">
            Straxon Secure provides real-time threat intelligence, continuous attack surface management,
            and advanced SOC simulation to keep your organization steps ahead of adversaries.
          </p>

          <div className="grid grid-cols-2 gap-6 mt-2">
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-white font-medium">Real-time Analysis</h3>
              <p className="text-sm text-slate-400">Instantly detect and respond to threats across your environment.</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Lock className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-white font-medium">Zero-Trust Ready</h3>
              <p className="text-sm text-slate-400">Built from the ground up to support modern zero-trust architectures.</p>
            </div>
          </div>

          <div className="mt-4 pt-8 border-t border-white/10">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0a0a0c] bg-muted/30 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User avatar" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm font-medium text-white">Trusted by 2,400+ security teams</p>
                <p className="text-xs text-slate-500">Rated 4.9/5 across enterprise reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
