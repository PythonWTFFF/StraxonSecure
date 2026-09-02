import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Cpu,
  Building2,
  Zap,
  Globe,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ClientProfitCenter } from "@/components/ClientProfitCenter";
import { AgencyLeadMagnet } from "@/components/AgencyLeadMagnet";

const ResellerPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container pt-32 pb-24 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-16"
        >
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-4">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-mono uppercase tracking-wider text-primary">
                Wholesale Agency Engine & Profit Hub
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 leading-tight">
              Start Your Own <span className="text-gradient">Automated Agency</span> in 24 Hours
            </h1>
            <p className="text-muted-foreground text-sm sm:text-lg leading-relaxed max-w-2xl mx-auto">
              Resell our 16+ autonomous services under your own agency brand. We handle the RAG semantic knowledge ingestion, AI execution, and deliverable pipelines. You bill your clients $3,000–$10,000/mo and keep up to 85% gross profit margins.
            </p>
            <div className="mt-8 flex justify-center gap-3 flex-wrap">
              <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground border-0 shadow-glow font-semibold">
                <Link to="/checkout/conversion-website?tier=enterprise">
                  Activate Agency License ($149/mo) <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary/30">
                <Link to="/pricing">Compare All Tiers</Link>
              </Button>
            </div>
          </div>

          {/* Interactive Profit Center: Simulator + Margins + White-label Portals + Proposals */}
          <div className="max-w-6xl mx-auto">
            <ClientProfitCenter />
          </div>

          {/* Reseller License Inclusions */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="glass p-6 sm:p-8 border-border/50 space-y-3">
              <Layers className="h-8 w-8 text-primary mb-2" />
              <h3 className="text-lg font-bold">100% White-Label Deliverables</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Remove all Straxon Labs watermarks. Export clean client delivery portals, Figma blueprints, and client-ready code bearing your agency's name, brand colors, and custom domain.
              </p>
            </Card>

            <Card className="glass p-6 sm:p-8 border-border/50 space-y-3">
              <Cpu className="h-8 w-8 text-primary mb-2" />
              <h3 className="text-lg font-bold">Autonomous RAG Brand Brain</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Each client gets their own isolated Brand Brain with tone sliders, rules, and semantic vector knowledge base. Deliverables speak the exact brand voice every single time.
              </p>
            </Card>

            <Card className="glass p-6 sm:p-8 border-border/50 space-y-3">
              <ShieldCheck className="h-8 w-8 text-primary mb-2" />
              <h3 className="text-lg font-bold">Client Sub-Workspaces & Webhooks</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Maintain isolated workspaces for each client account. Auto-dispatch completed deliverables to client Slack channels, Zapier zaps, Make scenarios, or webhook endpoints.
              </p>
            </Card>
          </div>

          {/* Turnkey Agency Lead Magnet Widget & CRM */}
          <div className="max-w-6xl mx-auto">
            <AgencyLeadMagnet />
          </div>

          {/* Wholesale Rate Card */}
          <div className="max-w-6xl mx-auto">
            <Card className="glass-strong p-6 sm:p-10 rounded-3xl border-primary/20 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Wholesale Service Rate Card & Margin Table</h2>
                  <p className="text-xs text-muted-foreground">Fixed wholesale fulfillment prices for Agency License holders vs recommended retail client billing.</p>
                </div>
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/20 font-mono">
                  Up to 91% Margin
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground uppercase">
                      <th className="py-3 px-4">Deliverable Service</th>
                      <th className="py-3 px-4">Fulfillment SLA</th>
                      <th className="py-3 px-4">Wholesale Cost</th>
                      <th className="py-3 px-4">Suggested Retail</th>
                      <th className="py-3 px-4">Your Gross Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {[
                      { name: "High-Conversion Website Blueprint", sla: "24h", wholesale: "$89", retail: "$997–$2,500", margin: "91% ($908+)" },
                      { name: "Brand Identity System & Voice Kit", sla: "12h", wholesale: "$69", retail: "$799–$1,800", margin: "91% ($730+)" },
                      { name: "Autonomous SEO Keyword Cluster Plan", sla: "15m", wholesale: "$49", retail: "$499–$1,200", margin: "90% ($450+)" },
                      { name: "Executive 12-Slide Pitch Deck", sla: "24h", wholesale: "$99", retail: "$1,299–$3,500", margin: "92% ($1,200+)" },
                      { name: "SaaS Technical Architecture Spec", sla: "24h", wholesale: "$119", retail: "$1,499–$4,000", margin: "92% ($1,380+)" },
                      { name: "30-Day Automated Social Content Batch", sla: "5m", wholesale: "$49", retail: "$599–$1,500", margin: "91% ($550+)" },
                    ].map((row) => (
                      <tr key={row.name} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3.5 px-4 font-sans font-medium text-foreground">{row.name}</td>
                        <td className="py-3.5 px-4 text-muted-foreground">{row.sla}</td>
                        <td className="py-3.5 px-4 text-muted-foreground">{row.wholesale}</td>
                        <td className="py-3.5 px-4 text-primary font-bold">{row.retail}</td>
                        <td className="py-3.5 px-4 text-green-400 font-bold">{row.margin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default ResellerPage;
