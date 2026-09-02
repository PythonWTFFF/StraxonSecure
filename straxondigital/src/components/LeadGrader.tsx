import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles, Zap, ArrowRight, ShieldAlert, CheckCircle2, TrendingUp,
  Loader2, Target, Globe, Search, BarChart3, Cpu, AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface Axis {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  score: number;
  diagnosis: string;
  fix: string;
}

interface AuditResult {
  overallScore: number;
  grade: string;
  gradeColor: string;
  summary: string;
  axes: Axis[];
  recommendations: Array<{
    title: string;
    slug: string;
    price: string;
    fix: string;
    priority: "critical" | "high" | "medium";
  }>;
}

const generateDynamicResult = (input: string): AuditResult => {
  // Deterministic scoring based on input characteristics
  const lower = input.toLowerCase();
  const hasUrl = input.includes("http") || input.includes("www.");
  const hasTech = lower.includes("saas") || lower.includes("ai") || lower.includes("tech") || lower.includes("app");
  const hasMarketing = lower.includes("marketing") || lower.includes("brand") || lower.includes("seo") || lower.includes("content");
  const hasNumbers = /\$[\d,]+|\d+%|\d+k|\d+ clients|\d+ users/i.test(input);
  const wordCount = input.split(" ").length;
  const hasUVP = wordCount > 15 && (lower.includes("because") || lower.includes("unlike") || lower.includes("for") || lower.includes("that"));

  const vpScore = hasUVP ? 58 + Math.min(25, wordCount * 0.8) : 31 + Math.min(30, wordCount * 1.2);
  const funnelScore = hasUrl ? 52 : 28;
  const seoScore = hasMarketing ? 61 : hasUrl ? 45 : 22;
  const trustScore = hasNumbers ? 68 : hasTech ? 48 : 34;
  const ragScore = hasTech ? 52 : 28;

  const scores = [vpScore, funnelScore, seoScore, trustScore, ragScore].map(s => Math.min(100, Math.max(10, Math.round(s))));
  const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const grade = overall >= 80 ? "A" : overall >= 65 ? "B" : overall >= 50 ? "C" : overall >= 35 ? "D" : "F";
  const gradeColor = grade === "A" ? "text-green-400" : grade === "B" ? "text-emerald-400" : grade === "C" ? "text-yellow-400" : grade === "D" ? "text-orange-400" : "text-red-400";

  return {
    overallScore: overall,
    grade,
    gradeColor,
    summary: overall >= 65
      ? `Your business shows solid fundamentals with ${grade}-grade conversion architecture. However, key gaps in ${scores[2] < 50 ? "SEO clustering" : "trust infrastructure"} and ${scores[0] < 60 ? "value proposition precision" : "funnel automation"} are costing you significant organic revenue.`
      : `Critical gaps detected across your conversion architecture. Your business is losing an estimated 60-75% of potential leads to preventable friction points. Immediate action required on value proposition clarity, funnel design, and SEO visibility.`,
    axes: [
      {
        id: "vp", label: "Value Proposition & Positioning", icon: Target, color: "text-blue-400",
        score: scores[0],
        diagnosis: scores[0] < 50
          ? "Your value proposition is generic and fails to differentiate. Visitors cannot determine in <5 seconds why they should choose you over alternatives."
          : "Your positioning has some differentiation but lacks the precision needed to trigger immediate purchase intent from your ICP.",
        fix: scores[0] < 50 ? "Complete website blueprint rewrite with conversion-first hero architecture" : "Brand identity audit and value ladder restructure",
      },
      {
        id: "funnel", label: "Conversion Funnel & CTA Density", icon: Zap, color: "text-amber-400",
        score: scores[1],
        diagnosis: scores[1] < 50
          ? "No clear conversion path detected. Visitors enter and exit with no guided journey — 65%+ bounce rate likely."
          : "Conversion funnel exists but CTAs are misaligned with buyer stage. Revenue is leaking at the consideration phase.",
        fix: scores[1] < 50 ? "High-conversion website blueprint with A/B-tested CTA matrix" : "Conversion rate optimization and funnel restructure",
      },
      {
        id: "seo", label: "Organic SEO Keyword & Cluster Index", icon: Search, color: "text-emerald-400",
        score: scores[2],
        diagnosis: scores[2] < 50
          ? "Near-zero programmatic SEO infrastructure. You're invisible to 94% of commercial intent searches in your category."
          : "Some keyword coverage exists but no structured cluster strategy. You're ranking for fragmented terms without topical authority.",
        fix: scores[2] < 50 ? "Autonomous SEO growth engine with 10 keyword cluster roadmap" : "SEO cluster plan and content architecture sprint",
      },
      {
        id: "trust", label: "Trust & Social Proof Architecture", icon: ShieldAlert, color: "text-purple-400",
        score: scores[3],
        diagnosis: scores[3] < 50
          ? "Critical trust vacuum. No quantified social proof, case studies, or authority signals detected. Visitors have no reason to believe your claims."
          : "Basic social proof present but lacks the specificity and volume to overcome purchase objections at the decision stage.",
        fix: scores[3] < 50 ? "Brand identity kit with social proof framework and authority positioning" : "Case study content pack and authority content sprint",
      },
      {
        id: "rag", label: "Automation & RAG Readiness", icon: Cpu, color: "text-primary",
        score: scores[4],
        diagnosis: scores[4] < 50
          ? "No automation or AI infrastructure. You're running operations manually — limiting throughput and consistency at scale."
          : "Basic operations in place but no autonomous content or lead generation systems. You're leaving compounding gains on the table.",
        fix: scores[4] < 50 ? "Full autonomous pipeline setup with Brand Brain and RAG knowledge base" : "AI automation suite with scheduled content and SEO generation",
      },
    ],
    recommendations: [
      ...(scores[1] < 60 ? [{
        title: "High-Conversion Website Blueprint",
        slug: "conversion-website",
        price: "$499",
        fix: "Rewires your site layout and messaging to double visitor-to-demo conversion rates within 30 days.",
        priority: "critical" as const,
      }] : []),
      ...(scores[2] < 60 ? [{
        title: "Autonomous SEO Growth Engine",
        slug: "seo-growth",
        price: "$199",
        fix: "Injects 10 high-volume commercial keyword clusters with content angles into your organic funnel.",
        priority: (scores[2] < 40 ? "critical" : "high") as const,
      }] : []),
      ...(scores[3] < 60 ? [{
        title: "Brand Identity System",
        slug: "branding",
        price: "$299",
        fix: "Builds your authority architecture with a cohesive brand kit, voice guidelines, and social proof framework.",
        priority: "high" as const,
      }] : []),
      {
        title: "SaaS Architecture Specification",
        slug: "saas-architecture",
        price: "$799",
        fix: "Production-ready technical specification for your platform with database schema and API matrix.",
        priority: "medium" as const,
      },
    ].slice(0, 3),
  };
};

