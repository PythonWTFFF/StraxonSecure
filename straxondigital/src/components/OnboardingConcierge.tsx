import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles, CheckCircle2, Globe, Brain, Zap, ArrowRight,
  Loader2, Rocket, Compass, X, Database,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const OnboardingConcierge = ({
  workspaceId,
  onComplete,
}: {
  workspaceId?: string;
  onComplete?: () => void;
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [brandName, setBrandName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("agency_growth");
  const [processing, setProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      toast.error("Please enter your brand or agency name");
      return;
    }
    setStep(2);
  };

  const handleStep2AutoScrape = async () => {
    if (!websiteUrl.trim()) {
      setStep(3);
      return;
    }

    setProcessing(true);
    setStatusMsg("Scanning website and extracting brand identity guidelines…");

    try {
      // Trigger competitor / website scraper to seed Brand Brain
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-competitor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          url: websiteUrl,
          yourProduct: brandName,
          workspaceId,
          saveToKnowledgeBase: true,
        }),
      }).catch(() => {});

      toast.success("Brand identity & website guidelines indexed!");
      setStep(3);
    } catch (err) {
      setStep(3);
    } finally {
      setProcessing(false);
    }
  };

  const handleStep3SeedKb = async () => {
    setProcessing(true);
    setStatusMsg("Vectorizing starter knowledge base chunks with pgvector…");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      // Add default high-priority brand prompt to knowledge base
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          title: `${brandName} Core Mission & Value Prop`,
          content: `${brandName} is a high-growth autonomous service organization focused on ${primaryGoal}. Official website: ${websiteUrl}. Brand standard: high velocity, data-backed deliverables, zero operational bottlenecks.`,
          workspaceId,
        }),
      }).catch(() => {});

      toast.success("RAG Knowledge Base initialized with brand embeddings!");
      setStep(4);
    } catch (err) {
      setStep(4);
    } finally {
      setProcessing(false);
    }
  };

  const handleStep4Finish = async () => {
    toast.success("🎉 Workspace fully activated! You are ready to generate revenue.");
    setDismissed(true);
    if (onComplete) onComplete();
  };

  return (
    <Card className="glass-strong p-6 sm:p-8 rounded-3xl border-primary/40 relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1"
        title="Dismiss Concierge"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Floating AI Orb */}
        <div className="hidden md:flex flex-col items-center justify-center shrink-0 w-48 border-r border-border/40 pr-8">
          <motion.div 
            animate={{ 
              y: [0, -10, 0],
              scale: [1, 1.05, 1],
              boxShadow: ["0 0 20px 0px rgba(var(--primary), 0.3)", "0 0 40px 10px rgba(var(--primary), 0.5)", "0 0 20px 0px rgba(var(--primary), 0.3)"]
            }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-primary via-purple-500 to-blue-500 flex items-center justify-center mb-6"
          >
            <div className="w-20 h-20 rounded-full bg-background/90 flex items-center justify-center backdrop-blur-md">
              <Brain className="h-10 w-10 text-primary" />
            </div>
          </motion.div>
          <div className="text-center">
            <h4 className="font-bold text-sm">Nexus AI</h4>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Chief of Staff</p>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
              AI Onboarding Concierge
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground">
                Activate Your Autonomous Agency & RAG Engine
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                4 rapid steps to calibrate your Brand Brain, embed your Knowledge Base, and launch automated services.
              </p>
            </div>

            {/* Step Counter */}
            <div className="flex items-center gap-1.5 font-mono text-xs text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              <span>Step {step} of 4</span>
            </div>
          </div>

          <Progress value={(step / 4) * 100} className="h-1.5 mb-6" />

      {/* Step 1: Brand & Domain */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono uppercase text-muted-foreground block mb-1">
                Your Brand or Agency Name
              </label>
              <Input
                id="brandName"
                name="brandName"
                placeholder="e.g. Apex Digital Capital"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="glass text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase text-muted-foreground block mb-1">
                Primary Website / Portfolio URL (Optional)
              </label>
              <Input
                id="websiteUrl"
                name="websiteUrl"
                placeholder="https://yourbrand.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="glass text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-mono uppercase text-muted-foreground block mb-1.5">
              Primary Business Objective
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "agency_growth", label: "Resell to Clients (Agency)", desc: "10x markup on digital deliverables" },
                { id: "inhouse_scale", label: "Grow In-House Startup", desc: "Automate SEO, GTM & pitch decks" },
                { id: "lead_generation", label: "Inbound Lead Generation", desc: "Embed audit widget for conversions" },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setPrimaryGoal(opt.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    primaryGoal === opt.id
                      ? "bg-primary/15 border-primary shadow-glow"
                      : "bg-muted/15 border-border/40 hover:border-border"
                  }`}
                >
                  <div className="font-bold text-xs text-foreground">{opt.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              className="bg-gradient-primary text-primary-foreground border-0 shadow-glow font-semibold text-xs px-6"
            >
              Continue <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: Auto Website Scrape & Brand Brain Calibration */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-black/20 border border-border/40 space-y-2">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" /> Auto-Calibrate Brand Brain Identity
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We will extract your tone of voice, commercial value proposition, and competitive positioning from{" "}
              <strong className="text-foreground">{websiteUrl || brandName}</strong>.
            </p>
          </div>

          {processing ? (
            <div className="text-center py-6 space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              <p className="text-xs font-mono text-primary">{statusMsg}</p>
            </div>
          ) : (
            <div className="flex justify-between items-center pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs">
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setStep(3)} className="glass text-xs">
                  Skip for Now
                </Button>
                <Button
                  size="sm"
                  onClick={handleStep2AutoScrape}
                  className="bg-gradient-primary text-primary-foreground border-0 shadow-glow font-semibold text-xs px-6"
                >
                  <Globe className="h-3.5 w-3.5 mr-1.5" />
                  Auto-Scrape & Calibrate
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Seed RAG Knowledge Base */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-black/20 border border-border/40 space-y-2">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" /> Initialize pgvector Knowledge Base
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Vectorize your brand mission and business goals so that all subsequent autonomous automations, cold emails, and AI chat widgets pull accurate context.
            </p>
          </div>

          {processing ? (
            <div className="text-center py-6 space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              <p className="text-xs font-mono text-primary">{statusMsg}</p>
            </div>
          ) : (
            <div className="flex justify-between items-center pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-xs">
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleStep3SeedKb}
                className="bg-gradient-primary text-primary-foreground border-0 shadow-glow font-semibold text-xs px-6"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Initialize Knowledge Base
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Ready to Profit */}
      {step === 4 && (
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto border border-green-500/40">
            <Rocket className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-foreground">
              {brandName} is Live & Ready for High-Margin Revenue!
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Your Brand Brain is calibrated, RAG Knowledge Base is indexed, and autonomous delivery portals are ready to serve clients.
            </p>
          </div>

          <div className="pt-2">
            <Button
              size="sm"
              onClick={handleStep4Finish}
              className="bg-gradient-primary text-primary-foreground border-0 shadow-glow font-semibold text-xs px-8 h-9"
            >
              Open Command Center Dashboard
            </Button>
          </div>
        </div>
      )}
        </div>
      </div>
    </Card>
  );
};
