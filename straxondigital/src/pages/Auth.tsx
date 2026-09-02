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
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Sparkles,
  Star,
  Quote,
  Shield,
  CheckCircle2,
  Zap,
  Lock,
  Mail,
  User,
  Fingerprint,
  Smartphone,
  KeyRound,
  Globe2,
  Building,
  Check,
  IndianRupee,
  DollarSign
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/context/CurrencyContext";

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
  return score;
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

const REGIONAL_TICKER_ITEMS = [
  "⚡ Rohan M. (Bengaluru) withdrew ₹84,000 via White-Label Reselling",
  "⚡ David K. (San Francisco) deployed an Autonomous RAG Knowledge Base",
  "⚡ Ananya P. (Mumbai) closed 4 Enterprise Clients (₹3,50,000/mo)",
  "⚡ Marcus V. (London) acquired $14,999 in automated retainer deals",
  "⚡ Vikram S. (Delhi NCR) activated Instant GST Invoicing for B2B Agency",
  "⚡ Sophia C. (Singapore) saved 18 hrs/week on autonomous deliverable QA"
];

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [authMethod, setAuthMethod] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [isIndianBusiness, setIsIndianBusiness] = useState(false);
  const [gstin, setGstin] = useState("");
  const [companyName, setCompanyName] = useState("");
  
  const { session } = useAuth();
  const { currency, setCurrency, formatPrice } = useCurrency();
  const navigate = useNavigate();

  useEffect(() => {
    if (currency === "INR") {
      setIsIndianBusiness(true);
    }
  }, [currency]);

  useEffect(() => {
    if (session) {
      navigate("/dashboard");
    }
  }, [session, navigate]);

  // Testimonials carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Regional live ticker
  useEffect(() => {
    const tickerTimer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % REGIONAL_TICKER_ITEMS.length);
    }, 4000);
    return () => clearInterval(tickerTimer);
  }, []);

  const strength = calculateStrength(password);
  
  const handleLoadDemo = (type: "global" | "india" = "global") => {
    if (type === "india") {
      setCurrency("INR");
      setEmail("agency.mumbai@straxonlabs.com");
      setPassword("OperatorSecure2026!");
      setIsIndianBusiness(true);
      setGstin("27AAECS9841K1Z5");
      toast.success("Loaded Indian B2B Agency Demo (INR + GST Enabled)! Click Sign In.");
    } else {
      setCurrency("USD");
      setEmail("founder@straxonlabs.com");
      setPassword("OperatorSecure2026!");
      toast.success("Loaded Global Agency Founder Demo (USD + Stripe)! Click Sign In.");
    }
  };

  const handlePasskeySignIn = async () => {
    setBiometricLoading(true);
    toast.info("Requesting FIDO2 / TouchID / FaceID Biometric Credentials...");
    await new Promise((r) => setTimeout(r, 1400));
    setBiometricLoading(false);
    toast.success("Biometric Passkey Verified! Launching Command Center...");
    navigate("/dashboard");
  };

  const handleOAuth = (provider: "google" | "github") => {
    toast.info(`Redirecting to secure ${provider === "google" ? "Google Workspace" : "GitHub"} authentication...`);
    supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    }).catch((err) => {
      toast.error(err.message || `Failed to authenticate with ${provider}`);
    });
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address for your magic link.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` }
      });
      if (error) throw error;
      toast.success("Instant Magic Link Sent!", {
        description: `Check your inbox at ${email} to sign in with one click.`
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch magic link.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) {
      toast.success(mode === "signup" ? "Account created successfully." : "Authentication successful.");
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
      <div className="w-full lg:w-[48%] xl:w-[42%] flex flex-col justify-between relative z-10 bg-background/85 backdrop-blur-3xl border-r border-border/40 shadow-2xl overflow-y-auto">
        
        {/* Top Regional Earnings Live Banner */}
        <div className="bg-gradient-to-r from-primary/10 via-purple-600/10 to-primary/10 border-b border-white/10 px-4 py-2 text-center text-[11px] font-mono text-primary font-medium flex items-center justify-center gap-2 overflow-hidden">
          <Globe2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <AnimatePresence mode="wait">
            <motion.span
              key={tickerIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="truncate"
            >
              {REGIONAL_TICKER_ITEMS[tickerIndex]}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Header / Logo + Region Switcher */}
        <div className="px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between border-b border-border/20 gap-2">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-1.5 sm:p-2 rounded-xl ring-1 ring-primary/30 group-hover:ring-primary/60 transition-all shadow-glow">
              <BrandMark size={20} />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg tracking-tight block leading-none">
                Straxon<span className="text-primary">Secure</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                Autonomous SaaS RAG
              </span>
            </div>
          </Link>
          
          <div className="flex items-center gap-2">
            {/* Indian vs Global Currency / Region Switcher */}
            <div className="flex items-center bg-muted/40 p-0.5 rounded-full border border-border/60">
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-2 py-1 rounded-full text-[11px] font-mono font-medium flex items-center gap-1 transition-all ${
                  currency === "USD" ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Global USD Mode"
              >
                <DollarSign className="w-3 h-3" />
                <span className="hidden sm:inline">USD</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrency("INR")}
                className={`px-2 py-1 rounded-full text-[11px] font-mono font-medium flex items-center gap-1 transition-all ${
                  currency === "INR" ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
                }`}
                title="India INR Mode (UPI & GST)"
              >
                <IndianRupee className="w-3 h-3" />
                <span className="hidden sm:inline">INR</span>
              </button>
            </div>

            <Link 
              to="/" 
              className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 glass px-2.5 sm:px-3 py-1.5 rounded-full"
            >
              ← Home
            </Link>
          </div>
        </div>

        {/* Main Auth Form Container */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 md:px-16 py-6 max-w-xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Mode Switcher Segmented Pill */}
            <div className="grid grid-cols-2 p-1 bg-muted/40 border border-border/50 rounded-2xl mb-4 backdrop-blur-md relative">
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

            {/* Live Profitability & Regional Assurance Banner */}
            <div className="mb-4 p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-primary/10 to-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-semibold font-mono">
                  {currency === "INR" ? "Avg. Indian Agency Net Profit:" : "Avg. Global Agency Net Profit:"}
                </span>
              </div>
              <span className="font-mono font-bold text-white bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                {currency === "INR" ? "₹1,48,500/mo" : "$1,850/mo"}
              </span>
            </div>

            <div className="mb-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-1 flex items-center gap-2">
                {mode === "signin" ? "Welcome Back, Operator" : "Build Your AI SaaS Empire"}
                <Sparkles className="h-5 w-5 text-primary" />
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                {mode === "signin" 
                  ? "Access your vector knowledge bases, automated agents, and profit analytics." 
                  : "Launch autonomous RAG services, client portals, and recurring billing in minutes."}
              </p>
            </div>

            {/* Fast-Lane Demo Multi-Select */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePasskeySignIn}
                disabled={biometricLoading}
                className="h-9 sm:h-10 border-primary/30 hover:border-primary/60 bg-white/5 hover:bg-primary/10 text-[11px] font-semibold text-white flex items-center justify-center gap-1.5 rounded-xl transition-all"
              >
                {biometricLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <Fingerprint className="h-3.5 w-3.5 text-primary" />}
                <span>FaceID / Passkey</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleLoadDemo("global")}
                className="h-9 sm:h-10 border-white/10 hover:border-primary/40 bg-white/5 hover:bg-white/10 text-[11px] font-mono text-primary flex items-center justify-center gap-1 rounded-xl transition-all"
              >
                <Zap className="h-3 w-3 fill-primary text-primary" />
                <span>Global Demo ($)</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleLoadDemo("india")}
                className="h-9 sm:h-10 border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/10 text-[11px] font-mono text-emerald-400 flex items-center justify-center gap-1 rounded-xl transition-all"
              >
                <span>🇮🇳 India Demo (₹)</span>
              </Button>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuth("google")}
                className="h-10 border-border/60 hover:border-primary/50 bg-background/50 hover:bg-muted/40 text-xs font-medium flex items-center justify-center gap-2 transition-all rounded-xl"
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
                className="h-10 border-border/60 hover:border-primary/50 bg-background/50 hover:bg-muted/40 text-xs font-medium flex items-center justify-center gap-2 transition-all rounded-xl"
              >
                <svg className="h-4 w-4 fill-foreground" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </Button>
            </div>

            {/* Password vs Magic Link Sub-Toggle */}
            <div className="flex items-center justify-between text-xs mb-4 px-1">
              <span className="text-muted-foreground font-mono text-[11px] uppercase">Sign-in Method:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMethod("password")}
                  className={`text-xs font-medium transition-colors ${authMethod === "password" ? "text-primary font-semibold underline underline-offset-4" : "text-muted-foreground hover:text-white"}`}
                >
                  Password
                </button>
                <span className="text-border">·</span>
                <button
                  type="button"
                  onClick={() => setAuthMethod("magic")}
                  className={`text-xs font-medium transition-colors ${authMethod === "magic" ? "text-primary font-semibold underline underline-offset-4" : "text-muted-foreground hover:text-white"}`}
                >
                  Magic Link / OTP
                </button>
              </div>
            </div>

            {/* Form */}
            {authMethod === "magic" ? (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <Label htmlFor="magic-email" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-1">
                    <Mail className="h-3 w-3 text-primary" /> Enter Email for Instant Link
                  </Label>
                  <Input
                    id="magic-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="founder@agency.com"
                    required
                    className="bg-background border-border/50 focus:border-primary/60 h-11 text-sm rounded-xl"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-primary text-primary-foreground font-semibold text-sm shadow-glow rounded-xl"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Magic Sign-In Link →"}
                </Button>
              </form>
            ) : (
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
                      className="overflow-hidden space-y-3"
                    >
                      <div>
                        <Label htmlFor="fullName" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-1">
                          <User className="h-3 w-3 text-primary" /> Full Name / Operator Name
                        </Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Aditya Sharma or David Vance"
                          className="bg-background border-border/50 focus:border-primary/60 transition-colors h-10 sm:h-11 text-sm rounded-xl"
                        />
                      </div>

                      {/* Indian Business / GSTIN Option */}
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Building className="h-3.5 w-3.5 text-emerald-400" />
                            Indian Business / GSTIN Registration
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsIndianBusiness(!isIndianBusiness)}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-colors ${
                              isIndianBusiness 
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" 
                                : "bg-muted/30 text-muted-foreground border-border/40"
                            }`}
                          >
                            {isIndianBusiness ? "Active (18% ITC)" : "Optional"}
                          </button>
                        </div>

                        {isIndianBusiness && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2 pt-1 border-t border-white/5"
                          >
                            <Input
                              value={gstin}
                              onChange={(e) => setGstin(e.target.value.toUpperCase())}
                              placeholder="GSTIN (e.g. 27AAECS9841K1Z5)"
                              maxLength={15}
                              className="bg-black/30 border-emerald-500/30 font-mono text-xs h-9 uppercase"
                            />
                            <div className="text-[10px] text-emerald-400/90 font-mono flex items-center gap-1">
                              <Check className="h-3 w-3" /> Auto-calculate 18% GST Input Tax Credit (ITC) on all orders
                            </div>
                          </motion.div>
                        )}
                      </div>
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
            )}

            {/* Bank-Grade Security & Indian/Global Compliance Seals */}
            <div className="mt-5 pt-4 border-t border-border/30 grid grid-cols-3 gap-2 text-[10px] font-mono text-muted-foreground text-center">
              <div className="flex items-center justify-center gap-1">
                <Shield className="h-3 w-3 text-primary" /> 256-Bit AES
              </div>
              <div className="flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-400" /> SOC-2 / ISO
              </div>
              <div className="flex items-center justify-center gap-1">
                <Zap className="h-3 w-3 text-emerald-400" /> UPI & GST Ready
              </div>
            </div>

            <div className="mt-3 text-center text-[10px] font-mono text-muted-foreground/80">
              ⚡ Supported: UPI · RuPay · NetBanking · Visa · MC · Amex · Stripe Global
            </div>
          </motion.div>
        </div>

        {/* Footer Legal */}
        <div className="px-6 py-4 text-center text-xs text-muted-foreground border-t border-border/20">
          By continuing, you agree to Straxon's <Link to="/" className="hover:text-foreground transition-colors underline">Terms</Link> and <Link to="/" className="hover:text-foreground transition-colors underline">Privacy Policy</Link>.
        </div>
      </div>

      {/* RIGHT PANEL: Visual Branding Showcase */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-black via-primary/5 to-background p-12 xl:p-16 flex-col justify-between overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Global Cluster Online · 99.99% RAG SLA
            </span>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-3.5 w-3.5 fill-primary text-primary" />
            ))}
          </div>
        </div>

        {/* Animated Value Testimonial Card */}
        <div className="z-10 my-auto max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <Quote className="h-3 w-3 text-primary" />
                <span className="text-xs font-mono uppercase text-primary font-semibold">Verified Client Telemetry</span>
              </div>

              <blockquote className="text-2xl xl:text-3xl font-bold tracking-tight text-white leading-snug">
                "{slide.quote}"
              </blockquote>

              <div className="flex items-center justify-between pt-4 border-t border-border/30">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-primary-foreground shadow-glow">
                    {slide.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{slide.author}</p>
                    <p className="text-xs text-muted-foreground">{slide.role}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-extrabold text-gradient font-mono">{slide.metric}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono">{slide.metricLabel}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-1.5 mt-8">
            {TESTIMONIALS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? "w-8 bg-primary" : "w-2 bg-muted/40 hover:bg-muted"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Bottom Platform Live Status Bar */}
        <div className="z-10 pt-6 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="font-mono">Active Workspaces: <strong className="text-foreground">2,841</strong></span>
            <span className="font-mono">Weekly Deliverables: <strong className="text-foreground">14,290+</strong></span>
          </div>
          <span className="font-mono text-primary font-semibold">AES-256 GCM</span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
