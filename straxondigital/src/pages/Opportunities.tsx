import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Target,
  ShieldCheck,
  DollarSign,
  Users,
  Compass,
  Zap,
  ArrowUpDown,
  BookOpen,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export interface EdTechOpportunity {
  id: string;
  title: string;
  category: string;
  description: string;
  severity_score: number;
  tam_score: number;
  whitespace_score: number;
  frequency_score: number;
  itch_score: number;
  solution_concept: string;
  moat: string;
  monetization_model: string;
  target_audience: string;
}

const STATIC_OPPORTUNITIES: EdTechOpportunity[] = [
  {
    id: "1",
    title: "Why do fresh graduates lack practical coding skills despite strong academic performance?",
    category: "EdTech",
    description:
      "Companies hiring fresh graduates discover candidates possess theoretical knowledge and good academic scores but cannot solve basic programming problems, debug code, or apply concepts practically because college curricula rely on theoretical lectures without providing hands-on industry-simulation labs or real-world project experience.",
    severity_score: 9.0,
    tam_score: 9.0,
    whitespace_score: 8.5,
    frequency_score: 7.0,
    itch_score: 86.5,
    solution_concept:
      "ProductionSim: Automated ephemeral multi-file legacy codebases in microVMs where students solve real Jira bugs, handle merge conflicts, and get evaluated by AI code-reviewers on debugging speed, test hygiene, and system architecture.",
    moat: "Proprietary corpus of realistic broken production codebases + automated multi-metric evaluation telemetry that enterprise hiring managers trust over resumes.",
    monetization_model:
      "B2B recruiting sponsorship and candidate skill-verification fees + B2C subscription for certified graduation credential.",
    target_audience: "Engineering students, fresh CS graduates, and technical recruiters.",
  },
  {
    id: "2",
    title: "Why are college choices influenced by referral fees instead of student aptitude?",
    category: "EdTech",
    description:
      "High school graduates receive biased college recommendations from counseling agencies and education consultants who prioritize their own commission structures over student aptitude, interests, or career goals, steering confused teenagers toward expensive private institutions that pay the highest referral fees.",
    severity_score: 9.0,
    tam_score: 9.0,
    whitespace_score: 8.5,
    frequency_score: 6.0,
    itch_score: 85.5,
    solution_concept:
      "PurePath Counseling: A fiduciary admissions platform with zero college commissions. Uses transparent algorithms matching verified alumni career trajectories, salary distributions, and curriculum rigor directly against student aptitude assessments.",
    moat: "Audited zero-kickback charter, verified alumni outcome database, and parent trust moat.",
    monetization_model: "Flat-fee student advisory subscription or outcome-aligned installment plans.",
    target_audience: "High school students, college applicants, and parents.",
  },
  {
    id: "3",
    title: "Why don’t global learning platforms support high-quality regional language instruction?",
    category: "EdTech",
    description:
      "Exceptionally talented students from non-metro areas who are highly skilled in their fields cannot access elite global online courses, certification programs, or educational content from top institutions because these resources are exclusively available in English and haven't been localized into regional Indian languages.",
    severity_score: 7.0,
    tam_score: 9.0,
    whitespace_score: 8.0,
    frequency_score: 9.0,
    itch_score: 85.5,
    solution_concept:
      "BhashaTech: An automated neural localization and dubbing pipeline specifically trained on technical pedagogy (Hinglish/Tamil-English transliterated technical terms), synchronized code walkthroughs, and regional AI voice-tutors.",
    moat: "Proprietary bilingual technical terminology dictionary and localized code-explaining fine-tuned LLM.",
    monetization_model: "B2B course licensing to MOOC platforms/universities + affordable freemium student tier.",
    target_audience: "Tier-2 and Tier-3 college students, vernacular engineers, and vocational learners.",
  },
  {
    id: "4",
    title: "Why is scholarship information fragmented and inaccessible to low-income and rural students?",
    category: "EdTech",
    description:
      "Deserving students from economically weaker sections or remote areas remain unaware of available government scholarships, private grants, and financial aid opportunities because information is scattered across disconnected platforms, application processes are complex, and they lack mentors who can guide them through documentation requirements.",
    severity_score: 7.0,
    tam_score: 9.0,
    whitespace_score: 8.0,
    frequency_score: 7.0,
    itch_score: 82.0,
    solution_concept:
      "VidyaSetu: An aggregated scholarship eligibility engine with single-click profile matching, localized WhatsApp notification bots, and a digital document locker that auto-fills complex state and corporate grant applications.",
    moat: "Proprietary database of obscure NGO/CSR educational endowments + government API integrations.",
    monetization_model: "Corporate CSR sponsorship, state welfare partnerships, and university placement subsidies.",
    target_audience: "Economically disadvantaged students, rural youth, and high school counselors.",
  },
  {
    id: "5",
    title: "Why are mock tests and analytics inaccessible to low-income exam candidates?",
    category: "EdTech",
    description:
      "NEET, JEE, and competitive exam aspirants from economically disadvantaged backgrounds cannot afford premium coaching classes that provide extensive question banks, doubt-clearing support, and mock test series, leaving them relying solely on outdated textbooks without access to quality practice problems and performance analytics.",
    severity_score: 6.0,
    tam_score: 9.0,
    whitespace_score: 8.0,
    frequency_score: 9.0,
    itch_score: 81.5,
    solution_concept:
      "AbhyasAI: A lightweight, mobile-first, and offline-capable adaptive test platform that uses low-latency local models to generate customized mock exams, weak-area diagnostic heatmaps, and step-by-step doubt resolution at 1/100th the cost of legacy coaching.",
    moat: "Dynamic question synthesis engine, calibrated difficulty rating system, and extreme low-bandwidth compression.",
    monetization_model: "Ultra-affordable micro-passes (e.g. ₹49/month or ₹5/test) and philanthropic foundation grants.",
    target_audience: "Competitive exam aspirants (JEE, NEET, SSC, UPSC) in non-metro regions.",
  },
  {
    id: "6",
    title: "Why hasn’t tutoring shifted from answer-giving to skill-building learning?",
    category: "EdTech",
    description:
      "Parents hiring private tutors to help with challenging math and science subjects discover their children remain weak in fundamentals because tutors simply solve homework problems on students' behalf rather than explaining underlying concepts, principles, and problem-solving approaches that build genuine understanding.",
    severity_score: 8.0,
    tam_score: 9.0,
    whitespace_score: 8.5,
    frequency_score: 8.0,
    itch_score: 78.5,
    solution_concept:
      "SocraticMentor: An interactive learning companion that refuses to output direct homework answers. Instead, it diagnoses misconceptions through guided questions, visual interactive simulations, and first-principles reasoning prompts.",
    moat: "Adaptive pedagogy tree that dynamically tracks student conceptual gaps and prevents cognitive reliance on direct solution generation.",
    monetization_model: "Parent-funded monthly subscription with weekly conceptual mastery reports.",
    target_audience: "K-12 students, parents, and progressive educators.",
  },
  {
    id: "7",
    title: "Why do resumes fail ATS filters despite candidates being qualified for roles?",
    category: "EdTech",
    description:
      "Fresh graduates and career switchers applying to dozens of entry-level positions receive no response or interview callbacks because corporate ATS (Applicant Tracking Systems) automatically filter out resumes lacking specific keywords, employer brand names, or exact experience criteria, and candidates lack guidance on optimizing applications for AI screening.",
    severity_score: 8.0,
    tam_score: 9.0,
    whitespace_score: 9.0,
    frequency_score: 7.0,
    itch_score: 76.5,
    solution_concept:
      "TalentDecoder: A bi-directional career platform that parses job descriptions to identify latent qualification vectors, optimizes resumes for semantic ATS parsers without keyword stuffing, and links verifiable micro-project proofs of work directly into the recruiter screening view.",
    moat: "Reverse-engineered ATS parsing suite and cryptographically verified proof-of-work badges.",
    monetization_model:
      "Freemium model with premium application optimization credits and talent marketplace recruiting fees.",
    target_audience: "Job seekers, career switchers, and fresh university graduates.",
  },
  {
    id: "8",
    title: "Why don’t schools provide step-by-step, student-friendly kits for complex assignments?",
    category: "EdTech",
    description:
      "Elementary and middle school students assigned elaborate science fair projects, working models, or craft assignments rely heavily on parental intervention because schools assign overly complex tasks without providing age-appropriate guidance, pre-assembled DIY kits, or step-by-step student-friendly instruction materials.",
    severity_score: 7.0,
    tam_score: 9.0,
    whitespace_score: 8.0,
    frequency_score: 6.0,
    itch_score: 75.5,
    solution_concept:
      "MakerKid Labs: Curriculum-aligned experiential project kits shipped on-demand, paired with gamified interactive AR/video companion guides that empower children to design, build, and debug their own working science models independently.",
    moat: "Proprietary modular hardware kits, school curriculum integration, and patent-pending interactive AR assembly instructions.",
    monetization_model: "Direct-to-consumer quarterly kit subscriptions and B2B school curriculum partnerships.",
    target_audience: "Middle school students, parents, and STEM science teachers.",
  },
  {
    id: "9",
    title: "Why must students commit to expensive annual subscriptions before testing exam platforms?",
    category: "EdTech",
    description:
      "Students wanting to try online learning platforms for exam preparation discover that most services require upfront annual subscription commitments with non-refundable payments, offering no flexibility for pay-per-topic access, course-switching, or trial periods that let students test teaching quality before major financial commitments.",
    severity_score: 8.0,
    tam_score: 9.0,
    whitespace_score: 8.5,
    frequency_score: 5.0,
    itch_score: 73.5,
    solution_concept:
      "FlexiLearn: A utility-style micropayment learning marketplace where students purchase modular topic tokens (e.g. paying only for Thermodynamics or Calculus) or rent complete courses on a weekly pay-as-you-learn basis with instant course portability.",
    moat: "Cross-platform topic-level learning credit protocol and revenue-sharing settlement network for top independent educators.",
    monetization_model: "Small transaction fee per module unlocked + educator marketplace platform cut.",
    target_audience: "Budget-conscious students, modular learners, and self-directed test candidates.",
  },
];

