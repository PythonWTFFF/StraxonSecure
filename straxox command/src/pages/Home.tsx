"use client";

import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText, Users, BarChart3, Terminal,
  Shield, Activity, ArrowRight, Cpu,
  Lock, Layers, ChevronRight, Globe,
  TrendingUp, Database, Bell, GitBranch,
  Wifi, Zap, KanbanSquare, DollarSign
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/lib/api";

import straxonLogo  from "@/assets/straxonlogo.png";
import secureIcon   from "@/assets/secure.svg";
import devIcon      from "@/assets/dev.svg";
import creativeIcon from "@/assets/creative.svg";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
// Single accent colour system. Restraint = luxury.
const T = {
  bg:          "#05080f",
  surface:     "#080d18",
  surfaceHi:   "#0c1220",
  border:      "rgba(255,255,255,0.055)",
  borderMid:   "rgba(255,255,255,0.09)",
  accent:      "#06b6d4",
  accentDim:   "rgba(6,182,212,0.14)",
  textPrimary: "#e2e8f0",
  textSecond:  "#64748b",
  textMuted:   "#293a4d",
  success:     "#10b981",
};

// ─── FEATURES CONFIG ────────────────────────────────────────────────────────
const FEATURES_CONFIG = [
  {
    icon: FileText,  label: "Invoice Generator",
    desc: "Create and export branded PDF invoices in seconds.",
    route: "/invoices",  tag: "PDF ENGINE",
    statKey: "invoiceCount", statLabel: "generated",
    rgb: "6,182,212",  hex: "#06b6d4",
  },
  {
    icon: Users,     label: "Client Vault",
    desc: "Centralised CRM for clients, contacts and projects.",
    route: "/clients",    tag: "CRM",
    statKey: "clientCount",  statLabel: "active clients",
    rgb: "167,139,250", hex: "#a78bfa",
  },
  {
    icon: KanbanSquare, label: "Deals Pipeline",
    desc: "Live MRR, revenue breakdowns and performance metrics.",
    route: "/deals",  tag: "SALES",
    statKey: "dealCount", statLabel: "active deals",
    rgb: "52,211,153",  hex: "#34d399",
  },
  {
    icon: Terminal,  label: "Audit Ledger",
    desc: "Immutable event trail — every action, timestamped.",
    route: "/audit-log",  tag: "FORENSICS",
    statKey: "auditCount", statLabel: "events logged",
    rgb: "251,191,36",  hex: "#fbbf24",
  },
  {
    icon: Shield,    label: "Proposals",
    desc: "Generate, send and track polished project proposals.",
    route: "/proposals",  tag: "DOCS",
    statKey: "proposalCount",   statLabel: "pending review",
    rgb: "251,113,133", hex: "#fb7185",
  },
  {
    icon: Zap,  label: "Automations",
    desc: "Configure visual workflows and system alerts.",
    route: "/automations",  tag: "WORKFLOWS",
    statKey: "automationCount",   statLabel: "active workflows",
    rgb: "56,189,248",  hex: "#38bdf8",
  },
];

// ─── ANIMATED COUNTER ─────────────────────────────────────────────────────────

function Counter({ value, duration = 1100 }: { value: string; duration?: number }) {
  const [display, setDisplay] = useState("—");
  const num    = parseFloat(value.replace(/[^0-9.]/g, ""));
  const prefix = value.match(/^[^0-9]*/)?.[0]  ?? "";
  const suffix = value.match(/[^0-9.]+$/)?.[0] ?? "";

  useEffect(() => {
    if (isNaN(num)) { setDisplay(value); return; }
    let cur = 0;
    const step = num / (duration / 16);
    const id   = setInterval(() => {
      cur += step;
      if (cur >= num) { setDisplay(value); clearInterval(id); return; }
      setDisplay(`${prefix}${cur.toFixed(value.includes(".") ? 1 : 0)}${suffix}`);
    }, 16);
    return () => clearInterval(id);
  }, [value]); // eslint-disable-line

  return <>{display}</>;
}

// ─── BACKGROUND ───────────────────────────────────────────────────────────────

