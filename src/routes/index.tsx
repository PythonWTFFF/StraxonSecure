import { motion } from "framer-motion";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  Activity,
  Beaker,
  GraduationCap,
  Network,
  ScanLine,
  Bot,
  ArrowRight,
  Lock,
  Zap,
  Eye,
  Globe,
  Crosshair,
  Flag,
  Swords,
  AlertCircle,
  BarChart3,
  Wifi,
  Mail,
  Ghost,
  ShieldCheck,
} from "lucide-react";
import { CyberButton } from "@/components/cyber/CyberButton";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { callAuthed } from "@/lib/serverCall";
import { captureLead } from "@/server/leads";
import { toast } from "sonner";
import { OnboardingTour } from "@/components/OnboardingTour";
import { TypewriterText } from "@/components/cyber/TypewriterText";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Straxon Secure — Cyber Attack Simulation Platform" }],
  }),
  component: Index,
});

import React, { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const ParticleSwarm = lazy(() =>
  import("@/components/cyber/LandingGlobes").then((m) => ({ default: m.ParticleSwarm })),
);
const BackgroundGlobe = lazy(() =>
  import("@/components/cyber/LandingGlobes").then((m) => ({ default: m.BackgroundGlobe })),
);
const CyberEarth = lazy(() =>
  import("@/components/cyber/LandingGlobes").then((m) => ({ default: m.CyberEarth })),
);

// ─────────────────────────────────────────────
const MODULES = [
  {
    to: "/dashboard",
    icon: Activity,
    title: "SOC Dashboard",
    desc: "Real-time threat intel with global 3D attack map, anomaly detection, and deep packet inspection.",
    accent: "cyan" as const,
    tag: "01 / OPS",
  },
  {
    to: "/warroom",
    icon: Swords,
    title: "Red vs Blue War Room",
    desc: "Real-time cyber warfare simulation. Attack as red team or defend as blue team.",
    accent: "magenta" as const,
    tag: "02 / WARFARE",
  },
  {
    to: "/labs",
    icon: Beaker,
    title: "Attack Labs",
    desc: "12 hands-on attack simulations: SQLi, XSS, RCE, SSRF, JWT, LFI, XXE, and IDOR.",
    accent: "cyan" as const,
    tag: "03 / OFFENSE",
  },
  {
    to: "/ctf",
    icon: Flag,
    title: "CTF Hub",
    desc: "Solve cryptography, forensics, reverse engineering, and web challenges to capture flags.",
    accent: "magenta" as const,
    tag: "04 / CTF",
  },
  {
    to: "/posture",
    icon: BarChart3,
    title: "Security Posture",
    desc: "Track your global score, earn achievement badges, and climb the global leaderboard.",
    accent: "cyan" as const,
    tag: "05 / POSTURE",
  },
  {
    to: "/packet-analyzer",
    icon: Wifi,
    title: "Packet Analyzer",
    desc: "Wireshark-style network traffic inspection, protocol dissection, and anomaly tracking.",
    accent: "magenta" as const,
    tag: "06 / NETWORK",
  },
  {
    to: "/ir",
    icon: AlertCircle,
    title: "IR Playbooks",
    desc: "Respond to incidents with NIST-aligned ransomware, data breach, and DDoS playbooks.",
    accent: "cyan" as const,
    tag: "07 / RESPOND",
  },
  {
    to: "/scanner",
    icon: ScanLine,
    title: "Vulnerability Scanner",
    desc: "Continuous automated scanning for known CVEs across your external attack surface.",
    accent: "cyan" as const,
    tag: "08 / SCAN",
  },
  {
    to: "/darkweb",
    icon: Ghost,
    title: "Dark Web Monitor",
    desc: "Track leaked credentials, exposed domains, and compromised VIP emails across illicit forums.",
    accent: "magenta" as const,
    tag: "09 / INTEL",
  },
  {
    to: "/assistant",
    icon: Bot,
    title: "AI Assistant",
    desc: "Ask anything cybersecurity. Get instant, explained answers from a senior security AI.",
    accent: "cyan" as const,
    tag: "09 / INTEL",
  },
];

const STATS = [
  { value: "12", label: "Live Labs" },
  { value: "8", label: "CTF Flags" },
  { value: "15", label: "Achievements" },
  { value: "AI", label: "Assisted" },
];

// ─────────────────────────────────────────────
// SMOOTH EASING CURVES
// ─────────────────────────────────────────────
const customEase: any = [0.16, 1, 0.3, 1];

const fadeUpVariants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: customEase } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

