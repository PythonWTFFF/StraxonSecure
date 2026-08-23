import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, FileText, Download, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPortalData() {
      try {
        const res = await fetch(`/api/v1/portal/${token}`);
        if (!res.ok) {
          throw new Error("Invalid or expired portal link");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadPortalData();
  }, [token]);

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch("/api/v1/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          successUrl: window.location.href + "?payment=success",
          cancelUrl: window.location.href + "?payment=cancel",
        }),
      });
      const resData = await res.json();
      if (resData.url) {
        window.location.href = resData.url;
      }
    } catch (err) {
      console.error("Failed to redirect to Stripe", err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_15px_var(--glow-cyan)]"></div>
      <p className="mt-4 font-mono text-cyan-400 tracking-widest text-sm uppercase">Authenticating Token...</p>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
      <div className="p-4 rounded-full bg-rose-500/10 mb-4 border border-rose-500/20">
        <ShieldCheck className="w-8 h-8 text-rose-500" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
      <p className="text-zinc-400 font-mono text-sm max-w-md">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-6xl mx-auto space-y-8 p-6 sm:p-12 relative z-10">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-purple-500" />
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-cyan-400 shadow-[0_0_10px_var(--glow-cyan)]" />
              <h1 className="text-3xl font-black text-white tracking-tight">Secure Client Portal</h1>
            </div>
            <p className="text-zinc-400 mt-2 font-mono text-sm uppercase tracking-widest">
              Welcome back, <span className="text-cyan-400 font-bold">{data.client.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">End-to-End Encrypted</span>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.section 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-zinc-100 flex items-center mb-6">
              Active Projects <Badge className="ml-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_-2px_var(--glow-cyan)]">{data.projects.length}</Badge>
            </h2>
            {data.projects.length === 0 && <p className="text-zinc-500 font-mono text-sm">No active projects.</p>}
            
            <AnimatePresence>
              {data.projects.map((project: any) => (
                <motion.div key={project.id} variants={itemVariants}>
                  <Card className="glass-card-hover border-zinc-800/50">
                    <CardHeader className="pb-3 border-b border-zinc-800/40">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg text-white">{project.name}</CardTitle>
                        <Badge className={project.status === "active" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-zinc-800 text-zinc-400"}>
                          {project.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-3">Recent Tasks</h4>
                      <div className="space-y-3">
                        {project.tasks.slice(0, 4).map((task: any) => (
                          <div key={task.id} className="flex items-start gap-3">
                            {task.status === "completed" ? (
                              <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 shadow-[0_0_10px_-2px_var(--glow-cyan)] rounded-full" />
                            ) : (
                              <Circle className="w-4 h-4 text-zinc-600 mt-0.5" />
                            )}
                            <p className={`text-sm ${task.status === "completed" ? "text-zinc-600 line-through" : "text-zinc-300"}`}>
                              {task.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.section>

          <motion.section 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-zinc-100 flex items-center mb-6">
              Invoices <Badge className="ml-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_-2px_var(--glow-cyan)]">{data.invoices.length}</Badge>
            </h2>
            {data.invoices.length === 0 && <p className="text-zinc-500 font-mono text-sm">No invoices found.</p>}
            
            <AnimatePresence>
              {data.invoices.map((invoice: any) => {
                const subtotal = invoice.lineItems.reduce((acc: number, item: any) => acc + (item.rate * item.quantity), 0);
                const total = subtotal + (subtotal * (invoice.taxRate / 100));
                
                return (
                  <motion.div key={invoice.id} variants={itemVariants}>
                    <Card className="glass-card-hover border-zinc-800/50">
                      <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800/50">
                            <FileText className="w-6 h-6 text-cyan-400 shadow-[0_0_15px_-3px_var(--glow-cyan)]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-lg tracking-tight">{invoice.invoiceNumber}</h4>
                            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mt-1">Due: {invoice.dueDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-6">
                          <div className="text-right">
                            <p className="font-black font-mono text-xl text-white tracking-tighter">${total.toLocaleString()}</p>
                            <Badge variant="outline" className={
                              invoice.status === "paid" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 mt-1" : 
                              invoice.status === "sent" ? "text-amber-400 border-amber-500/30 bg-amber-500/10 mt-1" : 
                              "text-zinc-400 border-zinc-700 bg-zinc-900 mt-1"
                            }>
                              {invoice.status}
                            </Badge>
                          </div>
                          <div className="flex flex-col gap-2">
                            {invoice.status !== "paid" && (
                              <Button size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold tracking-wide shadow-[0_0_15px_-3px_var(--glow-cyan)] transition-all" onClick={() => handlePayInvoice(invoice.id)}>
                                Pay Now
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 text-[10px] uppercase font-mono tracking-widest">
                              <Download className="w-3 h-3 mr-2" /> Download
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
