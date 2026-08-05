import { motion } from "framer-motion";
import { Code, Palette, Cpu, Shield, Smartphone, Globe, Workflow, Lock } from "lucide-react";

const services = [
  {
    icon: Code,
    title: "Web & App Development",
    description: "Full-stack websites, SaaS platforms, admin dashboards, and API integrations built with modern architectures.",
  },
  {
    icon: Palette,
    title: "Creative Design",
    description: "Logo & brand identity, UI/UX design, web interfaces, app concepts, and marketing creatives.",
  },
  {
    icon: Cpu,
    title: "Automation Software",
    description: "Workflow automation, business process tools, data management systems, and AI-powered dashboards.",
  },
  {
    icon: Shield,
    title: "Offensive Security",
    description: "Penetration testing, vulnerability assessments, ethical hacking, and web application security testing.",
  },
  {
    icon: Lock,
    title: "Defensive Security",
    description: "Security hardening, threat monitoring, risk analysis, secure architecture consulting, and incident response.",
  },
  {
    icon: Smartphone,
    title: "App Development",
    description: "Progressive web apps, mobile-first UI systems, and cross-platform application development.",
  },
];

const ServicesSection = () => {
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
              className="group relative rounded-xl border border-border bg-card p-8 transition-all duration-300 hover:border-primary/40 hover:box-glow"
            >
              <div className="mb-5 inline-flex items-center justify-center rounded-lg bg-primary/10 p-3">
                <service.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{service.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
