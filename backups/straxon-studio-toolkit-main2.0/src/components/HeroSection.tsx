import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Shield, Code, Palette, Cpu } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import creativeLogo from "@/assets/creative.svg";
import devLogo from "@/assets/dev.svg";
import secureLogo from "@/assets/secure.svg";

const floatingVariants = {
  animate: (i: number) => ({
    y: [0, -20, 0],
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 5 + i,
      repeat: Infinity,
      ease: "easeInOut" as const,
      delay: i * 0.3,
    },
  }),
};

const divisionLogos = [
  { logo: creativeLogo, label: "STRAXON Creative", glow: "drop-shadow-[0_0_12px_#ff4ecd]" },
  { logo: devLogo, label: "STRAXON Develop", glow: "drop-shadow-[0_0_12px_#3b82f6]" },
  { logo: secureLogo, label: "STRAXON Secure", glow: "drop-shadow-[0_0_12px_#22c55e]" },
];


const HeroSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Parallax Background */}
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <img src={heroBg} alt="" className="w-full h-[120%] object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </motion.div>

      {/* Animated grid overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />

      {/* Floating particles - hidden on small screens for performance */}
      <div className="hidden sm:block">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={floatingVariants}
            animate="animate"
            className="absolute rounded-full bg-primary/10 border border-primary/20"
            style={{
              width: 30 + i * 15,
              height: 30 + i * 15,
              left: `${8 + i * 12}%`,
              top: `${20 + (i % 4) * 15}%`,
            }}
          />
        ))}
      </div>

      {/* Glowing orbs */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-48 sm:w-96 h-48 sm:h-96 rounded-full bg-primary/10 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-40 sm:w-80 h-40 sm:h-80 rounded-full bg-glow-secondary/10 blur-3xl"
      />

      <motion.div style={{ y: textY, opacity }} className="relative z-10 container mx-auto px-4 sm:px-6 py-20 sm:py-32 text-center">
        {/* Three Division Logo Placeholders */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
          className="flex items-center justify-center gap-3 sm:gap-6 mb-6 sm:mb-8"
        >
          {divisionLogos.map((div, i) => (
            <motion.div
              key={div.label}
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15, type: "spring", bounce: 0.4 }}
              className="flex flex-col items-center gap-1 sm:gap-2"
            >
              <div className="h-14 w-14 sm:h-18 sm:w-18 md:h-20 md:w-20 rounded-xl sm:rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 flex items-center justify-center relative group hover:border-primary/70 transition-colors cursor-default">
               <motion.img
  src={div.logo}
  alt={div.label}
  className={`h-8 w-8 sm:h-10 sm:w-10 object-contain transition-all duration-300 group-hover:scale-110 group-hover:brightness-125 ${div.glow}`}

/>

              </div>
              <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground tracking-wider mt-2 sm:mt-3">{div.label.split(" ")[1]}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 sm:px-4 py-1.5 mb-6 sm:mb-8"
        >
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs sm:text-sm font-mono text-primary tracking-wide">Build • Automate • Design • Secure</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black tracking-tight leading-tight max-w-5xl mx-auto">
          {["Engineering", "Digital", "Experiences", "with"].map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              className="inline-block mr-2 sm:mr-3 text-foreground"
            >
              {word}
            </motion.span>
          ))}
          <br />
          <motion.span
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.5, type: "spring" }}
            className="text-primary text-glow inline-block"
          >
            Intelligence
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-foreground inline-block mx-2 sm:mx-3"
          >
            &
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.65, type: "spring" }}
            className="text-primary text-glow inline-block"
          >
            Security
          </motion.span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-4 sm:mt-6 text-sm sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
        >
          STRAXON LABS delivers full-stack development, intelligent automation,
          creative design, and advanced cybersecurity solutions.
        </motion.p>

        {/* Capability pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-8 sm:mt-10"
        >
          {[
            { icon: Code, label: "Full-Stack Development" },
            { icon: Palette, label: "Creative Design" },
            { icon: Cpu, label: "Automation Software" },
            { icon: Shield, label: "Cybersecurity" },
          ].map(({ icon: Icon, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 + i * 0.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-border bg-card/50 px-3 sm:px-4 py-1.5 sm:py-2 backdrop-blur-sm cursor-default"
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-foreground">{label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <Link
            to="/projects"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 sm:px-8 py-3 sm:py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:box-glow-strong hover:scale-105"
          >
            View Our Work
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/contact"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-6 sm:px-8 py-3 sm:py-3.5 text-sm font-semibold text-secondary-foreground transition-all hover:border-primary/50"
          >
            Get in Touch
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll indicator - hidden on very small screens */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 hidden sm:block"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-1"
        >
          <motion.div className="w-1.5 h-3 rounded-full bg-primary/50" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
