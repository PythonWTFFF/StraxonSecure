import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Code, Shield, Cpu, Palette, ArrowRight, ImageIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import ImageLightbox from "@/components/ImageLightbox";

const allProjects = [
  {
    category: "Web Development",
    icon: Code,
    title: "Smart Business Website Platform",
    description: "Designed and developed a responsive, high-performance website tailored to business needs with modern UI/UX and scalable architecture.",
    tech: ["React.js", "Node.js", "MongoDB", "Tailwind CSS"],
    features: ["Responsive frontend", "Secure authentication", "Optimized performance", "SEO-ready structure"],
    color: "from-primary/20 to-glow-secondary/20",
    images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
  },
  {
    category: "Web Development",
    icon: Code,
    title: "E-Commerce Platform",
    description: "Full-featured e-commerce solution with product management, cart system, payment integration, and admin dashboard.",
    tech: ["Next.js", "Stripe", "PostgreSQL", "Redis"],
    features: ["Payment processing", "Inventory management", "Real-time analytics", "Mobile-optimized"],
    color: "from-primary/15 to-glow-secondary/25",
    images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
  },
  {
    category: "Automation",
    icon: Cpu,
    title: "Workflow Automation System",
    description: "Built a customizable automation solution to reduce manual tasks and improve operational efficiency for businesses.",
    tech: ["Python", "Node.js", "Cloud APIs", "Docker"],
    features: ["Automated task execution", "API integrations", "Real-time dashboards", "Secure access control"],
    color: "from-glow-secondary/20 to-primary/20",
    images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
  },
  {
    category: "Automation",
    icon: Cpu,
    title: "AI Data Pipeline Manager",
    description: "Intelligent data processing pipeline with ML-powered insights and automated reporting dashboards.",
    tech: ["Python", "TensorFlow", "Apache Kafka", "AWS"],
    features: ["ML model integration", "Stream processing", "Auto-scaling", "Custom alerts"],
    color: "from-glow-secondary/15 to-primary/25",
    images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
  },
  {
    category: "Cybersecurity",
    icon: Shield,
    title: "Web Application Security Assessment",
    description: "Comprehensive vulnerability assessment and penetration testing to identify security risks and improve system resilience.",
    tech: ["OWASP", "Burp Suite", "Nmap", "Metasploit"],
    features: ["OWASP vulnerability scanning", "Exploit testing", "Security gap analysis", "Risk mitigation"],
    color: "from-primary/20 to-primary/10",
    images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
  },
  {
    category: "Cybersecurity",
    icon: Shield,
    title: "Network Security Audit",
    description: "Complete network infrastructure security audit with threat modeling and hardening recommendations.",
    tech: ["Wireshark", "Nessus", "Kali Linux", "Splunk"],
    features: ["Network mapping", "Threat modeling", "Compliance checking", "Hardening guide"],
    color: "from-primary/15 to-primary/20",
    images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
  },
  {
    category: "Design",
    icon: Palette,
    title: "SaaS Dashboard UI/UX",
    description: "Complete UI/UX design system for a SaaS analytics dashboard with data visualization and comprehensive branding.",
    tech: ["Figma", "Adobe XD", "Illustrator", "After Effects"],
    features: ["Design system", "Component library", "Data visualizations", "Dark/light themes"],
    color: "from-glow-secondary/20 to-primary/15",
    images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
  },
  {
    category: "Design",
    icon: Palette,
    title: "Mobile App Brand Identity",
    description: "Complete brand identity and mobile app UI design for a fintech startup, from logo to final screens.",
    tech: ["Figma", "Illustrator", "Principle", "Lottie"],
    features: ["Brand guidelines", "App UI screens", "Micro-animations", "Icon set"],
    color: "from-glow-secondary/15 to-primary/20",
    images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
  },
];

const categories = ["All", "Web Development", "Design", "Automation", "Cybersecurity"];

