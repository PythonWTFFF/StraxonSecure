import { motion } from "framer-motion";

const techStack = [
  "React.js", "Node.js", "Python", "TypeScript", "MongoDB",
  "PostgreSQL", "Docker", "AWS", "Tailwind CSS", "Figma",
  "Burp Suite", "Metasploit", "Linux", "Git", "REST APIs",
];

const TechStackSection = () => {
  return (
    <section className="py-20 bg-background border-y border-border">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="text-sm font-mono text-primary tracking-widest uppercase">Technologies</span>
          <h2 className="mt-3 text-2xl md:text-3xl font-bold text-foreground">Our Tech Stack</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4"
        >
          {techStack.map((tech, i) => (
            <motion.div
              key={tech}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-mono text-muted-foreground transition-all hover:text-primary hover:border-primary/40"
            >
              {tech}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TechStackSection;
