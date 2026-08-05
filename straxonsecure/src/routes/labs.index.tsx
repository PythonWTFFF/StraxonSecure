import { createFileRoute, Link } from "@tanstack/react-router";
import { CyberCard } from "@/components/cyber/CyberCard";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import {
  Database,
  Code2,
  KeyRound,
  Waves,
  ServerCrash,
  ArrowRight,
  Terminal,
  Globe,
  ShieldOff,
  Key,
  FolderOpen,
  FileCode,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/labs/")({
  head: () => ({
    meta: [
      { title: "Attack Labs — Straxon Secure" },
      {
        name: "description",
        content:
          "12 hands-on cyber attack simulations: SQLi, XSS, RCE, SSRF, JWT, LFI, XXE, IDOR, and more.",
      },
    ],
  }),
  component: LabsHub,
});

const LABS = [
  {
    to: "/labs/sqli",
    icon: Database,
    title: "SQL Injection",
    desc: "Tautology, UNION-based, and comment bypass with live query visualizer.",
    difficulty: "Beginner",
    badge: "LAB-01",
    accent: "cyan" as const,
  },
  {
    to: "/labs/xss",
    icon: Code2,
    title: "Cross-Site Scripting",
    desc: "Stored & DOM-based XSS. Compare vulnerable vs sanitized rendering.",
    difficulty: "Beginner",
    badge: "LAB-02",
    accent: "magenta" as const,
  },
  {
    to: "/labs/brute",
    icon: KeyRound,
    title: "Brute Force",
    desc: "Dictionary attack with rate limiting, lockouts, and password strength meter.",
    difficulty: "Intermediate",
    badge: "LAB-03",
    accent: "cyan" as const,
  },
  {
    to: "/labs/ddos",
    icon: Waves,
    title: "DDoS Visualization",
    desc: "Three.js particle flood. Toggle rate limiting and watch server load.",
    difficulty: "Intermediate",
    badge: "LAB-04",
    accent: "magenta" as const,
  },
  {
    to: "/labs/misconfig",
    icon: ServerCrash,
    title: "Misconfigured Server",
    desc: "Exposed admin panel, default creds, directory listing vulnerabilities.",
    difficulty: "Advanced",
    badge: "LAB-05",
    accent: "cyan" as const,
  },
  {
    to: "/labs/rce",
    icon: Terminal,
    title: "Remote Code Execution",
    desc: "Exploit OS command injection via unsanitized exec(). Capture the flag!",
    difficulty: "Advanced",
    badge: "LAB-06",
    accent: "magenta" as const,
    isNew: true,
  },
  {
    to: "/labs/ssrf",
    icon: Globe,
    title: "Server-Side Request Forgery",
    desc: "Pivot to cloud metadata endpoints and steal AWS IAM credentials.",
    difficulty: "Advanced",
    badge: "LAB-07",
    accent: "cyan" as const,
    isNew: true,
  },
  {
    to: "/labs/csrf",
    icon: ShieldOff,
    title: "Cross-Site Request Forgery",
    desc: "Forge authenticated requests and bypass CSRF token protection.",
    difficulty: "Intermediate",
    badge: "LAB-08",
    accent: "magenta" as const,
    isNew: true,
  },
  {
    to: "/labs/jwt",
    icon: Key,
    title: "JWT Attack Lab",
    desc: "Algorithm confusion (alg:none), secret cracking, and token forgery.",
    difficulty: "Expert",
    badge: "LAB-09",
    accent: "cyan" as const,
    isNew: true,
  },
  {
    to: "/labs/lfi",
    icon: FolderOpen,
    title: "Local File Inclusion",
    desc: "Path traversal to read /etc/passwd, config files, and capture the flag.",
    difficulty: "Advanced",
    badge: "LAB-10",
    accent: "magenta" as const,
    isNew: true,
  },
  {
    to: "/labs/xxe",
    icon: FileCode,
    title: "XML External Entity",
    desc: "XXE file disclosure, SSRF, and Billion Laughs DoS via XML injection.",
    difficulty: "Expert",
    badge: "LAB-11",
    accent: "cyan" as const,
    isNew: true,
  },
  {
    to: "/labs/idor",
    icon: Users,
    title: "IDOR",
    desc: "Access other users' profiles, orders, and documents via ID manipulation.",
    difficulty: "Intermediate",
    badge: "LAB-12",
    accent: "magenta" as const,
    isNew: true,
  },
];

function LabsHub() {
  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <SectionHeading
          eyebrow="// OFFENSE MODULE"
          title="Attack Simulation Labs"
          description="12 contained sandboxes. Run real attack patterns, see the impact, then deploy the fix."
        />
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="font-display text-3xl font-bold neon-text">12</div>
            <div className="text-[10px] font-mono text-muted-foreground">LABS</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="font-display text-3xl font-bold text-success">7</div>
            <div className="text-[10px] font-mono text-muted-foreground">NEW</div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {LABS.map((lab, i) => {
          const Icon = lab.icon;
          return (
            <motion.div
              key={lab.to}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link to={lab.to} className="block group h-full">
                <CyberCard variant={lab.accent} glow className="h-full flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`p-2.5 rounded-md ${
                        lab.accent === "magenta"
                          ? "bg-accent/10 text-accent"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {(lab as any).isNew && (
                        <span className="text-[9px] font-mono uppercase tracking-widest bg-success/20 text-success border border-success/40 rounded px-1.5 py-0.5">
                          NEW
                        </span>
                      )}
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border border-border rounded px-1.5 py-0.5">
                        {lab.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground/50 mb-1">
                    {(lab as any).badge}
                  </div>
                  <h3 className="font-display text-xl font-bold">{lab.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 flex-1">{lab.desc}</p>
                  <div
                    className={`mt-4 flex items-center gap-2 text-xs font-mono uppercase tracking-wider ${
                      lab.accent === "magenta" ? "text-accent" : "text-primary"
                    } group-hover:gap-3 transition-all`}
                  >
                    Engage <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </CyberCard>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
