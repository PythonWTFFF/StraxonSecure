"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Save, Download, FileText, ClipboardList, ChevronRight, Loader2,
  CheckCircle2, Plus, Trash2, ChevronDown, AlertTriangle, Settings,
  Users, Calendar, Cpu, BarChart3, Shield, Target,
} from "lucide-react";

import straxonLogoAsset  from "@/assets/straxonlogo.png";
import secureIconAsset   from "@/assets/secure.svg";
import devIconAsset      from "@/assets/dev.svg";
import creativeIconAsset from "@/assets/creative.svg";

function toSrc(a: unknown): string {
  if (typeof a === "string") return a;
  if (a && typeof a === "object" && "src" in (a as object)) return (a as { src: string }).src;
  return "";
}
const LOGO_SRC     = toSrc(straxonLogoAsset);
const SECURE_SRC   = toSrc(secureIconAsset);
const DEV_SRC      = toSrc(devIconAsset);
const CREATIVE_SRC = toSrc(creativeIconAsset);

// ─── Types ────────────────────────────────────────────────────────────────────
type DocType        = "SRS" | "CLIENT_REPORT";
type Priority       = "Critical" | "High" | "Medium" | "Low";
type RiskLevel      = "High" | "Medium" | "Low";
type MilestoneStatus = "Complete" | "On Track" | "At Risk" | "Delayed";

interface Req       { id: string; category: string; description: string; priority: Priority; }
interface Milestone { name: string; due: string; pct: number; status: MilestoneStatus; }
interface TeamMember { name: string; role: string; alloc: number; }
interface Risk      { description: string; level: RiskLevel; mitigation: string; }

