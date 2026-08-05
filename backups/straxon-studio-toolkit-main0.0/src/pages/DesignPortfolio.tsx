import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Palette, PenTool, Layout, Image, Layers, Sparkles, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const brands = [
  {
    name: "STRAXON Creative",
    tagline: "Design & Visual Identity",
    description: "Crafting visual identities that resonate. From logo design to complete brand systems.",
    icon: Palette,
  },
  {
    name: "STRAXON Develop",
    tagline: "Digital Products & Interfaces",
    description: "Building beautiful, functional digital experiences with precision engineering.",
    icon: Layout,
  },
  {
    name: "STRAXON Secure",
    tagline: "Security-First Design",
    description: "Designing secure systems with user-friendly interfaces for cybersecurity tools.",
    icon: Sparkles,
  },
];

const designCategories = [
  {
    title: "Logo Design",
    icon: PenTool,
    items: [
      { name: "Tech Startup Logo Suite", tools: "Illustrator, Figma", description: "Complete logo system with variations for a tech startup" },
      { name: "Corporate Identity Marks", tools: "Illustrator, Photoshop", description: "Professional logo marks for corporate clients" },
      { name: "Brand Monogram Collection", tools: "Illustrator", description: "Elegant monogram designs for luxury brands" },
    ],
  },
  {
    title: "Graphics Design",
    icon: Image,
    items: [
      { name: "Social Media Campaign", tools: "Photoshop, Canva", description: "Eye-catching social media graphics and templates" },
      { name: "Marketing Collateral Set", tools: "InDesign, Illustrator", description: "Brochures, flyers, and presentation decks" },
      { name: "Digital Ad Creatives", tools: "Photoshop, After Effects", description: "Animated and static ad banners for campaigns" },
    ],
  },
  {
    title: "UI/UX Design",
    icon: Layout,
    items: [
      { name: "SaaS Dashboard Design", tools: "Figma, Framer", description: "Data-rich analytics dashboard with clean UX" },
      { name: "Mobile App Interface", tools: "Figma, Principle", description: "Mobile-first app design with micro-interactions" },
      { name: "E-commerce Experience", tools: "Adobe XD, Figma", description: "Complete e-commerce UI with checkout flows" },
    ],
  },
  {
    title: "Brand Identity",
    icon: Layers,
    items: [
      { name: "Complete Brand Book", tools: "InDesign, Illustrator", description: "Full brand guidelines with typography and color systems" },
      { name: "Visual Identity System", tools: "Figma, Illustrator", description: "Comprehensive visual identity with applications" },
      { name: "Packaging Design", tools: "Illustrator, Photoshop", description: "Product packaging with premium finish concepts" },
    ],
  },
];

const DesignPortfolio = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Parallax Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Floating shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-primary/5 border border-primary/10"
              style={{
                width: 100 + i * 60,
                height: 100 + i * 60,
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [0, -30, 0],
                rotate: [0, 180, 360],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            />
          ))}
        </div>

        <motion.div style={{ y: heroY, scale: heroScale }} className="relative z-10 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 mb-8"
          >
            <Palette className="h-4 w-4 text-primary" />
            <span className="text-sm font-mono text-primary tracking-wide">Design Portfolio</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black text-foreground leading-tight"
          >
            Where <span className="text-primary text-glow">Creativity</span>
            <br />
            Meets <span className="text-primary text-glow">Code</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Explore our design portfolio across logo design, graphics, UI/UX, and complete brand identity systems.
          </motion.p>
        </motion.div>
      </section>

      {/* Sub-brands Section */}
      <section className="py-28 bg-secondary/30">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-sm font-mono text-primary tracking-widest uppercase">Our Brands</span>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold text-foreground">Design Divisions</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {brands.map((brand, i) => (
              <motion.div
                key={brand.name}
                initial={{ opacity: 0, y: 50, rotateX: 15 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.7 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="relative rounded-2xl border border-border bg-card p-8 text-center group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Logo placeholder */}
                <div className="relative mx-auto mb-6 h-24 w-24 rounded-2xl border-2 border-dashed border-primary/30 flex items-center justify-center bg-primary/5 group-hover:border-primary/60 transition-colors">
                  <brand.icon className="h-10 w-10 text-primary/40 group-hover:text-primary transition-colors" />
                  <span className="absolute -bottom-2 text-[10px] font-mono text-muted-foreground bg-card px-2">LOGO</span>
                </div>

                <h3 className="relative text-xl font-bold text-foreground mb-1">{brand.name}</h3>
                <p className="relative text-xs font-mono text-primary tracking-wider uppercase mb-4">{brand.tagline}</p>
                <p className="relative text-sm text-muted-foreground leading-relaxed">{brand.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Design Categories with Parallax */}
      <section className="py-28">
        <div className="container mx-auto px-6 space-y-24">
          {designCategories.map((category, catIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="flex items-center gap-4 mb-10">
                <div className="rounded-lg bg-primary/10 p-3">
                  <category.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">{category.items.length} projects</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {category.items.map((item, i) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    whileHover={{ y: -5 }}
                    className="group rounded-xl border border-border bg-card overflow-hidden"
                  >
                    {/* Image placeholder */}
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-glow-secondary/10 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.1)_0%,transparent_70%)] group-hover:scale-150 transition-transform duration-700" />
                      <category.icon className="relative h-12 w-12 text-primary/30 group-hover:text-primary/60 transition-colors duration-300" />
                    </div>
                    <div className="p-6">
                      <h4 className="text-lg font-bold text-foreground mb-2">{item.name}</h4>
                      <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                      <span className="text-xs font-mono text-primary/60">{item.tools}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Have a design project in mind?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Let's create something visually stunning together.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-10 py-4 text-base font-semibold text-primary-foreground transition-all hover:box-glow-strong hover:scale-105"
            >
              Start a Project <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DesignPortfolio;
