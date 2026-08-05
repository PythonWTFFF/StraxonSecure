import { motion } from "framer-motion";
import { useState } from "react";
import { Code, Shield, Cpu, Palette } from "lucide-react";
import ProjectDetailDialog from "./ProjectDetailDialog";

const projects = [
  {
    category: "Web Development",
    icon: Code,
    title: "Smart Business Website Platform",
    description: "Designed and developed a responsive, high-performance website with modern UI/UX and scalable architecture.",
    tech: ["React.js", "Node.js", "MongoDB", "Tailwind CSS"],
    features: ["Responsive frontend", "Secure authentication", "Optimized performance", "SEO-ready structure"],
    color: "from-primary/20 to-glow-secondary/20",
  },
  {
    category: "Automation",
    icon: Cpu,
    title: "Workflow Automation System",
    description: "Built a customizable automation solution to reduce manual tasks and improve operational efficiency.",
    tech: ["Python", "Node.js", "Cloud APIs", "Docker"],
    features: ["Automated task execution", "API integrations", "Real-time dashboards", "Secure access control"],
    color: "from-glow-secondary/20 to-primary/20",
  },
  {
    category: "Cybersecurity",
    icon: Shield,
    title: "Web Application Security Assessment",
    description: "Comprehensive vulnerability assessment and penetration testing to identify security risks.",
    tech: ["OWASP", "Burp Suite", "Nmap", "Metasploit"],
    features: ["OWASP scanning", "Exploit testing", "Gap analysis", "Risk mitigation"],
    color: "from-primary/20 to-primary/10",
  },
  {
    category: "Design",
    icon: Palette,
    title: "SaaS Dashboard UI/UX",
    description: "Complete UI/UX design system for a SaaS analytics dashboard with data visualization and branding.",
    tech: ["Figma", "Adobe XD", "Illustrator", "After Effects"],
    features: ["Design system", "Component library", "Data visualizations", "Dark/light themes"],
    color: "from-glow-secondary/20 to-primary/15",
  },
];

const ProjectsSection = () => {
  const [selected, setSelected] = useState<typeof projects[0] | null>(null);

  return (
    <section id="projects" className="py-28 bg-secondary/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-mono text-primary tracking-widest uppercase">Portfolio</span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold text-foreground">Featured Projects</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            A selection of our work across development, design, automation, and security.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project, i) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              onClick={() => setSelected(project)}
              className="group relative rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/40 hover:box-glow cursor-pointer"
            >
              <div className={`h-48 bg-gradient-to-br ${project.color} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--primary)/0.15)_0%,transparent_60%)] group-hover:scale-150 transition-transform duration-700" />
                <project.icon className="relative h-16 w-16 text-primary/60 group-hover:text-primary transition-colors duration-300" />
              </div>
              <div className="p-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono text-primary tracking-wider uppercase bg-primary/10 px-2.5 py-1 rounded">{project.category}</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{project.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{project.description}</p>
                <span className="text-xs font-mono text-primary tracking-wider">View details →</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <ProjectDetailDialog open={!!selected} onOpenChange={() => setSelected(null)} project={selected} />
    </section>
  );
};

export default ProjectsSection;
