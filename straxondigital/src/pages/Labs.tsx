import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Terminal, Clock, ShieldAlert, Code2 } from "lucide-react";

export default function Labs() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadScenarios() {
      try {
        const { data, error } = await supabase
          .from("sim_scenarios")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          setScenarios(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadScenarios();
  }, []);

  const getDifficultyColor = (diff: string) => {
    if (diff === "entry") return "text-emerald-400 border-emerald-800/60 bg-emerald-950/40";
    if (diff === "mid") return "text-amber-400 border-amber-800/60 bg-amber-950/40";
    return "text-rose-400 border-rose-800/60 bg-rose-950/40";
  };

  return (
    <div className="min-h-screen bg-[#020617] text-foreground">
      <Navbar />

      <main className="container max-w-7xl pt-32 pb-24 px-4 sm:px-6">
        <div className="mb-12">
          <Badge className="mb-4 bg-cyan-950/50 text-cyan-400 border-cyan-500/30 font-mono">
            <Terminal className="mr-1.5 h-3.5 w-3.5" />
            ProductionSim
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            DevLab Engine <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Scenarios</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
            Drop into realistic, ephemeral multi-tier production codebases. Fix Jira bugs, handle merge conflicts, and prove your engineering instincts on day 1.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground animate-pulse font-mono text-sm">
            Booting scenario orchestrator...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenarios.map((s) => (
              <Card key={s.id} className="bg-slate-900/50 border-slate-800 backdrop-blur-md flex flex-col hover:border-cyan-500/30 transition-all group">
                <CardHeader>
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant="outline" className={`font-mono text-[10px] capitalize ${getDifficultyColor(s.difficulty)}`}>
                      {s.difficulty} Level
                    </Badge>
                    <div className="flex items-center gap-1 text-muted-foreground text-[10px] font-mono">
                      <Clock className="h-3 w-3" />
                      45m limit
                    </div>
                  </div>
                  <CardTitle className="text-lg leading-snug group-hover:text-cyan-400 transition-colors">
                    {s.title}
                  </CardTitle>
                  <CardDescription className="text-xs mt-2 line-clamp-3">
                    {s.jira_ticket_brief?.description || "A critical production issue requires immediate diagnosis and resolution."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 mt-auto">
                  <div className="flex flex-wrap gap-1 mb-4">
                    {s.stack?.map((tech: string) => (
                      <Badge key={tech} variant="secondary" className="bg-slate-800/50 text-slate-300 hover:bg-slate-800 text-[9px] font-mono rounded">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    onClick={() => navigate(`/labs/${s.slug}`)}
                    className="w-full bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-900/60 font-mono text-xs flex items-center justify-center gap-2"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Launch MicroVM Sandbox
                  </Button>
                </CardContent>
              </Card>
            ))}

            {scenarios.length === 0 && (
              <div className="col-span-full text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                <Code2 className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm font-semibold">No active scenarios found.</p>
                <p className="text-xs text-muted-foreground mt-1">Run database migrations to seed DevLab scenarios.</p>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
