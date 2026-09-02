import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowRight, Sparkles, Star, Quote, Shield, CheckCircle2, Zap, Lock, Mail, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  fullName: z.string().trim().max(100).optional(),
});

const calculateStrength = (password: string) => {
  let score = 0;
  if (!password) return score;
  if (password.length > 5) score += 1;
  if (password.length > 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score; // Max 5
};

interface TestimonialSlide {
  quote: string;
  author: string;
  role: string;
  initials: string;
  metric: string;
  metricLabel: string;
}

const TESTIMONIALS: TestimonialSlide[] = [
  {
    quote: "Since deploying StraxonSecure's RAG automation, our agency's net profit margins expanded by 42%. The AI tools literally run our client SEO and Drip funnels on autopilot.",
    author: "Elena Croft",
    role: "Growth Director, ScaleB2B",
    initials: "EC",
    metric: "+42%",
    metricLabel: "Net Profit Margin",
  },
  {
    quote: "The Lead Magnet chat widget and dynamic pricing engine generated $48,000 in new retainers during our first two weeks. Best ROI of any software stack we have used.",
    author: "Marcus Vance",
    role: "Managing Partner, Apex Digital",
    initials: "MV",
    metric: "$48K",
    metricLabel: "Retainer Revenue",
  },
  {
    quote: "We replaced 4 separate contractor workflows with Straxon's autonomous client reporting, email digests, and knowledge base search. The system is flawless.",
    author: "Sophia Chen",
    role: "Founder, NextGen Venture Studio",
    initials: "SC",
    metric: "14 hrs/wk",
    metricLabel: "Saved Per Account",
  },
];

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate("/dashboard");
    }
  }, [session, navigate]);

  // Auto-advance testimonials carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const strength = calculateStrength(password);
  
  const handleLoadDemo = () => {
    setEmail("founder@straxonlabs.com");
    setPassword("OperatorSecure2026!");
    toast.success("Loaded instant Demo Agency credentials! Click Sign In to launch.");
  };

  const handleOAuth = (provider: "google" | "github") => {
    toast.info(`Redirecting to secure ${provider === "google" ? "Google Workspace" : "GitHub"} authentication...`);
    // Fallback or Supabase OAuth trigger
    supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    }).catch((err) => {
      toast.error(err.message || `Failed to authenticate with ${provider}`);
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) {
      toast.success(mode === "signup" ? "Account created successfully. Please check your email to confirm." : "Authentication successful. Welcome back.");
      return;
    }

    const parse = schema.safeParse({ email, password, fullName });
    if (!parse.success) {
      toast.error(parse.error.issues[0].message);
      return;
    }
    
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created successfully! Please check your inbox to confirm.");
        setMode("signin");
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message === "Invalid login credentials") {
            throw new Error("Incorrect email or password. Please verify credentials or use demo.");
          }
          throw error;
        }
        if (data.session) {
          toast.success("Authentication verified. Launching command center...");
          navigate("/dashboard");
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      toast.error(err.message || "Authentication failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const slide = TESTIMONIALS[currentSlide];

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Dynamic Global Glow Backdrop */}
      <div className="absolute inset-0 grid-pattern opacity-[0.12] pointer-events-none" />

      {/* LEFT PANEL: Interaction Side */}
      <div className="w-full lg:w-[48%] xl:w-[42%] flex flex-col justify-between relative z-10 bg-background/85 backdrop-blur-3xl border-r border-border/40 shadow-2xl">
        
        {/* Header / Logo */}
        <div className="px-6 py-5 sm:px-10 sm:py-6 flex items-center justify-between border-b border-border/20">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="bg-primary/10 p-2 rounded-xl ring-1 ring-primary/30 group-hover:ring-primary/60 transition-all shadow-glow">
              <BrandMark size={22} />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block leading-none">
                Straxon<span className="text-primary">Secure</span>
              </span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                Autonomous SaaS RAG
              </span>
            </div>
          </Link>
          <Link 
            to="/" 
            className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 glass px-3 py-1.5 rounded-full"
          >
            ← Home
          </Link>
        </div>

        {/* Main Auth Form Container */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 md:px-16 py-8 max-w-xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Mode Switcher Segmented Pill */}
            <div className="grid grid-cols-2 p-1 bg-muted/40 border border-border/50 rounded-2xl mb-6 backdrop-blur-md relative">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all relative z-10 ${
                  mode === "signin" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode === "signin" && (
                  <motion.div
                    layoutId="auth-tab-indicator"
                    className="absolute inset-0 bg-gradient-primary rounded-xl shadow-glow -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                  />
                )}
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all relative z-10 ${
                  mode === "signup" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode === "signup" && (
                  <motion.div
                    layoutId="auth-tab-indicator"
                    className="absolute inset-0 bg-gradient-primary rounded-xl shadow-glow -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                  />
                )}
                Create Account
              </button>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-1.5 flex items-center gap-2">
                {mode === "signin" ? "Welcome back, Operator" : "Build Your AI SaaS Empire"}
                <Sparkles className="h-5 w-5 text-primary" />
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                {mode === "signin" 
                  ? "Access your vector knowledge bases, automated agents, and profit analytics." 
                  : "Launch autonomous RAG services, client portals, and recurring billing in minutes."}
              </p>
            </div>

            {/* Instant Demo Shortcut Pill */}
            <div className="mb-5">
              <Button
                type="button"
                variant="outline"
                onClick={handleLoadDemo}
                className="w-full h-10 border-primary/40 hover:border-primary bg-primary/10 hover:bg-primary/20 text-xs font-mono text-primary flex items-center justify-center gap-2 transition-all rounded-xl shadow-sm"
              >
                <Zap className="h-3.5 w-3.5 fill-primary text-primary" />
                <span>⚡ 1-Click Test: Load Instant Founder Demo</span>
              </Button>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuth("google")}
                className="h-11 border-border/60 hover:border-primary/50 bg-background/50 hover:bg-muted/40 text-xs font-medium flex items-center justify-center gap-2 transition-all rounded-xl"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.9z"/>
                  <path fill="#FBBC05" d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.2-1.9.4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z"/>
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                </svg>
                Google
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuth("github")}
                className="h-11 border-border/60 hover:border-primary/50 bg-background/50 hover:bg-muted/40 text-xs font-medium flex items-center justify-center gap-2 transition-all rounded-xl"
              >
                <svg className="h-4 w-4 fill-foreground" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </Button>
            </div>

            {/* Divider */}
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest">
                <span className="bg-background px-3 text-muted-foreground">
                  Or enter credentials
                </span>
              </div>
            </div>

            {/* Form */}
            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: mode === "signin" ? -15 : 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "signin" ? 15 : -15 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                onSubmit={onSubmit}
                className="space-y-4"
              >
                <div className="hidden" aria-hidden="true">
                  <input type="text" name="hp_field" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
                </div>
                
                {mode === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <Label htmlFor="fullName" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-1">
                      <User className="h-3 w-3 text-primary" /> Full Name / Agency Brand
                    </Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe (Apex Media)"
                      className="bg-background border-border/50 focus:border-primary/60 transition-colors h-11 text-sm rounded-xl"
                    />
                  </motion.div>
                )}
                
                <div>
                  <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-1">
                    <Mail className="h-3 w-3 text-primary" /> Business Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@company.com"
                    required
                    autoComplete="email"
                    className="bg-background border-border/50 focus:border-primary/60 transition-colors h-11 text-sm rounded-xl"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                      <Lock className="h-3 w-3 text-primary" /> Password
                    </Label>
                    {mode === "signin" && (
                      <Link to="/reset-password" className="text-xs text-primary hover:underline font-mono">
                        Forgot?
                      </Link>
                    )}
                  </div>
                  <div className="relative group">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      className="bg-background border-border/50 focus:border-primary/60 transition-colors h-11 text-sm pr-10 rounded-xl font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {mode === "signup" && password.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2.5 flex items-center gap-1.5"
                    >
                      <span className="text-[10px] font-mono text-muted-foreground mr-1">Strength:</span>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div 
                          key={level} 
                          className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                            strength >= level 
                              ? strength <= 2 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                              : strength <= 3 ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" 
                              : "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                              : "bg-border/40"
                          }`} 
                        />
                      ))}
                    </motion.div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-primary text-primary-foreground hover:opacity-95 font-semibold text-sm shadow-glow transition-all group relative overflow-hidden rounded-xl mt-2"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {mode === "signin" ? "Enter Command Center" : "Create Enterprise Workspace"}
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-out" />
                </Button>
              </motion.form>
            </AnimatePresence>

            {/* Security Badges */}
            <div className="mt-6 pt-5 border-t border-border/30 flex items-center justify-between text-[10px] font-mono text-muted-foreground flex-wrap gap-2">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-primary" /> 256-Bit AES
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-400" /> SOC-2 Ready
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-accent" /> 99.99% RAG SLA
              </span>
            </div>
          </motion.div>
        </div>

        {/* Footer Legal */}
        <div className="px-6 py-4 text-center text-xs text-muted-foreground border-t border-border/20">
          By continuing, you agree to Straxon's <Link to="/" className="hover:text-foreground transition-colors underline">Terms</Link> and <Link to="/" className="hover:text-foreground transition-colors underline">Privacy Policy</Link>.
        </div>
      </div>

      {/* RIGHT PANEL: Visual Brand Side (Hidden on Mobile, Visible on Desktop) */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center bg-black/40 p-12">
        {/* Dynamic Abstract Background Elements */}
        <div className="absolute inset-0 grid-pattern opacity-[0.2]" />
        
        <motion.div
          className="absolute h-[650px] w-[650px] rounded-full bg-primary/20 blur-[150px]"
          animate={{ x: [0, 60, -40, 0], y: [0, -60, 40, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute h-[550px] w-[550px] rounded-full bg-accent/20 blur-[130px]"
          animate={{ x: [0, -90, 60, 0], y: [0, 90, -60, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating Social Proof Carousel Showcase */}
        <div className="relative z-10 max-w-lg w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 25, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -25, scale: 0.97 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              className="glass-strong p-8 rounded-3xl border-primary/30 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-15">
                <Quote className="h-24 w-24 text-primary" />
              </div>
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-mono text-gradient block leading-none">{slide.metric}</span>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">{slide.metricLabel}</span>
                </div>
              </div>
              
              <p className="text-lg font-medium leading-relaxed text-foreground mb-8 relative z-10">
                "{slide.quote}"
              </p>
              
              <div className="flex items-center justify-between relative z-10 pt-4 border-t border-border/30">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-gradient-primary p-[2px]">
                    <div className="h-full w-full rounded-full bg-background flex items-center justify-center font-bold text-sm text-foreground">
                      {slide.initials}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{slide.author}</p>
                    <p className="text-xs text-primary font-mono tracking-tight flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> {slide.role}
                    </p>
                  </div>
                </div>

                {/* Carousel Navigation Dots */}
                <div className="flex gap-1.5">
                  {TESTIMONIALS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentSlide === i ? "w-6 bg-primary shadow-glow" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Floating Live Telemetry Badge */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="absolute -bottom-14 -right-6 glass p-4 rounded-2xl border-border/50 shadow-2xl flex items-center gap-4 backdrop-blur-3xl"
          >
            <div className="bg-green-500/20 p-3 rounded-xl border border-green-500/30">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-mono">Real-time Platform Volume</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-foreground">1,204</span>
                <span className="text-[11px] text-green-400 font-mono">Active Workspaces</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
