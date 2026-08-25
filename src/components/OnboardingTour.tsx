import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, Shield, Activity, ChevronRight, X } from "lucide-react";
import { CyberButton } from "./cyber/CyberButton";

const TOUR_STEPS = [
  {
    title: "Welcome to Straxon Secure",
    description: "Your enterprise-grade offensive security platform. Let's get you orientated.",
    icon: Shield,
    color: "text-[#00f3ff]",
  },
  {
    title: "The SOC Dashboard",
    description:
      "Monitor global threats in real-time. The ML Engine actively analyzes anomalies and can push alerts directly to your Slack or Discord via Webhooks.",
    icon: Activity,
    color: "text-emerald-400",
  },
  {
    title: "PTaaS & Attack Labs",
    description:
      "Deploy automated AI Penetration Tests or spin up Dockerized vulnerable environments to hone your skills.",
    icon: Crosshair,
    color: "text-[#ff003c]",
  },
];

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Only show once
    const hasSeen = localStorage.getItem("straxon_tour_completed");
    if (!hasSeen) {
      // Small delay for dramatic effect
      const t = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const completeTour = () => {
    localStorage.setItem("straxon_tour_completed", "true");
    setIsOpen(false);
  };

  const nextStep = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      completeTour();
    }
  };

  if (!isOpen) return null;

  const current = TOUR_STEPS[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#020610]/80 backdrop-blur-sm"
          onClick={completeTour}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-[#020610] border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] [clip-path:polygon(16px_0,100%_0,100%_calc(100%-16px),calc(100%-16px)_100%,0_100%,0_16px)] p-6"
        >
          {/* Close Btn */}
          <button
            onClick={completeTour}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div
              className={`h-12 w-12 rounded bg-white/5 border border-white/10 flex items-center justify-center ${current.color}`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                System Initializing {step + 1}/{TOUR_STEPS.length}
              </p>
              <h2 className="text-xl font-display font-bold text-white">{current.title}</h2>
            </div>
          </div>

          <p className="text-slate-400 text-sm leading-relaxed mb-8">{current.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {TOUR_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-[#00f3ff]" : "w-2 bg-white/10"}`}
                />
              ))}
            </div>

            <CyberButton
              variant={step === TOUR_STEPS.length - 1 ? "magenta" : "cyan"}
              onClick={nextStep}
            >
              {step === TOUR_STEPS.length - 1 ? "Enter Network" : "Next Module"}{" "}
              <ChevronRight className="h-4 w-4 ml-2" />
            </CyberButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
