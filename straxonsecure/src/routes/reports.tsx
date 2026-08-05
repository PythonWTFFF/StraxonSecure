import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { PremiumGate } from "@/components/PremiumGate";
import { FileText, Download, Mail, Save, Clock, ShieldCheck, Activity, Globe } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { callAuthed } from "@/lib/serverCall";
import { getSchedule, updateSchedule, getReportMetrics } from "@/server/reports";
import jsPDF from "jspdf";
import "jspdf-autotable";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Executive Reports — Straxon Secure" },
      { name: "description", content: "Automated CISO-level security posture reports." },
    ],
  }),
  component: ReportsDashboard,
});

function ReportsDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  
  // Schedule state
  const [schedule, setSchedule] = useState<any>(null);
  const [frequency, setFrequency] = useState("weekly");
  const [emailStr, setEmailStr] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      loadMetrics();
      loadSchedule();
    }
  }, [user]);

  const loadMetrics = async () => {
    try {
      const data = await callAuthed(getReportMetrics, undefined);
      setMetrics(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSchedule = async () => {
    try {
      const data = await callAuthed(getSchedule, undefined);
      if (data) {
        setSchedule(data);
        setFrequency(data.frequency);
        setEmailStr(data.emails.join(", "));
        setIsActive(data.active);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Parse emails
    const emails = emailStr.split(",").map(s => s.trim()).filter(s => s.includes("@"));
    
    if (emails.length === 0 && emailStr.length > 0) {
      toast.error("Please enter valid email addresses.");
      setIsSaving(false);
      return;
    }

    try {
      await callAuthed(updateSchedule, {
        frequency: frequency as any,
        emails,
        active: isActive
      });
      toast.success("Report schedule updated!");
    } catch (e: any) {
      toast.error(e.message || "Failed to update schedule");
    } finally {
      setIsSaving(false);
    }
  };

  const generatePDF = () => {
    if (!metrics) return;
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Theme colors
      const primaryColor = "#00f3ff";
      
      // Header
      doc.setFillColor(10, 15, 25);
      doc.rect(0, 0, pageWidth, 40, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("STRAXON SECURE", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text("Executive Security Posture Report", 14, 30);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 14, 30, { align: "right" });

      // Body
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.text("1. Threat Intelligence (EDR)", 14, 55);
      
      // @ts-ignore
      doc.autoTable({
        startY: 60,
        head: [['Threat Level', 'Detected Instances']],
        body: [
          ['Critical', metrics.edr.critical.toString()],
          ['High', metrics.edr.high.toString()],
          ['Medium', metrics.edr.medium.toString()],
          ['Low', metrics.edr.low.toString()]
        ],
        theme: 'grid',
        headStyles: { fillColor: [0, 243, 255], textColor: [0,0,0] }
      });

      // @ts-ignore
      let currentY = doc.lastAutoTable.finalY + 15;

      doc.text("2. External Attack Surface (EASM)", 14, currentY);
      // @ts-ignore
      doc.autoTable({
        startY: currentY + 5,
        head: [['Metric', 'Count']],
        body: [
          ['Exposed Subdomains', metrics.easm.subdomains.toString()],
          ['Open Ports', metrics.easm.openPorts.toString()],
          ['Total OSINT Findings', metrics.easm.totalFindings.toString()]
        ],
        theme: 'grid',
        headStyles: { fillColor: [0, 243, 255], textColor: [0,0,0] }
      });

      // @ts-ignore
      currentY = doc.lastAutoTable.finalY + 15;

      doc.text("3. Compliance & Audit", 14, currentY);
      if (metrics.compliance) {
        // @ts-ignore
        doc.autoTable({
          startY: currentY + 5,
          head: [['Status', 'Passed', 'Failed']],
          body: [
            [metrics.compliance.status.toUpperCase(), metrics.compliance.controls_passed.toString(), metrics.compliance.controls_failed.toString()]
          ],
          theme: 'grid',
          headStyles: { fillColor: [0, 243, 255], textColor: [0,0,0] }
        });
      } else {
        doc.setFontSize(12);
        doc.text("No compliance runs recorded.", 14, currentY + 8);
      }

      // Save
      doc.save(`Straxon_Report_${new Date().getTime()}.pdf`);
      toast.success("PDF Generated successfully!");
      
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <SectionHeading
        eyebrow="// REPORTING ENGINE"
        title="Executive Summary"
        description="Aggregate metrics across the entire platform and export CISO-ready PDF reports."
      />

      <PremiumGate
        feature="Automated Reporting"
        description="Pro unlocks on-demand PDF generation and scheduled email delivery for executive stakeholders."
      >
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Left Column: Schedule Form */}
          <div className="lg:col-span-1 space-y-6">
            <CyberCard variant="cyan" className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-[#00f3ff]" />
                <h3 className="font-display font-bold text-lg">Scheduled Delivery</h3>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Automatically email this report to your stakeholders.
              </p>

              <form onSubmit={handleSaveSchedule} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-300">Frequency</label>
                  <select 
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full bg-[#020610] border border-[#00f3ff]/30 rounded px-3 py-2 text-sm text-slate-200 outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-300">Recipients (comma separated)</label>
                  <input 
                    type="text"
                    placeholder="ciso@company.com, admin@company.com"
                    value={emailStr}
                    onChange={(e) => setEmailStr(e.target.value)}
                    className="w-full bg-[#020610] border border-[#00f3ff]/30 rounded px-3 py-2 text-sm text-slate-200 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    id="active-toggle"
                    className="accent-[#00f3ff]"
                  />
                  <label htmlFor="active-toggle" className="text-xs font-mono text-slate-300 cursor-pointer">
                    Enable Scheduled Emails
                  </label>
                </div>

                <CyberButton type="submit" disabled={isSaving} variant="cyan" className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Schedule"}
                </CyberButton>
              </form>
            </CyberCard>

            <CyberCard variant="plain" className="p-5 flex flex-col items-center justify-center text-center gap-4">
              <FileText className="h-10 w-10 text-slate-400" />
              <div className="space-y-1">
                <h4 className="font-mono font-bold text-sm text-white">Manual Export</h4>
                <p className="text-xs text-slate-400">Download the report right now.</p>
              </div>
              <CyberButton onClick={generatePDF} disabled={isGenerating || !metrics} variant="ghost" className="w-full border border-white/20">
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Download PDF"}
              </CyberButton>
            </CyberCard>
          </div>

          {/* Right Column: Live Metrics Preview */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-mono text-sm text-[#00f3ff] uppercase tracking-widest pl-2 border-l-2 border-[#00f3ff]">
              Live Report Preview
            </h3>

            {!metrics ? (
              <div className="p-12 text-center text-slate-500 font-mono animate-pulse">Loading Aggregations...</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                
                {/* EDR Preview */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-400 mb-3">
                    <Activity className="h-4 w-4" />
                    <span className="font-mono text-xs uppercase">EDR Telemetry</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-red-400 font-mono">Critical</span>
                      <span className="text-white font-bold">{metrics.edr.critical}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-orange-400 font-mono">High</span>
                      <span className="text-white font-bold">{metrics.edr.high}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-400 font-mono">Low/Monitored</span>
                      <span className="text-white font-bold">{metrics.edr.low}</span>
                    </div>
                  </div>
                </div>

                {/* EASM Preview */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center gap-2 text-slate-400 mb-3">
                    <Globe className="h-4 w-4" />
                    <span className="font-mono text-xs uppercase">Attack Surface</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-300 font-mono">Subdomains</span>
                      <span className="text-[#00f3ff] font-bold">{metrics.easm.subdomains}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-300 font-mono">Open Ports</span>
                      <span className="text-yellow-400 font-bold">{metrics.easm.openPorts}</span>
                    </div>
                  </div>
                </div>

                {/* Compliance Preview */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg col-span-2">
                  <div className="flex items-center gap-2 text-slate-400 mb-3">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="font-mono text-xs uppercase">Latest Compliance Audit</span>
                  </div>
                  {metrics.compliance ? (
                    <div className="flex gap-8">
                       <div className="space-y-1">
                          <div className="text-xs text-slate-500 font-mono uppercase">Status</div>
                          <div className={`font-bold ${metrics.compliance.status === 'failed' ? 'text-red-400' : 'text-green-400'}`}>
                            {metrics.compliance.status.toUpperCase()}
                          </div>
                       </div>
                       <div className="space-y-1">
                          <div className="text-xs text-slate-500 font-mono uppercase">Controls Passed</div>
                          <div className="font-bold text-white">{metrics.compliance.controls_passed} / {metrics.compliance.total_controls}</div>
                       </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 font-mono italic">No audits performed yet.</div>
                  )}
                </div>

              </div>
            )}
          </div>
          
        </div>
      </PremiumGate>
    </div>
  );
}
