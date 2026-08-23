import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import straxonLogo from "@/assets/straxonlogo.png";

// ─── Injected CSS ─────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;700&display=swap');

  .stx-404 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(7rem, 18vw, 13rem);
    font-weight: 800;
    line-height: 0.9;
    letter-spacing: -0.04em;
    color: transparent;
    -webkit-text-stroke: 1.5px rgba(6,182,212,0.7);
    position: relative;
    display: inline-block;
    text-shadow: 0 0 80px rgba(6,182,212,0.15);
  }
  .stx-404::before, .stx-404::after {
    content: attr(data-text);
    position: absolute;
    inset: 0;
    -webkit-text-stroke: 1.5px transparent;
    font-size: inherit;
    font-weight: inherit;
    letter-spacing: inherit;
  }
  .stx-404::before {
    color: #f43f5e;
    animation: stx-glitch-a 4.5s steps(1) infinite;
    text-shadow: none;
  }
  .stx-404::after {
    color: #8b5cf6;
    animation: stx-glitch-b 4.5s steps(1) infinite;
    text-shadow: none;
  }

  @keyframes stx-glitch-a {
    0%,89%,100% { clip-path: none; transform: none; opacity: 0; }
    90%  { clip-path: polygon(0 8%,100% 8%,100% 22%,0 22%); transform: translate(-5px,0); opacity: 0.7; }
    91%  { clip-path: polygon(0 55%,100% 55%,100% 68%,0 68%); transform: translate(5px,0); opacity: 0.7; }
    92%  { clip-path: polygon(0 38%,100% 38%,100% 45%,0 45%); transform: translate(-3px,0); opacity: 0.6; }
    93%  { clip-path: none; transform: none; opacity: 0; }
    94%  { clip-path: polygon(0 75%,100% 75%,100% 88%,0 88%); transform: translate(7px,0); opacity: 0.5; }
    95%  { clip-path: none; opacity: 0; }
  }
  @keyframes stx-glitch-b {
    0%,89%,100% { clip-path: none; transform: none; opacity: 0; }
    90%  { clip-path: polygon(0 60%,100% 60%,100% 75%,0 75%); transform: translate(6px,0); opacity: 0.6; }
    91%  { clip-path: polygon(0 20%,100% 20%,100% 35%,0 35%); transform: translate(-6px,0); opacity: 0.6; }
    92%  { clip-path: none; opacity: 0; }
    93%  { clip-path: polygon(0 85%,100% 85%,100% 95%,0 95%); transform: translate(3px,0); opacity: 0.5; }
    94%,95% { clip-path: none; opacity: 0; }
  }

  @keyframes stx-scan {
    0%   { top: -3px; opacity: 1; }
    95%  { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }
  @keyframes stx-ring-x { from { transform: rotateX(0deg); } to { transform: rotateX(360deg); } }
  @keyframes stx-ring-y { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
  @keyframes stx-ring-z { from { transform: rotateZ(0deg); } to { transform: rotateZ(360deg); } }
  @keyframes stx-pulse-scale {
    0%,100% { transform: scale(1);   opacity: 0.6; }
    50%      { transform: scale(1.08); opacity: 1;   }
  }
  @keyframes stx-float {
    0%,100% { transform: translateY(0px)   rotate(0deg); }
    33%     { transform: translateY(-18px) rotate(1deg); }
    66%     { transform: translateY(-8px)  rotate(-1deg); }
  }
  @keyframes stx-drift {
    0%,100% { transform: translateY(0px)  translateX(0px);  opacity: 0.25; }
    25%     { transform: translateY(-14px) translateX(6px);  opacity: 0.5; }
    75%     { transform: translateY(10px)  translateX(-8px); opacity: 0.15; }
  }
  @keyframes stx-waveform {
    0%,100% { transform: scaleY(1); }
    50%     { transform: scaleY(0.3); }
  }
  @keyframes stx-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  @keyframes stx-flicker {
    0%,19%,21%,23%,25%,54%,56%,100% { opacity:1; }
    20%,24%,55% { opacity:0.4; }
  }

  .stx-ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid;
    transform-style: preserve-3d;
  }
  .stx-node {
    font-family: 'JetBrains Mono', monospace;
    animation: stx-drift linear infinite;
  }
  .stx-cursor { animation: stx-blink 1s step-end infinite; }
  .stx-flicker { animation: stx-flicker 8s linear infinite; }
`;

// ─── Neural Particle Canvas (mouse-reactive) ──────────────────────────────────

function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef  = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    let   raf: number;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    type P = { x: number; y: number; ox: number; oy: number; vx: number; vy: number; r: number; a: number };
    const N = 160;
    const pts: P[] = Array.from({ length: N }, () => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      return { x, y, ox: x, oy: y, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, r: Math.random() * 1.8 + 0.4, a: Math.random() * 0.7 + 0.1 };
    });

    const LINK_DIST  = 110;
    const MOUSE_DIST = 160;
    const REPEL      = 2200;

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = mouseRef.current;

      for (const p of pts) {
        // Mouse repulsion
        const dx = p.x - mx, dy = p.y - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < MOUSE_DIST * MOUSE_DIST && d2 > 0) {
          const d  = Math.sqrt(d2);
          const f  = REPEL / (d2);
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }

        // Spring back to origin
        p.vx += (p.ox - p.x) * 0.008;
        p.vy += (p.oy - p.y) * 0.008;

        // Damping
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.x  += p.vx;
        p.y  += p.vy;

        // Draw node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6,182,212,${p.a * 0.85})`;
        ctx.fill();
      }

      // Draw links
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK_DIST) {
            const a = (1 - d / LINK_DIST) * 0.18;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(6,182,212,${a})`;
            ctx.lineWidth   = 0.6;
            ctx.stroke();
          }
        }
      }

      // Mouse highlight ring
      if (mx > 0) {
        ctx.beginPath();
        ctx.arc(mx, my, MOUSE_DIST, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(6,182,212,0.04)";
        ctx.lineWidth   = 1;
        ctx.stroke();
      }

      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }} />;
}

// ─── Holographic Rings ────────────────────────────────────────────────────────

function HoloSphere() {
  const rings = [
    { size: 200, color: "rgba(6,182,212,0.55)",  anim: "stx-ring-y 6s linear infinite",         rot: "rotateX(80deg)" },
    { size: 200, color: "rgba(139,92,246,0.45)", anim: "stx-ring-x 9s linear infinite",         rot: "rotateY(30deg)" },
    { size: 160, color: "rgba(6,182,212,0.35)",  anim: "stx-ring-z 12s linear infinite reverse",rot: "rotateX(40deg) rotateY(60deg)" },
    { size: 240, color: "rgba(99,102,241,0.25)", anim: "stx-ring-y 15s linear infinite reverse", rot: "rotateX(20deg)" },
    { size: 280, color: "rgba(6,182,212,0.12)",  anim: "stx-ring-x 20s linear infinite",         rot: "rotateX(70deg) rotateZ(30deg)" },
  ];

  return (
    <div className="relative" style={{ width: 300, height: 300, perspective: 800 }}>
      {/* Core glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-full" style={{
          width: 60, height: 60,
          background: "radial-gradient(circle, rgba(6,182,212,0.9) 0%, rgba(6,182,212,0.3) 40%, transparent 70%)",
          boxShadow: "0 0 60px rgba(6,182,212,0.6), 0 0 120px rgba(6,182,212,0.2)",
          animation: "stx-pulse-scale 3s ease-in-out infinite",
        }} />
      </div>

      {/* Rings */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: "preserve-3d" }}>
        {rings.map((r, i) => (
          <div key={i} className="absolute" style={{
            width: r.size, height: r.size,
            marginLeft: -r.size / 2, marginTop: -r.size / 2,
            border: `1px solid ${r.color}`,
            borderRadius: "50%",
            boxShadow: `0 0 12px ${r.color.replace("0.", "0.3")}`,
            animation: r.anim,
            transform: r.rot,
            transformStyle: "preserve-3d",
          }} />
        ))}
      </div>

      {/* Tick marks on outermost ring */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="absolute" style={{
          width: 2, height: 10,
          background: "rgba(6,182,212,0.5)",
          top: "50%", left: "50%",
          transformOrigin: "1px 140px",
          transform: `rotate(${i * 30}deg) translateY(-140px)`,
        }} />
      ))}
    </div>
  );
}

// ─── Waveform Oscilloscope ────────────────────────────────────────────────────

function Waveform() {
  const bars = 48;
  return (
    <div className="flex items-center gap-[3px]" style={{ height: 40 }}>
      {Array.from({ length: bars }).map((_, i) => {
        const baseH = Math.abs(Math.sin(i * 0.4 + 1)) * 100;
        const delay = i * 0.035;
        return (
          <div
            key={i}
            className="rounded-full flex-shrink-0"
            style={{
              width: 2.5,
              height: `${baseH}%`,
              minHeight: 3,
              background: i < bars / 2
                ? `rgba(6,182,212,${0.4 + (i / bars) * 0.5})`
                : `rgba(139,92,246,${0.9 - ((i - bars / 2) / bars) * 0.5})`,
              animation: `stx-waveform ${0.6 + Math.random() * 1.2}s ease-in-out ${delay}s infinite`,
              transformOrigin: "bottom",
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Terminal Lines ───────────────────────────────────────────────────────────

const LINES = [
  { t: 0,    s: "system", text: "STRAXON-OS kernel 4.2.1 — boot sequence complete" },
  { t: 700,  s: "info",   text: "mounting filesystem at /dev/null/quantum..." },
  { t: 1300, s: "warn",   text: "WARNING: route table lookup failed for requested path" },
  { t: 1900, s: "error",  text: "SIGSEGV — null pointer dereference at 0xSTX_VOID" },
  { t: 2500, s: "info",   text: "invoking sector recovery protocol..." },
  { t: 3100, s: "warn",   text: "scan: no valid sector found in 32 adjacent zones" },
  { t: 3700, s: "system", text: "anomaly class: HTTP_404 · severity: NON_CRITICAL" },
  { t: 4400, s: "ok",     text: "isolation boundary active — event logged" },
  { t: 5100, s: "ok",     text: "ready: awaiting operator navigation input_" },
];

const COLORS: Record<string, string> = {
  system: "text-slate-500",
  info:   "text-cyan-400/80",
  warn:   "text-amber-400",
  error:  "text-rose-400",
  ok:     "text-emerald-400",
};
const PREFIX: Record<string, string> = {
  system: "SYS",
  info:   "INF",
  warn:   "WRN",
  error:  "ERR",
  ok:     "  ✓",
};

function Terminal({ path }: { path: string }) {
  const [visible, setVisible] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timers = LINES.map((l, i) =>
      setTimeout(() => {
        setVisible(p => [...p, i]);
        if (i === LINES.length - 1) setDone(true);
      }, l.t)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      className="w-full rounded-2xl overflow-hidden border border-slate-800/60"
      style={{ background: "rgba(2,8,18,0.9)", backdropFilter: "blur(20px)" }}
    >
      {/* Chrome bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/60"
        style={{ background: "rgba(0,0,0,0.3)" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>
        <span className="font-mono text-[10px] text-slate-600 tracking-widest">
          straxon-os · /anomaly{path}
        </span>
        <div className="w-16" />
      </div>

      <div className="p-4 space-y-1.5 min-h-[200px]">
        <AnimatePresence>
          {visible.map(i => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-start gap-3 font-mono text-[11px] leading-relaxed"
            >
              <span className={`${COLORS[LINES[i].s]} flex-shrink-0 opacity-60`}>
                [{PREFIX[LINES[i].s]}]
              </span>
              <span className={COLORS[LINES[i].s]}>{LINES[i].text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {done && (
          <div className="flex items-center gap-1 font-mono text-[11px] text-cyan-400 mt-2">
            <span className="text-slate-600">$</span>
            <span className="stx-cursor">█</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Floating Data Fragments ──────────────────────────────────────────────────

const FRAGMENTS = [
  "0x00FF_NULL", "ERR_ROUTE", "SECTOR:∅", "0b10110100", "NaN", "∅.∅.∅.∅",
  "undefined", "VOID[404]", "0xDEAD", "LOST_PKT", "∞ → 0", "ERR::REF",
];

function FloatingFragments() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
      {FRAGMENTS.map((f, i) => {
        const top  = 8 + (i * 7.1) % 85;
        const left = (i % 2 === 0 ? 2 : 88) + (i % 4) * 2;
        const dur  = 6 + (i % 5) * 2.3;
        const del  = i * 0.4;
        return (
          <div
            key={f}
            className="stx-node absolute text-[10px] text-cyan-500/25 select-none"
            style={{
              top: `${top}%`,
              left: `${left}%`,
              animationDuration: `${dur}s`,
              animationDelay: `${del}s`,
            }}
          >
            {f}
          </div>
        );
      })}
    </div>
  );
}

// ─── Live Clock ───────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState(() => new Date().toISOString().slice(11, 19));
  useEffect(() => {
    const iv = setInterval(() => setTime(new Date().toISOString().slice(11, 19)), 1000);
    return () => clearInterval(iv);
  }, []);
  return <span className="tabular-nums">{time} UTC</span>;
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function NotFound() {
  const location = useLocation();
  const navigate  = useNavigate();

  const mx  = useMotionValue(0.5);
  const my  = useMotionValue(0.5);
  const spx = useSpring(mx, { stiffness: 50, damping: 20 });
  const spy = useSpring(my, { stiffness: 50, damping: 20 });

  const sphereX = useTransform(spx, [0, 1], ["-20px", "20px"]);
  const sphereY = useTransform(spy, [0, 1], ["-12px", "12px"]);
  const textX   = useTransform(spx, [0, 1], ["8px",  "-8px"]);
  const textY   = useTransform(spy, [0, 1], ["4px",  "-4px"]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - left) / width);
    my.set((e.clientY - top)  / height);
  }, [mx, my]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div
        className="relative min-h-screen w-full overflow-hidden flex flex-col"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 20%, #030f1a 0%, #010608 50%, #000 100%)",
          fontFamily: "'Space Grotesk', sans-serif",
        }}
        onMouseMove={onMouseMove}
        onMouseLeave={() => { mx.set(0.5); my.set(0.5); }}
      >
        {/* Neural particle background */}
        <NeuralCanvas />

        {/* Floating data fragments */}
        <FloatingFragments />

        {/* Page-wide scanline sweep */}
        <div className="absolute inset-x-0 pointer-events-none overflow-hidden" style={{ zIndex: 15, top: 0, bottom: 0 }}>
          <div style={{
            position: "absolute",
            left: 0, right: 0, height: 2,
            background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.6), rgba(139,92,246,0.4), transparent)",
            animation: "stx-scan 8s linear infinite",
            boxShadow: "0 0 20px rgba(6,182,212,0.3)",
          }} />
        </div>

        {/* Scanline texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)",
            zIndex: 16,
          }}
        />

        {/* Perspective grid floor */}
        <div className="absolute bottom-0 inset-x-0 pointer-events-none" style={{ height: "45%", zIndex: 3 }}>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `
              linear-gradient(rgba(6,182,212,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6,182,212,0.08) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
            transform: "perspective(500px) rotateX(65deg)",
            transformOrigin: "50% 100%",
            maskImage: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 80%)",
            WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 80%)",
          }} />
        </div>

        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1,  y: 0   }}
          transition={{ duration: 0.7 }}
          className="relative z-20 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 pt-6 sm:pt-8 gap-4"
        >
          <div className="flex items-center gap-3">
            <img src={straxonLogo} alt="Straxon Labs" className="h-6 sm:h-7 w-auto object-contain stx-flicker" />
          </div>
          <div className="flex items-center gap-2 sm:gap-4 font-mono text-[9px] sm:text-[10px] text-slate-600 uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Signal Lost
            </span>
            <span className="hidden sm:inline">·</span>
            <LiveClock />
          </div>
        </motion.header>

        {/* ── Main Content ── */}
        <div className="relative z-20 flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 px-8 py-12 max-w-[1400px] mx-auto w-full">

          {/* ── LEFT: 404 + Info ── */}
          <motion.div
            style={{ x: textX, y: textY }}
            className="flex-1 min-w-0 flex flex-col items-start"
          >
            {/* Status badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 flex items-center gap-2 px-3 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/5"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-mono text-[10px] text-rose-400 uppercase tracking-[0.2em]">Quantum Route Failure</span>
            </motion.div>

            {/* Giant 404 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="stx-404" data-text="404">404</div>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="mt-4 mb-6 max-w-xl"
            >
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight leading-tight">
                Lost in the{" "}
                <span
                  className="text-transparent bg-clip-text"
                  style={{ backgroundImage: "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #f43f5e 100%)" }}
                >
                  Void Sector
                </span>
              </h1>
              <p className="mt-3 text-slate-500 text-sm font-mono leading-relaxed">
                The coordinate you requested does not exist in this<br />
                dimensional plane. All traversal attempts have been catalogued.
              </p>
            </motion.div>

            {/* Data table */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="mb-8 w-full max-w-md"
            >
              <div className="rounded-xl border border-slate-800/80 overflow-hidden"
                style={{ background: "rgba(2,10,16,0.7)", backdropFilter: "blur(12px)" }}>
                {[
                  { k: "Path",     v: location.pathname,                                                        c: "text-rose-400" },
                  { k: "Code",     v: "HTTP 404 · VOID_COORDINATE",                                              c: "text-amber-400" },
                  { k: "Incident", v: `STX-${Date.now().toString(36).toUpperCase().slice(-8)}`,                  c: "text-cyan-400"  },
                  { k: "Zone",     v: "Quantum Sector Δ-7 · Subsector NULL",                                     c: "text-slate-400" },
                ].map(({ k, v, c }, i) => (
                  <div
                    key={k}
                    className={`flex items-center gap-4 px-4 py-2.5 font-mono text-[11px] ${i < 3 ? "border-b border-slate-800/60" : ""}`}
                  >
                    <span className="text-slate-600 w-16 uppercase tracking-wider flex-shrink-0">{k}</span>
                    <span className={`${c} truncate font-medium`}>{v}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Waveform */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              className="mb-8 w-full max-w-md"
            >
              <div className="mb-2 font-mono text-[9px] text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/40 animate-pulse" />
                Signal Waveform — No Carrier Detected
              </div>
              <Waveform />
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
              className="flex flex-wrap gap-3"
            >
              <button
                onClick={() => navigate("/")}
                className="group relative overflow-hidden flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-mono text-xs font-bold uppercase tracking-widest text-white transition-all duration-300"
                style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "linear-gradient(135deg, #0891b2, #7c3aed)" }} />
                <span className="relative">Return to Command Center</span>
                <span className="relative group-hover:translate-x-1 transition-transform duration-200">→</span>
              </button>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest text-slate-400 border border-slate-800 hover:border-cyan-500/40 hover:text-cyan-400 hover:bg-cyan-500/5 transition-all duration-300"
              >
                ← Previous Sector
              </button>
            </motion.div>
          </motion.div>

          {/* ── RIGHT: Holo Sphere + Terminal ── */}
          <div className="flex flex-col items-center gap-8 flex-shrink-0">
            {/* Holographic sphere */}
            <motion.div
              style={{ x: sphereX, y: sphereY }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1  }}
              transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-center justify-center"
            >
              {/* Outer glow halo */}
              <div className="absolute rounded-full pointer-events-none" style={{
                width: 340, height: 340,
                background: "radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)",
              }} />
              <HoloSphere />
            </motion.div>

            {/* Terminal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0  }}
              transition={{ delay: 0.6, duration: 0.7 }}
              className="w-full max-w-[380px]"
            >
              <Terminal path={location.pathname} />
            </motion.div>
          </div>
        </div>

        {/* ── Footer ── */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="relative z-20 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 pb-6 font-mono text-[9px] sm:text-[10px] text-slate-800 uppercase tracking-widest gap-4 text-center sm:text-left mt-12 lg:mt-0"
        >
          <span>Straxon Labs · Command Center v4.2</span>
          <div className="flex items-center gap-2 sm:gap-3 text-slate-700 flex-wrap justify-center">
            <span>Isolation Active</span>
            <span className="w-1 h-1 rounded-full bg-slate-700 hidden sm:block" />
            <span>No Breach Detected</span>
          </div>
          <span className="hidden md:inline">© {new Date().getFullYear()} Straxon Technologies</span>
        </motion.footer>
      </div>
    </>
  );
}
