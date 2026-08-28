import { cn } from "@/lib/utils";

/**
 * BrandMark — Straxon Labs logo.
 * A custom PCB-trace styled 'S' logo.
 */
export const BrandMark = ({
  size = 32,
  withWordmark = false,
  wordmark = "StraxonLabs",
  className,
}: {
  size?: number;
  withWordmark?: boolean;
  wordmark?: string;
  className?: string;
}) => {
  return (
    <span className={cn("inline-flex items-center gap-2 group/brand", className)}>
      <span
        aria-label="Straxon Labs logo"
        className="relative inline-flex items-center justify-center transition-transform group-hover/brand:scale-110"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]"
          stroke="currentColor"
        >
          {/* Main S Trace */}
          <path
            d="M 22 4 H 11 C 5 4, 3 8, 3 11 C 3 14, 5 14, 10 15 C 16 16.2, 21 16.5, 21 19 C 21 21.5, 19 22, 13 22 H 2"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="drop-shadow-[0_0_2px_currentColor]"
          />
          {/* Main Trace Pads */}
          <rect x="21" y="3" width="2" height="2" fill="currentColor" stroke="none" />
          <rect x="1" y="21" width="2" height="2" fill="currentColor" stroke="none" />

          {/* Top Inner Trace 1 */}
          <path d="M 18 7 H 10 C 6.5 7, 6 9, 6 11.5" strokeWidth="1" strokeLinecap="round" />
          <circle cx="18" cy="7" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="6" cy="11.5" r="1.2" fill="currentColor" stroke="none" />

          {/* Top Inner Trace 2 */}
          <path d="M 15 10 H 10" strokeWidth="1" strokeLinecap="round" />
          <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
          <circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" />

          {/* Bottom Inner Trace 1 */}
          <path d="M 6 19 H 14 C 17.5 19, 18 17, 18 14.5" strokeWidth="1" strokeLinecap="round" />
          <circle cx="6" cy="19" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="18" cy="14.5" r="1.2" fill="currentColor" stroke="none" />

          {/* Bottom Inner Trace 2 */}
          <path d="M 9 16 H 14" strokeWidth="1" strokeLinecap="round" />
          <circle cx="9" cy="16" r="1" fill="currentColor" stroke="none" />
          <circle cx="14" cy="16" r="1" fill="currentColor" stroke="none" />

          {/* Diagonal cross trace */}
          <path d="M 7 13 L 11 14.5" strokeWidth="1" strokeLinecap="round" />
          <circle cx="7" cy="13" r="1" fill="currentColor" stroke="none" />
          <circle cx="11" cy="14.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      </span>
      {withWordmark && (
        <span className="font-bold text-lg tracking-tight">
          {wordmark}
          <span className="text-primary">.</span>
        </span>
      )}
    </span>
  );
};
