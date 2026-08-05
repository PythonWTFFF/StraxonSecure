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
  Cpu,
  Globe,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSubscription } from "@/hooks/useSubscription";
import { CommandPalette } from "./CommandPalette";

const NAV = [
  { to: "/", label: "Home", icon: Shield },
  { to: "/dashboard", label: "SOC", icon: Activity },
  { to: "/threat-intel", label: "CVE Feed", icon: ShieldAlert },
  { to: "/labs", label: "Labs", icon: Beaker },
  { to: "/ctf", label: "CTF", icon: Flag, isNew: true },
  { to: "/warroom", label: "War Room", icon: Swords, isNew: true },
  { to: "/ir", label: "IR Playbooks", icon: AlertCircle, isNew: true },
  { to: "/posture", label: "Posture", icon: BarChart3, isNew: true },
  { to: "/packet-analyzer", label: "Packets", icon: Wifi, isNew: true },
  { to: "/replay", label: "Replay", icon: Clapperboard },
  { to: "/learning", label: "Learn", icon: GraduationCap },
  { to: "/architecture", label: "Architect", icon: Network },
  { to: "/compliance", label: "Compliance", icon: ShieldCheck },
  { to: "/scanner", label: "Scanner", icon: ScanLine },
  { to: "/easm", label: "EASM / Recon", icon: Globe, isNew: true },
  { to: "/pentest", label: "PTaaS", icon: Crosshair, isNew: true },
  { to: "/edr", label: "EDR", icon: Cpu, isNew: true },
  { to: "/reports", label: "Reports", icon: FileText, isNew: true },
  { to: "/teams", label: "Teams", icon: Users },
  { to: "/assistant", label: "AI", icon: Bot },
  { to: "/developer", label: "API & Webhooks", icon: Network, isNew: true },
  { to: "/settings", label: "Settings", icon: ShieldCheck },
  { to: "/pricing", label: "Pricing", icon: CreditCard },
] as const;

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <div className="relative">
        <Zap className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
        <div className="absolute inset-0 blur-md bg-primary/40 group-hover:bg-primary/70 transition-colors rounded-full" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-display text-base font-bold tracking-widest neon-text">STRAXON</span>
        <span className="font-mono text-[10px] text-muted-foreground tracking-[0.3em]">
          SECURE v2
        </span>
      </div>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
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
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all relative group",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 bg-primary rounded-r glow-cyan" />
            )}
            <Icon className={cn("h-4 w-4", active && "text-primary")} />
            <span className="font-mono tracking-wide flex-1">{item.label}</span>
            {(item as any).isNew && (
              <span className="text-[8px] font-mono bg-success/20 text-success border border-success/30 rounded px-1 py-0.5 leading-none">
                NEW
              </span>
            )}
          </Link>
        );
      })}
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-h-screen flex flex-col">
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
                <div className="mb-6">
                  <Brand />
                </div>
                <NavLinks onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <Brand />
          </div>
          <div className="hidden md:block">
            <StatusPill />
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border/50 p-4 sticky top-14 self-start h-[calc(100vh-3.5rem)]">
          <NavLinks />
          <div className="mt-auto pt-4 text-[10px] font-mono text-muted-foreground/60 leading-relaxed">
            <div>
              NODE: <span className="text-primary">straxon-01</span>
            </div>
            <div>
              BUILD: <span className="text-accent">3.0.0</span>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 relative scanline">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
