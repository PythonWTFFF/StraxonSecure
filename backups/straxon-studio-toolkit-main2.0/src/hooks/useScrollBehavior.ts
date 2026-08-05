import { useState, useEffect, useCallback, useRef } from "react";

interface ScrollBehavior {
  scrollSpeed: "slow" | "normal" | "fast";
  scrollDepth: "top" | "middle" | "bottom";
  isIdle: boolean;
  idleDuration: number;
  hoverIntensity: number; // 0–1 based on hover frequency
  dynamicCTA: string;
}

export const useScrollBehavior = (): ScrollBehavior => {
  const [scrollSpeed, setScrollSpeed] = useState<"slow" | "normal" | "fast">("normal");
  const [scrollDepth, setScrollDepth] = useState<"top" | "middle" | "bottom">("top");
  const [isIdle, setIsIdle] = useState(false);
  const [idleDuration, setIdleDuration] = useState(0);
  const [hoverIntensity, setHoverIntensity] = useState(0);
  
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();
  const idleStart = useRef(Date.now());
  const hoverCount = useRef(0);
  const hoverResetTimer = useRef<ReturnType<typeof setInterval>>();

  const resetIdle = useCallback(() => {
    setIsIdle(false);
    setIdleDuration(0);
    idleStart.current = Date.now();
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      setIsIdle(true);
      idleStart.current = Date.now();
    }, 4000);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now();
      const dt = now - lastScrollTime.current;
      const dy = Math.abs(window.scrollY - lastScrollY.current);
      const speed = dt > 0 ? dy / dt : 0;

      if (speed > 3) setScrollSpeed("fast");
      else if (speed > 0.8) setScrollSpeed("normal");
      else setScrollSpeed("slow");

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? window.scrollY / docHeight : 0;
      if (pct < 0.3) setScrollDepth("top");
      else if (pct < 0.7) setScrollDepth("middle");
      else setScrollDepth("bottom");

      lastScrollY.current = window.scrollY;
      lastScrollTime.current = now;
      resetIdle();
    };

    const handleMouseMove = () => resetIdle();
    
    const handleMouseOver = () => {
      hoverCount.current++;
      setHoverIntensity(Math.min(1, hoverCount.current / 20));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseover", handleMouseOver, { passive: true });

    // Reset hover count every 10s
    hoverResetTimer.current = setInterval(() => {
      hoverCount.current = Math.max(0, hoverCount.current - 5);
      setHoverIntensity(Math.min(1, hoverCount.current / 20));
    }, 10000);

    // Idle duration updater
    const idleInterval = setInterval(() => {
      if (isIdle) {
        setIdleDuration(Date.now() - idleStart.current);
      }
    }, 1000);

    resetIdle();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (hoverResetTimer.current) clearInterval(hoverResetTimer.current);
      clearInterval(idleInterval);
    };
  }, [resetIdle, isIdle]);

  const dynamicCTA = scrollDepth === "top" 
    ? "Explore Work" 
    : scrollDepth === "middle" 
    ? "View Projects" 
    : "Start a Project";

  return { scrollSpeed, scrollDepth, isIdle, idleDuration, hoverIntensity, dynamicCTA };
};
