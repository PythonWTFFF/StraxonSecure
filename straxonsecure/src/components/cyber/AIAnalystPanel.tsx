import { useState } from "react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { BrainCircuit, Search, Globe, ShieldAlert, Cpu } from "lucide-react";

type Tab = "payload" | "dga" | "llm";

export function AIAnalystPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("payload");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const analyze = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);

    const mlUrl = import.meta.env.VITE_ML_ENGINE_URL || "http://localhost:8082";
    let endpoint = "";
    let body = {};

    if (activeTab === "payload") {
      endpoint = "/api/ml/analyze-payload";
      body = { payload: input };
    } else if (activeTab === "dga") {
      endpoint = "/api/ml/detect-dga";
      body = { domain: input };
    } else {
      endpoint = "/api/ml/local-llm-report";
      body = { context: input };
    }

    try {
      const res = await fetch(`${mlUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setResult(await res.json());
      } else {
        setResult({ error: "ML Engine unreachable or returned an error." });
      }
    } catch (e: any) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CyberCard
      variant="magenta"
      className="p-4 bg-[#020610]/90 backdrop-blur-xl border-white/10 flex flex-col h-full max-h-[500px]"
    >
      <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
        <BrainCircuit className="h-5 w-5 text-[#ff003c]" />
        <h3 className="font-display font-bold text-white tracking-wide">AI Analyst Tool</h3>
        <span className="ml-auto text-[9px] font-mono bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">
          AIR-GAPPED ML
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setActiveTab("payload");
            setResult(null);
            setInput("");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-mono tracking-widest uppercase rounded border transition-colors ${activeTab === "payload" ? "bg-[#ff003c]/20 border-[#ff003c]/50 text-white" : "bg-black/40 border-white/5 text-slate-500 hover:text-slate-300"}`}
        >
          <Search className="h-3 w-3" /> NLP
        </button>
        <button
          onClick={() => {
            setActiveTab("dga");
            setResult(null);
            setInput("");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-mono tracking-widest uppercase rounded border transition-colors ${activeTab === "dga" ? "bg-[#00f3ff]/20 border-[#00f3ff]/50 text-white" : "bg-black/40 border-white/5 text-slate-500 hover:text-slate-300"}`}
        >
          <Globe className="h-3 w-3" /> DGA
        </button>
        <button
          onClick={() => {
            setActiveTab("llm");
            setResult(null);
            setInput("");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-mono tracking-widest uppercase rounded border transition-colors ${activeTab === "llm" ? "bg-purple-500/20 border-purple-500/50 text-white" : "bg-black/40 border-white/5 text-slate-500 hover:text-slate-300"}`}
        >
          <Cpu className="h-3 w-3" /> LLM
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-3 min-h-[150px]">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            activeTab === "payload"
              ? "Paste HTTP payload (e.g. <script>alert(1)</script>)"
              : activeTab === "dga"
                ? "Paste domain (e.g. xkqkzj291.com)"
                : "Paste raw log or event context for AI summary..."
          }
          className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm font-mono text-slate-300 focus:border-[#ff003c] transition-colors resize-none h-24 custom-scrollbar"
        />
        <CyberButton
          variant={activeTab === "dga" ? "cyan" : activeTab === "llm" ? "ghost" : "magenta"}
          className="w-full justify-center"
          onClick={analyze}
          disabled={loading || !input}
        >
          {loading ? "Analyzing..." : "Run ML Inference"}
        </CyberButton>
      </div>

      {/* Results Box */}
      {result && (
        <div className="mt-4 p-3 bg-black/60 border border-white/10 rounded-lg overflow-y-auto custom-scrollbar max-h-[150px]">
          {result.error ? (
            <div className="text-red-400 font-mono text-[10px]">{result.error}</div>
          ) : activeTab === "payload" ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-slate-400">
                <span>Prediction:</span>
                <span className={result.malicious ? "text-red-500 font-bold" : "text-emerald-400"}>
                  {result.malicious ? "Malicious" : "Benign"}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-slate-400">
                <span>Confidence:</span>
                <span className="text-white">{result.confidence * 100}%</span>
              </div>
            </div>
          ) : activeTab === "dga" ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-slate-400">
                <span>Is Algorithmic (DGA):</span>
                <span className={result.is_dga ? "text-red-500 font-bold" : "text-emerald-400"}>
                  {result.is_dga ? "YES" : "NO"}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-slate-400">
                <span>Entropy Score:</span>
                <span className="text-white">{result.entropy}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-2">
                <ShieldAlert className="h-3 w-3 text-purple-400" /> Offline Report
              </div>
              <div className="text-xs font-sans text-slate-300 leading-relaxed">
                {result.report}
              </div>
            </div>
          )}
          {result.model && (
            <div className="mt-3 text-[8px] font-mono text-slate-600 text-right uppercase tracking-widest">
              Model: {result.model}
            </div>
          )}
        </div>
      )}
    </CyberCard>
  );
}
