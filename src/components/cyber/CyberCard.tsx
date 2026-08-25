import { cn } from "@/lib/utils";
import { forwardRef, useState, useRef, type HTMLAttributes } from "react";

interface CyberCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "cyan" | "magenta" | "plain" | (string & {});
  glow?: boolean;
  glitchContent?: boolean; // Makes internal text glitch
}

export const CyberCard = forwardRef<HTMLDivElement, CyberCardProps>(
  (
    { className, variant = "cyan", glow = false, glitchContent = false, children, ...props },
    forwardedRef,
  ) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const internalRef = useRef<HTMLDivElement>(null);

    const setRefs = (node: HTMLDivElement) => {
      internalRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!internalRef.current) return;
      const rect = internalRef.current.getBoundingClientRect();
      setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    // Advanced Cyber Theme Mapping - Using pure neon HEX values for bloom
    const themeColors: Record<string, any> = {
      cyan: {
        border: "border-cyan-500/30 group-hover:border-[#00f3ff]",
        spotlight: "radial-gradient(400px circle at x y, rgba(0, 243, 255, 0.15), transparent 60%)",
        corner: "border-[#00f3ff]",
        accent: "bg-[#00f3ff]",
        shadow: "hover:shadow-[0_0_30px_rgba(0,243,255,0.18)]",
        textShadow: "0 0 5px rgba(0,243,255,0.7)",
      },
      magenta: {
        border: "border-magenta-500/30 group-hover:border-[#ff003c]",
        spotlight: "radial-gradient(400px circle at x y, rgba(255, 0, 60, 0.15), transparent 60%)",
        corner: "border-[#ff003c]",
        accent: "bg-[#ff003c]",
        shadow: "hover:shadow-[0_0_30px_rgba(255,0,60,0.18)]",
        textShadow: "0 0 5px rgba(255,0,60,0.7)",
      },
      plain: {
        border: "border-slate-700/50 group-hover:border-slate-500",
        spotlight:
          "radial-gradient(400px circle at x y, rgba(148, 163, 184, 0.05), transparent 60%)",
        corner: "border-slate-500",
        accent: "bg-slate-500",
        shadow: "hover:shadow-[0_0_30px_rgba(148,163,184,0.05)]",
        textShadow: "none",
      },
    };

    const theme = themeColors[variant];

    return (
      <>
        {/* Defining the glitch animations in context */}
        <style>{`
          @keyframes glitch {
            0% { clip: rect(44px, 450px, 56px, 0); }
            5% { clip: rect(62px, 450px, 86px, 0); }
            10% { clip: rect(12px, 450px, 34px, 0); }
            15% { clip: rect(90px, 450px, 98px, 0); }
            20% { clip: rect(10px, 450px, 12px, 0); }
            25% { clip: rect(50px, 450px, 60px, 0); }
            30% { clip: rect(80px, 450px, 85px, 0); }
            100% { clip: rect(0, 450px, 100px, 0); }
          }
          @keyframes glare {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
          @keyframes glitch-skew {
            0% { transform: skew(0deg); }
            2% { transform: skew(3deg); }
            4% { transform: skew(0deg); }
          }
          .animate-glitch {
            position: relative;
            display: inline-block;
          }
          .animate-glitch::after {
            content: attr(data-text);
            position: absolute;
            left: 2px;
            text-shadow: -1px 0 #ff00c1;
            top: 0;
            color: #fff;
            overflow: hidden;
            animation: glitch 3s infinite linear alternate-reverse, glitch-skew 1s infinite linear alternate-reverse;
          }
        `}</style>

        <div
          ref={setRefs}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "group relative p-5 bg-[#020610]/95 backdrop-blur-xl border transition-all duration-300 overflow-hidden",
            // Cyberpunk Chamfered Corners
            "[clip-path:polygon(16px_0,100%_0,100%_calc(100%-16px),calc(100%-16px)_100%,0_100%,0_16px)]",
            theme.border,
            glow && theme.shadow,
            glow && variant === "cyan" && "cyber-hover",
            glow && variant === "magenta" && "cyber-hover-magenta",
            className,
          )}
          {...props}
        >
          {/* Dynamic Mouse Spotlight Layer */}
          {glow && (
            <div
              className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0"
              style={{
                opacity: isHovered ? 1 : 0,
                background: theme.spotlight
                  .replace("x", mousePosition.x.toString())
                  .replace("y", mousePosition.y.toString()),
              }}
            />
          )}

          {/* Cyber Glare Effect */}
          {glow && (
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10 overflow-hidden mix-blend-overlay">
              <div className="absolute top-0 left-[-100%] w-[30%] h-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] group-hover:animate-[glare_2.5s_ease-in-out_infinite]" />
            </div>
          )}

          {/* CRT Scanline Texture Background */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.04] z-0 bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:100%_4px] group-hover:opacity-[0.08] transition-opacity duration-500" />

          {/* Tech Accents - Corner Targeting Brackets */}
          <span
            className={cn(
              "absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 opacity-30 group-hover:opacity-100 transition-opacity duration-300 z-10",
              theme.corner,
            )}
          />
          <span
            className={cn(
              "absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 opacity-30 group-hover:opacity-100 transition-opacity duration-300 z-10",
              theme.corner,
            )}
          />
          <span
            className={cn(
              "absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 opacity-30 group-hover:opacity-100 transition-opacity duration-300 z-10",
              theme.corner,
            )}
          />
          <span
            className={cn(
              "absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 opacity-30 group-hover:opacity-100 transition-opacity duration-300 z-10",
              theme.corner,
            )}
          />

          {/* Animated Tech Data Bar at the top - PULSING */}
          <span
            className={cn(
              "absolute top-0 left-6 w-8 h-[2px] opacity-40 group-hover:w-32 group-hover:opacity-100 transition-all duration-700 ease-out z-10 animate-pulse",
              theme.accent,
              variant === "cyan" && "shadow-[0_0_8px_#00f3ff]",
              variant === "magenta" && "shadow-[0_0_8px_#ff003c]",
            )}
          />

          {/* Secondary Tech Bar at the bottom right */}
          <span
            className={cn(
              "absolute bottom-0 right-6 w-4 h-[2px] opacity-20 group-hover:w-16 group-hover:opacity-80 transition-all duration-500 ease-out delay-100 z-10",
              theme.accent,
            )}
          />

          {/* Content Wrapper */}
          <div
            className={cn(
              "relative z-10 transition-colors duration-300",
              glitchContent && "animate-glitch group-hover:[text-shadow:0_0_8px_white]",
              variant === "cyan" && glitchContent && "text-cyan-200",
              variant === "magenta" && glitchContent && "text-pink-200",
            )}
            style={{ textShadow: isHovered ? theme.textShadow : "none" }}
            // Pass the original text content as data-text for the glitch effect
            {...(glitchContent
              ? { "data-text": typeof children === "string" ? children : undefined }
              : {})}
          >
            {children}
          </div>
        </div>
      </>
    );
  },
);

CyberCard.displayName = "CyberCard";
