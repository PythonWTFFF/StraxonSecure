import { motion } from "framer-motion";
import { Cpu, Shield, Zap, Globe, Briefcase, Clock } from "lucide-react";

const features = [
  { icon: Zap, title: "Autonomous Pipelines", desc: "End-to-end delivery without human delays." },
  { icon: Cpu, title: "pgvector RAG Architecture", desc: "Enterprise-grade AI memory built-in." },
  { icon: Globe, title: "Multi-Currency Native", desc: "Seamless INR/USD dynamic pricing & routing." },
  { icon: Shield, title: "Bank-Grade Security", desc: "SOC-2 compliant with real-time audit trails." },
  { icon: Briefcase, title: "White-Label Agency", desc: "Resell under your brand with custom margins." },
  { icon: Clock, title: "24h SLA Guarantee", desc: "Or your money back. No questions asked." },
];

export const FeatureGrid = () => {
  return (
    <section className="container pb-20 pt-10">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="glass rounded-xl p-6 flex flex-col hover:border-primary/50 transition-colors"
          >
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <f.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