function Background() {
  return (
    <>
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />
      {/* Top bloom */}
      <div
        className="absolute top-0 inset-x-0 h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% -5%, rgba(6,182,212,0.065) 0%, transparent 70%)",
        }}
      />
      {/* Bottom whisper */}
      <div
        className="absolute bottom-0 inset-x-0 h-[300px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 110%, rgba(167,139,250,0.03) 0%, transparent 70%)",
        }}
      />
      {/* Film grain */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.016]">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </>
  );
}

// ─── FEATURE CARD ─────────────────────────────────────────────────────────────

function FeatureCard({ feat, index }: { feat: any; index: number }) {
  const navigate  = useNavigate();
  const [hov, setHov] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const mx  = useMotionValue(0);
  const my  = useMotionValue(0);
  const rx  = useTransform(my, [-0.5, 0.5], [2.5, -2.5]);
  const ry  = useTransform(mx, [-0.5, 0.5], [-2.5, 2.5]);

  const onMove  = useCallback((e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width  - 0.5);
    my.set((e.clientY - r.top)  / r.height - 0.5);
  }, [mx, my]);
  const onLeave = useCallback(() => { mx.set(0); my.set(0); }, [mx, my]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.06, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      ref={ref}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d", perspective: 1000 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <motion.button
        whileTap={{ scale: 0.982 }}
        onHoverStart={() => setHov(true)}
        onHoverEnd={() => setHov(false)}
        onClick={() => navigate(feat.route)}
        className="relative w-full text-left p-5 rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: hov
            ? `linear-gradient(145deg, rgba(${feat.rgb},0.045) 0%, ${T.surfaceHi} 100%)`
            : T.surface,
          border: `1px solid ${hov ? `rgba(${feat.rgb},0.22)` : T.border}`,
          boxShadow: hov
            ? `0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(${feat.rgb},0.08), inset 0 1px 0 rgba(${feat.rgb},0.07)`
            : `0 2px 20px rgba(0,0,0,0.35)`,
        }}
      >
        {/* Radial spotlight */}
        <AnimatePresence>
          {hov && (
            <motion.div
              key="spot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{
                background: `radial-gradient(circle at 25% 15%, rgba(${feat.rgb},0.07) 0%, transparent 55%)`,
              }}
            />
          )}
        </AnimatePresence>

        {/* Row 1: icon + tag */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
            style={{
              background: hov ? `rgba(${feat.rgb},0.13)` : "rgba(255,255,255,0.04)",
              border: `1px solid ${hov ? `rgba(${feat.rgb},0.28)` : T.border}`,
            }}
          >
            <feat.icon
              style={{ width: 16, height: 16, color: hov ? feat.hex : "#3d5068" }}
              className="transition-colors duration-300"
            />
          </div>
          <span
            className="text-[7.5px] font-mono font-bold tracking-[0.17em] px-2 py-1 rounded-md transition-all duration-300"
            style={{
              color:      hov ? feat.hex : T.textMuted,
              background: hov ? `rgba(${feat.rgb},0.09)` : "rgba(255,255,255,0.025)",
              border:     `1px solid ${hov ? `rgba(${feat.rgb},0.22)` : "rgba(255,255,255,0.04)"}`,
            }}
          >
            {feat.tag}
          </span>
        </div>

        {/* Label */}
        <p
          className="text-[13px] font-semibold tracking-[-0.01em] mb-1.5 transition-colors duration-300"
          style={{ color: hov ? T.textPrimary : "#7a8fa8" }}
        >
          {feat.label}
        </p>

        {/* Description */}
        <p className="text-[11px] leading-[1.6] mb-5" style={{ color: T.textSecond }}>
          {feat.desc}
        </p>

        {/* Stat + progress + arrow */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1.5 mb-1.5">
              <span
                className="text-[22px] font-black font-mono leading-none tracking-tight transition-colors duration-300"
                style={{ color: hov ? feat.hex : "#3d5068" }}
              >
                {feat.stat}
              </span>
              <span className="text-[9px] font-mono" style={{ color: T.textMuted }}>
                {feat.statLabel}
              </span>
            </div>
            {/* Progress bar */}
            <div
              className="h-[2px] w-16 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: feat.hex }}
                initial={{ width: "0%" }}
                animate={{ width: hov ? "72%" : "25%" }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              />
            </div>
          </div>

          <motion.span
            animate={{ opacity: hov ? 1 : 0, x: hov ? 0 : -8 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1 text-[9px] font-mono font-bold"
            style={{ color: feat.hex }}
          >
            Open <ChevronRight style={{ width: 11, height: 11 }} />
          </motion.span>
        </div>
      </motion.button>
    </motion.div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate();
  const [time, setTime]       = useState(new Date());
  const [session]             = useState(() => Math.random().toString(36).slice(2, 11).toUpperCase());
  const [mounted, setMounted] = useState(false);

  // Fetch real data from the backend
  const { data: stats } = useQuery({
    queryKey: ["dashboard-home"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
    refetchInterval: 60000,
  });

  const fmtCurrency = (n: number) => {
    if (!n) return "$0";
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
    return `$${n}`;
  };

  const totalRevenue = stats?.totalRevenue || 0;
  const pipelineValue = stats?.totalPipelineValue || 0;
  const clientCount = stats?.clientCount || 0;
  
  const NAV_STATS = [
    { label: "Uptime",  value: "99.98%", icon: Wifi,       accent: true  },
    { label: "Clients", value: clientCount.toString(), icon: Users, accent: false },
    { label: "Revenue", value: fmtCurrency(totalRevenue), icon: TrendingUp, accent: false },
    { label: "DB",      value: "1.2 GB", icon: Database,   accent: false },
  ];

  const METRICS = [
    { label: "Invoices",  value: (stats?.recentInvoices?.length || 0).toString(), note: "Active recent", icon: FileText },
    { label: "Pipeline",  value: fmtCurrency(pipelineValue), note: "Total potential", icon: TrendingUp },
    { label: "Projects",  value: (stats?.activeProjects || 0).toString(), note: "In progress", icon: GitBranch },
    { label: "Overdue",   value: (stats?.overdueInvoicesCount || 0).toString(), note: "Requires action", icon: Bell },
  ];

  const FEATURES = FEATURES_CONFIG.map(f => {
    let statValue = "0";
    if (f.statKey === "invoiceCount") statValue = (stats?.recentInvoices?.length || 0).toString();
    if (f.statKey === "clientCount") statValue = clientCount.toString();
    if (f.statKey === "dealCount") statValue = (stats?.dealCount || 0).toString();
    if (f.statKey === "auditCount") statValue = "1.2k"; // Static placeholder if not in stats
    if (f.statKey === "proposalCount") statValue = "3"; // Static placeholder
    if (f.statKey === "automationCount") statValue = "5"; // Static placeholder
    
    return { ...f, stat: statValue };
  });

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const clockStr = time.toLocaleTimeString("en-US", { hour12: false });

  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <div
      className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center overflow-x-hidden"
      style={{ background: T.bg }}
    >
      <Background />

      {/* ── Status Bar ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : -10 }}
        transition={{ duration: 0.45 }}
        className="w-full flex items-center justify-between px-6 py-2.5 z-30 relative"
        style={{
          background:   "rgba(5,8,15,0.88)",
          borderBottom: `1px solid ${T.border}`,
          backdropFilter: "blur(24px)",
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-5">
          {/* Pulse */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
                style={{ background: T.success }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ background: T.success }}
              />
            </span>
            <span
              className="text-[8px] font-mono font-bold tracking-[0.32em] uppercase"
              style={{ color: T.success }}
            >
              Online
            </span>
          </div>
          <div className="w-px h-3.5" style={{ background: T.border }} />
          {NAV_STATS.map((s, i) => (
            <div key={s.label} className="hidden sm:flex items-center gap-1.5">
              <s.icon style={{ width: 10, height: 10, color: s.accent ? T.accent : T.textMuted }} />
              <span className="text-[8px] font-mono" style={{ color: T.textMuted }}>{s.label}</span>
              <span
                className="text-[8px] font-mono font-semibold"
                style={{ color: s.accent ? T.accent : "#5a7080" }}
              >
                <Counter value={s.value} duration={950 + i * 130} />
              </span>
            </div>
          ))}
        </div>
        {/* Right */}
        <div className="flex items-center gap-4">
          <span className="hidden md:block text-[8px] font-mono tabular-nums" style={{ color: T.textMuted }}>
            {clockStr}
          </span>
          <span className="text-[8px] font-mono tracking-wider" style={{ color: T.textMuted }}>
            SID·{session}
          </span>
          <div
            className="px-2 py-0.5 rounded text-[7px] font-mono font-bold tracking-[0.15em]"
            style={{
              background: "rgba(16,185,129,0.07)",
              border: "1px solid rgba(16,185,129,0.18)",
              color: T.success,
            }}
          >
            SECURE
          </div>
        </div>
      </motion.div>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 pt-16 pb-10 flex flex-col items-center text-center">

        {/* — Brand Assembly — */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.7, ease }}
          className="relative flex items-center justify-center mb-8"
        >
          {/* Soft bloom behind the logo */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: 320, height: 320,
              background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 65%)",
              filter: "blur(28px)",
            }}
          />

          {/* Satellite — Secure */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="hidden lg:flex flex-col items-center gap-2 mr-12 cursor-default select-none"
            style={{ opacity: 0.38 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.72")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0.38")}
          >
            <div
              className="p-3 rounded-2xl"
              style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
              <img src={secureIcon} alt="Secure" className="w-7 h-7" />
            </div>
            <span className="text-[7px] font-mono tracking-[0.32em] uppercase" style={{ color: T.textMuted }}>
              Sec_Proto
            </span>
          </motion.div>

          {/* — Main Logo Box — */}
          <motion.div
            className="relative group"
            whileHover={{ scale: 1.025 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
          >
            {/* Breathing glow ring */}
            <motion.div
              animate={{ opacity: [0.35, 0.65, 0.35], scale: [1, 1.04, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-[-16px] rounded-[44px] pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(6,182,212,0.09) 0%, transparent 68%)",
              }}
            />

            <div
              className="relative w-[136px] h-[136px] md:w-[164px] md:h-[164px] rounded-[30px] flex items-center justify-center overflow-hidden"
              style={{
                background:  "linear-gradient(155deg, #0d1827 0%, #060c17 100%)",
                border:      "1px solid rgba(6,182,212,0.16)",
                boxShadow: `
                  0 0 0 1px rgba(6,182,212,0.05),
                  0 40px 100px rgba(0,0,0,0.75),
                  inset 0 1px 0 rgba(6,182,212,0.1),
                  inset 0 -2px 0 rgba(0,0,0,0.5)
                `,
              }}
            >
              {/* Top-glass sheen */}
              <div
                className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(255,255,255,0.04), transparent)",
                }}
              />

              <img
                src={straxonLogo}
                alt="Straxon Labs"
                className="relative z-10 w-[70%] h-auto object-contain transition-all duration-500"
                style={{
                  filter: "drop-shadow(0 0 22px rgba(6,182,212,0.32))",
                }}
              />

              {/* Scan line sweep */}
              <motion.div
                animate={{ y: ["-130%", "230%"] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "linear", repeatDelay: 2.8 }}
                className="absolute inset-x-0 pointer-events-none"
                style={{
                  height: 3,
                  background:
                    "linear-gradient(to right, transparent, rgba(6,182,212,0.45), transparent)",
                }}
              />

              {/* Corner ticks */}
              {[
                "top-2.5 left-2.5 border-t border-l",
                "top-2.5 right-2.5 border-t border-r",
                "bottom-2.5 left-2.5 border-b border-l",
                "bottom-2.5 right-2.5 border-b border-r",
              ].map((cls, i) => (
                <div
                  key={i}
                  className={`absolute w-3 h-3 ${cls} pointer-events-none`}
                  style={{ borderColor: "rgba(6,182,212,0.22)" }}
                />
              ))}
            </div>

            {/* Status beacon */}
            <div
              className="absolute -bottom-3 -right-3 w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: T.bg,
                border: "1px solid rgba(16,185,129,0.25)",
                boxShadow: "0 0 20px rgba(0,0,0,0.6)",
              }}
            >
              <div
                className="w-3.5 h-3.5 rounded-full animate-pulse"
                style={{
                  background: T.success,
                  boxShadow: "0 0 12px rgba(16,185,129,0.75)",
                }}
              />
            </div>
          </motion.div>

          {/* Satellites — Dev + Creative */}
          <div className="hidden lg:flex flex-col gap-3.5 ml-12">
            {[
              { src: devIcon,      alt: "Dev",     label: "Dev_Mod" },
              { src: creativeIcon, alt: "Creative", label: "Art_Eng" },
            ].map((n, i) => (
              <motion.div
                key={n.label}
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.08, duration: 0.48 }}
                className="flex items-center gap-2.5 cursor-default select-none"
                style={{ opacity: 0.38 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.72")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "0.38")}
              >
                <div
                  className="p-2.5 rounded-xl"
                  style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                  <img src={n.src} alt={n.alt} className="w-5 h-5" />
                </div>
                <span className="text-[7px] font-mono tracking-[0.32em] uppercase" style={{ color: T.textMuted }}>
                  {n.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* — Version Chip — */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58, duration: 0.4 }}
          className="flex items-center gap-3 mb-5"
        >
          <div
            className="h-px w-10"
            style={{ background: "linear-gradient(to right, transparent, rgba(6,182,212,0.3))" }}
          />
          <div
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full"
            style={{
              background: "rgba(6,182,212,0.055)",
              border:     "1px solid rgba(6,182,212,0.13)",
            }}
          >
            <Cpu style={{ width: 10, height: 10, color: T.accent }} />
            <span
              className="text-[8px] font-mono tracking-[0.38em] uppercase"
              style={{ color: "rgba(6,182,212,0.65)" }}
            >
              Internal Command System · v2.04
            </span>
          </div>
          <div
            className="h-px w-10"
            style={{ background: "linear-gradient(to left, transparent, rgba(6,182,212,0.3))" }}
          />
        </motion.div>

        {/* — Headline — */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.65, ease }}
          className="font-black leading-[0.86] tracking-[-0.048em] select-none mb-4"
          style={{ fontSize: "clamp(3rem, 9.5vw, 6.2rem)" }}
        >
          <span
            style={{
              background: "linear-gradient(172deg, #f1f5f9 0%, #c8d6e5 42%, #4a6080 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            STRAXON
          </span>
          <span
            className="ml-4"
            style={{
              background: "linear-gradient(172deg, #67e8f9 0%, #06b6d4 48%, #0e7490 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            LABS
          </span>
        </motion.h1>

        {/* — Sub-headline — */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.76, duration: 0.5 }}
          className="text-[11px] font-mono tracking-[0.32em] uppercase mb-10"
          style={{ color: T.textSecond }}
        >
          Automated Command Center &amp; Documentation Engine
        </motion.p>

        {/* — Metric Bar — */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.82, duration: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-px w-full max-w-xl mb-10 rounded-2xl overflow-hidden"
          style={{
            background:  T.border,
            border:      `1px solid ${T.border}`,
            boxShadow:   "0 8px 48px rgba(0,0,0,0.45)",
          }}
        >
          {METRICS.map((m, i) => (
            <div
              key={m.label}
              className="flex flex-col items-center py-5 px-4 cursor-default select-none transition-colors duration-200"
              style={{ background: T.surface }}
              onMouseEnter={e => (e.currentTarget.style.background = T.surfaceHi)}
              onMouseLeave={e => (e.currentTarget.style.background = T.surface)}
            >
              <m.icon style={{ width: 12, height: 12, color: T.textMuted, marginBottom: 9 }} />
              <span
                className="text-[20px] font-black font-mono leading-none tracking-tight mb-1"
                style={{ color: T.textPrimary }}
              >
                <Counter value={m.value} duration={860 + i * 160} />
              </span>
              <span
                className="text-[8.5px] font-mono tracking-[0.22em] uppercase mb-0.5"
                style={{ color: T.textMuted }}
              >
                {m.label}
              </span>
              <span className="text-[8px] font-mono" style={{ color: "#334a5e" }}>
                {m.note}
              </span>
            </div>
          ))}
        </motion.div>

        {/* — CTA Row — */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.92, duration: 0.45 }}
          className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center"
        >
          {/* Primary */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.975 }}
            onClick={() => navigate("/dashboard")}
            className="group relative overflow-hidden px-10 h-12 rounded-xl text-[11px] font-bold tracking-[0.2em] uppercase text-white flex items-center justify-center gap-2.5"
            style={{
              background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
              boxShadow:  "0 4px 28px rgba(6,182,212,0.22), inset 0 1px 0 rgba(255,255,255,0.14)",
            }}
          >
            <motion.span
              className="absolute inset-0 pointer-events-none"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
              style={{
                background:
                  "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.13) 50%, transparent 65%)",
              }}
            />
            <span className="relative z-10 flex items-center gap-2">
              Initialize Command
              <ArrowRight
                style={{ width: 15, height: 15 }}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </span>
          </motion.button>

          {/* Secondary */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.975 }}
            onClick={() => navigate("/invoices")}
            className="group px-8 h-12 rounded-xl text-[11px] font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2.5 transition-all duration-200"
            style={{
              background:  T.surface,
              border:      "1px solid rgba(255,255,255,0.075)",
              color:       "#7a90a8",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color        = T.textPrimary;
              e.currentTarget.style.borderColor  = "rgba(255,255,255,0.13)";
              e.currentTarget.style.background   = T.surfaceHi;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color        = "#7a90a8";
              e.currentTarget.style.borderColor  = "rgba(255,255,255,0.075)";
              e.currentTarget.style.background   = T.surface;
            }}
          >
            <Layers
              style={{ width: 14, height: 14 }}
              className="transition-transform duration-300 group-hover:rotate-12"
            />
            Quick Assets
          </motion.button>

          {/* Ghost */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.975 }}
            onClick={() => navigate("/audit-log")}
            className="px-6 h-12 rounded-xl text-[11px] font-bold tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all duration-200"
            style={{ color: T.textMuted, border: `1px solid ${T.border}` }}
            onMouseEnter={e => {
              e.currentTarget.style.color       = T.textSecond;
              e.currentTarget.style.borderColor = T.borderMid;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color       = T.textMuted;
              e.currentTarget.style.borderColor = T.border;
            }}
          >
            <Bell style={{ width: 13, height: 13 }} />
            Audit Log
          </motion.button>
        </motion.div>
      </div>

      {/* ── Section Divider ──────────────────────────────────────────────────── */}
      <div className="w-full max-w-5xl mx-auto px-6 relative z-10">
        <div
          className="flex items-center gap-5"
          style={{ borderTop: `1px solid ${T.border}`, paddingTop: "2.5rem" }}
        >
          <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: T.accent }} />
          <span
            className="text-[9px] font-mono font-bold tracking-[0.38em] uppercase flex-shrink-0"
            style={{ color: T.textSecond }}
          >
            System Modules
          </span>
          <div className="flex-1 h-px" style={{ background: T.border }} />
          <span className="text-[8px] font-mono flex-shrink-0" style={{ color: T.textMuted }}>
            {FEATURES.length} active
          </span>
        </div>
      </div>

      {/* ── Module Grid ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-5 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f, i) => <FeatureCard key={f.label} feat={f} index={i} />)}
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-8"
        style={{ borderTop: `1px solid ${T.border}`, paddingTop: "1.5rem" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {[
              { icon: Lock,   text: "AES-256 Encrypted"  },
              { icon: Layers, text: "React + Vite Engine" },
              { icon: Globe,  text: "Region: US-East-1"   },
              { icon: Zap,    text: "99.98% Uptime"        },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-1.5 cursor-default transition-colors duration-200"
                style={{ color: T.textMuted }}
                onMouseEnter={e => (e.currentTarget.style.color = "#475569")}
                onMouseLeave={e => (e.currentTarget.style.color = T.textMuted)}
              >
                <item.icon style={{ width: 10, height: 10 }} />
                <span className="text-[8px] font-mono tracking-[0.18em] uppercase">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[8px] font-mono tracking-wider" style={{ color: T.textMuted }}>
              SID·{session}
            </span>
            <div
              className="px-2 py-0.5 rounded text-[7px] font-mono font-bold tracking-[0.15em]"
              style={{
                background: "rgba(16,185,129,0.07)",
                border:     "1px solid rgba(16,185,129,0.18)",
                color:      T.success,
              }}
            >
              SECURE
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}