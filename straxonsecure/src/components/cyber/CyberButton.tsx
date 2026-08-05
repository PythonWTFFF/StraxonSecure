import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "cyan" | "magenta" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const CyberButton = forwardRef<HTMLButtonElement, CyberButtonProps>(
  ({ className, variant = "cyan", size = "md", children, ...props }, ref) => {
    const sizes = {
      sm: "px-4 py-1.5 text-[10px]",
      md: "px-6 py-2.5 text-xs",
      lg: "px-8 py-3.5 text-sm md:text-base",
    };

    // The animated outer gradient border
    const gradientWrappers = {
      cyan: "bg-gradient-to-r from-[#00f3ff] via-[#0277ff] to-[#8a2be2] hover:shadow-[0_0_25px_rgba(0,243,255,0.6)]",
      magenta:
        "bg-gradient-to-r from-[#ff003c] via-[#d946ef] to-[#ff8a00] hover:shadow-[0_0_25px_rgba(255,0,60,0.6)]",
      ghost:
        "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-[#00f3ff] hover:to-[#d946ef] hover:shadow-[0_0_20px_rgba(0,243,255,0.3)]",
      danger:
        "bg-gradient-to-r from-[#ff0000] via-[#ff4500] to-[#ff8a00] hover:shadow-[0_0_25px_rgba(255,0,0,0.6)]",
    };

    // The text colors
    const textColors = {
      cyan: "text-cyan-300 group-hover:text-white",
      magenta: "text-pink-300 group-hover:text-white",
      ghost: "text-slate-300 group-hover:text-white",
      danger: "text-red-300 group-hover:text-white",
    };

    return (
      <>
        <style>{`
          @keyframes btn-scanline {
            0% { transform: translateY(-200%); }
            100% { transform: translateY(400%); }
          }
          @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-btn-scanline {
            animation: btn-scanline 1.5s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          }
          .animate-gradient {
            background-size: 200% 200%;
            animation: gradient-shift 3s ease infinite;
          }
        `}</style>

        <button
          ref={ref}
          className={cn(
            "group relative inline-flex items-center justify-center p-[2px] font-mono font-bold uppercase tracking-widest transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden active:scale-95 animate-gradient",
            // The outer shape
            "[clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)]",
            gradientWrappers[variant],
            className,
          )}
          {...props}
        >
          {/* Inner Dark Surface (Shrinks slightly on hover to reveal more gradient) */}
          <span
            className="absolute inset-[2px] bg-[#020610] z-0 transition-all duration-300 group-hover:bg-[#020610]/60 group-hover:inset-[1px]"
            style={{
              clipPath:
                "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
            }}
          />

          {/* Holographic Scanline Overlay */}
          <span className="absolute inset-0 w-full h-[4px] bg-white/60 blur-[2px] -translate-y-full opacity-0 group-hover:opacity-100 group-hover:animate-btn-scanline z-20 mix-blend-overlay" />

          {/* Micro-tech corner dots */}
          <span className="absolute top-[4px] left-[14px] w-1 h-1 bg-white/50 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity delay-100" />
          <span className="absolute bottom-[4px] right-[14px] w-1 h-1 bg-white/50 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity delay-100" />

          {/* Content Wrapper */}
          <span
            className={cn(
              "relative z-10 flex items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] transition-colors duration-300",
              sizes[size],
              textColors[variant],
            )}
          >
            {children}
          </span>
        </button>
      </>
    );
  },
);

CyberButton.displayName = "CyberButton";