type SortKey = "itch_score" | "severity_score" | "tam_score" | "whitespace_score" | "frequency_score";

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<EdTechOpportunity[]>(STATIC_OPPORTUNITIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMinScore, setSelectedMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortKey>("itch_score");
  const [activeModal, setActiveModal] = useState<EdTechOpportunity | null>(null);
  const [loading, setLoading] = useState(false);

  // Attempt to fetch live from Supabase if table exists
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("edtech_opportunities" as any)
          .select("*")
          .order("itch_score", { ascending: false });

        if (!error && data && data.length > 0) {
          setOpportunities(data as EdTechOpportunity[]);
        }
      } catch {
        // Fallback already pre-seeded
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return opportunities
      .filter((op) => {
        const matchesSearch =
          op.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          op.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          op.solution_concept.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesScore = op.itch_score >= selectedMinScore;
        return matchesSearch && matchesScore;
      })
      .sort((a, b) => b[sortBy] - a[sortBy]);
  }, [opportunities, searchQuery, selectedMinScore, sortBy]);

  const avgItch = useMemo(() => {
    return (opportunities.reduce((acc, o) => acc + o.itch_score, 0) / opportunities.length).toFixed(1);
  }, [opportunities]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-400 bg-emerald-950/40 border-emerald-800/60";
    if (score >= 80) return "text-cyan-400 bg-cyan-950/40 border-cyan-800/60";
    return "text-amber-400 bg-amber-950/40 border-amber-800/60";
  };

  return (
    <div className="min-h-screen bg-[#020617] text-foreground selection:bg-cyan-500/30">
      <Navbar />

      <main className="container max-w-7xl pt-32 pb-24 px-4 sm:px-6">
        {/* Header Title & Pitch */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-400 text-xs font-mono tracking-widest uppercase mb-4"
          >
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            Venture Intelligence · EdTech Evaluation Matrix
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4"
          >
            Top Underserved <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">EdTech Opportunities</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-sm sm:text-base leading-relaxed"
          >
            A quantitative audit of 9 high-conviction problem spaces evaluated across market severity, addressable TAM, competitive whitespace, and frequency of occurrence.
          </motion.p>
        </div>

        {/* Top KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-mono">Evaluated Spaces</p>
                <p className="text-2xl font-bold font-mono">{opportunities.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-mono">Average ITCH</p>
                <p className="text-2xl font-bold font-mono text-emerald-400">{avgItch}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-mono">#1 Top Conviction</p>
                <p className="text-2xl font-bold font-mono text-purple-400">86.5</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-mono">Max Whitespace</p>
                <p className="text-2xl font-bold font-mono text-blue-400">9.0 / 10</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Control Bar */}
        <Card className="bg-slate-900/80 border-slate-800/90 backdrop-blur-xl mb-8">
          <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search problem statements, root causes, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-950/60 border-slate-800 text-sm focus-visible:ring-cyan-500/40"
              />
            </div>

            {/* Score Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: "All Scores", value: 0 },
                { label: "ITCH 80+", value: 80 },
                { label: "ITCH 85+ (Tier 1)", value: 85 },
              ].map((f) => (
                <Button
                  key={f.label}
                  size="sm"
                  variant={selectedMinScore === f.value ? "default" : "outline"}
                  onClick={() => setSelectedMinScore(f.value)}
                  className={`text-xs ${
                    selectedMinScore === f.value
                      ? "bg-cyan-500 text-slate-950 font-semibold"
                      : "border-slate-800 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </Button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                aria-label="Sort opportunities by metric"
                className="bg-slate-950/70 border border-slate-800 text-xs text-foreground rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="itch_score">Sort by: ITCH Score</option>
                <option value="severity_score">Sort by: Severity</option>
                <option value="tam_score">Sort by: TAM Score</option>
                <option value="whitespace_score">Sort by: Whitespace</option>
                <option value="frequency_score">Sort by: Frequency</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Opportunity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((op, idx) => {
              const scoreBadgeClass = getScoreColor(op.itch_score);
              const isTop3 = op.itch_score >= 85.5;

              return (
                <motion.div
                  key={op.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: idx * 0.04 }}
                  className="flex"
                >
                  <Card
                    className={`flex-1 flex flex-col justify-between bg-slate-900/50 backdrop-blur-md border transition-all duration-300 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] group ${
                      isTop3 ? "border-cyan-500/40 bg-gradient-to-b from-slate-900/80 to-slate-950/90" : "border-slate-800"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge variant="outline" className="border-slate-700 font-mono text-[10px] text-muted-foreground">
                          #{idx + 1} · {op.category}
                        </Badge>
                        <div
                          className={`px-2.5 py-0.5 rounded-full border text-xs font-mono font-bold tracking-wider ${scoreBadgeClass}`}
                        >
                          ITCH {op.itch_score}
                        </div>
                      </div>
                      <CardTitle className="text-base font-semibold leading-snug group-hover:text-cyan-400 transition-colors">
                        {op.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground line-clamp-3 mt-2 leading-relaxed">
                        {op.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-2 flex flex-col justify-end gap-4">
                      {/* Metric Score Bars */}
                      <div className="space-y-2 border-t border-slate-800/80 pt-3 text-[11px] font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Severity</span>
                          <span className="text-foreground font-bold">{op.severity_score}/10</span>
                        </div>
                        <Progress value={op.severity_score * 10} className="h-1 bg-slate-800" />

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Whitespace</span>
                          <span className="text-foreground font-bold">{op.whitespace_score}/10</span>
                        </div>
                        <Progress value={op.whitespace_score * 10} className="h-1 bg-slate-800" />

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">TAM</span>
                          <span className="text-foreground font-bold">{op.tam_score}/10</span>
                        </div>
                        <Progress value={op.tam_score * 10} className="h-1 bg-slate-800" />
                      </div>

                      {/* Deep-Dive Action Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveModal(op)}
                        className="w-full mt-2 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/20 text-xs font-mono flex items-center justify-center gap-1.5"
                      >
                        Inspect Architecture & Solution
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl">
            <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-60" />
            <p className="text-base font-semibold">No problem spaces matched your filters</p>
            <p className="text-xs text-muted-foreground mt-1">Try relaxing the search keyword or score threshold.</p>
          </div>
        )}

        {/* Modal: Deep Dive Details */}
        <Dialog open={!!activeModal} onOpenChange={(open) => !open && setActiveModal(null)}>
          {activeModal && (
            <DialogContent className="max-w-2xl bg-[#090d1f] border border-cyan-500/30 text-foreground backdrop-blur-2xl">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 font-mono text-xs">
                    {activeModal.category}
                  </Badge>
                  <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/60">
                    ITCH Score: {activeModal.itch_score}
                  </span>
                </div>
                <DialogTitle className="text-xl font-bold leading-tight text-white">
                  {activeModal.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-300 mt-2">
                  {activeModal.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-3 text-xs">
                {/* Metric Summary Grid */}
                <div className="grid grid-cols-4 gap-2 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-center font-mono">
                  <div>
                    <div className="text-muted-foreground text-[10px]">Severity</div>
                    <div className="text-base font-bold text-cyan-400">{activeModal.severity_score}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[10px]">TAM</div>
                    <div className="text-base font-bold text-cyan-400">{activeModal.tam_score}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[10px]">Whitespace</div>
                    <div className="text-base font-bold text-cyan-400">{activeModal.whitespace_score}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-[10px]">Frequency</div>
                    <div className="text-base font-bold text-cyan-400">{activeModal.frequency_score}</div>
                  </div>
                </div>

                {/* Solution Architecture */}
                <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20">
                  <div className="flex items-center gap-2 text-cyan-300 font-semibold mb-1 font-mono text-sm">
                    <Zap className="h-4 w-4 text-cyan-400" />
                    Proposed Solution Architecture
                  </div>
                  <p className="text-slate-200 leading-relaxed">{activeModal.solution_concept}</p>
                </div>

                {/* Moat & Defensibility */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1 font-mono text-sm">
                    <ShieldCheck className="h-4 w-4" />
                    Defensive Moat
                  </div>
                  <p className="text-slate-300 leading-relaxed">{activeModal.moat}</p>
                </div>

                {/* Monetization & Audience */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1 font-mono">
                      <DollarSign className="h-3.5 w-3.5" />
                      Business Model
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{activeModal.monetization_model}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-1 font-mono">
                      <Users className="h-3.5 w-3.5" />
                      Target Audience
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{activeModal.target_audience}</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </main>

      <Footer />
    </div>
  );
}
