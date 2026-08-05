import { ReactNode } from "react";

interface A4DocumentProps {
  children: ReactNode;
  /** Optional accent color for header bar. */
  accent?: string;
}

/**
 * Pixel-precise A4 page (210mm × 297mm) for browser-print → PDF.
 * Uses absolute mm units so the printed PDF matches the on-screen preview exactly.
 * In print mode, only the page is visible; everything else is hidden.
 */
export const A4Document = ({ children, accent = "hsl(200 100% 50%)" }: A4DocumentProps) => {
  return (
    <div className="a4-wrap">
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          html, body { background: white !important; }
          body * { visibility: hidden; }
          .a4-page, .a4-page * { visibility: visible; }
          .a4-page { position: absolute; left: 0; top: 0; box-shadow: none !important; margin: 0 !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div
        className="a4-page bg-white text-black mx-auto shadow-elegant relative"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "18mm 16mm",
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: "10.5pt",
          lineHeight: 1.5,
          color: "#0a0a0a",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: "4mm",
            background: `linear-gradient(90deg, ${accent}, transparent)`,
          }}
        />
        {children}
      </div>
    </div>
  );
};
