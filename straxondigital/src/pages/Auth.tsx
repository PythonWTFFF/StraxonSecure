import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { session } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      navigate("/dashboard");
    }
  }, [session, navigate]);

  const strength = calculateStrength(password);
  
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
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
    <div className="min-h-screen relative overflow-hidden bg-background flex flex-col">
      <Navbar />

      {/* Advanced Ambient Background */}
      <div className="absolute inset-0 grid-pattern opacity-[0.15] pointer-events-none" />
      <motion.div
        aria-hidden
        className="absolute -top-[20%] -left-[10%] h-[800px] w-[800px] rounded-full bg-primary/10 blur-[120px] pointer-events-none"
        animate={{ 
          x: [0, 100, 0], 
          y: [0, 50, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute top-[40%] -right-[20%] h-[600px] w-[600px] rounded-full bg-accent/10 blur-[100px] pointer-events-none"
        animate={{ 
          x: [0, -80, 0], 
          y: [0, -40, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="bg-primary/10 p-4 rounded-2xl mb-4 ring-1 ring-primary/20 shadow-[0_0_40px_hsl(var(--primary)/0.2)]"
            >
              <BrandMark size={32} />
            </motion.div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
              {mode === "signin" ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {mode === "signin" 
                ? "Enter your credentials to access your workspace" 
                : "Enter your details below to create your workspace"}
            </p>
          </div>

          <Card className="glass-strong border border-border/50 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
            
            <div className="p-8">
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
                  {mode === "signup" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Label htmlFor="fullName" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="mt-1.5 bg-background/50 border-border/50 focus:bg-background transition-colors h-11"
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
                      placeholder="name@example.com"
                      required
                      autoComplete="email"
                      className="mt-1.5 bg-background/50 border-border/50 focus:bg-background transition-colors h-11"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        Password
                      </Label>
                      {mode === "signin" && (
                        <Link to="#" className="text-xs text-primary hover:underline font-medium">
                          Forgot password?
                        </Link>
                      )}
                    </div>
                    <div className="relative mt-1.5">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        className="bg-background/50 border-border/50 focus:bg-background transition-colors h-11 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {mode === "signup" && password.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 flex gap-1"
                      >
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div 
                            key={level} 
                            className={`h-1 w-full rounded-full transition-all duration-300 ${
                              strength >= level 
                                ? strength <= 2 ? "bg-red-500" : strength <= 3 ? "bg-yellow-500" : "bg-green-500"
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
                    className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 mt-2 font-medium shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all group relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          {mode === "signin" ? "Sign In" : "Create Account"}
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </span>
                    {/* Hover glow effect inside button */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </Button>
                </motion.form>
              </AnimatePresence>

              <div className="mt-8 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background/80 px-2 text-muted-foreground backdrop-blur-sm">
                    {mode === "signin" ? "New to Straxon?" : "Already have an account?"}
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  {mode === "signin" ? "Create an account" : "Sign in instead"}
                </button>
              </div>
            </div>
          </Card>
          
          <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing, you agree to our <Link to="/" className="underline hover:text-foreground transition-colors">Terms of Service</Link> and <Link to="/" className="underline hover:text-foreground transition-colors">Privacy Policy</Link>.
          </p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
