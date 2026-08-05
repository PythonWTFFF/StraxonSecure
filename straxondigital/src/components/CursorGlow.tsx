import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export const CursorGlow = () => {
  const [hovering, setHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth springs for a fluid, polished feel
  const springConfigOuter = { damping: 20, stiffness: 150, mass: 0.6 };
  const outerX = useSpring(mouseX, springConfigOuter);
  const outerY = useSpring(mouseY, springConfigOuter);

  // Tighter springs for the inner dot to stay closer to actual cursor
  const springConfigInner = { damping: 40, stiffness: 400, mass: 0.1 };
  const innerX = useSpring(mouseX, springConfigInner);
  const innerY = useSpring(mouseY, springConfigInner);

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;

    const move = (e: MouseEvent) => {
      setIsVisible(true);
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      setHovering(!!t.closest("a, button, [role=button], input, textarea, select"));
    };

    const mouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 || e.clientX <= 0 || (e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
        setIsVisible(false);
      }
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    window.addEventListener("mouseout", mouseLeave);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mouseout", mouseLeave);
    };
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Inner Dot */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[100] hidden md:flex items-center justify-center"
        style={{
          x: innerX,
          y: innerY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: hovering ? 0 : 1,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_15px_1px_hsl(var(--primary))]" />
      </motion.div>

      {/* Outer Ring */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[99] hidden md:flex items-center justify-center"
        style={{
          x: outerX,
          y: outerY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: hovering ? 1.5 : 1,
          opacity: isVisible ? (hovering ? 0.8 : 1) : 0,
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div
          className={`h-10 w-10 rounded-full transition-all duration-300 ${hovering
              ? "bg-primary/20 backdrop-blur-sm border border-primary/50"
              : "border border-primary/40"
            }`}
        />
      </motion.div>
    </>
  );
};
