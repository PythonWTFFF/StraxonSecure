import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Plus,
  CheckSquare,
  Square,
  Clock,
  AlertTriangle,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  Activity,
  Tag,
  Zap,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import {
  createIRPlaybook,
  getIRPlaybooks,
  updateIRPhase,
  deleteIRPlaybook,
} from "@/server/ir";
import { toast } from "sonner";

export const Route = createFileRoute("/ir")({
  head: () => ({
    meta: [
      { title: "Incident Response — Playbooks — Straxon Secure" },
      {
        name: "description",
        content:
          "Build, manage, and execute incident response playbooks for ransomware, data breaches, DDoS, and more.",
      },
    ],
  }),
  component: IRPage,
});

// ─── Types ──────────────────────────────────────────────────────────────────

interface IRTask {
  id: string;
  title: string;
  completed: boolean;
  notes?: string;
  completedAt?: string;
}
interface IRPhase {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  tasks: IRTask[];
  startedAt?: string;
  completedAt?: string;
}
interface IRPlaybook {
  id: string;
  name: string;
  incident_type: string;
  severity: string;
  phases: IRPhase[];
  mitre_tactics: string[];
  status: string;
  created_at: string;
  affected_systems: string[];
}

// ─── Templates (local display data only — actual phase data comes from server) ──

const TEMPLATES = [
  {
    key: "ransomware" as const,
    name: "Ransomware Response",
    icon: "🦠",
    description:
      "Full NIST-aligned playbook for ransomware attacks including containment, eradication, and recovery.",
    severity: "critical" as const,
  },
  {
    key: "data_breach" as const,
    name: "Data Breach Response",
    icon: "🔓",
    description: "GDPR-compliant data breach response including 72-hour notification obligations.",
    severity: "critical" as const,
  },
  {
    key: "ddos" as const,
    name: "DDoS Response",
    icon: "💥",
    description:
      "Rapid DDoS mitigation playbook with BGP blackhole, CDN activation, and post-attack hardening.",
    severity: "high" as const,
  },
];

const SEV_COLORS: Record<string, string> = {
  critical: "text-destructive border-destructive/40",
  high: "text-warning border-warning/40",
  medium: "text-accent border-accent/40",
  low: "text-primary border-primary/40",
};

const PHASE_STATUS_COLORS: Record<string, string> = {
  pending: "text-muted-foreground",
  in_progress: "text-warning",
  completed: "text-success",
  skipped: "text-muted-foreground/50",
};

// ─── Phase Accordion ─────────────────────────────────────────────────────────

