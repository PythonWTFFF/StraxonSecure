import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Terminal, ShieldAlert, Home, CornerDownRight } from "lucide-react";
import { useEffect, useState } from "react";

export function Cyber404() {
  const [text, setText] = useState("");
  const fullText = "> ERROR: SECTOR_NOT_FOUND\n> TRACING CONNECTION...\n> CONNECTION SEVERED.\n> REROUTING TO SAFE ZONE...";

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#020617] flex items-center justify-center overflow-hidden selection:bg-primary/30">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/80 to-[#020617] pointer-events-none" />
      
      {/* Animated Scanline */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: ["-100%", "200%"] }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="w-full h-32 bg-gradient-to-b from-transparent via-primary/5 to-transparent"
        />
      </div>

      {/* Floating Holographic Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none flex items-center justify-center opacity-30">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
          className="absolute inset-0 border border-primary/20 rounded-full border-dashed"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          className="absolute inset-16 border border-accent/20 rounded-full border-dotted"
        />
      </div>

      <div className="relative z-10 max-w-2xl w-full px-6 flex flex-col items-center">
        {/* Project Branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-mono tracking-[0.2em] uppercase mb-8 flex items-center gap-2 backdrop-blur-md shadow-[0_0_15px_rgba(0,243,255,0.15)]"
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          Straxon Labs Project
        </motion.div>

        {/* Glitch 404 */}
        <div className="relative mb-8">
          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="text-[12rem] leading-none font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 select-none relative z-10"
          >
            404
          </motion.h1>
          
          {/* Glitch layers */}
          <h1 className="absolute inset-0 text-[12rem] leading-none font-display font-black text-primary opacity-50 blur-[2px] animate-pulse select-none -translate-x-1 translate-y-1 z-0">
            404
          </h1>
          <h1 className="absolute inset-0 text-[12rem] leading-none font-display font-black text-accent opacity-50 blur-[2px] animate-pulse select-none translate-x-1 -translate-y-1 z-0" style={{ animationDelay: "0.2s" }}>
            404
          </h1>
        </div>

        {/* Terminal Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full bg-black/60 border border-primary/20 rounded-lg p-6 backdrop-blur-xl shadow-2xl mb-8 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex items-center gap-2 mb-4 text-primary/70 border-b border-primary/10 pb-4">
            <Terminal className="h-4 w-4" />
            <span className="font-mono text-xs tracking-widest uppercase">System Diagnostics</span>
          </div>
          
          <div className="font-mono text-sm text-primary/90 whitespace-pre-line min-h-[100px] flex flex-col justify-end leading-relaxed">
            {text}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="inline-block w-2 h-4 bg-primary align-middle ml-1"
            />
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="flex flex-wrap items-center justify-center gap-4 w-full"
        >
          <Link
            to="/"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-mono text-sm font-bold uppercase tracking-widest rounded hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:shadow-[0_0_30px_rgba(0,243,255,0.5)] group"
          >
            <Home className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
            Return to Base
          </Link>
          
          <Link
            to="/dashboard"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-transparent border border-primary/30 text-primary font-mono text-sm font-bold uppercase tracking-widest rounded hover:bg-primary/10 transition-all group"
          >
            <CornerDownRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            SOC Dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
