import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  Code, Palette, Cpu, Shield, Lock, Smartphone, Globe, Workflow,
  ArrowRight, CheckCircle2, ArrowLeft
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const serviceDetails = [
  {
    id: "development",
    icon: Code,
    title: "Web & App Development",
    subtitle: "STRAXON DEVELOP",
    description: "Full-stack websites, SaaS platforms, admin dashboards, and API integrations built with modern architectures.",
    features: [
      "Custom responsive websites",
      "SaaS platform development",
      "Admin dashboards & portals",
      "REST & GraphQL API development",
      "E-commerce solutions",
      "Progressive web apps",
    ],
    tech: ["React.js", "Node.js", "TypeScript", "MongoDB", "PostgreSQL", "Tailwind CSS"],
  },
  {
    id: "design",
    icon: Palette,
    title: "Creative Design",
    subtitle: "STRAXON CREATIVE",
    description: "Logo & brand identity, UI/UX design, web interfaces, app concepts, and marketing creatives.",
    features: [
      "Logo & brand identity systems",
      "UI/UX design & prototyping",
      "Web & app interface design",
      "Marketing creatives & banners",
      "Motion graphics & animation",
      "Design system creation",
    ],
    tech: ["Figma", "Adobe XD", "Illustrator", "After Effects", "Photoshop", "Blender"],
  },
  {
    id: "automation",
    icon: Cpu,
    title: "Automation Software",
    subtitle: "STRAXON LABS",
    description: "Workflow automation, business process tools, data management systems, and AI-powered dashboards.",
    features: [
      "Workflow automation systems",
      "Business process automation",
      "Data pipeline management",
      "AI-powered analytics dashboards",
      "Custom internal tools",
      "API integration & orchestration",
    ],
    tech: ["Python", "Node.js", "Docker", "Cloud APIs", "TensorFlow", "Redis"],
  },
  {
    id: "offensive-security",
    icon: Shield,
    title: "Offensive Security",
    subtitle: "STRAXON SECURE",
    description: "Penetration testing, vulnerability assessments, ethical hacking, and web application security testing.",
    features: [
      "Penetration testing",
      "Vulnerability assessment",
      "Ethical hacking engagements",
      "Web application security testing",
      "Network exploitation testing",
      "Security audits & reporting",
    ],
    tech: ["Burp Suite", "Metasploit", "Nmap", "OWASP ZAP", "Kali Linux", "Wireshark"],
  },
  {
    id: "defensive-security",
    icon: Lock,
    title: "Defensive Security",
    subtitle: "STRAXON SECURE",
    description: "Security hardening, threat monitoring, risk analysis, secure architecture consulting, and incident response.",
    features: [
      "Security architecture consulting",
      "Threat monitoring & detection",
      "Risk analysis & mitigation",
      "System hardening",
      "Incident response planning",
      "Data protection strategy",
    ],
    tech: ["SIEM", "IDS/IPS", "Firewalls", "Splunk", "AWS Security", "Zero Trust"],
  },
  {
    id: "app-dev",
    icon: Smartphone,
    title: "App Development",
    subtitle: "STRAXON DEVELOP",
    description: "Progressive web apps, mobile-first UI systems, and cross-platform application development.",
    features: [
      "Cross-platform mobile apps",
      "Progressive web applications",
      "Mobile-first UI systems",
      "Native app prototyping",
      "App store deployment",
      "Performance optimization",
    ],
    tech: ["React Native", "Flutter", "Swift", "Kotlin", "Firebase", "PWA"],
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const Services = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-16">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 container mx-auto px-6 py-24 text-center">
          <motion.span {...fadeUp} className="text-sm font-mono text-primary tracking-widest uppercase">What We Do</motion.span>
          <motion.h1 {...fadeUp} transition={{ delay: 0.1, duration: 0.6 }} className="mt-4 text-4xl md:text-6xl font-black text-foreground">
            Our <span className="text-primary text-glow">Services</span>
          </motion.h1>
          <motion.p {...fadeUp} transition={{ delay: 0.2, duration: 0.6 }} className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            End-to-end digital solutions from concept to deployment and beyond. We cover development, design, automation, and cybersecurity.
          </motion.p>
        </motion.div>
      </section>

      {/* Service Detail Cards */}
      <section className="pb-28">
        <div className="container mx-auto px-6 space-y-20">
          {serviceDetails.map((service, i) => (
            <motion.div
              key={service.id}
              {...fadeUp}
              transition={{ delay: 0.1, duration: 0.6 }}
              className={`flex flex-col ${i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} gap-10 items-center`}
            >
              {/* Icon / Visual */}
              <div className="flex-shrink-0 w-full lg:w-2/5">
                <div className="relative aspect-square max-w-sm mx-auto rounded-2xl border border-border bg-card overflow-hidden flex items-center justify-center group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-glow-secondary/10 group-hover:from-primary/20 group-hover:to-glow-secondary/20 transition-all duration-500" />
                  <service.icon className="relative z-10 h-24 w-24 text-primary/50 group-hover:text-primary group-hover:scale-110 transition-all duration-500" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="text-xs font-mono text-primary/60 tracking-widest">{service.subtitle}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 mb-4">
                  <service.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-mono text-primary tracking-wider uppercase">{service.subtitle}</span>
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-4">{service.title}</h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">{service.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {service.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground">{f}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {service.tech.map((t) => (
                    <span key={t} className="text-xs font-mono text-muted-foreground border border-border rounded px-2 py-1">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-6 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to start your project?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Let's discuss how we can engineer the perfect solution for your business.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-10 py-4 text-base font-semibold text-primary-foreground transition-all hover:box-glow-strong hover:scale-105"
            >
              Get in Touch <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
