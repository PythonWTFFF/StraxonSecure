import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BOOT_LINES = [
  "[BOOT] Straxon Secure Core v3.0.0 initializing…",
  "[NET]  Establishing quantum-encrypted uplink → 198.51.100.7",
  "[CRYP] Loading zero-trust cipher suites: AES-256-GCM, CHACHA20-POLY1305",
  "[INTEL] Syncing global threat feed (4,812,330 IOCs) via ML Engine",
  "[AUTH]  Verifying root operator credentials…",
  "[SOC]   Spinning up live anomaly detection telemetry",
  "[OK]    All systems nominal — welcome, operator.",
];

const SPLASH_KEY = "straxon_splash_seen_v1";

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SPLASH_KEY)) return;
    setVisible(true);
    sessionStorage.setItem(SPLASH_KEY, "1");

    const start = performance.now();
    const dur = 2600;
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / dur);
      setProgress(t);
      setLineIdx(Math.min(BOOT_LINES.length, Math.floor(t * BOOT_LINES.length) + 1));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setVisible(false), 450);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-background"
        >
          {/* Layered cyber atmosphere */}
          <div className="absolute inset-0 grid-bg opacity-60" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, oklch(0.78 0.18 200 / 0.18), transparent 60%), radial-gradient(ellipse at 80% 20%, oklch(0.70 0.30 330 / 0.18), transparent 55%)",
            }}
          />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute h-[2px] w-full bg-gradient-to-r from-transparent via-[#00f3ff]/80 to-transparent animate-scan-line shadow-[0_0_20px_rgba(0,243,255,0.5)]" />
          </div>

          {/* Concentric rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1.4, opacity: [0, 0.5, 0] }}
                transition={{ duration: 2.6, delay: i * 0.45, repeat: Infinity, ease: "easeOut" }}
                className="absolute rounded-full border border-primary/40"
                style={{ width: 320, height: 320 }}
              />
            ))}
          </div>

          <div className="relative z-10 flex flex-col items-center px-6 max-w-xl w-full">
            {/* Logo slot — reserved space for user's logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative mb-8"
            >
              <div
                id="straxon-logo-slot"
                data-logo-slot
                className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-2xl glass flex items-center justify-center overflow-hidden"
                style={{ boxShadow: "var(--shadow-glow-cyan)" }}
              >
                {/* Corner brackets */}
                <span className="absolute top-1 left-1 h-3 w-3 border-t-2 border-l-2 border-primary" />
                <span className="absolute top-1 right-1 h-3 w-3 border-t-2 border-r-2 border-primary" />
                <span className="absolute bottom-1 left-1 h-3 w-3 border-b-2 border-l-2 border-accent" />
                <span className="absolute bottom-1 right-1 h-3 w-3 border-b-2 border-r-2 border-accent" />

                {/* The Official Shield Logo */}
                <motion.div
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ duration: 1, ease: "backOut" }}
                  className="relative z-10"
                >
                  <img
                    src="/straxonlogo.jpeg"
                    alt="Straxon Secure"
                    className="w-20 h-20 sm:w-28 sm:h-28 object-contain drop-shadow-[0_0_25px_rgba(0,243,255,0.6)] animate-float"
                  />
                </motion.div>

                {/* Cyber Sweep */}
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#00f3ff]/30 to-transparent skew-x-12 mix-blend-overlay z-20"
                />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="font-display text-3xl sm:text-5xl font-black tracking-[0.2em] text-white drop-shadow-[0_0_15px_rgba(0,243,255,0.4)] flex items-center justify-center gap-3 mt-4"
            >
              STRAXON{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#ff003c]">
                SECURE
              </span>
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, letterSpacing: "0.1em" }}
              animate={{ opacity: 1, letterSpacing: "0.5em" }}
              transition={{ delay: 0.35, duration: 0.8 }}
              className="mt-2 font-mono text-xs text-muted-foreground uppercase"
            >
              Secure · Defend · Outlearn
            </motion.div>

            {/* Progress bar */}
            <div className="mt-10 w-full max-w-sm">
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
                <span>SECURE BOOT</span>
                <span className="text-primary">{Math.floor(progress * 100)}%</span>
              </div>
              <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-primary"
                  style={{ width: `${progress * 100}%` }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_50%,oklch(1_0_0_/_0.15)_50%)] bg-[length:8px_100%]" />
              </div>
            </div>

            {/* Boot log */}
            <div className="mt-6 w-full max-w-sm h-28 font-mono text-[10px] sm:text-xs leading-relaxed text-muted-foreground overflow-hidden">
              {BOOT_LINES.slice(0, lineIdx).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={
                    line.startsWith("[OK]")
                      ? "text-success"
                      : line.startsWith("[INTEL]")
                        ? "text-accent"
                        : "text-primary/80"
                  }
                >
                  {line}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