function PhaseAccordion({
  phase,
  onUpdateTask,
  onUpdatePhase,
}: {
  phase: IRPhase;
  onUpdateTask: (taskId: string, completed: boolean) => void;
  onUpdatePhase: (status: IRPhase["status"]) => void;
}) {
  const [open, setOpen] = useState(phase.status === "in_progress");
  const completed = phase.tasks.filter((t) => t.completed).length;
  const total = phase.tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-colors ${phase.status === "completed" ? "border-success/40" : phase.status === "in_progress" ? "border-warning/40" : "border-border/50"}`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 p-4 bg-background/40 hover:bg-background/60 transition-colors text-left"
      >
        <div
          className={`text-sm font-mono uppercase tracking-wider flex-1 ${PHASE_STATUS_COLORS[phase.status]}`}
        >
          {phase.name}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground">
            {completed}/{total}
          </span>
          <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${phase.status === "completed" ? "bg-success" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-2 border-t border-border/30">
              {phase.tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 group">
                  <button
                    onClick={() => onUpdateTask(task.id, !task.completed)}
                    className="mt-0.5 shrink-0"
                  >
                    {task.completed ? (
                      <CheckSquare className="h-4 w-4 text-success" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </button>
                  <span
                    className={`text-sm ${task.completed ? "line-through text-muted-foreground" : "text-foreground/90"}`}
                  >
                    {task.title}
                  </span>
                  {task.completedAt && (
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground/50 shrink-0">
                      {new Date(task.completedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              ))}

              <div className="flex gap-2 pt-2 border-t border-border/30">
                {(["pending", "in_progress", "completed", "skipped"] as IRPhase["status"][]).map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => onUpdatePhase(s)}
                      className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${phase.status === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                    >
                      {s.replace("_", " ")}
                    </button>
                  ),
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Playbook View ────────────────────────────────────────────────────────────

function PlaybookView({
  pb,
  onDelete,
  onPhasesChange,
}: {
  pb: IRPlaybook;
  onDelete: () => void;
  onPhasesChange: (phases: IRPhase[]) => void;
}) {
  const [phases, setPhases] = useState(pb.phases);
  const [saving, setSaving] = useState(false);

  // Keep parent in sync
  useEffect(() => {
    setPhases(pb.phases);
  }, [pb.id]);

  const updateTask = async (phaseId: string, taskId: string, completed: boolean) => {
    // Optimistic update
    setPhases((prev) =>
      prev.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      completed,
                      completedAt: completed ? new Date().toISOString() : undefined,
                    }
                  : t,
              ),
            }
          : p,
      ),
    );

    setSaving(true);
    try {
      const res = await updateIRPhase({
        data: {
          playbookId: pb.id,
          phaseId,
          taskId,
          taskCompleted: completed,
        },
      });
      // Update from server response
      if (res.phases) {
        const updatedPhases = res.phases as IRPhase[];
        setPhases(updatedPhases);
        onPhasesChange(updatedPhases);
      }
    } catch (e: any) {
      toast.error("Failed to save: " + e.message);
      // Revert on error
      setPhases(pb.phases);
    } finally {
      setSaving(false);
    }

    toast.success(completed ? "Task completed ✓" : "Task reopened", { duration: 1500 });
  };

  const updatePhase = async (phaseId: string, status: IRPhase["status"]) => {
    // Optimistic update
    setPhases((prev) => prev.map((p) => (p.id === phaseId ? { ...p, status } : p)));

    try {
      const res = await updateIRPhase({
        data: {
          playbookId: pb.id,
          phaseId,
          phaseStatus: status,
        },
      });
      if (res.phases) {
        const updatedPhases = res.phases as IRPhase[];
        setPhases(updatedPhases);
        onPhasesChange(updatedPhases);
      }
    } catch (e: any) {
      toast.error("Failed to save: " + e.message);
    }
  };

  const overallPct = Math.round(
    (phases.flatMap((p) => p.tasks).filter((t) => t.completed).length /
      Math.max(1, phases.flatMap((p) => p.tasks).length)) *
      100,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">{pb.name}</h2>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span
              className={`text-[10px] font-mono border rounded px-2 py-0.5 uppercase ${SEV_COLORS[pb.severity] ?? ""}`}
            >
              {pb.severity}
            </span>
            <span className="text-xs font-mono text-muted-foreground">{pb.incident_type}</span>
            <span className="text-xs font-mono text-muted-foreground">
              {new Date(pb.created_at).toLocaleDateString()}
            </span>
            {saving && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-primary">
                <Loader2 className="h-3 w-3 animate-spin" /> saving…
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-display text-3xl font-bold text-primary">{overallPct}%</div>
            <div className="text-[10px] font-mono text-muted-foreground">COMPLETE</div>
          </div>
          <button
            onClick={onDelete}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {pb.mitre_tactics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pb.mitre_tactics.map((t) => (
            <span
              key={t}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {phases.map((phase) => (
          <PhaseAccordion
            key={phase.id}
            phase={phase}
            onUpdateTask={(taskId, completed) => updateTask(phase.id, taskId, completed)}
            onUpdatePhase={(status) => updatePhase(phase.id, status)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main IR Page ─────────────────────────────────────────────────────────────

function IRPage() {
  const [playbooks, setPlaybooks] = useState<IRPlaybook[]>([]);
  const [selected, setSelected] = useState<IRPlaybook | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  // ── Load playbooks from Supabase ─────────────────────────────────────────
  const loadPlaybooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getIRPlaybooks();
      const pbs = (res.playbooks ?? []) as IRPlaybook[];
      setPlaybooks(pbs);
      if (pbs.length > 0 && !selected) setSelected(pbs[0]);
    } catch (e: any) {
      toast.error("Failed to load playbooks: " + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlaybooks();
  }, [loadPlaybooks]);

  // ── Create from template ─────────────────────────────────────────────────
  const handleCreatePlaybook = async (template: (typeof TEMPLATES)[0]) => {
    setCreating(template.key);
    try {
      const res = await createIRPlaybook({
        data: {
          templateKey: template.key,
          severity: template.severity,
        },
      });

      toast.success(`📋 Playbook created: ${template.name}`);
      setShowTemplates(false);

      // Reload to get the fresh playbook from DB
      await loadPlaybooks();

      // Select the newly created one
      setSelected((prev) => playbooks.find((p) => p.id === res.id) ?? prev);
    } catch (e: any) {
      toast.error("Failed to create playbook: " + e.message);
    } finally {
      setCreating(null);
    }
  };

  // ── Delete playbook ──────────────────────────────────────────────────────
  const handleDeletePlaybook = async (id: string) => {
    try {
      await deleteIRPlaybook({ data: { playbookId: id } });
      setPlaybooks((p) => p.filter((pb) => pb.id !== id));
      if (selected?.id === id) setSelected(playbooks.find((p) => p.id !== id) ?? null);
      toast.info("Playbook deleted");
    } catch (e: any) {
      toast.error("Failed to delete: " + e.message);
    }
  };

  // ── Keep selected playbook phases in sync with list ──────────────────────
  const handlePhasesChange = (id: string, phases: IRPhase[]) => {
    setPlaybooks((prev) => prev.map((pb) => (pb.id === id ? { ...pb, phases } : pb)));
    setSelected((prev) => (prev?.id === id ? { ...prev, phases } : prev));
  };

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <SectionHeading
          eyebrow="// INCIDENT MANAGEMENT"
          title="IR Playbooks"
          description="Build and execute incident response playbooks aligned with NIST, SANS, and MITRE ATT&CK frameworks."
        />
        <div className="flex items-center gap-2">
          <CyberButton onClick={loadPlaybooks} variant="ghost" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </CyberButton>
          <CyberButton onClick={() => setShowTemplates(!showTemplates)} variant="magenta">
            <Plus className="h-4 w-4" /> New Playbook
          </CyberButton>
        </div>
      </div>

      {/* Template Selector */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="grid md:grid-cols-3 gap-4">
              {TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => handleCreatePlaybook(t)}
                  disabled={creating === t.key}
                  className="text-left group disabled:opacity-60"
                >
                  <CyberCard
                    variant="magenta"
                    glow
                    className="h-full hover:border-accent/60 transition-colors"
                  >
                    <div className="text-3xl mb-2">{t.icon}</div>
                    <h3 className="font-display font-bold text-lg group-hover:text-accent transition-colors">
                      {t.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs font-mono text-accent">
                      {creating === t.key ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Zap className="h-3.5 w-3.5" />
                      )}
                      {creating === t.key ? "Creating..." : "Use Template"}
                    </div>
                  </CyberCard>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <CyberCard variant="cyan" className="text-center py-16">
          <Loader2 className="h-10 w-10 text-primary mx-auto animate-spin mb-4" />
          <p className="text-muted-foreground font-mono text-sm">Loading playbooks…</p>
        </CyberCard>
      ) : playbooks.length === 0 && !showTemplates ? (
        <CyberCard variant="cyan" className="text-center py-16">
          <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl font-bold mb-2">No Active Playbooks</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Create an incident response playbook from a template to get started.
          </p>
          <CyberButton onClick={() => setShowTemplates(true)} variant="cyan">
            <Plus className="h-4 w-4" /> Create First Playbook
          </CyberButton>
        </CyberCard>
      ) : playbooks.length > 0 ? (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-2">
            {playbooks.map((pb) => {
              const pct = Math.round(
                (pb.phases.flatMap((p) => p.tasks).filter((t) => t.completed).length /
                  Math.max(1, pb.phases.flatMap((p) => p.tasks).length)) *
                  100,
              );
              return (
                <button
                  key={pb.id}
                  onClick={() => setSelected(pb)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${selected?.id === pb.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                >
                  <div className="font-mono text-sm font-medium truncate">{pb.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{pct}%</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono mt-1 block ${SEV_COLORS[pb.severity] ?? "text-muted-foreground"}`}
                  >
                    {pb.severity.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detail */}
          <div className="lg:col-span-3">
            {selected ? (
              <PlaybookView
                pb={selected}
                onDelete={() => handleDeletePlaybook(selected.id)}
                onPhasesChange={(phases) => handlePhasesChange(selected.id, phases)}
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground font-mono text-sm border border-dashed border-border rounded-lg">
                Select a playbook to view
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
