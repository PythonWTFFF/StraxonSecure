import { useState, useEffect } from "react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { X, Sparkles, Terminal, Shield, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show only once per browser
    const seen = localStorage.getItem("straxon_welcome_seen");
    if (!seen) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("straxon_welcome_seen", "true");
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg relative"
          >
            <CyberCard className="p-8 relative overflow-hidden bg-[#020610]/95 border-accent/50">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6 flex items-center gap-3 text-accent">
                <Sparkles className="h-8 w-8" />
                <h2 className="font-display text-2xl font-bold text-white tracking-wide">
                  Welcome to Straxon
                </h2>
              </div>

              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                You have successfully initialized your connection to the ultimate cyber attack
                simulation platform. Before engaging with the live red-team modules, we recommend
                calibrating your skills.
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3 p-3 rounded bg-white/5 border border-white/10">
                  <Terminal className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white text-sm font-semibold mb-1">Interactive Labs</h4>
                    <p className="text-xs text-slate-400">
                      Deploy live vulnerable infrastructure and practice real-world exploits safely.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded bg-white/5 border border-white/10">
                  <Shield className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white text-sm font-semibold mb-1">SOC Dashboard</h4>
                    <p className="text-xs text-slate-400">
                      Monitor live threats and defend your infrastructure in real-time.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end">
                <CyberButton variant="ghost" onClick={handleDismiss}>
                  Dismiss
                </CyberButton>
                <Link to="/labs" onClick={handleDismiss}>
                  <CyberButton variant="cyan">
                    Enter Training Labs <ArrowRight className="h-4 w-4 ml-2" />
                  </CyberButton>
                </Link>
              </div>
            </CyberCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