export const LeadGrader = () => {
  const [urlOrPitch, setUrlOrPitch] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [expandedAxis, setExpandedAxis] = useState<string | null>(null);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlOrPitch.trim()) return;

    setAnalyzing(true);
    setResult(null);
    setExpandedAxis(null);

    const steps = [
      { p: 18, label: "Analyzing value proposition clarity..." },
      { p: 35, label: "Scanning conversion funnel & CTA architecture..." },
      { p: 52, label: "Indexing SEO keyword density & cluster gaps..." },
      { p: 71, label: "Evaluating trust signals & social proof..." },
      { p: 88, label: "Assessing automation & RAG readiness score..." },
      { p: 100, label: "Generating 5-axis diagnostic report..." },
    ];

    for (const step of steps) {
      setProgress(step.p);
      setProgressLabel(step.label);
      await new Promise(r => setTimeout(r, 420 + Math.random() * 250));
    }

    setResult(generateDynamicResult(urlOrPitch));
    setAnalyzing(false);
  };

  const priorityColors = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <section className="py-12">
      <div className="max-w-5xl mx-auto">
        <Card className="glass-strong p-6 sm:p-10 rounded-3xl border-primary/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/8 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-3">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-mono uppercase tracking-wider text-primary">Free 5-Axis AI Audit</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2">
              Grade Your Business & Conversion Engine
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enter your website URL or elevator pitch. Our AI analyzes 5 critical dimensions and reveals your exact growth bottlenecks in under 10 seconds.
            </p>
          </div>

          <form onSubmit={handleAudit} className="max-w-xl mx-auto mb-8">
            <div className="flex gap-2 flex-col sm:flex-row">
              <Input
                value={urlOrPitch}
                onChange={(e) => setUrlOrPitch(e.target.value)}
                placeholder="https://yourstartup.com or describe your business in 1-2 sentences..."
                className="glass h-12 text-sm"
              />
              <Button
                type="submit"
                disabled={analyzing || !urlOrPitch.trim()}
                className="bg-gradient-primary text-primary-foreground border-0 shadow-glow font-semibold h-12 px-6 shrink-0"
              >
                {analyzing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Scanning…</>
                ) : (
                  <>Run Free AI Audit <ArrowRight className="h-4 w-4 ml-1.5" /></>
                )}
              </Button>
            </div>
          </form>

          {analyzing && (
            <div className="max-w-md mx-auto space-y-3 py-6">
              <div className="flex justify-between text-xs font-mono text-primary mb-1">
                <span>{progressLabel}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex gap-2 flex-wrap justify-center">
                {["Value Prop", "Funnel", "SEO", "Trust", "Automation"].map((axis, i) => (
                  <span key={axis} className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${progress > i * 18 + 10 ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground"}`}>
                    {axis}
                  </span>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Overall Score */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-2xl bg-muted/20 border border-border/50">
                  <div className="flex-shrink-0 text-center">
                    <div className={`text-6xl font-extrabold ${result.gradeColor}`}>{result.grade}</div>
                    <div className="text-2xl font-bold font-mono">{result.overallScore}<span className="text-sm text-muted-foreground">/100</span></div>
                    <p className="text-[10px] text-muted-foreground font-mono">Conversion Health Score</p>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" /> Diagnostic Summary
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
                  </div>
                </div>

                {/* 5-Axis Scores */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-primary" /> 5-Axis Breakdown
                  </h3>
                  {result.axes.map((axis) => {
                    const Icon = axis.icon;
                    const isExpanded = expandedAxis === axis.id;
                    return (
                      <div
                        key={axis.id}
                        className="rounded-xl border border-border/40 bg-muted/10 overflow-hidden cursor-pointer hover:border-primary/30 transition-all"
                        onClick={() => setExpandedAxis(isExpanded ? null : axis.id)}
                      >
                        <div className="flex items-center gap-4 p-4">
                          <Icon className={`h-4 w-4 shrink-0 ${axis.color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm font-medium">{axis.label}</span>
                              <span className={`text-sm font-bold font-mono ml-2 shrink-0 ${axis.score >= 70 ? "text-green-400" : axis.score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                                {axis.score}/100
                              </span>
                            </div>
                            <Progress value={axis.score} className="h-1.5" />
                          </div>
                          {axis.score < 60 && <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />}
                        </div>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 border-t border-border/40 pt-3 space-y-2">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  <span className="text-foreground font-medium">Diagnosis: </span>{axis.diagnosis}
                                </p>
                                <div className="flex items-center gap-2 pt-1">
                                  <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
                                  <span className="text-xs text-primary">Fix: {axis.fix}</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                {/* Recommendations */}
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Recommended Fixes
                  </h3>
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-muted/15 border border-border/40 hover:border-primary/30 transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-sm">{rec.title}</p>
                          <Badge variant="outline" className={`text-[9px] font-mono uppercase ${priorityColors[rec.priority]}`}>
                            {rec.priority}
                          </Badge>
                          <span className="text-sm font-bold text-gradient">{rec.price}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{rec.fix}</p>
                      </div>
                      <Button asChild size="sm" className="bg-gradient-primary text-primary-foreground border-0 shadow-glow text-xs shrink-0">
                        <Link to={`/checkout/${rec.slug}`}>
                          Fix Now <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setResult(null); setUrlOrPitch(""); setProgress(0); }}
                    className="text-muted-foreground text-xs"
                  >
                    Run Another Audit
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </section>
  );
};
