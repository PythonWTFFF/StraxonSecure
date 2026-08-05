import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Palette, PenTool, Layout, Image, Layers, Sparkles, ArrowRight, ImageIcon, Maximize2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import ImageLightbox from "@/components/ImageLightbox";

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
      { name: "Tech Startup Logo Suite", tools: "Illustrator, Figma", description: "Complete logo system with variations for a tech startup including horizontal, stacked, and icon-only versions.", images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"] },
      { name: "Corporate Identity Marks", tools: "Illustrator, Photoshop", description: "Professional logo marks for corporate clients with multiple applications across stationery, digital, and signage.", images: ["/placeholder.svg", "/placeholder.svg"] },
      { name: "Brand Monogram Collection", tools: "Illustrator", description: "Elegant monogram designs for luxury brands with gold foil and embossing-ready vector files.", images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"] },
    ],
  },
  {
    title: "Graphics Design",
    icon: Image,
    items: [
      { name: "Social Media Campaign", tools: "Photoshop, Canva", description: "Eye-catching social media graphics and templates optimized for Instagram, LinkedIn, and Twitter.", images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg", "/placeholder.svg"] },
      { name: "Marketing Collateral Set", tools: "InDesign, Illustrator", description: "Brochures, flyers, and presentation decks with cohesive visual language.", images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"] },
      { name: "Digital Ad Creatives", tools: "Photoshop, After Effects", description: "Animated and static ad banners for campaigns across Google Display Network and social platforms.", images: ["/placeholder.svg", "/placeholder.svg"] },
    ],
  },
  {
    title: "UI/UX Design",
    icon: Layout,
    items: [
      { name: "SaaS Dashboard Design", tools: "Figma, Framer", description: "Data-rich analytics dashboard with clean UX, interactive charts, and comprehensive component library.", images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"] },
      { name: "Mobile App Interface", tools: "Figma, Principle", description: "Mobile-first app design with micro-interactions, gesture-based navigation, and accessibility compliance.", images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"] },
      { name: "E-commerce Experience", tools: "Adobe XD, Figma", description: "Complete e-commerce UI with checkout flows, product galleries, and personalized recommendation panels.", images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg", "/placeholder.svg"] },
    ],
  },
  {
    title: "Brand Identity",
    icon: Layers,
    items: [
      { name: "Complete Brand Book", tools: "InDesign, Illustrator", description: "Full brand guidelines with typography systems, color palette, iconography, and usage examples.", images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"] },
      { name: "Visual Identity System", tools: "Figma, Illustrator", description: "Comprehensive visual identity with applications across business cards, letterheads, and social media.", images: ["/placeholder.svg", "/placeholder.svg"] },
      { name: "Packaging Design", tools: "Illustrator, Photoshop", description: "Product packaging with premium finish concepts, 3D mockups, and production-ready dielines.", images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"] },
    ],
  },
];

const DesignPortfolio = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Parallax Hero */}
        <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-primary/5 border border-primary/10"
                style={{ width: 100 + i * 60, height: 100 + i * 60, left: `${10 + i * 15}%`, top: `${20 + (i % 3) * 20}%` }}
                animate={{ y: [0, -30, 0], rotate: [0, 180, 360], scale: [1, 1.05, 1] }}
                transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
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
              Click any project to view work samples in fullscreen. Upload your own work to showcase your portfolio.
            </motion.p>
          </motion.div>
        </section>

        {/* Sub-brands */}
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
                  <div className="relative mx-auto mb-6 h-28 w-28 rounded-2xl border-2 border-dashed border-primary/30 flex items-center justify-center bg-primary/5 group-hover:border-primary/60 transition-colors">
                    <brand.icon className="h-12 w-12 text-primary/40 group-hover:text-primary transition-colors" />
                    <span className="absolute -bottom-2 text-[10px] font-mono text-muted-foreground bg-card px-2">YOUR LOGO</span>
                  </div>

                  <h3 className="relative text-xl font-bold text-foreground mb-1">{brand.name}</h3>
                  <p className="relative text-xs font-mono text-primary tracking-wider uppercase mb-4">{brand.tagline}</p>
                  <p className="relative text-sm text-muted-foreground leading-relaxed">{brand.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Design Categories */}
        <section className="py-28">
          <div className="container mx-auto px-6 space-y-24">
            {designCategories.map((category) => (
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
                    <p className="text-sm text-muted-foreground">{category.items.length} projects • Click images to view fullscreen</p>
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
                      className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/40 hover:box-glow"
                    >
                      {/* Main image placeholder - clickable for fullscreen */}
                      <div
                        onClick={() => setLightbox({ images: item.images, index: 0 })}
                        className="aspect-video bg-gradient-to-br from-primary/10 to-glow-secondary/10 flex items-center justify-center relative overflow-hidden cursor-pointer"
                      >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.1)_0%,transparent_70%)] group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative flex flex-col items-center gap-2">
                          <ImageIcon className="h-10 w-10 text-primary/30 group-hover:text-primary/60 transition-colors duration-300" />
                          <span className="text-[10px] font-mono text-muted-foreground/50">Upload your work</span>
                        </div>
                        {/* Fullscreen hint */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="rounded-full bg-background/80 backdrop-blur-sm p-1.5 border border-border">
                            <Maximize2 className="h-3.5 w-3.5 text-primary" />
                          </div>
                        </div>
                        {/* Image count */}
                        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-background/80 backdrop-blur-sm px-2 py-1 border border-border">
                          <ImageIcon className="h-3 w-3 text-primary" />
                          <span className="text-[10px] font-mono text-foreground">{item.images.length}</span>
                        </div>
                      </div>

                      {/* Thumbnail strip */}
                      {item.images.length > 1 && (
                        <div className="flex gap-1 px-3 pt-3">
                          {item.images.slice(0, 4).map((img, idx) => (
                            <div
                              key={idx}
                              onClick={() => setLightbox({ images: item.images, index: idx })}
                              className="flex-1 aspect-square rounded border border-dashed border-primary/20 bg-primary/5 flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/10 transition-all"
                            >
                              <span className="text-[8px] font-mono text-muted-foreground/40">{idx + 1}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-6">
                        <h4 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{item.name}</h4>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{item.description}</p>
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
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Have a design project in mind?</h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Let's create something visually stunning together.</p>
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-lg bg-primary px-10 py-4 text-base font-semibold text-primary-foreground transition-all hover:box-glow-strong hover:scale-105">
                Start a Project <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {lightbox && (
          <ImageLightbox
            images={lightbox.images}
            initialIndex={lightbox.index}
            open={true}
            onClose={() => setLightbox(null)}
          />
        )}
        <Footer />
      </div>
    </PageTransition>
  );
};

export default DesignPortfolio;
