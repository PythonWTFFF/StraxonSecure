import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { authFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, TrendingUp, Target, Trophy, Trash2, DollarSign,
  Calendar, ChevronRight, Building2, BarChart3, AlertCircle
} from "lucide-react";

type DealStage = "Lead" | "Qualified" | "Proposal" | "Negotiation" | "Won" | "Lost";
const STAGES: DealStage[] = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];

const STAGE_CONFIG: Record<DealStage, { color: string; bg: string; border: string; probability: number; icon: any }> = {
  Lead:        { color: "text-zinc-400",   bg: "bg-zinc-500/10",    border: "border-zinc-500/20",   probability: 10,  icon: AlertCircle },
  Qualified:   { color: "text-blue-400",   bg: "bg-blue-500/10",    border: "border-blue-500/20",   probability: 25,  icon: Target },
  Proposal:    { color: "text-violet-400", bg: "bg-violet-500/10",  border: "border-violet-500/20", probability: 50,  icon: BarChart3 },
  Negotiation: { color: "text-amber-400",  bg: "bg-amber-500/10",   border: "border-amber-500/20",  probability: 75,  icon: TrendingUp },
  Won:         { color: "text-cyan-400",   bg: "bg-cyan-500/10",    border: "border-cyan-500/20",   probability: 100, icon: Trophy },
  Lost:        { color: "text-red-400",    bg: "bg-red-500/10",     border: "border-red-500/20",    probability: 0,   icon: X },
};

