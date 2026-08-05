import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const CustomCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springX = useSpring(cursorX, { damping: 25, stiffness: 400 });
  const springY = useSpring(cursorY, { damping: 25, stiffness: 400 });
  
  const [cursorVariant, setCursorVariant] = useState<"default" | "hover" | "magnetic">("default");
  const [sectionColor, setSectionColor] = useState("hsl(190, 95%, 50%)");
  const [isMobile, setIsMobile] = useState(false);
  const trailRef = useRef<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    cursorX.set(e.clientX);
    cursorY.set(e.clientY);
    
    // Track trail
    trailRef.current.push({ x: e.clientX, y: e.clientY });
    if (trailRef.current.length > 5) trailRef.current.shift();

    // Section color detection
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el) {
      const section = el.closest("[data-cursor-color]");
      if (section) {
        setSectionColor(section.getAttribute("data-cursor-color") || "hsl(190, 95%, 50%)");
      } else {
        setSectionColor("hsl(190, 95%, 50%)");
      }
    }

    // Magnetic button detection
    const magnetic = document.querySelectorAll("[data-magnetic]");
    let found = false;
    magnetic.forEach((btn) => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);
      
      if (dist < 80) {
        found = true;
        const pull = 0.3;
        const dx = (e.clientX - cx) * pull;
        const dy = (e.clientY - cy) * pull;
        (btn as HTMLElement).style.transform = `translate(${dx}px, ${dy}px)`;
        setCursorVariant("magnetic");
      } else {
        (btn as HTMLElement).style.transform = "";
      }
    });
    if (!found && cursorVariant === "magnetic") setCursorVariant("default");
  }, [cursorX, cursorY, cursorVariant]);

  useEffect(() => {
    if (isMobile) return;
    
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    
    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, [role='button'], [data-magnetic]")) {
        setCursorVariant("hover");
      }
    };
    const handleOut = () => setCursorVariant("default");

    document.addEventListener("mouseover", handleOver);
    document.addEventListener("mouseout", handleOut);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleOver);
      document.removeEventListener("mouseout", handleOut);
    };
  }, [isMobile, handleMouseMove]);

  if (isMobile) return null;

  const size = cursorVariant === "hover" ? 48 : cursorVariant === "magnetic" ? 56 : 16;

  return (
    <>
      {/* Glow trail */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998] rounded-full mix-blend-screen"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
          width: 120,
          height: 120,
          background: `radial-gradient(circle, ${sectionColor.replace(")", " / 0.08)")} 0%, transparent 70%)`,
        }}
      />
      {/* Main cursor dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full border"
        animate={{
          width: size,
          height: size,
          borderColor: sectionColor.replace(")", " / 0.5)"),
          backgroundColor: cursorVariant !== "default" ? sectionColor.replace(")", " / 0.1)") : "transparent",
        }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
      {/* Inner dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
          width: 4,
          height: 4,
          backgroundColor: sectionColor,
        }}
      />
    </>
  );
};

export default CustomCursor;
