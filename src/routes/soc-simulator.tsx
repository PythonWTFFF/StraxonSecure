import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Activity, Eye, AlertTriangle } from "lucide-react";
import { CyberButton } from "@/components/cyber/CyberButton";
import { motion } from "framer-motion";

export const Route = createFileRoute("/soc-simulator")({
  head: () => ({
    meta: [
      { title: "Browser SOC Simulator — Straxon Secure" },
      {
        name: "description",
        content:
          "Train your security team with our browser-based SOC Simulator. Monitor live threat matrices, respond to AI-generated anomalies, and defend networks in real-time.",
      },
      {
        name: "keywords",
        content: "SOC Simulator, Security Operations Center Training, Cyber Defense Simulator",
      },
    ],
  }),
  component: SOCLandingPage,
});

function SOCLandingPage() {
  return (
    <div className="min-h-screen bg-[#020610] text-slate-300 font-sans selection:bg-[#00f3ff] selection:text-black">
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#00f3ff]/10 border border-[#00f3ff]/30 text-xs font-mono text-[#00f3ff]">
              <span className="flex h-2 w-2 bg-[#00f3ff] animate-pulse" />
              <span>DEFENSIVE OPERATIONS</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-black leading-tight text-white">
              Live Browser <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-emerald-400">
                SOC Simulator
              </span>
            </h1>

            <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
              Train your security team in a hyper-realistic, browser-based Security Operations
              Center. Monitor global threat matrices, respond to AI-generated anomalies, and analyze
              SIEM telemetry without provisioning expensive hardware.
            </p>

            <div className="flex gap-4">
              <Link to="/pricing">
                <CyberButton variant="cyan" size="lg">
                  Start Free Trial
                </CyberButton>
              </Link>
              <Link to="/dashboard">
                <CyberButton variant="ghost" size="lg">
                  Enter the SOC
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
            <div className="absolute -inset-10 bg-[#00f3ff] rounded-full blur-[120px] opacity-10 animate-pulse" />
            <div className="relative bg-[#020610]/80 backdrop-blur-xl border border-slate-800 p-8 [clip-path:polygon(20px_0,100%_0,100%_calc(100%-20px),calc(100%-20px)_100%,0_100%,0_20px)] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div className="flex items-center gap-2 text-white">
                  <Shield className="h-5 w-5 text-[#00f3ff]" />
                  <span className="font-mono text-sm tracking-wider">SIEM TELEMETRY</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="h-2 w-2 bg-slate-700" />
                  <div className="h-2 w-2 bg-[#ff003c] animate-pulse" />
                  <div className="h-2 w-2 bg-slate-700" />
                </div>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-3">
                    <Eye className="h-4 w-4" /> <span>Login.Success</span>
                  </div>
                  <span className="text-emerald-400">10.0.0.45</span>
                </div>
                <div className="flex items-center justify-between text-[#ff003c] border-b border-white/5 pb-2">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4" /> <span>Auth.Bruteforce</span>
                  </div>
                  <span>192.168.1.100</span>
                </div>
                <div className="flex items-center justify-between text-yellow-400 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4" /> <span>SQLi.Attempt</span>
                  </div>
                  <span>172.16.0.50</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <div className="flex items-center gap-3">
                    <Eye className="h-4 w-4" /> <span>VPN.Connect</span>
                  </div>
                  <span className="text-emerald-400">10.0.0.21</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
