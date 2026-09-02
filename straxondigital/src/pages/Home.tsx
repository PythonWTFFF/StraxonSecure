import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { NetworkGlobe } from "@/components/NetworkGlobe";
import { RevenueCalculator } from "@/components/RevenueCalculator";
import { ServiceCard } from "@/components/ServiceCard";
import { ServiceCustomizerDialog } from "@/components/ServiceCustomizerDialog";
import { SaaSPricingSection } from "@/components/SaaSPricingSection";
import { BundlesSection } from "@/components/BundlesSection";
import { LeadGrader } from "@/components/LeadGrader";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SERVICES, ServiceDef } from "@/lib/services";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Shield, Cpu, LifeBuoy, Sliders } from "lucide-react";
import { Link } from "react-router-dom";

const Home = () => {
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 1000], ["0%", "50%"]);
  const globeY = useTransform(scrollY, [0, 1000], ["0%", "20%"]);
  const [customizingService, setCustomizingService] = useState<ServiceDef | null>(null);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 overflow-hidden">
        <motion.div style={{ y: backgroundY }} className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute inset-0 bg-gradient-radial" />

        <div className="container relative grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-mono uppercase tracking-wider text-primary">Straxon Labs · Autonomous Digital Agency</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              Your <span className="text-gradient">Automated</span> Digital Empire Starts Here
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Resumes, websites, branding, SEO, SaaS architecture, and autonomous AI voice agents — engineered, customized, and delivered with surgical precision. Order at midnight, receive at dawn.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90">
                <Link to="/services">Explore 16+ Services <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary/30">
                <Link to="/automations"><Cpu className="mr-2 h-4 w-4 text-primary" /> Automations Hub</Link>
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
              {[
                { i: Zap, t: "12-24h delivery SLA" },
                { i: Shield, t: "100% money-back guarantee" },
                { i: Cpu, t: "pgvector RAG + human refined" },
              ].map(({ i: Icon, t }) => (
                <div key={t} className="flex items-center gap-2 font-mono text-xs">
                  <Icon className="h-4 w-4 text-primary" /> {t}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            style={{ y: globeY }}
            className="relative h-[420px] sm:h-[520px]"
          >
            <NetworkGlobe />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* Services preview */}
      <section className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] font-mono text-primary mb-3">/ Featured Services</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Engineered for ambitious operators</h2>
            </div>
            <Button asChild variant="ghost"><Link to="/services">View all 16 services <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.slice(0, 6).map((s, i) => (
              <ServiceCard
                key={s.slug}
                service={s}
                index={i}
                onCustomize={(selected) => setCustomizingService(selected)}
              />
            ))}
          </div>
        </motion.div>
      </section>

      {/* High-Ticket Turnkey Bundles Section */}
      <section className="container py-12">
        <BundlesSection />
      </section>

      {/* Free Lead Magnet Conversion Grader */}
      <section id="audit" className="container py-8 scroll-mt-24">
        <LeadGrader />
      </section>

      {/* SaaS Pricing Section */}
      <section className="container py-12">
        <SaaSPricingSection />
      </section>

      {/* Calculator */}
      <section className="container py-20">
        <motion.div 
          className="grid lg:grid-cols-2 gap-12 items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <p className="text-xs uppercase tracking-[0.3em] font-mono text-primary mb-3">/ ROI Engine</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">See your numbers move</h2>
            <p className="text-muted-foreground text-lg">
              Drag the sliders. Watch your projected revenue compound. Then ship the website and automations that actually deliver it.
            </p>
          </div>
          <RevenueCalculator />
        </motion.div>
      </section>

      {/* Support promise */}
      <section className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden glass-strong p-12"
        >
          <div className="absolute inset-0 bg-gradient-luxury opacity-50" />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] font-mono text-primary mb-3">/ Our Promise</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                If your job isn't done right, <span className="text-gradient">we make it right.</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                Every Straxon Labs deliverable comes with a real human escalation path. Open a ticket and a senior
                operator responds within 24 hours — or your money back. No scripts, no runaround.
              </p>
              <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground border-0 shadow-glow">
                <Link to="/contact"><LifeBuoy className="mr-2 h-4 w-4" /> Open a support ticket</Link>
              </Button>
            </div>
            <div className="grid gap-3">
              {[
                "Senior operator triage in under 24h",
                "Free revisions until it matches the brief",
                "100% money-back if we can't deliver",
                "Direct line to the team that built it",
              ].map((t) => (
                <div key={t} className="glass rounded-xl p-4 flex items-start gap-3">
                  <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Customizer Modal */}
      <ServiceCustomizerDialog
        service={customizingService}
        open={Boolean(customizingService)}
        onOpenChange={(open) => {
          if (!open) setCustomizingService(null);
        }}
      />

      <Footer />
    </div>
  );
};

export default Home;
