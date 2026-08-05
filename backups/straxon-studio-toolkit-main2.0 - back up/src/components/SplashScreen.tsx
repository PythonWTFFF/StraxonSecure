import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1400);
    const t3 = setTimeout(() => setPhase(3), 2200);
    const t4 = setTimeout(() => onComplete(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase < 3 && (
        <motion.div
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        >
          {/* Animated rings */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5 + i * 0.5], opacity: [0.6, 0] }}
              transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, ease: "easeOut" }}
              className="absolute rounded-full border border-primary/30"
              style={{ width: 120, height: 120 }}
            />
          ))}

          {/* Logo placeholder */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            className="relative mb-8"
          >
            <div className="h-20 w-20 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 flex items-center justify-center">
              <span className="text-3xl font-black text-primary">S</span>
            </div>
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-mono text-muted-foreground bg-background px-2">YOUR LOGO</span>
          </motion.div>

          {/* Brand name */}
          <div className="flex overflow-hidden">
            {"STRAXON".split("").map((char, i) => (
              <motion.span
                key={i}
                initial={{ y: 60, opacity: 0 }}
                animate={phase >= 1 ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.4, delay: i * 0.05, type: "spring" }}
                className="text-4xl md:text-6xl font-black text-foreground"
              >
                {char}
              </motion.span>
            ))}
            <motion.span
              initial={{ y: 60, opacity: 0 }}
              animate={phase >= 1 ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.4, type: "spring" }}
              className="text-4xl md:text-6xl font-black text-primary text-glow"
            >
              LABS
            </motion.span>
          </div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="mt-4 text-sm font-mono text-muted-foreground tracking-widest"
          >
            Build • Automate • Design • Secure
          </motion.p>

          {/* Loading bar */}
          <motion.div className="mt-10 w-48 h-0.5 bg-border rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
              className="h-full bg-primary rounded-full"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
