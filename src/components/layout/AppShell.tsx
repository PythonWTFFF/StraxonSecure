import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Shield,
  Activity,
  Beaker,
  GraduationCap,
  Network,
  ScanLine,
  Bot,
  Menu,
  X,
  Zap,
  Clapperboard,
  ShieldAlert,
  ShieldCheck,
  Users,
  CreditCard,
  Flag,
  Swords,
  AlertCircle,
  BarChart3,
  Wifi,
  Crosshair,
  Server,
  Globe,
  FileText,
  Mail,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useSubscription } from "@/hooks/useSubscription";
import { CommandPalette } from "./CommandPalette";

const NAV_GROUPS = [
  {
    category: "Core Operations",
    items: [
      { to: "/", label: "Home", icon: Shield },
      { to: "/dashboard", label: "SOC Dashboard", icon: Activity },
      { to: "/threat-intel", label: "CVE Feed", icon: ShieldAlert },
      { to: "/reports", label: "Reports", icon: FileText, isNew: true },
    ],
  },
  {
    category: "Offensive Ops",
    items: [
      { to: "/labs", label: "Attack Labs", icon: Beaker },
      { to: "/ctf", label: "CTF Challenges", icon: Flag },
      { to: "/pentest", label: "PTaaS", icon: Crosshair },
      { to: "/easm", label: "EASM / Recon", icon: Globe },
      { to: "/phishing", label: "Phishing Sim", icon: Mail, isNew: true },
    ],
  },
  {
    category: "Defensive Ops",
    items: [
      { to: "/edr", label: "Endpoint (EDR)", icon: Server },
      { to: "/packet-analyzer", label: "Packet Analyzer", icon: Wifi },
      { to: "/warroom", label: "War Room", icon: Swords },
      { to: "/ir", label: "IR Playbooks", icon: AlertCircle },
      { to: "/replay", label: "Attack Replay", icon: Clapperboard },
    ],
  },
  {
    category: "Architecture & Rules",
    items: [
      { to: "/architecture", label: "Designer", icon: Network },
      { to: "/posture", label: "Cloud Posture", icon: BarChart3 },
      { to: "/compliance", label: "Compliance", icon: ShieldCheck },
      { to: "/scanner", label: "Scanner", icon: ScanLine },
      { to: "/supply-chain", label: "Supply Chain", icon: Package, isNew: true },
      { to: "/learning", label: "Learning Hub", icon: GraduationCap },
    ],
  },
  {
    category: "System",
    items: [
      { to: "/teams", label: "Teams", icon: Users, isNew: true },
      { to: "/assistant", label: "AI Assistant", icon: Bot, isNew: true },
      { to: "/developer", label: "API & Webhooks", icon: Network, isNew: true },
      { to: "/settings", label: "Settings", icon: ShieldCheck },
      { to: "/pricing", label: "Billing & Plans", icon: CreditCard },
    ],
  },
];

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <div className="relative flex items-center justify-center">
        <img
          src="/straxonlogo.jpeg"
          alt="Straxon Secure Logo"
          className="h-8 w-8 object-contain group-hover:scale-110 transition-transform relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
        />
        <div className="absolute inset-0 blur-md bg-white/20 group-hover:bg-white/40 transition-colors rounded-full" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-display text-base font-bold tracking-widest neon-text">STRAXON</span>
        <span className="font-mono text-xs text-muted-foreground tracking-[0.3em] group-hover:text-primary transition-colors">
          SECURE v2
        </span>
      </div>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <nav className="flex flex-col gap-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.category} className="flex flex-col gap-1">
          <h4 className="px-4 text-xs font-mono tracking-widest text-muted-foreground/70 uppercase mb-1">
            {group.category}
          </h4>
          {group.items.map((item) => {
            const Icon = item.icon;
            const active =
              location.pathname === item.to ||
              (item.to !== "/" && location.pathname.startsWith(item.to as string));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-all relative group",
                  active
                    ? "bg-primary/10 text-primary shadow-[inset_0_0_12px_rgba(0,243,255,0.05)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-primary rounded-r glow-cyan" />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active
                      ? "text-primary drop-shadow-[0_0_8px_rgba(0,243,255,0.6)]"
                      : "opacity-70 group-hover:opacity-100 transition-opacity",
                  )}
                />
                <span className="font-mono tracking-wide flex-1 truncate">{item.label}</span>
                {item.isNew && (
                  <span className="text-[10px] font-mono bg-success/10 text-success border border-success/20 rounded px-1.5 py-0.5 leading-none shrink-0 shadow-[0_0_8px_rgba(0,255,100,0.1)]">
                    NEW
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function StatusPill() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-mono">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
      </span>
      <span className="text-muted-foreground">SYS</span>
      <span className="text-success">ONLINE</span>
    </div>
  );
}

function TrialBanner() {
  const { sub, trialActive, paidActive, hasAccess, trialDaysLeft } = useSubscription();
  if (!sub || paidActive) return null;
  if (trialActive) {
    return (
      <Link
        to="/pricing"
        className="block bg-accent/10 border-b border-accent/30 text-accent text-center py-1.5 text-xs font-mono hover:bg-accent/20"
      >
        ⏱ TRIAL — {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left · Upgrade to Pro →
      </Link>
    );
  }
  if (!hasAccess) {
    return (
      <Link
        to="/pricing"
        className="block bg-destructive/10 border-b border-destructive/30 text-destructive text-center py-1.5 text-xs font-mono hover:bg-destructive/20"
      >
        🔒 TRIAL EXPIRED — Upgrade to unlock Pro features →
      </Link>
    );
  }
  return null;
}

function MobileBottomNav() {
  const location = useLocation();
  const tabs = [
    { to: "/", icon: Shield, label: "Home" },
    { to: "/dashboard", icon: Activity, label: "SOC" },
    { to: "/labs", icon: Beaker, label: "Labs" },
    { to: "/settings", icon: ShieldCheck, label: "Settings" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#020610]/95 backdrop-blur-xl border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const active = location.pathname === tab.to || (tab.to !== "/" && location.pathname.startsWith(tab.to));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative min-w-[64px] min-h-[44px]", // Target sizes for touch accessibility
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-primary rounded-b glow-cyan" />
              )}
              <Icon className={cn("w-5 h-5", active && "drop-shadow-[0_0_8px_rgba(0,243,255,0.6)]")} />
              <span className="text-[10px] font-mono tracking-wider">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-h-[100dvh] flex flex-col noise-bg">
      {/* Animated grid background */}
      <div className="fixed inset-0 grid-bg pointer-events-none -z-10" />
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-scan-line" />
      </div>
      {/* Trial banner */}
      <TrialBanner />

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/50 backdrop-blur-xl bg-background/70">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden p-2 -ml-2 text-foreground" aria-label="Open menu">
                  {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="bg-card/95 backdrop-blur-xl border-border w-64 p-4"
              >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Use this menu to navigate through the application.
                </SheetDescription>
                <div className="mb-6">
                  <Brand />
                </div>
                <NavLinks onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <Brand />
          </div>
          <div className="hidden md:flex items-center gap-4">
            <a
              href="https://straxonlabs.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors border border-border/50 px-3 py-1.5 rounded-full hover:border-primary/50"
            >
              Main Website ↗
            </a>
            <StatusPill />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop sidebar - Advanced Floating Glass Dock */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 m-4 rounded-2xl border border-border/50 bg-[#020610]/60 backdrop-blur-3xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-20 overflow-hidden glass">
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40 p-4">
            <NavLinks />
          </div>

          <div className="shrink-0 p-4 pt-4 text-[10px] font-mono text-muted-foreground/60 leading-relaxed border-t border-border/30 bg-black/20">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                </span>
                <span className="tracking-wider">
                  NODE: <span className="text-primary font-bold">straxon-01</span>
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center opacity-70">
              <span>UPTIME: 99.9%</span>
              <span>LATENCY: 12ms</span>
            </div>
            <div className="flex justify-between items-center mt-0.5 opacity-70">
              <span>
                BUILD: <span className="text-accent">3.0.0-rc</span>
              </span>
              <span>
                UPLINK: <span className="text-success">SECURE</span>
              </span>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 relative scanline main-content overflow-y-auto">
          <div className="max-w-[2560px] mx-auto w-full h-full">
            {children}
          </div>
        </main>
      </div>
      <MobileBottomNav />
      <CommandPalette />
    </div>
  );
}
