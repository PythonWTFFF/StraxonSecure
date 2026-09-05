import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SaaSPricingSection } from "@/components/SaaSPricingSection";
import { RevenueCalculator } from "@/components/RevenueCalculator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck } from "lucide-react";

const FAQS = [
  {
    q: "How do automation credits work?",
    a: "Each credit powers 1 autonomous job run or deliverable generation. One-time deliverable orders include all generation runs required for initial delivery. Additional credits let you run automated workflows, audits, and content calendars on demand.",
  },
  {
    q: "Can I customize individual service packages without a subscription?",
    a: "Absolutely. All 16+ services in our catalog can be ordered as one-off engagements with custom tiers (Starter, Pro, Enterprise) and add-ons (12h rush delivery, raw Figma/code exports, webhook sync). Subscriptions provide monthly recurring credits and priority queuing.",
  },
  {
    q: "How does the RAG Knowledge Base benefit my orders?",
    a: "When you upload documents to your Knowledge Base, our pgvector indexing engine embeds them into high-dimensional space. Every service deliverable and chat assistant query automatically pulls relevant context from your documents, ensuring 100% brand consistency.",
  },
  {
    q: "What is your satisfaction guarantee?",
    a: "Every job comes with free revisions to match your brief. If our human-assisted AI engine cannot fulfill your requirements, we offer a 100% money-back guarantee within 14 days of order delivery.",
  },
];

const PricingPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <SaaSPricingSection />
        </motion.div>

        {/* ROI Calculator Section */}
        <section className="mt-16 py-12 border-t border-border/40">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] font-mono text-primary mb-2">/ ROI Economics</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Calculate Your Agency Cost Savings</h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4">
                Traditional digital agencies charge $5,000–$15,000 per month with 3–6 week turnaround cycles. Straxon delivers higher precision at 90% lower cost and 24-hour delivery times.
              </p>
              <div className="flex items-center gap-2 text-xs text-green-400 font-mono">
                <ShieldCheck className="h-4 w-4" /> Zero long-term lock-in · Cancel anytime
              </div>
            </div>
            <RevenueCalculator />
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="glass rounded-xl px-5 border-border/50">
                <AccordionTrigger className="text-sm font-semibold hover:text-primary">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PricingPage;
