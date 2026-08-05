import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { PremiumGate } from "@/components/PremiumGate";
import {
  Key,
  TerminalSquare,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Webhook,
  Activity,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/developer")({
  head: () => ({
    meta: [
      { title: "Developer API & Webhooks — Straxon Secure" },
      {
        name: "description",
        content:
          "Integrate Straxon Secure directly into your CI/CD pipelines, SIEM, and SOC workflows.",
      },
    ],
  }),
  component: DeveloperHub,
});

function DeveloperHub() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateKey = async () => {
    setGenerating(true);
    // Simulate generation delay
    await new Promise((r) => setTimeout(r, 1200));
    setApiKey(`strx_live_${crypto.randomUUID().replace(/-/g, "")}`);
    setShowKey(true);
    setGenerating(false);
    toast.success("New API key generated successfully");
  };

  const copyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <SectionHeading
        eyebrow="// DEVELOPER HUB"
        title="API & Integrations"
        description="Connect your infrastructure to the Straxon core. Automate vulnerability scans, ingest SOC alerts, and trigger incident response playbooks programmatically."
      />

      <PremiumGate
        feature="Developer API Access"
        description="Pro unlocks raw API access, CI/CD pipeline integration, webhook streaming, and SIEM forwarding."
      >
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main API Settings */}
          <div className="lg:col-span-2 space-y-6">
            <CyberCard variant="cyan">
              <div className="flex items-center gap-2 mb-4">
                <Key className="h-5 w-5 text-[#00f3ff]" />
                <h2 className="font-display text-xl font-bold">API Authentication</h2>
              </div>
              <p className="text-slate-400 text-sm mb-6">
                Use this key to authenticate requests to the Straxon Secure REST API. Keep it
                secret. Do not expose it in client-side code or public repositories.
              </p>

              <div className="space-y-4">
                {!apiKey ? (
                  <div className="p-6 border border-dashed border-white/20 rounded-xl text-center space-y-3">
                    <p className="text-sm font-mono text-slate-500">No active API keys found</p>
                    <CyberButton onClick={generateKey} disabled={generating} variant="cyan">
                      {generating ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Key className="h-4 w-4" />
                      )}
                      Generate Production Key
                    </CyberButton>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showKey ? "text" : "password"}
                          readOnly
                          value={apiKey}
                          className="w-full bg-[#020610] border border-[#00f3ff]/30 rounded-lg py-2.5 pl-4 pr-12 font-mono text-sm text-[#00f3ff] outline-none"
                        />
                        <button
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <CyberButton onClick={copyKey} variant="ghost" className="px-3">
                        {copied ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </CyberButton>
                    </div>
                    <p className="text-xs text-orange-400 font-mono flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3" /> Make sure to copy your key now. You
                      won't be able to see it again!
                    </p>
                  </div>
                )}
              </div>
            </CyberCard>

            <CyberCard variant="plain" className="opacity-80">
              <div className="flex items-center gap-2 mb-4">
                <Webhook className="h-5 w-5 text-purple-400" />
                <h2 className="font-display text-xl font-bold">Webhook Endpoints</h2>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Stream SOC alerts, failed compliance checks, and completed SAST scans directly to
                your servers or Slack/Discord.
              </p>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded border border-white/10">
                <input
                  type="text"
                  placeholder="https://your-server.com/webhooks/straxon"
                  className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-slate-300 placeholder:text-slate-600"
                />
                <CyberButton variant="ghost" size="sm">
                  Add Endpoint
                </CyberButton>
              </div>
            </CyberCard>
          </div>

          {/* Quickstart Guide */}
          <div className="space-y-4">
            <CyberCard variant="magenta" className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <TerminalSquare className="h-4 w-4 text-[#ff003c]" />
                <h3 className="font-mono text-sm font-bold uppercase text-[#ff003c]">Quickstart</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Authenticate by passing your key in the{" "}
                <code className="text-[#00f3ff]">Authorization</code> header.
              </p>
              <div className="bg-[#020610] rounded border border-white/10 p-3 overflow-x-auto">
                <pre className="text-[10px] font-mono text-slate-300">
                  <span className="text-green-400">curl</span> -X GET \<br />
                  {"  "}https://api.straxon.io/v1/soc/events \<br />
                  {"  "}-H{" "}
                  <span className="text-yellow-300">"Authorization: Bearer strx_live_..."</span>
                </pre>
              </div>
            </CyberCard>

            <div className="grid grid-cols-1 gap-2">
              <button className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm font-mono text-slate-300 group">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#00f3ff]" /> API Reference
                </span>
                <span className="text-slate-500 group-hover:text-white transition-colors">→</span>
              </button>
              <button className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm font-mono text-slate-300 group">
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-400" /> SIEM Forwarding
                </span>
                <span className="text-slate-500 group-hover:text-white transition-colors">→</span>
              </button>
            </div>
          </div>
        </div>
      </PremiumGate>
    </div>
  );
}
