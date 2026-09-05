import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Vikram S.",
    role: "Founder, TechGrow",
    location: "Bengaluru, India",
    content: "Straxon Labs transformed our clunky SaaS into a conversion machine. The UI is world-class, and the RAG integration is flawless.",
    metrics: "₹4.2L Monthly ARR Added",
    initials: "VS",
  },
  {
    name: "Sarah Jenkins",
    role: "Director of Marketing",
    location: "London, UK",
    content: "The autonomous pipelines they built saved us 40 hours a week. It's like having a senior engineer on call 24/7.",
    metrics: "$12k/mo Saved in Ops",
    initials: "SJ",
  },
  {
    name: "Amit Patel",
    role: "Agency Owner",
    location: "Mumbai, India",
    content: "Reselling their services has been the most profitable decision for my agency. The margins are insane, and the delivery is always on time.",
    metrics: "45% Profit Margin",
    initials: "AP",
  },
  {
    name: "Elena Rodriguez",
    role: "E-commerce VP",
    location: "Miami, USA",
    content: "Their conversion rate optimization audits are shockingly precise. Implementing their fixes boosted our sales by 30% in two weeks.",
    metrics: "+30% Conversion Rate",
    initials: "ER",
  },
  {
    name: "Rahul Verma",
    role: "CTO, FinTech Next",
    location: "Gurugram, India",
    content: "The security infrastructure they deploy is bank-grade. We passed our SOC-2 audit without a single hiccup thanks to their setup.",
    metrics: "SOC-2 Certified",
    initials: "RV",
  },
  {
    name: "David Chen",
    role: "SaaS Founder",
    location: "Singapore",
    content: "Unmatched speed. Ordered a complex web app architecture on Friday night, had the complete React/Vite boilerplate by Sunday morning.",
    metrics: "Delivered 2 days early",
    initials: "DC",
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="container py-20 border-t border-border/40">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <p className="text-xs uppercase tracking-[0.3em] font-mono text-primary mb-3">/ Global Trust</p>
        <h2 className="text-3xl sm:text-4xl font-bold">Engineered for the World's Best</h2>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="glass rounded-xl p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-6">"{t.content}"</p>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role} · {t.location}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 inline-flex self-start px-2 py-1 rounded bg-green-500/10 text-green-500 text-xs font-mono font-semibold">
              {t.metrics}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
