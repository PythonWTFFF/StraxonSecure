import { motion } from "framer-motion";
import { useState } from "react";
import { Code, Palette, Cpu, Shield, Smartphone, Lock } from "lucide-react";
import ServiceDetailDialog from "./ServiceDetailDialog";

const services = [
  {
    icon: Code,
    title: "Web & App Development",
    subtitle: "STRAXON DEVELOP",
    description: "Full-stack websites, SaaS platforms, admin dashboards, and API integrations built with modern architectures.",
    features: ["Custom responsive websites", "SaaS platform development", "Admin dashboards & portals", "REST & GraphQL APIs"],
    tech: ["React.js", "Node.js", "TypeScript", "MongoDB"],
  },
  {
    icon: Palette,
    title: "Creative Design",
    subtitle: "STRAXON CREATIVE",
    description: "Logo & brand identity, UI/UX design, web interfaces, app concepts, and marketing creatives.",
    features: ["Logo & brand identity", "UI/UX design & prototyping", "Marketing creatives", "Design systems"],
    tech: ["Figma", "Adobe XD", "Illustrator", "After Effects"],
  },
  {
    icon: Cpu,
    title: "Automation Software",
    subtitle: "STRAXON LABS",
    description: "Workflow automation, business process tools, data management systems, and AI-powered dashboards.",
    features: ["Workflow automation", "Business process automation", "AI analytics dashboards", "API orchestration"],
    tech: ["Python", "Node.js", "Docker", "Cloud APIs"],
  },
  {
    icon: Shield,
    title: "Offensive Security",
    subtitle: "STRAXON SECURE",
    description: "Penetration testing, vulnerability assessments, ethical hacking, and web application security testing.",
    features: ["Penetration testing", "Vulnerability assessment", "Ethical hacking", "Security audits"],
    tech: ["Burp Suite", "Metasploit", "Nmap", "OWASP ZAP"],
  },
  {
    icon: Lock,
    title: "Defensive Security",
    subtitle: "STRAXON SECURE",
    description: "Security hardening, threat monitoring, risk analysis, secure architecture consulting, and incident response.",
    features: ["Security consulting", "Threat monitoring", "Risk analysis", "Incident response"],
    tech: ["SIEM", "IDS/IPS", "Splunk", "AWS Security"],
  },
  {
    icon: Smartphone,
    title: "App Development",
    subtitle: "STRAXON DEVELOP",
    description: "Progressive web apps, mobile-first UI systems, and cross-platform application development.",
    features: ["Cross-platform apps", "Progressive web apps", "Mobile-first UI", "Performance optimization"],
    tech: ["React Native", "Flutter", "Firebase", "PWA"],
  },
];

const ServicesSection = () => {
  const [selected, setSelected] = useState<typeof services[0] | null>(null);

  return (
    <section id="services" className="py-28 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-mono text-primary tracking-widest uppercase">What We Do</span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold text-foreground">Our Services</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            End-to-end digital solutions from concept to deployment and beyond.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5, scale: 1.01 }}
              onClick={() => setSelected(service)}
              className="group relative rounded-xl border border-border bg-card p-8 transition-all duration-300 hover:border-primary/40 hover:box-glow cursor-pointer"
            >
              <div className="mb-5 inline-flex items-center justify-center rounded-lg bg-primary/10 p-3">
                <service.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{service.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">{service.description}</p>
              <span className="text-xs font-mono text-primary tracking-wider">Click to learn more →</span>
            </motion.div>
          ))}
        </div>
      </div>

      <ServiceDetailDialog open={!!selected} onOpenChange={() => setSelected(null)} service={selected} />
    </section>
  );
};

export default ServicesSection;
