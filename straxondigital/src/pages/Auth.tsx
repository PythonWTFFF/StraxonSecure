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
import { Eye, EyeOff, Loader2, ArrowRight, Sparkles, Star, Quote } from "lucide-react";
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

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate("/dashboard");
    }
  }, [session, navigate]);

  const strength = calculateStrength(password);
  
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
        toast.success("Account created successfully. Please check your email to confirm.");
        setMode("signin");
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message === "Invalid login credentials") {
            throw new Error("Incorrect email or password. Please try again.");
          }
          throw error;
        }
        if (data.session) {
          toast.success("Authentication successful. Welcome back.");
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

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* LEFT PANEL: Interaction Side */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col relative z-10 bg-background/80 backdrop-blur-3xl border-r border-border/40 shadow-2xl">
        
        {/* Header / Logo */}
        <div className="p-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-xl ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all shadow-glow">
              <BrandMark size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">Straxon<span className="text-primary">Secure</span></span>
          </Link>
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Back to Home
          </Link>
        </div>

        {/* Main Auth Form Container */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-20 max-w-2xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                {mode === "signin" 
                  ? "Enter your credentials to access your autonomous AI command center." 
                  : "Start scaling your agency with hyper-advanced AI workflows today."}
              </p>
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: mode === "signin" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "signin" ? 20 : -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                onSubmit={onSubmit}
                className="space-y-5"
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
                    <Label htmlFor="fullName" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="mt-1.5 bg-background border-border/50 focus:border-primary/50 transition-colors h-12 text-base rounded-xl"
                    />
                  </motion.div>
                )}
                
                <div>
                  <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    autoComplete="email"
                    className="mt-1.5 bg-background border-border/50 focus:border-primary/50 transition-colors h-12 text-base rounded-xl"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      Password
                    </Label>
                    {mode === "signin" && (
                      <Link to="/reset-password" className="text-xs text-primary hover:underline font-medium">
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div className="relative mt-1.5 group">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      className="bg-background border-border/50 focus:border-primary/50 transition-colors h-12 text-base pr-10 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {mode === "signup" && password.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 flex gap-1.5"
                    >
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div 
                          key={level} 
                          className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                            strength >= level 
                              ? strength <= 2 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
                              : strength <= 3 ? "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" 
                              : "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                              : "bg-border/50"
                          }`} 
                        />
                      ))}
                    </motion.div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-primary text-primary-foreground hover:opacity-90 mt-4 font-semibold text-base shadow-glow transition-all group relative overflow-hidden rounded-xl"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        {mode === "signin" ? "Sign In to Dashboard" : "Create Account"}
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-out" />
                </Button>
              </motion.form>
            </AnimatePresence>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  className="text-foreground font-semibold hover:text-primary transition-colors underline decoration-primary/50 underline-offset-4"
                >
                  {mode === "signin" ? "Sign up for free" : "Sign in here"}
                </button>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Footer Links */}
        <div className="p-8 text-center text-xs text-muted-foreground">
          By continuing, you agree to our <Link to="/" className="hover:text-foreground transition-colors underline">Terms of Service</Link> and <Link to="/" className="hover:text-foreground transition-colors underline">Privacy Policy</Link>.
        </div>
      </div>

      {/* RIGHT PANEL: Visual Brand Side (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center bg-black/40">
        {/* Dynamic Abstract Background Elements */}
        <div className="absolute inset-0 grid-pattern opacity-[0.2]" />
        
        <motion.div
          className="absolute h-[600px] w-[600px] rounded-full bg-primary/20 blur-[140px]"
          animate={{ x: [0, 50, -50, 0], y: [0, -50, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute h-[500px] w-[500px] rounded-full bg-accent/20 blur-[120px]"
          animate={{ x: [0, -100, 50, 0], y: [0, 100, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating Social Proof / UI Showcase Cards */}
        <div className="relative z-10 max-w-lg w-full px-8 perspective-1000">
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1, delay: 0.2, type: "spring" }}
            className="glass-strong p-8 rounded-3xl border-primary/20 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <Quote className="h-24 w-24 text-primary" />
            </div>
            
            <div className="flex gap-1 mb-6 relative z-10">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-5 w-5 fill-primary text-primary" />
              ))}
            </div>
            
            <h3 className="text-xl sm:text-2xl font-medium leading-relaxed text-foreground mb-8 relative z-10">
              "Since deploying StraxonSecure's RAG automation, our agency's profit margins increased by 42%. The AI tools literally run our SEO and Drip Campaigns on autopilot."
            </h3>
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-12 w-12 rounded-full bg-gradient-primary p-[2px]">
                <div className="h-full w-full rounded-full bg-background flex items-center justify-center font-bold text-lg">
                  EC
                </div>
              </div>
              <div>
                <p className="font-bold text-foreground">Elena Croft</p>
                <p className="text-sm text-primary font-mono tracking-tight flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Growth Director, ScaleB2B
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.6, type: "spring" }}
            className="absolute -bottom-16 -right-8 glass p-4 rounded-2xl border-border/50 shadow-xl flex items-center gap-4 backdrop-blur-3xl"
          >
            <div className="bg-green-500/20 p-3 rounded-xl border border-green-500/30">
              <CheckCircle2 className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Active Workspaces</p>
              <p className="text-2xl font-bold font-mono">1,204</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
