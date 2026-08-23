import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import { loginApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Lock, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "verifying" | "denied" | "granted">("idle");
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("verifying");
    setLoading(true);

    // Simulate network delay for the dramatic effect
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const domainCheck = email.toLowerCase();
    if (!domainCheck.endsWith("@straxon.com") && !domainCheck.endsWith("@straxonlabs.com")) {
      setStatus("denied");
      setLoading(false);
      toast.error("Access restricted to Straxon personnel only.");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    try {
      const data = await loginApi(email, password);
      setStatus("granted");
      setAuth(data.accessToken, data.user);
      toast.success("Identity verified.");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err: any) {
      setStatus("idle");
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black overflow-hidden relative font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 -left-10 w-[30rem] h-[30rem] bg-indigo-600 rounded-full mix-blend-screen filter blur-[100px]"
        />
        <motion.div 
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, -90, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 -right-10 w-[30rem] h-[30rem] bg-blue-600 rounded-full mix-blend-screen filter blur-[100px]"
        />
        <motion.div 
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.15, 0.1],
            y: [0, 50, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-20 left-1/4 w-[40rem] h-[20rem] bg-violet-600 rounded-[100%] mix-blend-screen filter blur-[120px]"
        />
      </div>

      {/* Grid Pattern overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-10" 
        style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      ></div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md z-10 relative px-4"
      >
        <div className="bg-zinc-900/40 backdrop-blur-2xl border border-zinc-800/60 p-8 rounded-2xl shadow-2xl shadow-black">
          
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex justify-center mb-6"
            >
              <img src="/logo.png" alt="Straxon Logo" className="h-20 w-auto object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-semibold tracking-tight text-white"
            >
              Straxon Command
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-zinc-400 mt-2 font-mono"
            >
              SECURE LOGIN REQUIRED
            </motion.p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <AnimatePresence mode="wait">
              {status === "denied" ? (
                <motion.div 
                  key="denied"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-950/40 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center gap-3 backdrop-blur-md"
                >
                  <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                  <div className="text-sm font-medium tracking-wide">ACCESS DENIED: Unauthorized Domain</div>
                </motion.div>
              ) : status === "granted" ? (
                <motion.div 
                  key="granted"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3 backdrop-blur-md"
                >
                  <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                  <div className="text-sm font-medium tracking-wide">IDENTITY VERIFIED</div>
                </motion.div>
              ) : (
                <motion.div key="form" className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="space-y-2">
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                      <Input 
                        id="email"
                        name="email"
                        type="email" 
                        autoComplete="email"
                        placeholder="personnel@straxon.com" 
                        className="pl-10 h-12 bg-black/40 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 transition-all rounded-xl shadow-inner shadow-black/50"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                      <Input 
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Security Key"
                        className="pl-10 h-12 bg-black/40 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 transition-all rounded-xl shadow-inner shadow-black/50"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Button 
                type="submit" 
                className="w-full h-12 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] relative overflow-hidden group"
                disabled={loading || status !== "idle"}
              >
                {status === "verifying" ? (
                  <span className="flex items-center tracking-wide text-sm">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    VERIFYING...
                  </span>
                ) : (
                  <span className="tracking-wide text-sm">AUTHENTICATE</span>
                )}
                {/* Glossy overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Button>
            </motion.div>
          </form>

          {/* Decorative Terminal Line */}
          <div className="mt-8 pt-6 border-t border-zinc-800/50">
            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono tracking-wider">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]"></span>
                SYSTEM ONLINE
              </span>
              <span>v1.0.4-SECURE</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
