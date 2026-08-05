import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const NEON_CYAN: [number, number, number] = [34, 211, 238];
const NEON_MAGENTA: [number, number, number] = [232, 80, 220];
const BG: [number, number, number] = [13, 17, 28];
const FG: [number, number, number] = [220, 230, 245];
const MUTED: [number, number, number] = [140, 150, 175];

function header(doc: jsPDF, title: string, subtitle: string) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...BG);
  doc.rect(0, 0, w, 60, "F");

  // Logo box
  doc.setDrawColor(...NEON_CYAN);
  doc.setLineWidth(0.6);
  doc.roundedRect(14, 14, 32, 32, 3, 3);
  doc.setTextColor(...NEON_CYAN);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("SX", 30, 35, { align: "center" });

  // Title
  doc.setTextColor(...FG);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(title, 54, 28);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(subtitle, 54, 38);

  // Brand strip
  doc.setFillColor(...NEON_CYAN);
  doc.rect(0, 60, w * 0.55, 1.2, "F");
  doc.setFillColor(...NEON_MAGENTA);
  doc.rect(w * 0.55, 60, w * 0.45, 1.2, "F");
}

function footer(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("STRAXON SECURE · Confidential", 14, h - 8);
    doc.text(`${i} / ${pages}`, w - 14, h - 8, { align: "right" });
  }
}

export interface ScanFinding {
  line: number;
  type: string;
  severity: "high" | "medium" | "low";
  match: string;
  fix: string;
}

export function generateScanReport(findings: ScanFinding[], filename = "scan") {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "Security Scan Report", new Date().toLocaleString());

  doc.setTextColor(...FG);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", 14, 78);

  const sevCount = (s: string) => findings.filter((f) => f.severity === s).length;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(
    `Total findings: ${findings.length}  •  High: ${sevCount("high")}  •  Medium: ${sevCount(
      "medium",
    )}  •  Low: ${sevCount("low")}`,
    14,
    86,
  );

  // Risk pill row
  const pillY = 94;
  const pills: { label: string; color: [number, number, number]; n: number }[] = [
    { label: "HIGH", color: [231, 76, 60], n: sevCount("high") },
    { label: "MED", color: [241, 196, 15], n: sevCount("medium") },
    { label: "LOW", color: NEON_CYAN, n: sevCount("low") },
  ];
  pills.forEach((p, i) => {
    const x = 14 + i * 50;
    doc.setFillColor(...p.color);
    doc.roundedRect(x, pillY, 44, 14, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(p.label, x + 4, pillY + 6);
    doc.setFontSize(14);
    doc.text(String(p.n), x + 4, pillY + 12);
  });

  autoTable(doc, {
    startY: 118,
    head: [["#", "Severity", "Type", "Line", "Match", "Remediation"]],
    body: findings.map((f, i) => [
      String(i + 1),
      f.severity.toUpperCase(),
      f.type,
      String(f.line),
      f.match,
      f.fix,
    ]),
    headStyles: { fillColor: NEON_CYAN, textColor: BG, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 18 },
      4: { cellWidth: 50, font: "courier" },
    },
    margin: { left: 14, right: 14 },
  });

  footer(doc);
  doc.save(`straxon-${filename}-${Date.now()}.pdf`);
}

export interface ArchNode {
  id: string;
  label: string;
}
export interface ArchEdge {
  source: string;
  target: string;
}

export function generateArchitectureReport(
  name: string,
  nodes: ArchNode[],
  edges: ArchEdge[],
  aiNotes?: string,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "Architecture Design", name);

  doc.setTextColor(...FG);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Components", 14, 78);

  autoTable(doc, {
    startY: 82,
    head: [["#", "Component"]],
    body: nodes.map((n, i) => [String(i + 1), n.label]),
    headStyles: { fillColor: NEON_CYAN, textColor: BG },
    styles: { fontSize: 9, cellPadding: 2 },
    margin: { left: 14, right: 14 },
  });

  const after1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  doc.setFont("helvetica", "bold");
  doc.text("Connections", 14, after1 + 10);
  autoTable(doc, {
    startY: after1 + 14,
    head: [["From", "To"]],
    body: edges.map((e) => [
      nodes.find((n) => n.id === e.source)?.label ?? e.source,
      nodes.find((n) => n.id === e.target)?.label ?? e.target,
    ]),
    headStyles: { fillColor: NEON_MAGENTA, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 2 },
    margin: { left: 14, right: 14 },
  });

  if (aiNotes) {
    const after2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    doc.setFont("helvetica", "bold");
    doc.text("AI Architect Review", 14, after2 + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    const lines = doc.splitTextToSize(aiNotes, doc.internal.pageSize.getWidth() - 28);
    doc.text(lines, 14, after2 + 16);
  }

  footer(doc);
  doc.save(`straxon-architecture-${Date.now()}.pdf`);
}

export interface ReplaySummary {
  id: string;
  lab: string;
  startedAt: number;
  endedAt: number | null;
  events: { t: number; kind: string; label: string; severity?: string }[];
}

export function generateReplayReport(session: ReplaySummary) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, "Attack Replay", `Lab: ${session.lab}`);

  doc.setTextColor(...FG);
  doc.setFontSize(10);
  const dur = session.endedAt
    ? `${((session.endedAt - session.startedAt) / 1000).toFixed(1)}s`
    : "in progress";
  doc.text(
    `Recorded: ${new Date(session.startedAt).toLocaleString()}  •  Duration: ${dur}  •  Events: ${session.events.length}`,
    14,
    78,
  );

  autoTable(doc, {
    startY: 88,
    head: [["t (ms)", "Kind", "Severity", "Event"]],
    body: session.events.map((e) => [
      String(e.t),
      e.kind,
      (e.severity ?? "info").toUpperCase(),
      e.label,
    ]),
    headStyles: { fillColor: NEON_CYAN, textColor: BG },
    styles: { fontSize: 8, cellPadding: 2 },
    margin: { left: 14, right: 14 },
  });

  footer(doc);
  doc.save(`straxon-replay-${session.id.slice(0, 8)}.pdf`);
}
