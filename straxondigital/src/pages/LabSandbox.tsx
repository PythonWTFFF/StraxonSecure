import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, Server, Code2, FolderTree, FileCode2, Search, 
  GitBranch, Play, CheckCircle2, ChevronRight, X, AlertTriangle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { toast } from "sonner";

export default function LabSandbox() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState<any>(null);
  const [bootState, setBootState] = useState<"initializing" | "provisioning" | "ready">("initializing");
  const [activeFile, setActiveFile] = useState("src/services/cart.ts");
  const [code, setCode] = useState(`export async function addToCart(userId: string, item: any) {
  const redis = new Redis();
  const cart = await redis.get(\`cart:\${userId}\`);
  
  // BUG: Race condition here if multiple requests hit concurrently
  let parsed = cart ? JSON.parse(cart) : [];
  parsed.push(item);
  
  await redis.set(\`cart:\${userId}\`, JSON.stringify(parsed));
  return parsed;
}`);

  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);

  const handleSubmit = async () => {
    if (!scenario) return;
    setSubmitting(true);
    try {
      // Use straxonsecure's new public API route (in prod this would be the actual domain)
      const apiUrl = import.meta.env.DEV ? "http://localhost:3000/api/public/evaluate-lab" : "https://secure.straxon.com/api/public/evaluate-lab";
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: crypto.randomUUID(), // Mock session ID for MVP
          scenarioSlug: scenario.slug,
          candidateCode: code
        })
      });

      if (!res.ok) throw new Error("Evaluation failed");
      const data = await res.json();
      setEvaluation(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to evaluate code");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    async function loadScenario() {
      const { data } = await supabase
        .from("sim_scenarios")
        .select("*")
        .eq("slug", id)
        .single();
      
      if (data) {
        setScenario(data);
      } else {
        toast.error("Scenario not found");
        navigate("/labs");
      }
    }
    
    if (id) loadScenario();
  }, [id, navigate]);

  useEffect(() => {
    if (!scenario) return;
    
    // Mock the microVM boot process
    const initTimer = setTimeout(() => setBootState("provisioning"), 600);
    const readyTimer = setTimeout(() => setBootState("ready"), 1500);
    
    return () => {
      clearTimeout(initTimer);
      clearTimeout(readyTimer);
    };
  }, [scenario]);

  if (!scenario) return <div className="min-h-screen bg-[#020617]" />;

  if (bootState !== "ready") {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-foreground font-mono">
        <Server className="h-12 w-12 text-cyan-400 mb-6 animate-pulse" />
        <h2 className="text-xl mb-2">DevLab Engine</h2>
        <div className="text-sm text-muted-foreground mb-8">
          {bootState === "initializing" ? "Allocating secure sandbox..." : "Booting Firecracker MicroVM..."}
        </div>
        <div className="w-64 h-1 bg-slate-900 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-cyan-500"
            initial={{ width: "10%" }}
            animate={{ width: bootState === "provisioning" ? "90%" : "30%" }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#020617] flex flex-col text-slate-300 font-sans overflow-hidden">
      {/* Top Navbar */}
      <header className="h-12 bg-[#090d1f] border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/labs")} className="text-muted-foreground hover:text-white px-2 h-8">
            <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
            Exit Lab
          </Button>
          <div className="h-4 w-px bg-slate-700" />
          <div className="font-mono text-xs flex items-center gap-2">
            <Server className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-400">VM: </span>
            <span className="text-emerald-400 font-semibold">running</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm font-mono font-bold text-white">
          <Terminal className="h-4 w-4 text-cyan-400" />
          {scenario.title}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-amber-400 bg-amber-950/30 px-2 py-1 rounded border border-amber-900/50">
            44:59 remaining
          </div>
          <Button 
            size="sm" 
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 text-xs font-mono disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
            Submit PR
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal">
          
          {/* Left Sidebar (File Explorer) */}
          <Panel defaultSize={15} minSize={10} maxSize={25} className="bg-[#090d1f] border-r border-slate-800 flex flex-col">
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest p-3 flex items-center justify-between">
              Explorer
            </div>
            <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
              <div className="text-xs font-mono py-1 px-2 hover:bg-slate-800/50 cursor-pointer rounded flex items-center gap-2 text-slate-300">
                <FolderTree className="h-3.5 w-3.5 text-blue-400" /> src
              </div>
              <div className="pl-4 space-y-0.5">
                <div 
                  onClick={() => setActiveFile("src/services/cart.ts")}
                  className={`text-xs font-mono py-1 px-2 cursor-pointer rounded flex items-center gap-2 ${activeFile === "src/services/cart.ts" ? "bg-cyan-950/40 text-cyan-300" : "hover:bg-slate-800/50 text-slate-400"}`}
                >
                  <FileCode2 className="h-3.5 w-3.5 text-amber-400" /> cart.ts
                </div>
                <div 
                  onClick={() => setActiveFile("src/tests/cart.test.ts")}
                  className={`text-xs font-mono py-1 px-2 cursor-pointer rounded flex items-center gap-2 ${activeFile === "src/tests/cart.test.ts" ? "bg-cyan-950/40 text-cyan-300" : "hover:bg-slate-800/50 text-slate-400"}`}
                >
                  <FileCode2 className="h-3.5 w-3.5 text-emerald-400" /> cart.test.ts
                </div>
              </div>
              <div className="text-xs font-mono py-1 px-2 hover:bg-slate-800/50 cursor-pointer rounded flex items-center gap-2 text-slate-400">
                <FileCode2 className="h-3.5 w-3.5 text-rose-400" /> package.json
              </div>
            </div>
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-slate-900 hover:bg-cyan-500/50 transition-colors cursor-col-resize" />

          {/* Middle Pane (Editor) */}
          <Panel defaultSize={55} className="flex flex-col bg-[#020617]">
            <div className="flex h-9 bg-[#090d1f] border-b border-slate-800">
              <div className="px-4 py-2 border-r border-slate-800 bg-[#020617] text-xs font-mono text-cyan-300 flex items-center gap-2 border-t-2 border-t-cyan-500">
                <FileCode2 className="h-3.5 w-3.5" />
                {activeFile.split("/").pop()}
                <X className="h-3 w-3 ml-2 text-slate-500 hover:text-white cursor-pointer" />
              </div>
            </div>
            <div className="flex-1 p-0 overflow-hidden flex flex-col">
              {/* Mock Editor Content */}
              {activeFile.includes("test") ? (
                <div className="p-4 font-mono text-[13px] leading-relaxed overflow-y-auto text-slate-400 whitespace-pre">
                  <span className="text-purple-400">import</span> {"{ "} Redis {" }"} <span className="text-purple-400">from</span> <span className="text-emerald-300">'ioredis'</span>;<br/><br/>
                  <span className="text-blue-400">describe</span>(<span className="text-emerald-300">'Cart Service'</span>, () =&gt; {"{"}<br/>
                  {"  "}<span className="text-blue-400">it</span>(<span className="text-emerald-300">'should accurately calculate total under concurrent load'</span>, <span className="text-purple-400">async</span> () =&gt; {"{"}<br/>
                  {"    "}// TODO: Write reproducing test for race condition<br/>
                  {"  "}{"});"}<br/>
                  {"});"}
                </div>
              ) : (
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                  className="flex-1 w-full bg-transparent p-4 font-mono text-[13px] leading-relaxed text-slate-300 resize-none focus:outline-none"
                />
              )}
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-slate-900 hover:bg-cyan-500/50 transition-colors cursor-col-resize" />

          {/* Right Pane (Jira Ticket & Terminal) */}
          <Panel defaultSize={30} className="flex flex-col border-l border-slate-800 bg-[#090d1f]">
            <PanelGroup direction="vertical">
              {/* Jira Ticket Mock */}
              <Panel defaultSize={40} className="flex flex-col border-b border-slate-800">
                <div className="h-9 border-b border-slate-800 bg-slate-900/50 flex items-center px-3 text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                  Ticket Brief
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 border-0 font-mono">
                      {scenario.jira_ticket_brief?.ticket || "ENG-101"}
                    </Badge>
                    <Badge variant="outline" className="text-rose-400 border-rose-400/50">Priority: High</Badge>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    {scenario.jira_ticket_brief?.description}
                  </p>
                  <div className="bg-slate-900/50 rounded-md p-3 border border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono mb-2">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Acceptance Criteria
                    </div>
                    <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                      {scenario.acceptance_tests?.tests?.map((t: string) => (
                        <li key={t} className="font-mono">{t} must pass</li>
                      )) || <li>All tests pass</li>}
                    </ul>
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className="h-1 bg-slate-900 hover:bg-cyan-500/50 transition-colors cursor-row-resize" />

              {/* Terminal Mock */}
              <Panel defaultSize={60} className="flex flex-col bg-[#020617]">
                <div className="h-9 border-b border-slate-800 bg-[#090d1f] flex items-center px-3 justify-between">
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5" /> bash
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="h-3.5 w-3.5 text-emerald-400 cursor-pointer hover:text-emerald-300" />
                  </div>
                </div>
                <div className="flex-1 p-3 font-mono text-[11px] text-slate-300 overflow-y-auto">
                  <div className="text-cyan-500 mb-1">straxon@devlab-vm:~/project$</div>
                  <div className="text-emerald-400">npm run test</div>
                  <div className="text-slate-400 mt-2">
                    &gt; sim-cart-service@1.0.0 test<br/>
                    &gt; vitest run
                  </div>
                  <div className="text-rose-400 mt-2">
                    FAIL  src/tests/cart.test.ts<br/>
                    ✕ should accurately calculate total under concurrent load (12ms)
                  </div>
                  <div className="text-slate-400 mt-2 whitespace-pre-wrap">
                    AssertionError: expected 10 to deeply equal 5<br/>
                    {"    at <anonymous> (/project/src/tests/cart.test.ts:15:33)"}
                  </div>
                  <div className="text-cyan-500 mt-4 flex">
                    straxon@devlab-vm:~/project$ <span className="animate-pulse ml-2 bg-slate-400 w-1.5 h-3 inline-block" />
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {/* AI Evaluation Modal */}
      <Dialog open={!!evaluation} onOpenChange={(open) => !open && setEvaluation(null)}>
        <DialogContent className="max-w-3xl bg-[#090d1f] border border-cyan-500/30 text-foreground backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              AI Staff Review Complete
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Your PR has been evaluated against our engineering standards.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {[
              { label: "Debugging", score: evaluation?.debugging_score },
              { label: "Test Hygiene", score: evaluation?.test_hygiene_score },
              { label: "Code Quality", score: evaluation?.code_quality_score },
              { label: "Git Hygiene", score: evaluation?.git_hygiene_score },
              { label: "Architecture", score: evaluation?.architectural_score },
              { label: "Composite", score: evaluation?.composite_score },
            ].map((metric) => (
              <div key={metric.label} className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{metric.label}</div>
                <div className={`text-2xl font-black ${metric.score >= 80 ? 'text-emerald-400' : metric.score >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {metric.score}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="h-4 w-4" /> Principal Engineer Feedback
            </h3>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-lg max-h-[300px] overflow-y-auto text-sm text-slate-300 font-mono whitespace-pre-wrap">
              {evaluation?.ai_staff_review}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEvaluation(null)} className="border-slate-700 hover:bg-slate-800 text-white">
              Revise Code
            </Button>
            <Button onClick={() => navigate("/labs")} className="bg-cyan-600 hover:bg-cyan-500 text-white">
              Return to Labs
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
