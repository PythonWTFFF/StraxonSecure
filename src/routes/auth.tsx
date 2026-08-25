import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CyberButton } from "@/components/cyber/CyberButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Mail, KeyRound, UserPlus, LogIn, ShieldCheck, Zap, Lock, ArrowLeft, Send } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Authentication — Straxon Secure" },
      {
        name: "description",
        content: "Sign in to access labs, save architectures, and track progress.",
      },
    ],
  }),
  component: AuthPage,
});

type AuthMode = "signin" | "signup" | "forgot" | "check-email";

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
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
        setMode("check-email");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back, operator.");
        navigate({ to: "/dashboard" });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        setMode("check-email");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to authenticate with ${provider}`);
      setBusy(false);
    }
  };

  // ── Check-email / confirmation screen ──────────────────────────────────
  if (mode === "check-email") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto animate-pulse-glow">
            <Mail className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold">Check Your Email</h1>
          <p className="text-muted-foreground leading-relaxed">
            We've sent a secure link to{" "}
            <span className="text-primary font-mono">{email || "your email"}</span>.<br />
            Click the link to confirm your account and get started.
          </p>
          <button
            onClick={() => { setMode("signin"); setEmail(""); setPassword(""); }}
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
      {/* ── Left Panel: Form ───────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24 relative z-10">
        <div className="w-full max-w-[420px] space-y-8">
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

            {mode === "forgot" ? (
              <>
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                  Reset Password
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Enter your email and we'll send a secure reset link.
                </p>
              </>
            ) : (
              <>
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                  {mode === "signin" ? "Welcome back" : "Create an account"}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  {mode === "signin"
                    ? "Enter your credentials to access the terminal."
                    : "Initialize your operator profile and secure your assets."}
                </p>
              </>
            )}
          </div>

          {/* Social Logins — only on signin / signup */}
          {mode !== "forgot" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleOAuth("github")}
                  disabled={busy}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border bg-background/50 hover:bg-muted/50 rounded-md text-sm font-medium transition-all duration-200 hover:border-primary/50 group disabled:opacity-50"
                >
                  <svg className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth("google")}
                  disabled={busy}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border bg-background/50 hover:bg-muted/50 rounded-md text-sm font-medium transition-all duration-200 hover:border-primary/50 group disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/60"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground font-mono tracking-wider">
                    Or continue with email
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
                placeholder="operator@straxon.io"
              />
            </div>

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
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-muted/20 border-border/50 focus:border-primary/50 transition-all font-mono h-11 pl-4"
                  placeholder="••••••••"
                />
              </div>
            )}

            <CyberButton type="submit" disabled={busy} className="w-full h-11 mt-2 text-base font-semibold tracking-wide" size="lg">
              {busy ? "Processing..." : mode === "signin" ? (
                <><LogIn className="h-4 w-4 mr-2" /> Sign In</>
              ) : mode === "signup" ? (
                <><UserPlus className="h-4 w-4 mr-2" /> Create Account</>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Send Reset Link</>
              )}
            </CyberButton>
          </form>

          {/* Toggle / Back links */}
          <div className="text-center text-sm text-muted-foreground pt-2 space-y-2">
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
                  onClick={() => setMode("signup")}
                  className="text-primary font-medium hover:underline hover:text-primary/80 transition-colors"
                >
                  Sign up here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("signin")}
                  className="text-primary font-medium hover:underline hover:text-primary/80 transition-colors"
                >
                  Sign in instead
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Premium Visual ────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0c] items-center justify-center overflow-hidden border-l border-border/30">
        {/* Background grid + glows */}
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

          {/* Social Proof */}
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
                <span className="text-sm text-slate-300">Trusted by 1,000+ security teams</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