// ─────────────────────────────────────────────
// MAIN INDEX PAGE
// ─────────────────────────────────────────────
function Index() {
  const [email, setEmail] = useState("");
  const [capturing, setCapturing] = useState(false);

  // Global Threat Matrix Real-Time Simulation
  const [nodes, setNodes] = useState(1402);
  const [defcon, setDefcon] = useState(3);
  const [matrixStatus, setMatrixStatus] = useState("Monitoring");

  useEffect(() => {
    const interval = setInterval(() => {
      // Fluctuate nodes organically between 1200 and 1600
      setNodes((prev) => {
        const change = Math.floor(Math.random() * 40) - 20;
        return Math.max(1200, Math.min(1600, prev + change));
      });

      // Determine Defcon based on simulated global spikes
      const spike = Math.random();
      if (spike > 0.95) {
        setDefcon(1);
        setMatrixStatus("CRITICAL THREAT");
      } else if (spike > 0.85) {
        setDefcon(2);
        setMatrixStatus("ELEVATED RISK");
      } else if (spike > 0.5) {
        setDefcon(3);
        setMatrixStatus("Monitoring");
      } else {
        setDefcon(4);
        setMatrixStatus("Stable");
      }
    }, 2500); // update every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleCaptureLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setCapturing(true);
    try {
      await callAuthed(captureLead, { email, source: "landing_footer" });
      toast.success("Welcome to the network. We'll be in touch.");
      setEmail("");
    } catch (e: any) {
      toast.error(e.message || "Failed to join network");
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#020610] text-slate-300 font-sans selection:bg-[#00f3ff] selection:text-black overflow-hidden flex flex-col">
      <OnboardingTour />
      {/* CRT SCANLINE OVERLAY */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.025] mix-blend-overlay bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:100%_4px]" />

      {/* 3D BACKGROUND LAYER */}
      <div
        className="fixed inset-0 z-0 pointer-events-none mix-blend-screen"
        style={{
          maskImage: "linear-gradient(to bottom, black 15%, transparent 95%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 15%, transparent 95%)",
        }}
      >
        <Canvas camera={{ position: [0, 0, 8], fov: 60 }} dpr={[1, 1.5]}>
          <ErrorBoundary>
            <Suspense fallback={null}>
              <ParticleSwarm />
              <BackgroundGlobe />
            </Suspense>
          </ErrorBoundary>
        </Canvas>
      </div>

      {/* CONTENT LAYER */}
      <div className="relative z-10 px-4 md:px-6 lg:px-8 py-12 md:py-16 lg:py-28 max-w-[1600px] mx-auto space-y-24 md:space-y-32 pointer-events-none">
        {/* HERO SECTION */}
        <section className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center pointer-events-auto min-h-[60vh] lg:min-h-[70vh]">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: customEase }}
            className="space-y-6 md:space-y-8"
          >
            <div className="inline-flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 bg-[#020610]/80 border border-[#00f3ff]/30 text-[10px] md:text-xs font-mono backdrop-blur-md shadow-[0_0_15px_rgba(0,243,255,0.15)] [clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]">
              <span className="flex h-1.5 w-1.5 md:h-2 md:w-2 bg-[#00f3ff] animate-pulse" />
              <span className="text-[#00f3ff] tracking-widest">STRAXON PLATFORM v3.0.0</span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tighter">
              <span className="block text-white drop-shadow-md glitch-text" data-text="SIMULATE.">
                SIMULATE.
              </span>
              <span
                className="block text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#ff003c] drop-shadow-lg pb-1 md:pb-2 glitch-text-color"
                data-text="DEFEND."
              >
                DEFEND.
              </span>
              <span className="block text-white drop-shadow-md glitch-text" data-text="DOMINATE.">
                DOMINATE.
              </span>
            </h1>

            <div className="text-sm sm:text-base md:text-lg text-slate-400 max-w-xl leading-relaxed backdrop-blur-md bg-[#020610]/50 p-4 border border-white/5 shadow-xl [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)] min-h-[100px]">
              <span className="text-[#00f3ff] font-mono mr-2">&gt;</span>
              <TypewriterText 
                strings={[
                  "Execute SQLi & XSS simulations.",
                  "Design hardened zero-trust architectures.",
                  "Operate a live SOC in your browser.",
                  "Automate DevSecOps vulnerability scanning.",
                  "Defend against ransomware and DDoS.",
                ]} 
              />
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-2 md:pt-4">
              <Link to="/labs" className="w-full sm:w-auto">
                <CyberButton
                  size="lg"
                  variant="cyan"
                  className="w-full shadow-[0_0_30px_rgba(0,243,255,0.15)] overflow-hidden group"
                >
                  <Zap className="h-4 w-4 mr-2 group-hover:animate-pulse" /> Launch Lab
                </CyberButton>
              </Link>
              <Link to="/dashboard" className="w-full sm:w-auto">
                <CyberButton
                  size="lg"
                  variant="ghost"
                  className="w-full bg-[#020610]/50 backdrop-blur-md hover:bg-[#020610]/80 group"
                >
                  <Eye className="h-4 w-4 mr-2 group-hover:text-[#00f3ff]" /> Open SOC
                </CyberButton>
              </Link>
            </div>
            
            {/* TRUSTED BY STRIP */}
            <div className="pt-8 border-t border-white/5">
              <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-4">
                Trusted by security teams at
              </p>
              <div className="flex flex-wrap gap-6 items-center opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                {/* Simulated company logos / badges */}
                <div className="flex items-center gap-2 font-display font-bold text-slate-300 text-lg">
                  <ScanLine className="h-5 w-5 text-indigo-400" />
                  CypherLabs
                </div>
                <div className="flex items-center gap-2 font-display font-bold text-slate-300 text-lg">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  Sentinel
                </div>
                <div className="flex items-center gap-2 font-display font-bold text-slate-300 text-lg">
                  <Network className="h-5 w-5 text-blue-400" />
                  Apex Defense
                </div>
                <div className="flex items-center gap-2 font-display font-bold text-slate-300 text-lg">
                  <Activity className="h-5 w-5 text-rose-400" />
                  RedShift
                </div>
              </div>
            </div>
          </motion.div>

          {/* Live 3D Cyber Earth Widget (Responsive Heights) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: customEase, delay: 0.2 }}
            className="relative pointer-events-auto group mt-8 lg:mt-0"
          >
            {/* Breathing Ambient Glow */}
            <div className="absolute -inset-4 md:-inset-10 bg-gradient-to-tr from-[#00f3ff] to-[#ff003c] rounded-full blur-[80px] md:blur-[120px] opacity-[0.08] group-hover:opacity-[0.18] transition-all duration-1000 ease-out" />

            {/* Glassmorphic Cyber Container */}
            <div className="relative bg-[#020610]/70 border border-slate-800/60 h-[320px] sm:h-[400px] lg:h-[460px] flex flex-col p-0 overflow-hidden backdrop-blur-2xl shadow-2xl [clip-path:polygon(20px_0,100%_0,100%_calc(100%-20px),calc(100%-20px)_100%,0_100%,0_20px)]">
              {/* Header */}
              <div className="bg-[#020610]/90 px-4 py-3 md:px-5 md:py-4 border-b border-white/5 flex items-center justify-between z-10 relative">
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f3ff]/40 to-transparent" />

                <div className="flex items-center gap-2 md:gap-3">
                  <Globe className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#00f3ff]" />
                  <span className="text-[9px] md:text-[10px] font-mono text-slate-300 tracking-[0.2em] uppercase">
                    Global Threat Matrix
                  </span>
                </div>
                <div className="flex gap-1.5 md:gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                  <div className="h-1.5 w-1.5 rounded-full bg-[#ff003c] shadow-[0_0_8px_#ff003c]" />
                </div>
              </div>

              {/* 3D Canvas Area */}
              <div className="flex-1 w-full relative cursor-crosshair">
                <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 1.5]}>
                  <ambientLight intensity={0.5} />
                  <ErrorBoundary>
                    <Suspense fallback={null}>
                      <CyberEarth />
                    </Suspense>
                  </ErrorBoundary>
                </Canvas>

                {/* Floating HUD Metrics */}
                <div className="absolute bottom-3 left-3 md:bottom-5 md:left-5 font-mono text-[8px] md:text-[10px] text-[#00f3ff]/90 uppercase tracking-widest space-y-1 md:space-y-1.5 bg-[#020610]/80 p-2.5 md:p-4 backdrop-blur-md border border-[#00f3ff]/20 [clip-path:polygon(6px_0,100%_0,100%_calc(100%-6px),calc(100%-6px)_100%,0_100%,0_6px)]">
                  <div className="flex justify-between gap-6 md:gap-8">
                    <span>Status:</span>
                    <span
                      className={
                        matrixStatus === "CRITICAL THREAT"
                          ? "text-[#ff003c] animate-pulse"
                          : matrixStatus === "ELEVATED RISK"
                            ? "text-orange-400"
                            : matrixStatus === "Monitoring"
                              ? "text-yellow-400"
                              : "text-emerald-400"
                      }
                    >
                      {matrixStatus}
                    </span>
                  </div>
                  <div className="flex justify-between gap-6 md:gap-8">
                    <span>Active Nodes:</span>{" "}
                    <span className="text-white">{nodes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-6 md:gap-8 hidden sm:flex">
                    <span>Network Defcon:</span>
                    <span
                      className={
                        defcon === 1
                          ? "text-[#ff003c] animate-pulse font-bold"
                          : defcon === 2
                            ? "text-orange-500 font-bold"
                            : defcon === 3
                              ? "text-yellow-400"
                              : "text-emerald-400"
                      }
                    >
                      Level {defcon}
                    </span>
                  </div>
                </div>

                {/* Targeting Reticle Overlay */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20 transition-opacity duration-500 group-hover:opacity-40">
                  <Crosshair
                    className="h-24 w-24 md:h-32 md:w-32 text-[#00f3ff]/60"
                    strokeWidth={0.5}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* STATS STRIP */}
        <section className="pointer-events-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
          >
            {STATS.map((s) => (
              <motion.div
                key={s.label}
                variants={fadeUpVariants}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center py-6 md:py-8 bg-[#020610]/70 backdrop-blur-xl border border-white/5 hover:border-[#00f3ff]/40 transition-colors shadow-lg group overflow-hidden relative [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)]">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-[0_0_15px_rgba(0,243,255,0.2)] group-hover:text-[#00f3ff] transition-colors duration-300">
                    {s.value}
                  </div>
                  <div className="relative font-mono text-[9px] md:text-[10px] tracking-[0.2em] text-slate-500 mt-2 md:mt-3 uppercase group-hover:text-slate-300 transition-colors duration-300">
                    {s.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* MODULES GRID */}
        <section className="pointer-events-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUpVariants}
            className="mb-8 md:mb-12"
          >
            <div className="text-[10px] md:text-xs font-mono tracking-[0.3em] text-[#00f3ff] uppercase flex items-center gap-3 mb-3 md:mb-4">
              <span className="h-px w-8 md:w-12 bg-[#00f3ff]/50" /> SYSTEM MODULES
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
              Nine modules.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-300 to-slate-500">
                One arsenal.
              </span>
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          >
            {MODULES.map((m) => {
              const Icon = m.icon;
              const isMagenta = m.accent === "magenta";
              const hoverBorder = isMagenta
                ? "hover:border-[#ff003c]/60"
                : "hover:border-[#00f3ff]/60";
              const shadowBloom = isMagenta
                ? "hover:shadow-[0_15px_40px_-10px_rgba(255,0,60,0.2)]"
                : "hover:shadow-[0_15px_40px_-10px_rgba(0,243,255,0.2)]";

              return (
                <motion.div
                  key={m.to}
                  variants={fadeUpVariants}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.4 }}
                  className="h-full"
                >
                  <Link to={m.to} className="block group h-full">
                    <div
                      className={`h-full flex flex-col bg-[#020610]/80 backdrop-blur-2xl border border-white/5 p-5 md:p-8 transition-all duration-500 relative overflow-hidden [clip-path:polygon(16px_0,100%_0,100%_calc(100%-16px),calc(100%-16px)_100%,0_100%,0_16px)] ${hoverBorder} ${shadowBloom}`}
                    >
                      {/* Hover Gradient Overlay */}
                      <div
                        className={`absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 bg-gradient-to-br ${isMagenta ? "from-[#ff003c]" : "from-[#00f3ff]"} to-transparent`}
                      />

                      {/* Corner Accents */}
                      <span
                        className={`absolute top-0 left-0 w-3 h-3 md:w-4 md:h-4 border-t-[1.5px] border-l-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 ${isMagenta ? "border-[#ff003c]" : "border-[#00f3ff]"}`}
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 md:w-4 md:h-4 border-b-[1.5px] border-r-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 ${isMagenta ? "border-[#ff003c]" : "border-[#00f3ff]"}`}
                      />

                      <div className="relative flex items-start justify-between mb-6 md:mb-8">
                        <div
                          className={`p-3 md:p-3.5 backdrop-blur-md border transition-colors duration-500 ${isMagenta ? "bg-[#ff003c]/5 text-[#ff003c] border-[#ff003c]/20 group-hover:bg-[#ff003c]/10" : "bg-[#00f3ff]/5 text-[#00f3ff] border-[#00f3ff]/20 group-hover:bg-[#00f3ff]/10"} [clip-path:polygon(6px_0,100%_0,100%_calc(100%-6px),calc(100%-6px)_100%,0_100%,0_6px)]`}
                        >
                          <Icon className="h-5 w-5 md:h-6 md:w-6" strokeWidth={1.5} />
                        </div>
                        <span className="text-[8px] md:text-[9px] font-mono tracking-widest text-slate-400 border border-white/5 bg-[#020610] px-2 md:px-2.5 py-1 md:py-1.5 uppercase shadow-sm [clip-path:polygon(4px_0,100%_0,100%_calc(100%-4px),calc(100%-4px)_100%,0_100%,0_4px)]">
                          {m.tag}
                        </span>
                      </div>

                      <h3 className="relative font-display text-xl md:text-2xl font-bold text-slate-100 mb-2 md:mb-3 group-hover:text-white transition-colors">
                        {m.title}
                      </h3>
                      <p className="relative text-xs md:text-sm text-slate-500 leading-relaxed flex-1 group-hover:text-slate-300 transition-colors duration-300">
                        {m.desc}
                      </p>

                      <div
                        className={`relative flex items-center gap-2 mt-6 md:mt-8 text-[9px] md:text-[10px] font-mono tracking-[0.2em] uppercase transition-all duration-300 font-bold ${isMagenta ? "text-[#ff003c]" : "text-[#00f3ff]"}`}
                      >
                        Engage Module{" "}
                        <ArrowRight className="h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* CTA FOOTER */}
        <section className="pb-16 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: customEase }}
          >
            <div className="p-6 sm:p-10 md:p-16 lg:p-20 text-center relative overflow-hidden bg-[#020610]/80 backdrop-blur-2xl border border-[#ff003c]/30 hover:border-[#ff003c]/50 transition-colors duration-700 shadow-[0_0_60px_rgba(255,0,60,0.08)] [clip-path:polygon(20px_0,100%_0,100%_calc(100%-20px),calc(100%-20px)_100%,0_100%,0_20px)] md:[clip-path:polygon(30px_0,100%_0,100%_calc(100%-30px),calc(100%-30px)_100%,0_100%,0_30px)]">
              {/* Cinematic Top Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-[#ff003c] to-transparent opacity-60 blur-md" />

              <div className="text-[10px] md:text-xs font-mono tracking-[0.3em] text-[#ff003c] uppercase mb-4 md:mb-6 flex justify-center items-center gap-2 md:gap-3">
                <Lock className="h-3.5 w-3.5 md:h-4 md:w-4" /> READY PLAYER ONE
              </div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white max-w-3xl mx-auto tracking-tight drop-shadow-sm">
                Sign in to save designs, track progress, and operate live.
              </h2>

              <div className="mt-8 md:mt-12 flex flex-col sm:flex-row justify-center gap-3 sm:gap-5">
                <Link to="/auth" className="w-full sm:w-auto">
                  <CyberButton variant="magenta" size="lg" className="w-full">
                    Initialize Account <ArrowRight className="h-4 w-4 ml-2" />
                  </CyberButton>
                </Link>
                <Link to="/assistant" className="w-full sm:w-auto">
                  <CyberButton
                    variant="ghost"
                    size="lg"
                    className="w-full bg-[#020610]/50 backdrop-blur-md"
                  >
                    Try AI Terminal First
                  </CyberButton>
                </Link>
              </div>

              {/* Lead Capture */}
              <div className="mt-16 max-w-md mx-auto p-1 rounded-xl bg-gradient-to-r from-[#00f3ff]/20 via-[#ff003c]/20 to-[#00f3ff]/20">
                <div className="bg-[#020610] p-6 rounded-lg text-left">
                  <h3 className="font-mono text-sm text-white mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#00f3ff]" /> Join the Red Team Network
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Get early access to new attack scenarios and AI exploits.
                  </p>
                  <form onSubmit={handleCaptureLead} className="flex gap-2">
                    <input
                      id="lead-email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ENTER_EMAIL_ADDR"
                      className="flex-1 bg-black/50 border border-white/10 rounded px-3 py-2 text-sm font-mono focus:border-[#00f3ff] outline-none transition-colors"
                      required
                    />
                    <CyberButton variant="cyan" type="submit" disabled={capturing}>
                      {capturing ? "..." : "JOIN"}
                    </CyberButton>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </div>

      {/* RAW CSS FOR THEME-SYNCED TEXT GLITCH ANIMATION */}
      <style>{`
        .glitch-text {
          position: relative;
          display: inline-block;
        }
        .glitch-text::before, .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent;
        }
        .glitch-text::before {
          left: 1.5px;
          text-shadow: -1px 0 #ff003c;
          clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
          animation: glitch-anim-1 2.5s infinite linear alternate-reverse;
        }
        .glitch-text::after {
          left: -1.5px;
          text-shadow: 1px 0 #00f3ff;
          clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
          animation: glitch-anim-2 3s infinite linear alternate-reverse;
        }
        
        .glitch-text-color {
          position: relative;
          display: inline-block;
        }
        .glitch-text-color::before, .glitch-text-color::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          -webkit-background-clip: text;
        }
        .glitch-text-color::before {
          left: 1.5px;
          background-image: linear-gradient(to right, #00f3ff, #3b82f6, #ff003c);
          text-shadow: -1px 0 rgba(255, 0, 60, 0.5);
          clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
          animation: glitch-anim-1 2.5s infinite linear alternate-reverse;
        }
        .glitch-text-color::after {
          left: -1.5px;
          background-image: linear-gradient(to right, #00f3ff, #3b82f6, #ff003c);
          text-shadow: 1px 0 rgba(0, 243, 255, 0.5);
          clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
          animation: glitch-anim-2 3s infinite linear alternate-reverse;
        }

        /* Smoothed, high-frequency glitch keyframes */
        @keyframes glitch-anim-1 {
          0% { clip-path: inset(20% 0 80% 0); transform: translate(-1px, 0.5px); }
          20% { clip-path: inset(60% 0 10% 0); transform: translate(1px, -0.5px); }
          40% { clip-path: inset(40% 0 50% 0); transform: translate(-1px, 1px); }
          60% { clip-path: inset(80% 0 5% 0); transform: translate(1px, -1px); }
          80% { clip-path: inset(10% 0 70% 0); transform: translate(-0.5px, 0.5px); }
          100% { clip-path: inset(30% 0 50% 0); transform: translate(0.5px, -0.5px); }
        }
        @keyframes glitch-anim-2 {
          0% { clip-path: inset(10% 0 60% 0); transform: translate(1px, -0.5px); }
          20% { clip-path: inset(30% 0 20% 0); transform: translate(-1px, 0.5px); }
          40% { clip-path: inset(70% 0 10% 0); transform: translate(1px, 1px); }
          60% { clip-path: inset(20% 0 50% 0); transform: translate(-1px, -1px); }
          80% { clip-path: inset(50% 0 30% 0); transform: translate(0.5px, 0.5px); }
          100% { clip-path: inset(5% 0 80% 0); transform: translate(-0.5px, -0.5px); }
        }
      `}</style>
    </div>
  );
}
