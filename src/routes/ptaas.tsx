import { createFileRoute, Link } from "@tanstack/react-router";
import { Crosshair, ShieldCheck, Zap, Server, Activity } from "lucide-react";
import { CyberButton } from "@/components/cyber/CyberButton";
import { motion } from "framer-motion";

export const Route = createFileRoute("/ptaas")({
  head: () => ({
    meta: [
      { title: "Automated PTaaS Platform — Straxon Secure" },
      {
        name: "description",
        content:
          "Next-generation Penetration Testing as a Service (PTaaS). Automated AI exploit paths, real-time vulnerability scanning, and compliance reporting.",
      },
      {
        name: "keywords",
        content: "PTaaS, Automated Penetration Testing, AI Pentest, Cyber Security Scanning",
      },
    ],
  }),
  component: PTaaSLandingPage,
});

function PTaaSLandingPage() {
  return (
    <div className="min-h-screen bg-[#020610] text-slate-300 font-sans selection:bg-[#ff003c] selection:text-white">
      {/* Background Texture */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.02] mix-blend-overlay bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:100%_4px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#ff003c]/10 border border-[#ff003c]/30 text-xs font-mono text-[#ff003c]">
              <span className="flex h-2 w-2 bg-[#ff003c] animate-pulse" />
              <span>ENTERPRISE PTaaS</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-black leading-tight text-white">
              Automated <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff003c] to-orange-500">
                AI Pentesting
              </span>
            </h1>

            <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
              Replace slow, manual security audits with continuous, AI-driven Penetration Testing as
              a Service. Straxon's ML engine autonomously discovers exploit paths and generates
              compliance-ready PDF reports in minutes, not weeks.
            </p>

            <div className="flex gap-4">
              <Link to="/pricing">
                <CyberButton variant="magenta" size="lg">
                  Start Free Trial
                </CyberButton>
              </Link>
              <Link to="/pentest">
                <CyberButton variant="ghost" size="lg">
                  View Demo Scan
                </CyberButton>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="relative"
          >
            <div className="absolute -inset-10 bg-[#ff003c] rounded-full blur-[120px] opacity-20 animate-pulse" />
            <div className="relative bg-[#020610]/80 backdrop-blur-xl border border-slate-800 p-8 [clip-path:polygon(20px_0,100%_0,100%_calc(100%-20px),calc(100%-20px)_100%,0_100%,0_20px)] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div className="flex items-center gap-2 text-white">
                  <Crosshair className="h-5 w-5 text-[#ff003c]" />
                  <span className="font-mono text-sm tracking-wider">LIVE PTaaS ENGINE</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="h-2 w-2 bg-slate-700" />
                  <div className="h-2 w-2 bg-slate-700" />
                  <div className="h-2 w-2 bg-[#00ff88]" />
                </div>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center gap-4 text-slate-400">
                  <Activity className="h-4 w-4" />{" "}
                  <span>[*] Initializing Nmap SYN stealth scan...</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                  <Server className="h-4 w-4" /> <span>[*] Enumerating 443/TCP TLS ciphers...</span>
                </div>
                <div className="flex items-center gap-4 text-[#ff003c]">
                  <Zap className="h-4 w-4" />{" "}
                  <span>[!] AI Exploit Path Generated: CVE-2023-38408</span>
                </div>
                <div className="flex items-center gap-4 text-[#00ff88]">
                  <ShieldCheck className="h-4 w-4" />{" "}
                  <span>[+] Compiling PDF Security Audit Report...</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
