import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Target, Eye, Zap, Users, Award, Globe, ArrowRight, Palette, Code, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const divisions = [
  {
    name: "STRAXON Creative",
    tagline: "Design & Visual Identity",
    description: "Crafting visual identities that resonate. Logo design, branding, UI/UX, and marketing creatives.",
    icon: Palette,
    color: "from-glow-secondary/20 to-primary/10",
  },
  {
    name: "STRAXON Develop",
    tagline: "Engineering & Development",
    description: "Building robust, scalable digital solutions. Full-stack development, SaaS, mobile apps, and automation.",
    icon: Code,
    color: "from-primary/20 to-glow-secondary/10",
  },
  {
    name: "STRAXON Secure",
    tagline: "Cybersecurity & Protection",
    description: "Protecting digital assets with offensive and defensive security services. Pen testing, audits, and consulting.",
    icon: Shield,
    color: "from-primary/15 to-primary/5",
  },
];

const stats = [
  { value: "50+", label: "Projects Delivered" },
  { value: "30+", label: "Happy Clients" },
  { value: "3", label: "Sub-Brands" },
  { value: "24/7", label: "Support" },
];

const values = [
  { icon: Target, title: "Mission-Driven", description: "Every project starts with understanding your goals and engineering the perfect solution." },
  { icon: Eye, title: "Vision Forward", description: "We stay ahead of technology trends to future-proof your digital infrastructure." },
  { icon: Zap, title: "Innovation First", description: "We push boundaries with cutting-edge tools, frameworks, and methodologies." },
  { icon: Award, title: "Quality Obsessed", description: "Every line of code, every pixel, and every security audit meets our exacting standards." },
];

const About = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero */}
        <section ref={heroRef} className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-16">
          {/* Floating shapes */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-primary/5 border border-primary/10"
                style={{ width: 80 + i * 50, height: 80 + i * 50, left: `${20 + i * 20}%`, top: `${30 + (i % 2) * 20}%` }}
                animate={{ y: [0, -25, 0], rotate: [0, 90, 180, 270, 360] }}
                transition={{ duration: 10 + i * 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
              />
            ))}
          </div>

          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 container mx-auto px-6 py-24 text-center">
            <motion.span {...fadeUp} className="text-sm font-mono text-primary tracking-widest uppercase">Who We Are</motion.span>
            <motion.h1 {...fadeUp} transition={{ delay: 0.1, duration: 0.6 }} className="mt-4 text-4xl md:text-6xl lg:text-7xl font-black text-foreground">
              About <span className="text-primary text-glow">STRAXON LABS</span>
            </motion.h1>
            <motion.p {...fadeUp} transition={{ delay: 0.2, duration: 0.6 }} className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              A multi-domain technology studio combining design innovation, software engineering, intelligent automation, and advanced cybersecurity expertise.
            </motion.p>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-secondary/30 border-y border-border">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-black text-primary text-glow">{stat.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-28">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
              <motion.div {...fadeUp}>
                <span className="text-sm font-mono text-primary tracking-widest uppercase">Our Story</span>
                <h2 className="mt-3 text-3xl md:text-4xl font-bold text-foreground">Building the Future, One Project at a Time</h2>
                <p className="mt-6 text-muted-foreground leading-relaxed">
                  STRAXON LABS was founded with a clear vision: to bridge the gap between exceptional design, robust engineering, and ironclad security. We noticed that businesses often had to work with multiple agencies to get the full picture—one for design, another for development, and yet another for security.
                </p>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  We built STRAXON LABS to be the single destination where creativity meets code meets protection. Our three specialized divisions—Creative, Develop, and Secure—work in harmony to deliver complete digital solutions.
                </p>
              </motion.div>
              <motion.div
                {...fadeUp}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="relative rounded-2xl border border-border bg-card p-8 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-glow-secondary/5" />
                <div className="relative space-y-6">
                  {values.map((v, i) => (
                    <motion.div
                      key={v.title}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.1 }}
                      className="flex items-start gap-4"
                    >
                      <div className="rounded-lg bg-primary/10 p-2.5 flex-shrink-0">
                        <v.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{v.title}</h4>
                        <p className="text-sm text-muted-foreground">{v.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Divisions */}
        <section className="py-28 bg-secondary/30">
          <div className="container mx-auto px-6">
            <motion.div {...fadeUp} className="text-center mb-16">
              <span className="text-sm font-mono text-primary tracking-widest uppercase">Our Divisions</span>
              <h2 className="mt-3 text-3xl md:text-5xl font-bold text-foreground">Three Brands, One Vision</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Each division brings specialized expertise, working together to deliver complete solutions.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {divisions.map((div, i) => (
                <motion.div
                  key={div.name}
                  initial={{ opacity: 0, y: 50, rotateX: 15 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.7 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="relative rounded-2xl border border-border bg-card p-8 text-center group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Logo placeholder */}
                  <div className="relative mx-auto mb-6 h-28 w-28 rounded-2xl border-2 border-dashed border-primary/30 flex items-center justify-center bg-primary/5 group-hover:border-primary/60 transition-colors">
                    <div.icon className="h-12 w-12 text-primary/40 group-hover:text-primary transition-colors" />
                    <span className="absolute -bottom-2 text-[10px] font-mono text-muted-foreground bg-card px-2">YOUR LOGO</span>
                  </div>

                  <h3 className="relative text-xl font-bold text-foreground mb-1">{div.name}</h3>
                  <p className="relative text-xs font-mono text-primary tracking-wider uppercase mb-4">{div.tagline}</p>
                  <p className="relative text-sm text-muted-foreground leading-relaxed">{div.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-6 text-center">
            <motion.div {...fadeUp}>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready to work with us?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Let's turn your vision into reality with the power of all three STRAXON divisions.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-10 py-4 text-base font-semibold text-primary-foreground transition-all hover:box-glow-strong hover:scale-105"
              >
                Get Started <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default About;
