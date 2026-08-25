import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Beaker, ShieldAlert, FileText, Menu, X, Home } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/dashboard", icon: LayoutDashboard, label: "SOC" },
  { to: "/labs", icon: Beaker, label: "Labs" },
  { to: "/threat-intel", icon: ShieldAlert, label: "Threats" },
  { to: "/reports", icon: FileText, label: "Reports" },
];

const ALL_NAV = [
  { to: "/", label: "🏠 Home" },
  { to: "/dashboard", label: "📡 SOC Dashboard" },
  { to: "/threat-intel", label: "⚠️ CVE Threat Feed" },
  { to: "/labs", label: "🧪 Attack Labs" },
  { to: "/ctf", label: "🚩 CTF Challenges" },
  { to: "/pentest", label: "🎯 PTaaS" },
  { to: "/easm", label: "🌐 EASM / Recon" },
  { to: "/phishing", label: "📨 Phishing Sim" },
  { to: "/edr", label: "🖥️ Endpoint (EDR)" },
  { to: "/packet-analyzer", label: "📶 Packet Analyzer" },
  { to: "/warroom", label: "⚔️ War Room" },
  { to: "/ir", label: "🚨 IR Playbooks" },
  { to: "/replay", label: "🎬 Attack Replay" },
  { to: "/architecture", label: "🗺️ Arch Designer" },
  { to: "/compliance", label: "✅ Compliance" },
  { to: "/scanner", label: "🔍 DevSecOps Scanner" },
  { to: "/posture", label: "☁️ Cloud Posture" },
  { to: "/supply-chain", label: "📦 Supply Chain" },
  { to: "/learning", label: "🎓 Learning Hub" },
  { to: "/reports", label: "📄 Reports" },
  { to: "/teams", label: "👥 Teams" },
  { to: "/assistant", label: "🤖 AI Assistant" },
  { to: "/settings", label: "⚙️ Settings" },
  { to: "/pricing", label: "💳 Billing & Plans" },
];

export function BottomNav() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#020610]/95 backdrop-blur-xl border-t border-white/10" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <nav className="flex justify-around items-center h-16 px-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
                  isActive ? "text-[#00f3ff]" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Icon
                  className={`h-[22px] w-[22px] transition-all ${
                    isActive ? "drop-shadow-[0_0_10px_rgba(0,243,255,0.7)] scale-110" : ""
                  }`}
                />
                <span className={`text-[9px] font-mono tracking-wider uppercase transition-all ${isActive ? "text-[#00f3ff]" : ""}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 h-0.5 w-8 bg-[#00f3ff] rounded-t-full shadow-[0_0_8px_#00f3ff]" />
                )}
              </Link>
            );
          })}
          {/* More menu */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Menu className="h-[22px] w-[22px]" />
            <span className="text-[9px] font-mono tracking-wider uppercase">More</span>
          </button>
        </nav>
      </div>

      {/* Full App Menu Sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="bottom" className="bg-[#020610]/98 backdrop-blur-2xl border-t border-white/10 rounded-t-2xl max-h-[75dvh] overflow-y-auto">
          <SheetTitle className="text-center font-mono text-sm text-[#00f3ff] tracking-widest uppercase pb-2 border-b border-white/10">
            STRAXON NAVIGATION
          </SheetTitle>
          <SheetDescription className="sr-only">Full navigation menu for all application sections.</SheetDescription>
          <div className="grid grid-cols-2 gap-2 pt-4 pb-[env(safe-area-inset-bottom)]">
            {ALL_NAV.map((item) => {
              const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-mono transition-all ${
                    isActive
                      ? "bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/30"
                      : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
