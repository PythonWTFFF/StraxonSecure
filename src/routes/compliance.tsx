import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  ShieldCheck,
  Check,
  X,
  AlertCircle,
  Download,
  Brain,
  RefreshCw,
  FileText,
} from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { PremiumGate } from "@/components/PremiumGate";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { askAI } from "@/server/ai";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance Checker — OWASP / NIST CSF / ISO 27001" },
      {
        name: "description",
        content:
          "Audit your systems against OWASP Top 10, NIST CSF, and ISO 27001 controls with AI-powered remediation guidance.",
      },
    ],
  }),
  component: CompliancePage,
});

interface Control {
  id: string;
  name: string;
  framework: "OWASP" | "NIST" | "ISO27001";
  question: string;
  risk: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

const CONTROLS: Control[] = [
  // OWASP Top 10 2021
  {
    id: "A01",
    name: "Broken Access Control",
    framework: "OWASP",
    question: "Are RLS policies enforced on every database table and API endpoint?",
    risk: "CRITICAL",
  },
  {
    id: "A02",
    name: "Cryptographic Failures",
    framework: "OWASP",
    question: "Are passwords hashed with bcrypt/argon2 and is TLS 1.2+ enforced everywhere?",
    risk: "CRITICAL",
  },
  {
    id: "A03",
    name: "Injection",
    framework: "OWASP",
    question: "Do all database queries use parameterized statements or ORMs?",
    risk: "CRITICAL",
  },
  {
    id: "A04",
    name: "Insecure Design",
    framework: "OWASP",
    question: "Is threat modeling and secure design review part of your SDLC?",
    risk: "HIGH",
  },
  {
    id: "A05",
    name: "Security Misconfiguration",
    framework: "OWASP",
    question: "Are default credentials removed, debug endpoints disabled, and headers hardened?",
    risk: "HIGH",
  },
  {
    id: "A06",
    name: "Vulnerable Components",
    framework: "OWASP",
    question: "Are dependencies scanned for CVEs and updated regularly?",
    risk: "HIGH",
  },
  {
    id: "A07",
    name: "Authentication Failures",
    framework: "OWASP",
    question: "Is MFA enforced, brute-force protection in place, and session management secure?",
    risk: "CRITICAL",
  },
  {
    id: "A08",
    name: "Software Integrity",
    framework: "OWASP",
    question: "Are CI/CD pipelines secured and code signing enforced?",
    risk: "MEDIUM",
  },
  {
    id: "A09",
    name: "Logging & Monitoring",
    framework: "OWASP",
    question: "Are security events logged, monitored, and alerted on in real-time?",
    risk: "HIGH",
  },
  {
    id: "A10",
    name: "SSRF",
    framework: "OWASP",
    question: "Are outbound network requests validated, and internal services protected?",
    risk: "HIGH",
  },
  // NIST CSF
  {
    id: "ID.AM",
    name: "Asset Management",
    framework: "NIST",
    question: "Is there a documented, up-to-date inventory of all systems and data assets?",
    risk: "HIGH",
  },
  {
    id: "ID.RA",
    name: "Risk Assessment",
    framework: "NIST",
    question: "Are formal risk assessments conducted and documented at least annually?",
    risk: "HIGH",
  },
  {
    id: "PR.AC",
    name: "Identity & Access",
    framework: "NIST",
    question: "Are access privileges reviewed quarterly using least-privilege principles?",
    risk: "CRITICAL",
  },
  {
    id: "PR.DS",
    name: "Data Security",
    framework: "NIST",
    question: "Is data encrypted at rest and in transit with proper key management?",
    risk: "CRITICAL",
  },
  {
    id: "DE.CM",
    name: "Continuous Monitoring",
    framework: "NIST",
    question: "Is continuous security monitoring and anomaly detection in place?",
    risk: "HIGH",
  },
  {
    id: "RS.RP",
    name: "Response Planning",
    framework: "NIST",
    question: "Is there a tested, documented incident response plan?",
    risk: "HIGH",
  },
  {
    id: "RC.RP",
    name: "Recovery Planning",
    framework: "NIST",
    question: "Are backups tested, recovery times measured, and RTO/RPO defined?",
    risk: "MEDIUM",
  },
  {
    id: "PR.IP",
    name: "Information Protection",
    framework: "NIST",
    question: "Are security policies, training, and vulnerability management processes in place?",
    risk: "MEDIUM",
  },
  // ISO 27001
  {
    id: "A.5.1",
    name: "Information Security Policies",
    framework: "ISO27001",
    question: "Are information security policies documented, approved, and communicated to staff?",
    risk: "HIGH",
  },
  {
    id: "A.6.1",
    name: "Internal Organization",
    framework: "ISO27001",
    question: "Are information security roles and responsibilities clearly defined?",
    risk: "MEDIUM",
  },
  {
    id: "A.8.1",
    name: "Asset Management",
    framework: "ISO27001",
    question: "Are assets identified, classified, and assigned to owners?",
    risk: "HIGH",
  },
  {
    id: "A.9.1",
    name: "Access Control Policy",
    framework: "ISO27001",
    question: "Is an access control policy defined and enforced?",
    risk: "CRITICAL",
  },
  {
    id: "A.10.1",
    name: "Cryptography Policy",
    framework: "ISO27001",
    question: "Is there a cryptographic key management and usage policy?",
    risk: "HIGH",
  },
  {
    id: "A.12.6",
    name: "Vulnerability Management",
    framework: "ISO27001",
    question: "Is there a formal process for timely patching of vulnerabilities?",
    risk: "HIGH",
  },
  {
    id: "A.16.1",
    name: "Incident Management",
    framework: "ISO27001",
    question: "Is there a formal incident management procedure with defined severity levels?",
    risk: "HIGH",
  },
  {
    id: "A.17.1",
    name: "Business Continuity",
    framework: "ISO27001",
    question: "Are business continuity plans documented, tested, and maintained?",
    risk: "MEDIUM",
  },
];

const RISK_COLORS: Record<string, string> = {
  CRITICAL: "text-red-400 border-red-500/30 bg-red-500/5",
  HIGH: "text-orange-400 border-orange-500/30 bg-orange-500/5",
  MEDIUM: "text-yellow-400 border-yellow-500/30 bg-yellow-500/5",
  LOW: "text-blue-400 border-blue-500/30 bg-blue-500/5",
};

function CompliancePage() {
  return (
    <div className="px-4 lg:px-8 py-8 max-w-5xl mx-auto space-y-6">
      <SectionHeading
        eyebrow="// AUDIT MODULE"
        title="Compliance Checker"
        description="Audit against OWASP Top 10, NIST CSF, and ISO 27001. Get AI remediation and export PDF reports."
      />
      <PremiumGate
        feature="Compliance Audits"
        description="Pro unlocks OWASP, NIST CSF & ISO 27001 audits with AI-powered remediation and PDF export."
      >
        <ChecklistRunner />
      </PremiumGate>
    </div>
  );
}

function ChecklistRunner() {
  const { user } = useAuth();
  const [framework, setFramework] = useState<"OWASP" | "NIST" | "ISO27001">("OWASP");
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [remediation, setRemediation] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const items = CONTROLS.filter((c) => c.framework === framework);
  const checked = items.filter((c) => answers[c.id]).length;
  const failing = items.filter((c) => !answers[c.id]);
  const score = items.length ? Math.round((checked / items.length) * 100) : 0;

  const criticalFailing = failing.filter((c) => c.risk === "CRITICAL").length;

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const findings = items.map((c) => ({
      control: c.id,
      name: c.name,
      passing: !!answers[c.id],
      question: c.question,
      risk: c.risk,
    }));
    const { error } = await supabase.from("compliance_runs").insert({
      user_id: user.id,
      framework,
      score,
      findings,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success(`${framework} audit saved — score ${score}%`);
  };

  const analyzeGaps = async () => {
    if (failing.length === 0) {
      toast.success("All controls passing! Nothing to analyze.");
      return;
    }
    setAnalyzing(true);
    setRemediation(null);
    try {
      const failingList = failing
        .map((c) => `- [${c.risk}] ${c.id} ${c.name}: ${c.question}`)
        .join("\n");

      const res = await askAI({
        data: {
          messages: [
            {
              role: "user",
              content: `You are a compliance expert. These ${framework} controls are FAILING in my organization:\n\n${failingList}\n\nProvide a prioritized remediation plan. For each control: explain the risk, give 2-3 concrete implementation steps, and estimate effort (Low/Medium/High). Format with markdown headers for each control.`,
            },
          ],
          mode: "chat",
        },
      });
      setRemediation(res.reply);
    } catch {
      toast.error("AI analysis failed — check GEMINI_API_KEY");
    } finally {
      setAnalyzing(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(2, 6, 16);
    doc.rect(0, 0, 210, 297, "F");
    doc.setTextColor(0, 243, 255);
    doc.setFontSize(20);
    doc.text("STRAXON SECURE", 20, 25);
    doc.setTextColor(150, 150, 180);
    doc.setFontSize(12);
    doc.text(`${framework} Compliance Audit Report`, 20, 35);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 43);
    doc.text(`Score: ${score}% (${checked}/${items.length} controls passing)`, 20, 51);

    let y = 65;
    doc.setFontSize(10);
    items.forEach((c) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const passing = !!answers[c.id];
      doc.setTextColor(passing ? 34 : 239, passing ? 197 : 68, passing ? 94 : 68);
      doc.text(`${passing ? "✓" : "✗"} [${c.risk}] ${c.id} — ${c.name}`, 20, y);
      y += 7;
      doc.setTextColor(130, 130, 160);
      const lines = doc.splitTextToSize(c.question, 170);
      doc.text(lines, 25, y);
      y += lines.length * 5 + 3;
    });

    if (remediation) {
      doc.addPage();
      doc.setTextColor(0, 243, 255);
      doc.setFontSize(14);
      doc.text("AI Remediation Plan", 20, 20);
      doc.setTextColor(180, 180, 200);
      doc.setFontSize(8);
      const lines = doc.splitTextToSize(remediation.replace(/[#*`]/g, ""), 170);
      let ry = 30;
      lines.forEach((line: string) => {
        if (ry > 280) {
          doc.addPage();
          ry = 20;
        }
        doc.text(line, 20, ry);
        ry += 5;
      });
    }

    doc.save(`straxon-${framework.toLowerCase()}-audit-${Date.now()}.pdf`);
    toast.success("PDF report exported!");
  };

  return (
    <>
      {/* Framework Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["OWASP", "NIST", "ISO27001"] as const).map((f) => (
          <CyberButton
            key={f}
            variant={framework === f ? "cyan" : "ghost"}
            onClick={() => {
              setFramework(f);
              setRemediation(null);
            }}
          >
            {f}
          </CyberButton>
        ))}
      </div>

      {/* Score Card */}
      <CyberCard variant="cyan" className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1">
              COMPLIANCE SCORE
            </div>
            <div
              className={`font-display text-5xl font-bold ${
                score >= 80 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-red-400"
              }`}
            >
              {score}%
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1">
              {checked}/{items.length} controls passing
            </div>
          </div>
          <div className="flex-1 max-w-xs">
            <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  score >= 80 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ width: `${score}%` }}
              />
            </div>
            {criticalFailing > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                <span className="text-xs font-mono text-red-400">
                  {criticalFailing} CRITICAL controls failing
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <CyberButton
              variant="magenta"
              onClick={analyzeGaps}
              disabled={analyzing || failing.length === 0}
            >
              {analyzing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              {analyzing ? "Analyzing..." : "AI Remediation"}
            </CyberButton>
            <CyberButton variant="ghost" onClick={exportPDF}>
              <Download className="h-4 w-4" /> Export PDF
            </CyberButton>
            <CyberButton variant="cyan" onClick={save} disabled={saving || !user}>
              <FileText className="h-4 w-4" /> {saving ? "Saving..." : "Save Report"}
            </CyberButton>
          </div>
        </div>
      </CyberCard>

      {/* AI Remediation Panel */}
      {(analyzing || remediation) && (
        <CyberCard variant="magenta" className="p-6">
          <div className="text-[10px] font-mono text-[#ff003c] uppercase tracking-widest mb-3 flex items-center gap-2">
            <Brain className="h-3.5 w-3.5" />
            STRAXON AI — REMEDIATION PLAN
          </div>
          {analyzing ? (
            <div className="flex items-center gap-3 text-sm font-mono text-slate-400 py-4">
              <RefreshCw className="h-5 w-5 text-[#ff003c] animate-spin" />
              Analyzing {failing.length} failing controls...
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-[#ff003c] prose-headings:font-mono prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white">
              <ReactMarkdown>{remediation!}</ReactMarkdown>
            </div>
          )}
        </CyberCard>
      )}

      {/* Controls List */}
      <div className="space-y-2">
        {items.map((c) => (
          <button
            key={c.id}
            onClick={() => setAnswers((a) => ({ ...a, [c.id]: !a[c.id] }))}
            className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${
              answers[c.id]
                ? "border-green-500/30 bg-green-500/5 hover:bg-green-500/8"
                : "border-white/8 bg-white/2 hover:border-white/20"
            }`}
          >
            <div
              className={`h-5 w-5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                answers[c.id]
                  ? "bg-green-500 border-green-500"
                  : "border-white/20 hover:border-white/40"
              }`}
            >
              {answers[c.id] && <Check className="h-3 w-3 text-black" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-mono text-[#00f3ff]">{c.id}</span>
                <span className="font-display font-semibold text-sm">{c.name}</span>
                <span
                  className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${RISK_COLORS[c.risk]}`}
                >
                  {c.risk}
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{c.question}</p>
            </div>
            {!answers[c.id] && <X className="h-4 w-4 text-red-400/50 shrink-0 mt-0.5" />}
          </button>
        ))}
      </div>
    </>
  );
}
