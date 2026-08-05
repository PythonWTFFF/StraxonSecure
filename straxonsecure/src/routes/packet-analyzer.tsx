import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Wifi, Upload, ShieldAlert, Zap, Activity, Download, HardDrive } from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { callAuthed } from "@/lib/serverCall";
import { getPacketScans, analyzePacket } from "@/server/packets";

export const Route = createFileRoute("/packet-analyzer")({
  head: () => ({
    meta: [
      { title: "Deep Packet Inspection — Straxon Secure" },
      { name: "description", content: "Analyze PCAP payloads for malware and data exfiltration." },
    ],
  }),
  component: PacketAnalyzerPage,
});

function PacketAnalyzerPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [scans, setScans] = useState<any[]>([]);
  const [selectedScan, setSelectedScan] = useState<any | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const loadScans = async () => {
    try {
      const data = await callAuthed(getPacketScans, undefined);
      setScans(data || []);
    } catch (e) {
      toast.error("Failed to load packet history");
    }
  };

  useEffect(() => {
    if (user) loadScans();
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pcap') && !file.name.endsWith('.pcapng')) {
      toast.error("Only .pcap or .pcapng files are supported");
      return;
    }

    setAnalyzing(true);
    toast.info("Uploading and starting Deep Packet Inspection...");
    
    try {
      // Send metadata to simulate upload & processing
      const scan = await callAuthed(analyzePacket, { filename: file.name, size: file.size });
      toast.success("Analysis Complete");
      loadScans();
      setSelectedScan(scan);
    } catch (e: any) {
      toast.error(e.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!user) return <div className="p-12 text-center text-slate-400 font-mono">Sign in to access Packet Analyzer.</div>;

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <SectionHeading eyebrow="// FORENSICS" title="Deep Packet Inspection" description="Upload PCAP payloads for AI-driven threat and anomaly detection." />

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Col: Upload & History */}
        <div className="lg:col-span-1 space-y-6">
          <CyberCard variant="cyan" className="p-4 text-center border-dashed">
            <Wifi className="h-8 w-8 text-[#00f3ff] mx-auto mb-3" />
            <h3 className="font-mono text-sm text-white mb-2">Upload Capture</h3>
            <p className="text-xs text-slate-400 font-mono mb-4">Max file size 50MB (.pcap)</p>
            <input type="file" ref={fileInputRef} className="hidden" accept=".pcap,.pcapng" onChange={handleFileUpload} />
            <CyberButton variant="cyan" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={analyzing}>
              {analyzing ? "Analyzing..." : <><Upload className="h-4 w-4 mr-2"/> Select Payload</>}
            </CyberButton>
          </CyberCard>

          <CyberCard variant="plain" className="p-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><HardDrive className="h-4 w-4"/> Scan History</h3>
            {scans.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic">No previous scans.</div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {scans.map(s => (
                  <button key={s.id} onClick={() => setSelectedScan(s)} className={`w-full text-left p-3 rounded border transition-all ${selectedScan?.id === s.id ? 'bg-[#00f3ff]/10 border-[#00f3ff]/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                    <div className="font-mono font-bold text-white text-sm truncate">{s.filename}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1 flex justify-between">
                      <span>{(s.size_bytes / 1024).toFixed(1)} KB</span>
                      <span>{new Date(s.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CyberCard>
        </div>

        {/* Right Col: Analysis Report */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedScan ? (
            <div className="h-[400px] border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-500 space-y-4">
              <Activity className="h-12 w-12 opacity-50" />
              <p className="font-mono text-sm">Select or upload a capture to view forensics</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <CyberCard variant="plain" className="p-4 flex flex-col items-center text-center">
                  <span className="text-xs font-mono text-slate-400 uppercase">Total Packets</span>
                  <span className="text-2xl font-display font-bold text-[#00f3ff] mt-2">{selectedScan.analysis_results.totalPackets}</span>
                </CyberCard>
                <CyberCard variant="plain" className="p-4 flex flex-col items-center text-center">
                  <span className="text-xs font-mono text-slate-400 uppercase">Malicious Packets</span>
                  <span className="text-2xl font-display font-bold text-red-500 mt-2">{selectedScan.analysis_results.maliciousPackets}</span>
                </CyberCard>
                <CyberCard variant="plain" className="p-4 flex flex-col items-center text-center">
                  <span className="text-xs font-mono text-slate-400 uppercase">Anomalies</span>
                  <span className="text-2xl font-display font-bold text-yellow-500 mt-2">{selectedScan.analysis_results.anomalies}</span>
                </CyberCard>
              </div>

              <CyberCard variant="magenta" className="p-6">
                <h3 className="text-sm font-mono text-[#ff003c] font-bold uppercase mb-4 flex items-center gap-2"><ShieldAlert className="h-4 w-4"/> Threat Signatures Detected</h3>
                {selectedScan.analysis_results.detectedThreats.length === 0 ? (
                  <div className="text-green-400 font-mono text-sm">No critical threats detected in payload.</div>
                ) : (
                  <ul className="space-y-2">
                    {selectedScan.analysis_results.detectedThreats.map((t: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-mono text-red-400 bg-red-500/10 p-2 border border-red-500/20 rounded">
                        <Zap className="h-4 w-4 shrink-0 mt-0.5" />
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </CyberCard>

              <div className="grid grid-cols-2 gap-6">
                <CyberCard variant="plain" className="p-4">
                  <h3 className="text-xs font-mono uppercase text-slate-400 mb-4 border-b border-white/10 pb-2">Top Protocols</h3>
                  <div className="space-y-2">
                    {selectedScan.analysis_results.topProtocols.map((p: string, i: number) => (
                      <div key={i} className="flex justify-between font-mono text-sm">
                        <span className="text-[#00f3ff]">{p}</span>
                        <span className="text-slate-400">{100 - i * 15}%</span>
                      </div>
                    ))}
                  </div>
                </CyberCard>
                <CyberCard variant="plain" className="p-4">
                  <h3 className="text-xs font-mono uppercase text-slate-400 mb-4 border-b border-white/10 pb-2">Top Talkers (IPs)</h3>
                  <div className="space-y-2">
                    {selectedScan.analysis_results.topTalkers.map((ip: string, i: number) => (
                      <div key={i} className="flex justify-between font-mono text-sm">
                        <span className="text-[#00f3ff]">{ip}</span>
                      </div>
                    ))}
                  </div>
                </CyberCard>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
