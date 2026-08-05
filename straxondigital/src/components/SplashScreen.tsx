import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.8,
          ease: "power2.inOut",
          onComplete: () => {
            setDone(true);
            onComplete();
          },
        });
      },
    });

    // Particles assemble
    const particles = particlesRef.current?.children;
    if (particles) {
      gsap.set(particles, {
        x: () => (Math.random() - 0.5) * window.innerWidth,
        y: () => (Math.random() - 0.5) * window.innerHeight,
        opacity: 0,
        scale: 0,
      });
      tl.to(particles, {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        stagger: 0.005,
        ease: "power2.out",
      })
        .to(particles, {
          x: 0,
          y: 0,
          duration: 1,
          stagger: 0.003,
          ease: "power3.inOut",
        }, "-=0.2")
        .to(particles, { opacity: 0, duration: 0.4 }, "+=0.1");
    }

    tl.fromTo(logoRef.current,
      { opacity: 0, scale: 0.85, filter: "blur(20px)" },
      { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1, ease: "power3.out" },
      "-=0.5"
    )
    .fromTo(lineRef.current,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.6, ease: "power3.inOut" },
      "-=0.4"
    )
    .fromTo(taglineRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5 },
      "-=0.2"
    )
    // Lightning pulse
    .to(logoRef.current, {
      textShadow: "0 0 40px hsl(200 100% 70%), 0 0 80px hsl(200 100% 60%)",
      duration: 0.15,
      yoyo: true,
      repeat: 3,
      ease: "power1.inOut",
    }, "+=0.3")
    .to({}, { duration: 0.4 }); // hold

    return () => {
      tl.kill();
    };
  }, [onComplete, done]);

  if (done) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background overflow-hidden"
      aria-hidden
    >
      <div ref={particlesRef} className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]"
          />
        ))}
      </div>

      <div className="relative flex flex-col items-center gap-4 px-6">
        <div
          ref={logoRef}
          className="font-sans text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-gradient"
          style={{ letterSpacing: "0.02em" }}
        >
          STRAXON DIGITAL
        </div>
        <div ref={lineRef} className="h-px w-64 bg-gradient-to-r from-transparent via-primary to-transparent origin-center" />
        <p ref={taglineRef} className="text-xs sm:text-sm font-mono uppercase tracking-[0.4em] text-muted-foreground">
          Your Automated Digital Empire
        </p>
      </div>
    </div>
  );
};
