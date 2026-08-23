import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Target, Activity, FileText } from "lucide-react";

export function BottomNav() {
  const location = useLocation();

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { to: "/easm", icon: Target, label: "EASM" },
    { to: "/pentest", icon: Activity, label: "Labs" },
    { to: "/reports", icon: FileText, label: "Reports" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#020610]/90 backdrop-blur-lg border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? "text-[#00f3ff]" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "drop-shadow-[0_0_8px_rgba(0,243,255,0.6)]" : ""}`} />
              <span className="text-[9px] font-mono tracking-wider uppercase">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
