import { Link, useLocation } from "@tanstack/react-router";
import { Activity, Beaker, ScanLine, ShieldAlert, Sparkles } from "lucide-react";

export function BottomNav() {
  const location = useLocation();

  const navItems = [
    { to: "/dashboard", icon: Activity, label: "SOC" },
    { to: "/labs", icon: Beaker, label: "Labs" },
    { to: "/scanner", icon: ScanLine, label: "Scanner" },
    { to: "/threat-intel", icon: ShieldAlert, label: "Intel" },
    { to: "/pricing", icon: Sparkles, label: "Pro", isPro: true },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#020610]/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
      <nav className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all relative ${
                isActive
                  ? item.isPro
                    ? "text-[#ff003c]"
                    : "text-[#00f3ff]"
                  : item.isPro
                    ? "text-accent/80 hover:text-accent"
                    : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isActive && (
                <span
                  className={`absolute top-0 w-8 h-0.5 rounded-full ${
                    item.isPro ? "bg-[#ff003c] shadow-[0_0_8px_#ff003c]" : "bg-[#00f3ff] shadow-[0_0_8px_#00f3ff]"
                  }`}
                />
              )}
              <div className="relative">
                <Icon
                  className={`h-5 w-5 ${
                    isActive
                      ? item.isPro
                        ? "drop-shadow-[0_0_8px_rgba(255,0,60,0.8)] scale-110"
                        : "drop-shadow-[0_0_8px_rgba(0,243,255,0.8)] scale-110"
                      : ""
                  } transition-transform`}
                />
                {item.isPro && !isActive && (
                  <span className="absolute -top-1 -right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-mono tracking-wider uppercase font-medium ${item.isPro ? "text-accent font-bold" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
