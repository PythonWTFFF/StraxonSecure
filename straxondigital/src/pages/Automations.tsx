import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AutomationsHub } from "@/components/AutomationsHub";
import { AutonomousPipelinesHub } from "@/components/AutonomousPipelinesHub";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Cpu, Brain, DollarSign, Target, Rocket, Layers } from "lucide-react";
import { Link } from "react-router-dom";

const AutomationsPage = () => {
  const [activeEngine, setActiveEngine] = useState("pipelines");

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container pt-32 pb-24 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Quick Hub Navigation Pills */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-3 rounded-2xl glass border-border/40">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/25 font-mono text-xs py-1 px-2.5">
                <Cpu className="h-3 w-3 mr-1.5" /> Autonomous Engine
              </Badge>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                RAG Semantic Search & Brand Brain synced
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link to="/dashboard?tab=workspace">
                  <Brain className="h-3.5 w-3.5 mr-1 text-primary" /> Brand Brain
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link to="/reseller">
                  <DollarSign className="h-3.5 w-3.5 mr-1 text-green-400" /> Client Profit
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-7 text-xs border-primary/30">
                <Link to="/#audit">
                  <Target className="h-3.5 w-3.5 mr-1 text-primary" /> 5-Axis Audit
                </Link>
              </Button>
            </div>
          </div>

          {/* Engine Selector: Pipelines vs Single Automations */}
          <Tabs value={activeEngine} onValueChange={setActiveEngine} className="w-full">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <TabsList className="glass p-1">
                <TabsTrigger value="pipelines" className="text-xs font-medium">
                  <Rocket className="h-3.5 w-3.5 mr-1.5 text-primary" /> Multi-Step Pipelines
                </TabsTrigger>
                <TabsTrigger value="single" className="text-xs font-medium">
                  <Layers className="h-3.5 w-3.5 mr-1.5 text-primary" /> Single Automations (7 Jobs)
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="pipelines">
              <AutonomousPipelinesHub />
            </TabsContent>

            <TabsContent value="single">
              <AutomationsHub />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default AutomationsPage;