function formatCurrency(amount: number) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString()}`;
}

interface NewDealForm {
  clientId: string;
  value: string;
  expectedCloseDate: string;
  notes: string;
  stage: DealStage;
}

export default function Deals() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [form, setForm] = useState<NewDealForm>({
    clientId: "", value: "", expectedCloseDate: "", notes: "", stage: "Lead",
  });

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/deals");
      return res.json();
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await authFetch("/api/v1/clients");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await authFetch("/api/v1/deals", { method: "POST", body: JSON.stringify(data) });
      if (!res.ok) throw new Error("Failed to create deal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      setShowModal(false);
      setForm({ clientId: "", value: "", expectedCloseDate: "", notes: "", stage: "Lead" });
      toast.success("Deal created successfully");
    },
    onError: () => toast.error("Failed to create deal"),
  });

  const stageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const res = await authFetch(`/api/v1/deals/${id}/stage`, { method: "PATCH", body: JSON.stringify({ stage }) });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deals"] }),
    onError: () => { toast.error("Failed to move deal"); queryClient.invalidateQueries({ queryKey: ["deals"] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/v1/deals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["deals"] }); toast.success("Deal deleted"); },
    onError: () => toast.error("Failed to delete deal"),
  });

  const onDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    stageMutation.mutate({ id: draggableId, stage: destination.droppableId });
  }, [stageMutation]);

  const handleCreate = () => {
    if (!form.clientId) return toast.error("Please select a client");
    if (!form.value || isNaN(Number(form.value))) return toast.error("Please enter a valid deal value");
    createMutation.mutate({ ...form, value: Number(form.value) });
  };

  // Metrics
  const activePipeline = deals.filter((d: any) => !["Won", "Lost"].includes(d.stage));
  const totalPipelineValue = activePipeline.reduce((s: number, d: any) => s + d.value, 0);
  const weightedValue = activePipeline.reduce((s: number, d: any) => s + d.value * (STAGE_CONFIG[d.stage as DealStage]?.probability ?? 0) / 100, 0);
  const wonValue = deals.filter((d: any) => d.stage === "Won").reduce((s: number, d: any) => s + d.value, 0);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm font-mono">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Sales Pipeline</h1>
          <p className="text-zinc-500 text-xs font-mono mt-0.5">{deals.length} deals across {STAGES.length} stages</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-900/30 transition-all">
          <Plus className="w-4 h-4 mr-2" /> New Deal
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Pipeline", value: formatCurrency(totalPipelineValue), icon: BarChart3, color: "text-indigo-400", glow: "shadow-indigo-900/30" },
          { label: "Weighted Value", value: formatCurrency(weightedValue), icon: TrendingUp, color: "text-amber-400", glow: "shadow-amber-900/30" },
          { label: "Won Revenue", value: formatCurrency(wonValue), icon: Trophy, color: "text-cyan-400", glow: "shadow-cyan-900/30" },
        ].map((kpi) => (
          <Card key={kpi.label} className={`glass-card border-zinc-800 shadow-lg ${kpi.glow}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-900 border border-zinc-800`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">{kpi.label}</p>
                <p className={`text-lg font-bold font-mono ${kpi.color}`}>{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 h-full min-w-max pb-4">
            {STAGES.map((stage) => {
              const stageDeals = deals.filter((d: any) => d.stage === stage);
              const stageValue = stageDeals.reduce((s: number, d: any) => s + d.value, 0);
              const cfg = STAGE_CONFIG[stage];
              return (
                <div key={stage} className="glass-card w-72 flex flex-col rounded-xl border border-zinc-800 overflow-hidden">
                  {/* Stage header */}
                  <div className={`px-4 py-3 border-b border-zinc-800 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                      <span className={`text-xs font-bold uppercase tracking-widest ${cfg.color}`}>{stage}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${cfg.bg} ${cfg.color} ${cfg.border} text-[10px] font-mono border`}>
                        {stageDeals.length}
                      </Badge>
                      <span className={`text-[10px] font-mono ${cfg.color}`}>{formatCurrency(stageValue)}</span>
                    </div>
                  </div>
                  {/* Probability bar */}
                  <div className="h-0.5 bg-zinc-900">
                    <div className={`h-full bg-gradient-to-r from-cyan-600 to-indigo-600`} style={{ width: `${cfg.probability}%` }} />
                  </div>
                  <Droppable droppableId={stage}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 flex flex-col gap-2 p-3 min-h-[200px] transition-colors ${snapshot.isDraggingOver ? "bg-cyan-500/5" : ""}`}
                      >
                        {stageDeals.map((deal: any, index: number) => (
                          <Draggable key={deal.id} draggableId={deal.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <motion.div
                                  layout
                                  className={`rounded-lg border bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group ${snapshot.isDragging ? "shadow-xl shadow-black/50 scale-105 border-cyan-500/40" : ""}`}
                                  onClick={() => setSelectedDeal(deal)}
                                >
                                  <div className="p-3">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                                          {deal.client?.name?.[0]?.toUpperCase() || "?"}
                                        </div>
                                        <span className="text-xs font-medium text-zinc-200 truncate">{deal.client?.name || "Unknown"}</span>
                                      </div>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(deal.id); }}
                                        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all flex-shrink-0"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-bold font-mono text-cyan-400">{formatCurrency(deal.value)}</span>
                                      {deal.expectedCloseDate && (
                                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                                          <Calendar className="w-2.5 h-2.5" />
                                          {deal.expectedCloseDate}
                                        </div>
                                      )}
                                    </div>
                                    <div className="mt-1.5 flex items-center gap-1">
                                      <div className="h-0.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-full" style={{ width: `${cfg.probability}%` }} />
                                      </div>
                                      <span className="text-[10px] text-zinc-500 font-mono">{cfg.probability}%</span>
                                    </div>
                                  </div>
                                </motion.div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {stageDeals.length === 0 && (
                          <div className="flex-1 flex items-center justify-center text-zinc-700 text-[10px] font-mono uppercase tracking-widest py-6 border border-dashed border-zinc-800 rounded-lg">
                            Drop deals here
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* New Deal Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-md glass-card border border-zinc-700 rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-zinc-100">New Deal</h2>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">Add to your sales pipeline</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-zinc-400 text-xs mb-1.5 block font-mono uppercase tracking-wider">Client *</Label>
                  <select
                    value={form.clientId}
                    onChange={(e) => setForm(f => ({ ...f, clientId: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="">Select a client...</option>
                    {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-zinc-400 text-xs mb-1.5 block font-mono uppercase tracking-wider">Value (₹) *</Label>
                    <Input
                      type="number" placeholder="50000"
                      value={form.value} onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))}
                      className="bg-zinc-900 border-zinc-700 text-zinc-200 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-400 text-xs mb-1.5 block font-mono uppercase tracking-wider">Stage</Label>
                    <select
                      value={form.stage}
                      onChange={(e) => setForm(f => ({ ...f, stage: e.target.value as DealStage }))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 transition-colors"
                    >
                      {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs mb-1.5 block font-mono uppercase tracking-wider">Expected Close Date</Label>
                  <Input
                    type="date"
                    value={form.expectedCloseDate} onChange={(e) => setForm(f => ({ ...f, expectedCloseDate: e.target.value }))}
                    className="bg-zinc-900 border-zinc-700 text-zinc-200 focus:border-cyan-500"
                  />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs mb-1.5 block font-mono uppercase tracking-wider">Notes</Label>
                  <textarea
                    placeholder="Deal notes, context..."
                    value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1 text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600">
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white">
                  {createMutation.isPending ? "Creating..." : "Create Deal"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deal Detail Slide-over */}
      <AnimatePresence>
        {selectedDeal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setSelectedDeal(null)}
          >
            <motion.div
              initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
              className="w-full sm:w-96 h-full sm:h-auto sm:max-h-[80vh] glass-card sm:rounded-2xl border-l border-zinc-700 shadow-2xl overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-zinc-100 text-lg">Deal Details</h2>
                  <button onClick={() => setSelectedDeal(null)} className="text-zinc-500 hover:text-zinc-300"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                    <Building2 className="w-8 h-8 text-cyan-400" />
                    <div>
                      <p className="font-bold text-zinc-100">{selectedDeal.client?.name}</p>
                      <p className="text-xs text-zinc-400">{selectedDeal.client?.industry}</p>
                    </div>
                  </div>
                  {[
                    { label: "Deal Value", value: formatCurrency(selectedDeal.value), icon: DollarSign },
                    { label: "Stage", value: selectedDeal.stage, icon: ChevronRight },
                    { label: "Probability", value: `${STAGE_CONFIG[selectedDeal.stage as DealStage]?.probability}%`, icon: TrendingUp },
                    { label: "Expected Close", value: selectedDeal.expectedCloseDate || "—", icon: Calendar },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-zinc-800">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <row.icon className="w-3.5 h-3.5" />{row.label}
                      </div>
                      <span className="text-sm text-zinc-200 font-mono">{row.value}</span>
                    </div>
                  ))}
                  {selectedDeal.notes && (
                    <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-1 font-mono uppercase tracking-wider">Notes</p>
                      <p className="text-sm text-zinc-300">{selectedDeal.notes}</p>
                    </div>
                  )}
                  <Button
                    onClick={() => { deleteMutation.mutate(selectedDeal.id); setSelectedDeal(null); }}
                    variant="ghost"
                    className="w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-red-500/20 mt-2"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Deal
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