interface FormValues {
  clientName: string; projectName: string; author: string;
  version: string; date: string; industry: string; contactEmail: string;
  executiveSummary: string;
  systemScope: string; objectives: string; techStack: string;
  nfReqs: string; apiNotes: string;
  progressBody: string; budgetTotal: string; budgetSpent: string; nextSteps: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const CFG = {
  SRS: {
    label: "System Scope & Requirements",
    docTitle: "SYSTEM REQUIREMENT SPECIFICATION",
    accent: "#0891b2",
    gradFrom: "#0891b2",
    gradTo: "#1d4ed8",
  },
  CLIENT_REPORT: {
    label: "Progress & Deliverables",
    docTitle: "EXECUTIVE CLIENT REPORT",
    accent: "#9333ea",
    gradFrom: "#9333ea",
    gradTo: "#6d28d9",
  },
} as const;

const PRIORITY_COLOR: Record<Priority, string> = {
  Critical: "#ef4444", High: "#f97316", Medium: "#eab308", Low: "#22c55e",
};
const RISK_COLOR: Record<RiskLevel, string> = {
  High: "#ef4444", Medium: "#f59e0b", Low: "#10b981",
};
const STATUS_COLOR: Record<MilestoneStatus, string> = {
  Complete: "#10b981", "On Track": "#3b82f6", "At Risk": "#f59e0b", Delayed: "#ef4444",
};

// ─── SVG Chart Primitives (html2canvas-safe) ──────────────────────────────────

function Ring({ pct, color, size = 80, label }: { pct: number; color: string; size?: number; label?: string }) {
  const r    = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ * (1 - Math.min(100, pct) / 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={9} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={9}
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={off}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
          fontSize="13" fontWeight="700" fill={color}>{pct}%</text>
      </svg>
      {label && (
        <p style={{ fontSize: 8, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, textAlign: "center", margin: 0 }}>
          {label}
        </p>
      )}
    </div>
  );
}

function ProgressBar({ label, pct, color, status, due }: {
  label: string; pct: number; color: string; status: MilestoneStatus; due: string;
}) {
  const sc = STATUS_COLOR[status];
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{label}</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 9, color: "#9ca3af", fontFamily: "monospace" }}>{due}</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: sc, backgroundColor: sc + "22", padding: "1px 6px", borderRadius: 4, border: `1px solid ${sc}44` }}>
            {status}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color }}>{pct}%</span>
        </div>
      </div>
      <div style={{ height: 6, backgroundColor: "#f3f4f6", borderRadius: 3, overflow: "hidden", border: "1px solid #e5e7eb" }}>
        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function ArchDiagram({ stack }: { stack: string }) {
  const parts = stack.split(",").map(s => s.trim()).filter(Boolean);
  const layers = [
    { label: "Presentation Layer",  detail: parts[0] || "React / Next.js",          color: "#0891b2" },
    { label: "API Gateway",          detail: "REST / GraphQL / tRPC",                color: "#6366f1" },
    { label: "Business Services",    detail: parts[1] || "Node.js / Microservices",  color: "#8b5cf6" },
    { label: "Data Persistence",     detail: parts[parts.length - 1] || "PostgreSQL", color: "#7c3aed" },
  ];
  const W = 440; const BH = 46; const GAP = 22;
  const TH = layers.length * BH + (layers.length - 1) * GAP + 4;
  return (
    <svg width={W} height={TH} viewBox={`0 0 ${W} ${TH}`} style={{ display: "block" }}>
      {layers.map((l, i) => {
        const y = i * (BH + GAP);
        return (
          <g key={i}>
            <rect x={20} y={y} width={W - 40} height={BH} rx={6}
              fill={l.color + "15"} stroke={l.color} strokeWidth={1.5} />
            <text x={W / 2} y={y + BH / 2 - 7} textAnchor="middle"
              fontSize="10" fontWeight="700" fill={l.color}>{l.label}</text>
            <text x={W / 2} y={y + BH / 2 + 9} textAnchor="middle"
              fontSize="9" fill="#6b7280">{l.detail}</text>
            {i < layers.length - 1 && (
              <>
                <line x1={W / 2} y1={y + BH} x2={W / 2} y2={y + BH + GAP - 8}
                  stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="3,3" />
                <polygon
                  points={`${W / 2 - 5},${y + BH + GAP - 8} ${W / 2 + 5},${y + BH + GAP - 8} ${W / 2},${y + BH + GAP - 2}`}
                  fill="#d1d5db" />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function BudgetChart({ total, spent, color }: { total: number; spent: number; color: string }) {
  const safe = Math.max(1, total);
  const pct  = Math.min(100, Math.round((spent / safe) * 100));
  const rem  = total - spent;
  const fmt  = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>Budget Utilization</span>
        <span style={{ fontSize: 10, fontWeight: 700, color }}>{pct}% used</span>
      </div>
      <div style={{ height: 14, backgroundColor: "#f3f4f6", borderRadius: 7, overflow: "hidden", border: "1px solid #e5e7eb" }}>
        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: 7 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
        <span style={{ fontSize: 9, color: "#6b7280" }}>Spent: {fmt(spent)}</span>
        <span style={{ fontSize: 9, color: "#6b7280" }}>Total: {fmt(total)}</span>
        <span style={{ fontSize: 9, color: rem >= 0 ? "#10b981" : "#ef4444" }}>
          {rem >= 0 ? `Remaining: ${fmt(rem)}` : `Over by: ${fmt(-rem)}`}
        </span>
      </div>
    </div>
  );
}

// ─── Inline styles (no Tailwind inside the A4 – html2canvas needs inline CSS) ─

const DOC_FONT = "'Helvetica Neue', Arial, sans-serif";

function SecH({ num, title, color }: { num: string; title: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span style={{ fontSize: 11, fontWeight: 900, color: "#d1d5db", fontFamily: DOC_FONT }}>{num}</span>
      <span style={{ fontSize: 10, fontWeight: 900, color: "#1f2937", textTransform: "uppercase", letterSpacing: 2, fontFamily: DOC_FONT }}>
        {title}
      </span>
      <div style={{ height: 1, flex: 1, backgroundColor: "#e5e7eb" }} />
    </div>
  );
}

function ReqTable({ reqs, color }: { reqs: Req[]; color: string }) {
  if (!reqs.length) return (
    <p style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic", fontFamily: DOC_FONT }}>No requirements added.</p>
  );
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, fontFamily: DOC_FONT }}>
      <thead>
        <tr style={{ backgroundColor: color + "15" }}>
          {["REQ ID", "Category", "Description", "Priority"].map(h => (
            <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: "#374151", fontSize: 9, textTransform: "uppercase", letterSpacing: 1, borderBottom: `2px solid ${color}` }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {reqs.map((r, i) => (
          <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? "#fafafa" : "#ffffff" }}>
            <td style={{ padding: "6px 10px", color: "#6b7280", fontFamily: "monospace", fontSize: 9 }}>{r.id}</td>
            <td style={{ padding: "6px 10px", fontWeight: 600, color: "#374151" }}>{r.category}</td>
            <td style={{ padding: "6px 10px", color: "#4b5563" }}>{r.description}</td>
            <td style={{ padding: "6px 10px" }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: PRIORITY_COLOR[r.priority], backgroundColor: PRIORITY_COLOR[r.priority] + "20", padding: "2px 8px", borderRadius: 4, border: `1px solid ${PRIORITY_COLOR[r.priority]}44` }}>
                {r.priority}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RiskTable({ risks }: { risks: Risk[] }) {
  if (!risks.length) return (
    <p style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic", fontFamily: DOC_FONT }}>No risks logged.</p>
  );
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, fontFamily: DOC_FONT }}>
      <thead>
        <tr style={{ backgroundColor: "#fef2f2" }}>
          {["Risk Description", "Level", "Mitigation Strategy"].map(h => (
            <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: "#374151", fontSize: 9, textTransform: "uppercase", letterSpacing: 1, borderBottom: "2px solid #fca5a5" }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {risks.map((r, i) => (
          <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fafafa" : "#ffffff" }}>
            <td style={{ padding: "6px 10px", color: "#374151" }}>{r.description}</td>
            <td style={{ padding: "6px 10px" }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: RISK_COLOR[r.level], backgroundColor: RISK_COLOR[r.level] + "20", padding: "2px 8px", borderRadius: 4, border: `1px solid ${RISK_COLOR[r.level]}44` }}>
                {r.level}
              </span>
            </td>
            <td style={{ padding: "6px 10px", color: "#4b5563" }}>{r.mitigation}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TeamTable({ team }: { team: TeamMember[] }) {
  if (!team.length) return null;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, fontFamily: DOC_FONT }}>
      <thead>
        <tr style={{ backgroundColor: "#f0f9ff" }}>
          {["Name", "Role", "Allocation"].map(h => (
            <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, color: "#374151", fontSize: 9, textTransform: "uppercase", letterSpacing: 1, borderBottom: "2px solid #93c5fd" }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {team.map((m, i) => (
          <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fafafa" : "#ffffff" }}>
            <td style={{ padding: "6px 10px", fontWeight: 600, color: "#1f2937" }}>{m.name}</td>
            <td style={{ padding: "6px 10px", color: "#4b5563" }}>{m.role}</td>
            <td style={{ padding: "6px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 4, backgroundColor: "#e5e7eb", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${m.alloc}%`, backgroundColor: "#3b82f6", borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#6b7280" }}>{m.alloc}%</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── A4 Document ──────────────────────────────────────────────────────────────

function A4Document({
  docType, v, cfg, refNum,
  reqs, milestones, team, risks,
}: {
  docType: DocType; v: FormValues; cfg: typeof CFG[DocType];
  refNum: string; reqs: Req[]; milestones: Milestone[];
  team: TeamMember[]; risks: Risk[];
}) {
  const isSRS    = docType === "SRS";
  const budTotal = parseFloat(v.budgetTotal) || 0;
  const budSpent = parseFloat(v.budgetSpent) || 0;
  const overallPct = milestones.length
    ? Math.round(milestones.reduce((s, m) => s + m.pct, 0) / milestones.length)
    : 0;

  const box: React.CSSProperties = {
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "14px 16px",
    marginBottom: 2,
  };

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        fontFamily: DOC_FONT,
        color: "#1f2937",
        width: "100%",
        minHeight: "297mm",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent stripe */}
      <div style={{ height: 8, width: "100%", background: `linear-gradient(90deg, ${cfg.gradFrom}, #6366f1, ${cfg.gradTo})` }} />

      {/* Multipage Tiled Watermark */}
      {LOGO_SRC && [0, 1, 2, 3, 4, 5].map((pageIndex) => (
        <div
          key={pageIndex}
          style={{
            position: "absolute",
            top: `calc(${pageIndex * 297}mm + 148.5mm)`, // Centers the watermark exactly on each A4 page interval
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 0,
            opacity: 0.20,
            width: "100%",
          }}
        >
          <img 
            src={LOGO_SRC} 
            alt="" 
            style={{ width: "65%", objectFit: "contain", transform: "rotate(-20deg)", filter: "grayscale(1)" }} 
          />
        </div>
      ))}

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, padding: "14mm 16mm 28mm 16mm" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #111827", paddingBottom: 18, marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {LOGO_SRC
              ? <img src={LOGO_SRC} alt="Straxon" style={{ height: 36, objectFit: "contain", objectPosition: "left" }} />
              : <span style={{ fontSize: 24, fontWeight: 900, fontStyle: "italic", color: "#111827" }}>STRAXON</span>
            }
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {[SECURE_SRC, DEV_SRC, CREATIVE_SRC].map((src, i) =>
                src ? <img key={i} src={src} alt="" style={{ width: 16, height: 16, opacity: 0.45, filter: "grayscale(1)" }} /> : null
              )}
              <div style={{ width: 1, height: 14, backgroundColor: "#d1d5db", margin: "0 4px" }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 2 }}>
                Enterprise Command
              </span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, color: cfg.gradFrom, lineHeight: 1.2 }}>
              {cfg.docTitle}
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: 10, fontFamily: "monospace", color: "#6b7280" }}>{refNum}</p>
            <p style={{ margin: "2px 0 0", fontSize: 9, color: "#9ca3af" }}>
              {isSRS ? "ISO/IEC 29148 Aligned" : "Executive Briefing Document"}
            </p>
          </div>
        </div>

        {/* ── META GRID ── */}
        <div style={{ ...box, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px", marginBottom: 22 }}>
          {[
            ["Prepared For",     v.clientName    || "—"],
            ["Project Scope",    v.projectName   || "—"],
            ["Lead Author",      v.author        || "—"],
            ["Industry",         v.industry      || "—"],
            ["Contact",          v.contactEmail  || "—"],
            ["Document Version", `v${v.version}`],
            ["Generation Date",  v.date],
            ["Reference",        refNum],
          ].map(([label, val]) => (
            <div key={label}>
              <p style={{ margin: 0, fontSize: 8, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1.5 }}>{label}</p>
              <p style={{ margin: "3px 0 0", fontSize: 12, fontWeight: 700, color: "#1f2937" }}>{val}</p>
            </div>
          ))}
        </div>

        {/* ── SECTION 01: EXECUTIVE SUMMARY ── */}
        <div style={{ marginBottom: 24 }}>
          <SecH num="01" title="Executive Summary" color={cfg.accent} />
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.8, color: "#374151" }}>
            {v.executiveSummary || "No summary provided."}
          </p>
        </div>

        {isSRS ? (
          /* ════════ SRS SECTIONS ════════ */
          <>
            {/* 02: System Scope */}
            <div style={{ marginBottom: 24 }}>
              <SecH num="02" title="System Scope & Objectives" color={cfg.accent} />
              <p style={{ margin: "0 0 10px", fontSize: 12, lineHeight: 1.8, color: "#374151" }}>
                {v.systemScope || "—"}
              </p>
              {v.objectives && (
                <div style={{ ...box, borderLeft: `4px solid ${cfg.accent}` }}>
                  <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 700, color: cfg.accent, textTransform: "uppercase", letterSpacing: 1 }}>Key Objectives</p>
                  <p style={{ margin: 0, fontSize: 11, lineHeight: 1.7, color: "#374151", whiteSpace: "pre-wrap" }}>{v.objectives}</p>
                </div>
              )}
            </div>

            {/* 03: Functional Requirements */}
            <div style={{ marginBottom: 24 }}>
              <SecH num="03" title="Functional Requirements" color={cfg.accent} />
              <ReqTable reqs={reqs} color={cfg.accent} />
            </div>

            {/* 04: Non-Functional Requirements */}
            {v.nfReqs && (
              <div style={{ marginBottom: 24 }}>
                <SecH num="04" title="Non-Functional Requirements" color={cfg.accent} />
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.8, color: "#374151", whiteSpace: "pre-wrap" }}>{v.nfReqs}</p>
              </div>
            )}

            {/* 05: Architecture Diagram */}
            <div style={{ marginBottom: 24 }}>
              <SecH num="05" title="System Architecture" color={cfg.accent} />
              <div style={{ ...box, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <ArchDiagram stack={v.techStack} />
              </div>
            </div>

            {/* 06: Technology Stack */}
            <div style={{ marginBottom: 24 }}>
              <SecH num="06" title="Technology Stack" color={cfg.accent} />
              <div style={{ ...box, backgroundColor: "#0f172a", borderColor: "#1e293b" }}>
                <p style={{ margin: "0 0 10px", fontSize: 10, color: cfg.accent, fontFamily: "monospace" }}>{"// Initialized Stack Requirements"}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {v.techStack.split(",").map((s, i) => (
                    <span key={i} style={{ padding: "4px 12px", backgroundColor: "#1e293b", border: "1px solid #334155", color: "#e2e8f0", fontSize: 10, fontFamily: "monospace", borderRadius: 5 }}>
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 07: API & DB Notes */}
            {(v.apiNotes) && (
              <div style={{ marginBottom: 24 }}>
                <SecH num="07" title="API & Database Overview" color={cfg.accent} />
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.8, color: "#374151", whiteSpace: "pre-wrap" }}>{v.apiNotes}</p>
              </div>
            )}

            {/* 08: Project Timeline */}
            {milestones.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <SecH num="08" title="Project Timeline & Milestones" color={cfg.accent} />
                <div style={box}>
                  {milestones.map((m, i) => (
                    <ProgressBar key={i} label={m.name} pct={m.pct} color={cfg.accent} status={m.status} due={m.due} />
                  ))}
                </div>
              </div>
            )}

            {/* 09: Team */}
            {team.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <SecH num="09" title="Team Allocation" color={cfg.accent} />
                <TeamTable team={team} />
              </div>
            )}

            {/* 10: Risk Assessment */}
            <div style={{ marginBottom: 24 }}>
              <SecH num="10" title="Risk Assessment" color={cfg.accent} />
              <RiskTable risks={risks} />
            </div>
          </>
        ) : (
          /* ════════ CLIENT REPORT SECTIONS ════════ */
          <>
            {/* 02: Project Health Dashboard */}
            <div style={{ marginBottom: 24 }}>
              <SecH num="02" title="Project Health Dashboard" color={cfg.accent} />
              <div style={{ ...box, display: "flex", justifyContent: "space-around", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <Ring pct={overallPct}                                                               color={cfg.accent}   size={90} label="Overall Progress" />
                <Ring pct={milestones.filter(m => m.status !== "Delayed" && m.status !== "At Risk").length && milestones.length ? Math.round(milestones.filter(m => m.status !== "Delayed" && m.status !== "At Risk").length / milestones.length * 100) : 100}
                  color="#3b82f6" size={90} label="Schedule Adherence" />
                <Ring pct={budTotal > 0 ? Math.min(100, 100 - Math.round(((budSpent - budTotal) / Math.max(1, budTotal)) * 100)) : 100}
                  color="#10b981" size={90} label="Budget Health" />
                <Ring pct={risks.filter(r => r.level === "Low" || !r.level).length && risks.length ? Math.round(risks.filter(r => r.level === "Low").length / risks.length * 100) : 100}
                  color="#f59e0b" size={90} label="Low-Risk Items" />
              </div>
            </div>

            {/* 03: Progress Summary */}
            <div style={{ marginBottom: 24 }}>
              <SecH num="03" title="Progress Summary" color={cfg.accent} />
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.8, color: "#374151", whiteSpace: "pre-wrap" }}>
                {v.progressBody || "—"}
              </p>
            </div>

            {/* 04: Milestone Status */}
            {milestones.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <SecH num="04" title="Milestone Status" color={cfg.accent} />
                <div style={box}>
                  {milestones.map((m, i) => (
                    <ProgressBar key={i} label={m.name} pct={m.pct} color={cfg.accent} status={m.status} due={m.due} />
                  ))}
                </div>
              </div>
            )}

            {/* 05: Budget Overview */}
            {budTotal > 0 && (
              <div style={{ marginBottom: 24 }}>
                <SecH num="05" title="Budget Overview" color={cfg.accent} />
                <div style={box}>
                  <BudgetChart total={budTotal} spent={budSpent} color={cfg.accent} />
                </div>
              </div>
            )}

            {/* 06: Team */}
            {team.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <SecH num="06" title="Team Composition" color={cfg.accent} />
                <TeamTable team={team} />
              </div>
            )}

            {/* 07: Risk Status */}
            <div style={{ marginBottom: 24 }}>
              <SecH num="07" title="Risk Register" color={cfg.accent} />
              <RiskTable risks={risks} />
            </div>

            {/* 08: Next Steps */}
            {v.nextSteps && (
              <div style={{ marginBottom: 24 }}>
                <SecH num="08" title="Next Steps & Recommendations" color={cfg.accent} />
                <div style={{ ...box, borderLeft: `4px solid ${cfg.accent}` }}>
                  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.8, color: "#374151", whiteSpace: "pre-wrap" }}>{v.nextSteps}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── SIGN-OFF ── */}
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: "3px solid #f3f4f6", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          {["Prepared By", "Authorized By"].map(lbl => (
            <div key={lbl}>
              <p style={{ margin: "0 0 40px", fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1.5 }}>{lbl}</p>
              <div style={{ borderBottom: "1px solid #d1d5db", marginBottom: 6 }} />
              <p style={{ margin: 0, fontSize: 9, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>Signature & Date</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "10px 16mm", borderTop: "1px solid #e5e7eb",
        backgroundColor: "#f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.55 }}>
          {LOGO_SRC && <img src={LOGO_SRC} alt="" style={{ height: 14, objectFit: "contain", filter: "grayscale(1)" }} />}
          <span style={{ fontSize: 8, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1 }}>Straxon Labs</span>
        </div>
        <span style={{ fontSize: 8, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>
          Proprietary &amp; Confidential — Do Not Distribute
        </span>
      </div>
    </div>
  );
}

// ─── Form helpers ──────────────────────────────────────────────────────────────

const IC = "w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-all duration-200";
const FL = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{children}</p>
);

function AccordionSection({
  icon: Icon, title, open, onToggle, children, accent = "#06b6d4",
}: {
  icon: React.ElementType; title: string; open: boolean; onToggle: () => void;
  children: React.ReactNode; accent?: string;
}) {
  return (
    <div className="border border-slate-800/60 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/60 hover:bg-slate-900 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4" style={{ color: accent }} />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{title}</span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 bg-[#0b0d14] border-t border-slate-800/40">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DocumentEngine() {
  const [docType, setDocType]     = useState<DocType>("SRS");
  const [isExporting, setExport]  = useState(false);
  const [exportDone, setDone]     = useState(false);
  const [openSec, setOpenSec]     = useState<Record<string, boolean>>({ identity: true, content: true });
  const documentRef               = useRef<HTMLDivElement>(null);
  const [refNum]                  = useState(() => `SLX-${Math.floor(Math.random() * 9000) + 1000}`);

  // Dynamic arrays
  const [reqs, setReqs]           = useState<Req[]>([
    { id: "FR-001", category: "Authentication", description: "Users must be able to register and log in via email/password and OAuth.", priority: "Critical" },
    { id: "FR-002", category: "Data Export",    description: "System shall allow export of reports in PDF and CSV formats.",          priority: "High" },
  ]);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { name: "Project Kickoff & Planning",  due: "2025-02-01", pct: 100, status: "Complete"  },
    { name: "UI/UX Design Prototypes",     due: "2025-03-15", pct: 85,  status: "On Track"  },
    { name: "Backend API Development",     due: "2025-04-30", pct: 60,  status: "On Track"  },
    { name: "QA Testing & User Acceptance",due: "2025-06-01", pct: 20,  status: "At Risk"   },
  ]);
  const [team, setTeam]             = useState<TeamMember[]>([
    { name: "Swaraj Panti",   role: "Tech Lead",           alloc: 100 },
    { name: "Ananya Sharma",  role: "UI/UX Designer",      alloc: 80  },
    { name: "Dev Mehta",      role: "Backend Engineer",    alloc: 100 },
  ]);
  const [risks, setRisks]           = useState<Risk[]>([
    { description: "Third-party API rate limits may affect data sync performance.", level: "Medium", mitigation: "Implement caching and retry logic with exponential backoff." },
    { description: "Scope creep due to evolving client requirements.",               level: "High",   mitigation: "Enforce change request process with formal sign-off protocol." },
  ]);

  const toggleSec  = (k: string) => setOpenSec(p => ({ ...p, [k]: !p[k] }));
  const cfg        = CFG[docType];

  const { register, watch } = useForm<FormValues>({
    defaultValues: {
      clientName: "Global Aquatics Inc.", projectName: "Fish World Platform",
      author: "Swaraj Panti", version: "2.0.4",
      date: new Date().toISOString().split("T")[0],
      industry: "Enterprise SaaS", contactEmail: "contact@client.com",
      executiveSummary: "Development of a premium aquatic pet platform featuring a cinematic 3D interactive web application built with React Three Fiber, including advanced aquarium simulations and comprehensive care guidelines.",
      systemScope: "The system covers end-to-end aquatic species management, 3D environment rendering, and a scalable species database with relational care parameters.",
      objectives: "• Deliver a sub-2s FCP on all pages\n• Support 10,000 concurrent users\n• Achieve 99.9% uptime SLA",
      techStack: "React, Next.js 14, React Three Fiber, Tailwind CSS, PostgreSQL, Prisma, Redis",
      nfReqs: "Performance: Page load < 2s on 4G. Security: SOC 2 Type II. Scalability: 10k concurrent users. Availability: 99.9% uptime.",
      apiNotes: "RESTful API with versioning (/v1/). GraphQL layer for flexible data queries. PostgreSQL with Prisma ORM. Redis caching for session management.",
      progressBody: "Phase 1 (Discovery & Architecture) is complete. Phase 2 (Core Development) is 72% complete with all critical path items on schedule. Design system fully approved by stakeholder review.",
      budgetTotal: "2400000", budgetSpent: "1560000",
      nextSteps: "1. Finalize QA test suite by next sprint\n2. Schedule UAT session with client stakeholders\n3. Prepare deployment runbook and rollback plan\n4. Confirm go-live date with all parties",
    },
  });

  const v = watch();

  // ── Req helpers ──
  const addReq = () => setReqs(p => [...p, { id: `FR-${String(p.length + 1).padStart(3, "0")}`, category: "", description: "", priority: "Medium" }]);
  const updateReq = (i: number, k: keyof Req, val: string) => setReqs(p => p.map((r, idx) => idx === i ? { ...r, [k]: val } : r));
  const removeReq = (i: number) => setReqs(p => p.filter((_, idx) => idx !== i));

  // ── Milestone helpers ──
  const addMs  = () => setMilestones(p => [...p, { name: "", due: new Date().toISOString().split("T")[0], pct: 0, status: "On Track" }]);
  const updMs  = (i: number, k: keyof Milestone, val: string | number) => setMilestones(p => p.map((m, idx) => idx === i ? { ...m, [k]: val } : m));
  const remMs  = (i: number) => setMilestones(p => p.filter((_, idx) => idx !== i));

  // ── Team helpers ──
  const addMem  = () => setTeam(p => [...p, { name: "", role: "", alloc: 100 }]);
  const updMem  = (i: number, k: keyof TeamMember, val: string | number) => setTeam(p => p.map((m, idx) => idx === i ? { ...m, [k]: val } : m));
  const remMem  = (i: number) => setTeam(p => p.filter((_, idx) => idx !== i));

  // ── Risk helpers ──
  const addRisk  = () => setRisks(p => [...p, { description: "", level: "Medium", mitigation: "" }]);
  const updRisk  = (i: number, k: keyof Risk, val: string) => setRisks(p => p.map((r, idx) => idx === i ? { ...r, [k]: val } : r));
  const remRisk  = (i: number) => setRisks(p => p.filter((_, idx) => idx !== i));

  // ── PDF Export ──
  const handleExport = async () => {
    if (!documentRef.current) return;
    setExport(true);
    setDone(false);
    try {
      const el     = documentRef.current;
      const canvas = await html2canvas(el, {
        scale: 3, useCORS: true, allowTaint: true,
        backgroundColor: "#ffffff", logging: false,
        imageTimeout: 0,
        onclone: (doc) => {
          const el = doc.querySelector("[data-doc-root]") as HTMLElement;
          if (el) { el.style.width = "794px"; el.style.minHeight = "1123px"; }
        },
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf     = new jsPDF("p", "mm", "a4");
      const pdfW    = pdf.internal.pageSize.getWidth();
      const pdfH    = pdf.internal.pageSize.getHeight();
      const imgH    = (canvas.height * pdfW) / canvas.width;

      let remaining = imgH;
      let position  = 0;

      pdf.addImage(imgData, "JPEG", 0, position, pdfW, imgH);
      remaining -= pdfH;

      while (remaining > 0) {
        position -= pdfH;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfW, imgH);
        remaining -= pdfH;
      }

      pdf.save(`Straxon_${docType}_${v.projectName.replace(/\s+/g, "_") || "Document"}_${refNum}.pdf`);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExport(false);
    }
  };

  const isSRS   = docType === "SRS";
  const selCls  = `${IC} appearance-none`;

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-50 flex flex-col">

      {/* ── TOPBAR ── */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur border-b border-slate-800/70 px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-4">
          {LOGO_SRC
            ? <img src={LOGO_SRC} alt="Straxon" className="h-8 w-auto object-contain" />
            : <span className="text-lg font-black uppercase italic tracking-tighter">STRAXON</span>
          }
          <div className="w-px h-7 bg-slate-800 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-4">
            {[
              { src: SECURE_SRC,   label: "Secure",   color: "#22d3ee" },
              { src: DEV_SRC,       label: "Dev",      color: "#a78bfa" },
              { src: CREATIVE_SRC,  label: "Creative", color: "#fb923c" },
            ].map(({ src, label, color }) => (
              <div key={label} className="flex flex-col items-center gap-1 group cursor-default">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center border transition-transform group-hover:scale-110"
                  style={{ background: `${color}18`, borderColor: `${color}45` }}>
                  {src
                    ? <img src={src} alt={label} className="w-4 h-4 object-contain" />
                    : <span className="text-[10px] font-black" style={{ color }}>{label[0]}</span>
                  }
                </div>
                <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {(["SRS", "CLIENT_REPORT"] as DocType[]).map((t) => {
            const active = docType === t;
            const c      = CFG[t];
            return (
              <button
                key={t}
                onClick={() => setDocType(t)}
                className={`relative px-3 md:px-5 py-2 text-[11px] font-bold rounded-lg transition-colors duration-200 flex items-center gap-1.5 ${active ? "text-white" : "text-slate-500 hover:text-slate-300"}`}
              >
                {active && (
                  <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-lg shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${c.gradFrom}, ${c.gradTo})` }}
                    transition={{ type: "spring", stiffness: 400, damping: 34 }} />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {t === "SRS" ? <FileText className="w-3.5 h-3.5" /> : <ClipboardList className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{t === "SRS" ? "SRS Builder" : "Client Report"}</span>
                  <span className="sm:hidden">{t === "SRS" ? "SRS" : "Report"}</span>
                </span>
              </button>
            );
          })}
        </div>

        <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest"
          style={{ borderColor: `${cfg.accent}55`, color: cfg.accent }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.accent }} />
          Live
        </span>
      </header>

      {/* ── BODY ── */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[460px_1fr]">

        {/* ── LEFT: FORM ── */}
        <aside className="border-b xl:border-b-0 xl:border-r border-slate-800/60 overflow-y-auto bg-[#0b0d14] p-4 md:p-5 space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            <ChevronRight className="w-3.5 h-3.5" style={{ color: cfg.accent }} />
            Configuration Matrix
          </div>

          {/* Identity */}
          <AccordionSection icon={Settings} title="Client & Project Identity" open={!!openSec.identity} onToggle={() => toggleSec("identity")} accent={cfg.accent}>
            <div className="grid grid-cols-2 gap-3">
              <div><FL>Client Name</FL><input {...register("clientName")} className={IC} /></div>
              <div><FL>Contact Email</FL><input {...register("contactEmail")} className={IC} /></div>
              <div><FL>Project Title</FL><input {...register("projectName")} className={IC} /></div>
              <div><FL>Lead Author</FL><input {...register("author")} className={IC} /></div>
              <div><FL>Industry</FL><input {...register("industry")} className={IC} /></div>
              <div><FL>Version</FL><input {...register("version")} className={IC} /></div>
            </div>
            <div><FL>Date</FL><input type="date" {...register("date")} className={IC} /></div>
          </AccordionSection>

          {/* Content */}
          <AccordionSection icon={FileText} title="Document Content" open={!!openSec.content} onToggle={() => toggleSec("content")} accent={cfg.accent}>
            <div>
              <FL>Executive Summary</FL>
              <textarea {...register("executiveSummary")} rows={4} className={`${IC} resize-none leading-relaxed`} />
            </div>
            <AnimatePresence mode="wait">
              {isSRS ? (
                <motion.div key="srs-content" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-4">
                  <div><FL>System Scope</FL><textarea {...register("systemScope")} rows={3} className={`${IC} resize-none leading-relaxed`} /></div>
                  <div><FL>Key Objectives (one per line)</FL><textarea {...register("objectives")} rows={3} className={`${IC} resize-none leading-relaxed font-mono text-xs`} /></div>
                  <div><FL>Non-Functional Requirements</FL><textarea {...register("nfReqs")} rows={3} className={`${IC} resize-none leading-relaxed text-xs`} /></div>
                  <div><FL>API & Database Notes</FL><textarea {...register("apiNotes")} rows={3} className={`${IC} resize-none leading-relaxed text-xs`} /></div>
                </motion.div>
              ) : (
                <motion.div key="report-content" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-4">
                  <div><FL>Progress Summary</FL><textarea {...register("progressBody")} rows={4} className={`${IC} resize-none leading-relaxed`} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><FL>Budget Total (₹)</FL><input type="number" {...register("budgetTotal")} className={IC} /></div>
                    <div><FL>Budget Spent (₹)</FL><input type="number" {...register("budgetSpent")} className={IC} /></div>
                  </div>
                  <div><FL>Next Steps</FL><textarea {...register("nextSteps")} rows={4} className={`${IC} resize-none leading-relaxed text-xs`} /></div>
                </motion.div>
              )}
            </AnimatePresence>
          </AccordionSection>

          {/* Requirements (SRS) / Milestones */}
          <AccordionSection icon={Target} title={isSRS ? "Functional Requirements" : "Milestones"} open={!!openSec.reqs} onToggle={() => toggleSec("reqs")} accent={cfg.accent}>
            {isSRS ? (
              <div className="space-y-3">
                {reqs.map((r, i) => (
                  <div key={r.id} className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500">{r.id}</span>
                      <button onClick={() => removeReq(i)} className="text-red-500/60 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <input value={r.category} onChange={e => updateReq(i, "category", e.target.value)} placeholder="Category (e.g. Auth)" className={`${IC} py-2`} />
                    <input value={r.description} onChange={e => updateReq(i, "description", e.target.value)} placeholder="Requirement description" className={`${IC} py-2`} />
                    <select value={r.priority} onChange={e => updateReq(i, "priority", e.target.value as Priority)} className={selCls + " py-2"}>
                      {(["Critical","High","Medium","Low"] as Priority[]).map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                ))}
                <button onClick={addReq} className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-700 hover:border-cyan-600 text-slate-500 hover:text-cyan-400 text-xs font-bold rounded-lg transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Requirement
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {milestones.map((m, i) => (
                  <div key={i} className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500">Milestone {i + 1}</span>
                      <button onClick={() => remMs(i)} className="text-red-500/60 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <input value={m.name} onChange={e => updMs(i, "name", e.target.value)} placeholder="Milestone name" className={`${IC} py-2`} />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={m.due} onChange={e => updMs(i, "due", e.target.value)} className={`${IC} py-2`} />
                      <select value={m.status} onChange={e => updMs(i, "status", e.target.value as MilestoneStatus)} className={selCls + " py-2"}>
                        {(["Complete","On Track","At Risk","Delayed"] as MilestoneStatus[]).map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="range" min={0} max={100} value={m.pct} onChange={e => updMs(i, "pct", Number(e.target.value))} className="flex-1 accent-cyan-500" />
                      <span className="text-xs font-mono text-slate-400 w-10 text-right">{m.pct}%</span>
                    </div>
                  </div>
                ))}
                <button onClick={addMs} className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-700 hover:border-purple-600 text-slate-500 hover:text-purple-400 text-xs font-bold rounded-lg transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Milestone
                </button>
              </div>
            )}
          </AccordionSection>

          {/* Team & Tech */}
          <AccordionSection icon={Users} title="Team & Technology" open={!!openSec.team} onToggle={() => toggleSec("team")} accent={cfg.accent}>
            {isSRS && (
              <div className="mb-4">
                <FL>Tech Stack (comma-separated)</FL>
                <input {...register("techStack")} className={IC} placeholder="React, Node.js, PostgreSQL..." />
              </div>
            )}
            <FL>Team Members</FL>
            <div className="space-y-2">
              {team.map((m, i) => (
                <div key={i} className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">Member {i+1}</span>
                    <button onClick={() => remMem(i)} className="text-red-500/60 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={m.name} onChange={e => updMem(i, "name", e.target.value)} placeholder="Full name" className={`${IC} py-2`} />
                    <input value={m.role} onChange={e => updMem(i, "role", e.target.value)} placeholder="Role" className={`${IC} py-2`} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500">Allocation</span>
                    <input type="range" min={0} max={100} value={m.alloc} onChange={e => updMem(i, "alloc", Number(e.target.value))} className="flex-1 accent-cyan-500" />
                    <span className="text-xs font-mono text-slate-400 w-10 text-right">{m.alloc}%</span>
                  </div>
                </div>
              ))}
              <button onClick={addMem} className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-700 hover:border-cyan-600 text-slate-500 hover:text-cyan-400 text-xs font-bold rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Member
              </button>
            </div>
          </AccordionSection>

          {/* Milestones (SRS only has milestones in timeline) */}
          {isSRS && (
            <AccordionSection icon={Calendar} title="Project Timeline" open={!!openSec.timeline} onToggle={() => toggleSec("timeline")} accent={cfg.accent}>
              <div className="space-y-3">
                {milestones.map((m, i) => (
                  <div key={i} className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500">Milestone {i+1}</span>
                      <button onClick={() => remMs(i)} className="text-red-500/60 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <input value={m.name} onChange={e => updMs(i, "name", e.target.value)} placeholder="Milestone name" className={`${IC} py-2`} />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={m.due} onChange={e => updMs(i, "due", e.target.value)} className={`${IC} py-2`} />
                      <select value={m.status} onChange={e => updMs(i, "status", e.target.value as MilestoneStatus)} className={selCls + " py-2"}>
                        {(["Complete","On Track","At Risk","Delayed"] as MilestoneStatus[]).map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="range" min={0} max={100} value={m.pct} onChange={e => updMs(i, "pct", Number(e.target.value))} className="flex-1 accent-cyan-500" />
                      <span className="text-xs font-mono text-slate-400 w-10 text-right">{m.pct}%</span>
                    </div>
                  </div>
                ))}
                <button onClick={addMs} className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-700 hover:border-cyan-600 text-slate-500 hover:text-cyan-400 text-xs font-bold rounded-lg transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Milestone
                </button>
              </div>
            </AccordionSection>
          )}

          {/* Risks */}
          <AccordionSection icon={AlertTriangle} title="Risk Register" open={!!openSec.risks} onToggle={() => toggleSec("risks")} accent="#ef4444">
            <div className="space-y-3">
              {risks.map((r, i) => (
                <div key={i} className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">Risk {i+1}</span>
                    <button onClick={() => remRisk(i)} className="text-red-500/60 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <input value={r.description} onChange={e => updRisk(i, "description", e.target.value)} placeholder="Risk description" className={`${IC} py-2`} />
                  <select value={r.level} onChange={e => updRisk(i, "level", e.target.value as RiskLevel)} className={selCls + " py-2"}>
                    {(["High","Medium","Low"] as RiskLevel[]).map(l => <option key={l}>{l}</option>)}
                  </select>
                  <input value={r.mitigation} onChange={e => updRisk(i, "mitigation", e.target.value)} placeholder="Mitigation strategy" className={`${IC} py-2`} />
                </div>
              ))}
              <button onClick={addRisk} className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-700 hover:border-red-600 text-slate-500 hover:text-red-400 text-xs font-bold rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Risk
              </button>
            </div>
          </AccordionSection>

          {/* Export actions */}
          <div className="flex gap-3 pt-2">
            <button className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs uppercase tracking-widest font-bold py-3.5 rounded-xl transition-all duration-200">
              <Save className="w-4 h-4" /> Save
            </button>
            <motion.button
              onClick={handleExport}
              disabled={isExporting}
              whileTap={{ scale: 0.98 }}
              className="flex-[2] flex items-center justify-center gap-2 text-white text-xs uppercase tracking-widest font-bold py-3.5 rounded-xl transition-all disabled:opacity-70 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${cfg.gradFrom}, ${cfg.gradTo})` }}
            >
              {isExporting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : exportDone
                  ? <CheckCircle2 className="w-4 h-4" />
                  : <Download className="w-4 h-4" />
              }
              {isExporting ? "Compiling PDF…" : exportDone ? "Generated!" : "Export PDF"}
            </motion.button>
          </div>
        </aside>

        {/* ── RIGHT: A4 PREVIEW ── */}
        <main className="overflow-y-auto bg-[#131824] flex items-start justify-center p-4 md:p-10 pb-24">
          <div className="w-full max-w-[794px]">
            {/* Scale indicator */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] text-slate-600 font-mono">A4 Preview · 210mm × 297mm</span>
              <span className="text-[10px] text-slate-600 font-mono">{refNum}</span>
            </div>

            {/* The actual A4 - this gets captured by html2canvas */}
            <div ref={documentRef} data-doc-root style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.5)" }}>
              <A4Document
                docType={docType}
                v={v}
                cfg={cfg}
                refNum={refNum}
                reqs={reqs}
                milestones={milestones}
                team={team}
                risks={risks}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}