const Projects = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const filtered = selectedCategory === "All" ? allProjects : allProjects.filter((p) => p.category === selectedCategory);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />

        <section className="pt-32 pb-28">
          <div className="container mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
              <span className="text-sm font-mono text-primary tracking-widest uppercase">Portfolio</span>
              <h1 className="mt-4 text-4xl md:text-6xl font-black text-foreground">
                Our <span className="text-primary text-glow">Projects</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                Click any project to see screenshots and detailed information about our work.
              </p>
            </motion.div>

            {/* Category Filter */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-wrap gap-3 mb-10 justify-center">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filtered.map((project, i) => {
                const isExpanded = expandedProject === project.title;
                return (
                  <motion.div
                    key={project.title}
                    layout
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (i % 4) * 0.1, duration: 0.5 }}
                    className="group relative rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/40 hover:box-glow"
                  >
                    {/* Main card area */}
                    <div
                      onClick={() => setExpandedProject(isExpanded ? null : project.title)}
                      className="cursor-pointer"
                    >
                      <div className={`h-56 bg-gradient-to-br ${project.color} flex items-center justify-center relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--primary)/0.15)_0%,transparent_60%)] group-hover:scale-150 transition-transform duration-700" />
                        <project.icon className="relative h-20 w-20 text-primary/40 group-hover:text-primary/70 transition-all duration-500 group-hover:scale-110" />
                        {/* Image count badge */}
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur-sm px-3 py-1.5 border border-border">
                          <ImageIcon className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-mono text-foreground">{project.images.length}</span>
                        </div>
                      </div>

                      <div className="p-8">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-mono text-primary tracking-wider uppercase bg-primary/10 px-2.5 py-1 rounded">{project.category}</span>
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-3">{project.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-4">{project.description}</p>
                        <span className="text-xs font-mono text-primary tracking-wider">
                          {isExpanded ? "Click to collapse ↑" : "Click to expand ↓"}
                        </span>
                      </div>
                    </div>

                    {/* Expanded detail section */}
                    <motion.div
                      initial={false}
                      animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-8 space-y-6">
                        <div className="h-px bg-border" />

                        {/* Image gallery */}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-primary" /> Project Screenshots
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            {project.images.map((img, idx) => (
                              <motion.div
                                key={idx}
                                whileHover={{ scale: 1.03 }}
                                onClick={(e) => { e.stopPropagation(); setLightbox({ images: project.images, index: idx }); }}
                                className="aspect-video rounded-lg border border-dashed border-primary/30 bg-primary/5 flex items-center justify-center cursor-pointer hover:border-primary/60 hover:bg-primary/10 transition-all group/img overflow-hidden"
                              >
                                <img
                                  src={img}
                                  alt={`${project.title} screenshot ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                                  }}
                                />
                                <div className="hidden flex-col items-center gap-1">
                                  <ImageIcon className="h-6 w-6 text-primary/30 group-hover/img:text-primary/60 transition-colors" />
                                  <span className="text-[10px] font-mono text-muted-foreground">Image {idx + 1}</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Features */}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">Key Features</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {project.features.map((f) => (
                              <div key={f} className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                <span className="text-sm text-muted-foreground">{f}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tech */}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">Tech Stack</h4>
                          <div className="flex flex-wrap gap-2">
                            {project.tech.map((t) => (
                              <span key={t} className="text-xs font-mono text-muted-foreground border border-border rounded px-2 py-1">{t}</span>
                            ))}
                          </div>
                        </div>

                        <Link
                          to="/contact"
                          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:box-glow-strong hover:scale-[1.02] w-full justify-center"
                        >
                          Start a Similar Project <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Want to see more?</h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Let's discuss your project and how we can help.</p>
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-lg bg-primary px-10 py-4 text-base font-semibold text-primary-foreground transition-all hover:box-glow-strong hover:scale-105">
                Get in Touch <ArrowRight className="h-5 w-5" />
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

export default Projects;
