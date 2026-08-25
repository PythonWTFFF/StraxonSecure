import { createFileRoute } from "@tanstack/react-router";
import { Users, Server, Terminal, ShieldAlert } from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { CyberButton } from "@/components/cyber/CyberButton";
import { startLabSession } from "@/server/labs";
import { callAuthed } from "@/lib/serverCall";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/labs/ad-network")({
  component: ADNetworkLab,
});

function ADNetworkLab() {
  const [loading, setLoading] = useState(false);
  const [container, setContainer] = useState<any>(null);

  const startLab = async () => {
    setLoading(true);
    try {
      const res = await callAuthed(startLabSession, { labId: "ad_network", mode: "ctf" });
      setContainer(res);
      toast.success("Active Directory Domain Controller Spawned!");
    } catch (e: any) {
      toast.error(e.message || "Failed to launch lab");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <SectionHeading
        eyebrow="// LAB-13"
        title="Active Directory: ZeroLogon"
        description="Exploit CVE-2020-1472 against a simulated Windows Domain Controller."
      />

      <div className="grid lg:grid-cols-2 gap-8">
        <CyberCard variant="magenta" className="p-6">
          <h2 className="font-display text-2xl text-white mb-4 flex items-center gap-2">
            <Users className="text-[#ff003c]" /> Domain Architecture
          </h2>
          <p className="text-slate-400 font-mono text-sm leading-relaxed mb-6">
            This module spawns an isolated container simulating a Windows Server 2019 Domain
            Controller vulnerable to the Netlogon elevation of privilege vulnerability.
          </p>
          {!container ? (
            <CyberButton variant="magenta" onClick={startLab} disabled={loading}>
              {loading ? "Provisioning..." : "Spawn Target Domain"}
            </CyberButton>
          ) : (
            <div className="p-4 bg-black/40 border border-[#00f3ff]/30 rounded text-[#00f3ff] font-mono text-sm">
              Target IP: {window.location.hostname}:{container.port}
            </div>
          )}
        </CyberCard>
      </div>
    </div>
  );
}
