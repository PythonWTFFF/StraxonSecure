import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Github, Figma, Server, Shield, Lock, Clock,
  Search, TrendingUp, Activity, ChevronDown, Copy, CheckCheck,
  Zap, AlertTriangle, MoreHorizontal, Plus, ArrowUpRight,
  Database, Key, X, User, Mail, Building2, Wallet,
  FolderOpen, Globe, ChevronRight,
} from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { fetchClients, saveClient } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Client {
  id: string;
  name: string;
  email: string;
  ltv: number;
  projects: number;
  health: number;
  status: string;
  lastActivity: string;
  industry: string;
  color: string;
  assets: { ip: string; repo: string; figma: string; env: string };
  invoiceDue: string | null;
}

interface DrmSettings {
  watermarking: boolean;
  timeLimited: boolean;
  readOnly: boolean;
  auditLog: boolean;
}

type FormErrors = Partial<Record<keyof AddClientForm, string>>;

interface AddClientForm {
  name: string;
  email: string;
  industry: string;
  ltv: string;
  projects: string;
  color: string;
  ip: string;
  repo: string;
  figma: string;
  env: string;
  invoiceDue: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT_COLORS = [
  "#06b6d4", "#a78bfa", "#34d399", "#f59e0b",
  "#f87171", "#60a5fa", "#fb923c", "#e879f9",
];

const INDUSTRIES = [
  "Enterprise SaaS", "FinTech", "EdTech", "HealthTech",
  "E-Commerce", "Logistics", "Media & Entertainment", "Other",
];

const EMPTY_FORM: AddClientForm = {
  name: "", email: "", industry: "", ltv: "",
  projects: "", color: ACCENT_COLORS[0],
  ip: "", repo: "", figma: "", env: "", invoiceDue: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLtv(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function generateId(name: string, count: number): string {
  const prefix = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "CLT";
  return `${prefix}-${String(count + 1).padStart(3, "0")}`;
}

function validateForm(f: AddClientForm): FormErrors {
  const e: FormErrors = {};
  if (!f.name.trim())                   e.name     = "Client name is required";
  if (!f.email.trim())                  e.email    = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
                                         e.email    = "Enter a valid email";
  if (!f.industry)                      e.industry = "Select an industry";
  if (!f.ltv || isNaN(Number(f.ltv)) || Number(f.ltv) <= 0)
                                         e.ltv      = "Enter a valid LTV amount (₹)";
  if (!f.projects || isNaN(Number(f.projects)) || Number(f.projects) < 0)
                                         e.projects = "Enter number of projects";
  return e;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HealthBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-muted/40 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-[10px] font-mono tabular-nums" style={{ color }}>{value}%</span>
    </div>
  );
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
    >
      {copied ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
    </button>
  );
}

function MaskedValue({ value, mask, visible }: { value: string; mask: string; visible: boolean }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span key={visible ? "v" : "h"} initial={{ opacity: 0, filter: "blur(4px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} exit={{ opacity: 0, filter: "blur(4px)" }} transition={{ duration: 0.18 }} className="font-mono truncate">
        {visible ? value : mask}
      </motion.span>
    </AnimatePresence>
  );
}

function AssetRow({ icon: Icon, label, value, masked, maskChar = "•", maskLen = 12, revealed }: {
  icon: React.ElementType; label: string; value: string;
  masked?: boolean; maskChar?: string; maskLen?: number; revealed: boolean;
}) {
  return (
    <div className="group flex items-center gap-2.5 px-3 py-2 rounded-lg bg-background/50 border border-border/40 hover:border-border/80 transition-colors">
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">{label}</p>
        <div className="text-xs text-foreground overflow-hidden">
          <MaskedValue value={value || "—"} mask={maskChar.repeat(maskLen)} visible={!masked || revealed} />
        </div>
      </div>
      {(!masked || revealed) && value && <CopyBtn value={value} />}
    </div>
  );
}

function DrmToggle({ icon: Icon, label, description, checked, onChange }: {
  icon: React.ElementType; label: string; description: string; checked: boolean; onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background/40 border border-border/30 hover:border-border/60 transition-colors">
      <div className="flex items-start gap-2">
        <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 transition-colors ${checked ? "text-primary" : "text-muted-foreground"}`} />
        <div>
          <p className="text-xs font-medium text-foreground leading-none mb-0.5">{label}</p>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ─── Field component for the modal ────────────────────────────────────────────

function Field({
  label, icon: Icon, error, required, children,
}: {
  label: string; icon: React.ElementType; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Icon className="w-3 h-3" />
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="text-[10px] text-red-400 font-mono"
          >
            ↳ {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputCls = "w-full bg-background/60 border border-border/60 focus:border-primary/60 focus:ring-1 focus:ring-primary/20 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all duration-200";
const inputErrCls = "border-red-500/60 focus:border-red-400/60 focus:ring-red-400/20";

// ─── Add Client Modal ─────────────────────────────────────────────────────────

function AddClientModal({
  open,
  clientCount,
  onClose,
  onAdd,
}: {
  open: boolean;
  clientCount: number;
  onClose: () => void;
  onAdd: (c: Client) => void;
}) {
  const [form, setForm]       = useState<AddClientForm>(EMPTY_FORM);
  const [errors, setErrors]   = useState<FormErrors>({});
  const [step, setStep]       = useState<1 | 2>(1);
  const [submitting, setSub]  = useState(false);
  const firstInputRef         = useRef<HTMLInputElement>(null);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setErrors({});
      setStep(1);
      setSub(false);
      setTimeout(() => firstInputRef.current?.focus(), 80);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const set = (k: keyof AddClientForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const handleNextStep = () => {
    const e = validateForm(form);
    // Only validate step-1 fields on step 1
    const step1Fields: (keyof AddClientForm)[] = ["name", "email", "industry", "ltv", "projects"];
    const step1Errors = Object.fromEntries(
      Object.entries(e).filter(([k]) => step1Fields.includes(k as keyof AddClientForm))
    ) as FormErrors;
    if (Object.keys(step1Errors).length > 0) {
      setErrors(step1Errors);
      return;
    }
    setStep(2);
  };

  const handleSubmit = () => {
    setSub(true);
    setTimeout(() => {
      const newClient: Client = {
        id:           generateId(form.name, clientCount),
        name:         form.name.trim(),
        email:        form.email.trim(),
        ltv:          Number(form.ltv),
        projects:     Number(form.projects),
        health:       100,
        status:       "active",
        lastActivity: "just now",
        industry:     form.industry,
        color:        form.color,
        assets: {
          ip:    form.ip.trim()    || "—",
          repo:  form.repo.trim()  || "—",
          figma: form.figma.trim() || "—",
          env:   form.env.trim()   || "—",
        },
        invoiceDue: form.invoiceDue.trim() || null,
      };
      onAdd(newClient);
      toast.success(`${newClient.name} added to vault`, {
        description: `${newClient.id} · ${newClient.industry}`,
      });
      onClose();
      setSub(false);
    }, 600);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-lg pointer-events-auto rounded-2xl border border-border/60 bg-[#0f1117] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top accent */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ background: `linear-gradient(90deg, ${form.color}, ${form.color}66)` }}
              />

              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/40">
                <div>
                  <h2 className="text-base font-bold text-foreground">Add New Client</h2>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    Step {step} of 2 · {step === 1 ? "Identity & Value" : "Assets & Config"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Step dots */}
                  <div className="flex gap-1.5">
                    {[1, 2].map((s) => (
                      <div
                        key={s}
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: step === s ? "20px" : "6px",
                          background: step >= s ? form.color : "var(--border)",
                        }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4"
                    >
                      {/* Name */}
                      <Field label="Client Name" icon={User} error={errors.name} required>
                        <input
                          ref={firstInputRef}
                          value={form.name}
                          onChange={set("name")}
                          placeholder="Acme Corporation"
                          className={`${inputCls} ${errors.name ? inputErrCls : ""}`}
                        />
                      </Field>

                      {/* Email */}
                      <Field label="Contact Email" icon={Mail} error={errors.email} required>
                        <input
                          type="email"
                          value={form.email}
                          onChange={set("email")}
                          placeholder="contact@acme.com"
                          className={`${inputCls} ${errors.email ? inputErrCls : ""}`}
                        />
                      </Field>

                      {/* Industry */}
                      <Field label="Industry" icon={Building2} error={errors.industry} required>
                        <select
                          value={form.industry}
                          onChange={set("industry")}
                          className={`${inputCls} ${errors.industry ? inputErrCls : ""}`}
                        >
                          <option value="" disabled>Select industry…</option>
                          {INDUSTRIES.map((ind) => (
                            <option key={ind} value={ind}>{ind}</option>
                          ))}
                        </select>
                      </Field>

                      {/* LTV + Projects */}
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="LTV (₹)" icon={Wallet} error={errors.ltv} required>
                          <input
                            type="number"
                            min="0"
                            value={form.ltv}
                            onChange={set("ltv")}
                            placeholder="1200000"
                            className={`${inputCls} ${errors.ltv ? inputErrCls : ""}`}
                          />
                        </Field>
                        <Field label="Projects" icon={FolderOpen} error={errors.projects} required>
                          <input
                            type="number"
                            min="0"
                            value={form.projects}
                            onChange={set("projects")}
                            placeholder="3"
                            className={`${inputCls} ${errors.projects ? inputErrCls : ""}`}
                          />
                        </Field>
                      </div>

                      {/* Colour picker */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Accent Colour
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {ACCENT_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setForm((p) => ({ ...p, color: c }))}
                              className="w-7 h-7 rounded-lg border-2 transition-all duration-150"
                              style={{
                                background: c,
                                borderColor: form.color === c ? "#fff" : "transparent",
                                transform: form.color === c ? "scale(1.15)" : "scale(1)",
                                boxShadow: form.color === c ? `0 0 0 2px ${c}55` : "none",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>

                  ) : (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4"
                    >
                      <p className="text-[11px] text-muted-foreground font-mono">
                        All asset fields are optional — you can fill them in later.
                      </p>

                      {/* Server IP */}
                      <Field label="Server IP" icon={Server}>
                        <input
                          value={form.ip}
                          onChange={set("ip")}
                          placeholder="192.168.1.42"
                          className={inputCls}
                        />
                      </Field>

                      {/* Repo */}
                      <Field label="Repository" icon={Globe}>
                        <input
                          value={form.repo}
                          onChange={set("repo")}
                          placeholder="github.com/org/repo"
                          className={inputCls}
                        />
                      </Field>

                      {/* Figma */}
                      <Field label="Figma URL" icon={Figma}>
                        <input
                          value={form.figma}
                          onChange={set("figma")}
                          placeholder="figma.com/file/..."
                          className={inputCls}
                        />
                      </Field>

                      {/* Env secret */}
                      <Field label="Env Secret" icon={Key}>
                        <input
                          value={form.env}
                          onChange={set("env")}
                          placeholder="PROD_KEY=sk_live_..."
                          className={inputCls}
                        />
                      </Field>

                      {/* Invoice due */}
                      <Field label="Invoice Due (optional)" icon={AlertTriangle}>
                        <input
                          value={form.invoiceDue}
                          onChange={set("invoiceDue")}
                          placeholder="₹45,000 overdue"
                          className={inputCls}
                        />
                      </Field>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 pt-3 border-t border-border/40 flex items-center gap-3">
                {step === 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(1)}
                    className="text-xs text-muted-foreground gap-1"
                  >
                    ← Back
                  </Button>
                )}
                <div className="flex-1" />
                <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-muted-foreground">
                  Cancel
                </Button>
                {step === 1 ? (
                  <Button
                    size="sm"
                    onClick={handleNextStep}
                    className="text-xs gap-1.5"
                    style={{ background: form.color, color: "#000" }}
                  >
                    Next Step <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="text-xs gap-1.5 min-w-[110px]"
                    style={{ background: form.color, color: "#000" }}
                  >
                    {submitting ? (
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                      >
                        Adding…
                      </motion.span>
                    ) : (
                      <><Plus className="w-3.5 h-3.5" /> Add Client</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════════

export default function Clients() {
  const queryClient = useQueryClient();
  
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients
  });

  const saveMutation = useMutation({
    mutationFn: saveClient,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success(`${data.client.name} added to vault`, {
        description: `${data.client.id} · ${data.client.industry}`,
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add client: ${error.message}`);
    }
  });

  const [unmasked, setUnmasked]   = useState<Record<string, boolean>>({});
  const [expanded, setExpanded]   = useState<Record<string, boolean>>({});
  const [drm, setDrm]             = useState<Record<string, DrmSettings>>({});
  const [search, setSearch]       = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const totalLtv  = clients.reduce((s, c) => s + c.ltv, 0);
  const totalProj = clients.reduce((s, c) => s + c.projects, 0);

  const filteredClients = useMemo(
    () =>
      clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase()) ||
          c.industry.toLowerCase().includes(search.toLowerCase())
      ),
    [clients, search]
  );

  const addClient = (c: Client) => saveMutation.mutate(c);

  const toggle       = (id: string) => setUnmasked((p) => ({ ...p, [id]: !p[id] }));
  const toggleExpand = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const toggleDrm = (id: string, field: keyof DrmSettings) => {
    setDrm((prev) => {
      const cur     = prev[id] || { watermarking: false, timeLimited: false, readOnly: false, auditLog: false };
      const updated = { ...cur, [field]: !cur[field] };
      const labels: Record<keyof DrmSettings, string> = {
        watermarking: "Invisible Watermarking",
        timeLimited:  "Time-Limited Access",
        readOnly:     "Read-Only Mode",
        auditLog:     "Audit Logging",
      };
      const client = clients.find((c) => c.id === id);
      toast.success(`${labels[field]} ${updated[field] ? "enabled" : "disabled"}`, {
        description: client?.name,
      });
      return { ...prev, [id]: updated };
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-1">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Client Vault</h1>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            CRM · Asset Management · DRM Controls
          </p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs" onClick={() => setModalOpen(true)}>
          <Plus className="w-3.5 h-3.5" />
          Add Client
        </Button>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: TrendingUp, label: "Total LTV",       value: formatLtv(totalLtv),      sub: `${clients.length} clients`,     color: "#06b6d4" },
          { icon: Activity,   label: "Active Projects", value: String(totalProj),         sub: "across all clients",             color: "#a78bfa" },
          { icon: Shield,     label: "Vault Health",    value: "All secure",              sub: "No alerts",                      color: "#34d399" },
        ].map(({ icon: Icon, label, value, sub, color }, idx) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="glass-card px-4 py-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{label}</p>
              <p className="text-sm font-bold font-mono text-foreground leading-tight">{value}</p>
              <p className="text-[10px] text-muted-foreground">{sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients, email, industry…"
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-background/60 border border-border/60 focus:border-primary/60 rounded-xl outline-none transition-colors placeholder:text-muted-foreground/50 font-mono"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hover:text-foreground font-mono">
            clear
          </button>
        )}
      </div>

      {/* ── Client cards ── */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredClients.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-muted-foreground text-sm font-mono">
              No clients match "{search}"
            </motion.div>
          )}

          {filteredClients.map((client, i) => {
            const clientDrm  = drm[client.id] || { watermarking: false, timeLimited: false, readOnly: false, auditLog: false };
            const isExpanded = expanded[client.id];
            const isUnmasked = unmasked[client.id];
            const drmCount   = Object.values(clientDrm).filter(Boolean).length;

            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 14, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 28 }}
                className="glass-card overflow-hidden"
                style={{ borderColor: `${client.color}22` }}
              >
                <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${client.color}, ${client.color}44)` }} />

                <div className="p-5">
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                        style={{ background: `${client.color}20`, color: client.color, border: `1px solid ${client.color}35` }}>
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground">{client.name}</h3>
                          {client.invoiceDue && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/25">
                              <AlertTriangle className="w-2.5 h-2.5" /> OVERDUE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono">{client.email}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{client.industry}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-muted-foreground">{client.id}</span>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: client.color }} />
                      </div>
                      <p className="text-base font-black font-mono" style={{ color: client.color }}>{formatLtv(client.ltv)}</p>
                      <p className="text-[10px] text-muted-foreground">Lifetime Value</p>
                    </div>
                  </div>

                  {/* Health + meta */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5">Project Health</p>
                      <HealthBar value={client.health} color={client.color} />
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Activity</p>
                      <p className="text-xs font-mono text-foreground">{client.lastActivity}</p>
                      <p className="text-[10px] text-muted-foreground">{client.projects} active projects</p>
                    </div>
                  </div>

                  {/* Asset grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <AssetRow icon={Server} label="Server IP"   value={client.assets.ip}    masked maskChar="•" maskLen={13} revealed={isUnmasked} />
                    <AssetRow icon={Globe}  label="Repository"  value={client.assets.repo}  revealed={true} />
                    <AssetRow icon={Figma}  label="Figma"       value={client.assets.figma} revealed={true} />
                    <AssetRow icon={Key}    label="Env Secret"  value={client.assets.env}   masked maskChar="█" maskLen={12} revealed={isUnmasked} />
                  </div>

                  {/* DRM toggle row */}
                  <button
                    onClick={() => toggleExpand(client.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-muted/20 hover:bg-muted/30 border border-border/30 hover:border-border/60 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" style={{ color: drmCount > 0 ? client.color : undefined }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Asset DRM</span>
                      {drmCount > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: `${client.color}25`, color: client.color }}>
                          {drmCount} active
                        </span>
                      )}
                    </div>
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </motion.div>
                  </button>

                  {/* DRM panel */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div key="drm"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <DrmToggle icon={Lock}     label="Invisible Watermarking" description="Embed client-specific fingerprint" checked={clientDrm.watermarking} onChange={() => toggleDrm(client.id, "watermarking")} />
                          <DrmToggle icon={Clock}    label="Time-Limited Access"    description="Auto-expire after set duration"   checked={clientDrm.timeLimited}  onChange={() => toggleDrm(client.id, "timeLimited")} />
                          <DrmToggle icon={Database} label="Read-Only Mode"         description="Prevent writes to assets"         checked={clientDrm.readOnly}     onChange={() => toggleDrm(client.id, "readOnly")} />
                          <DrmToggle icon={Activity} label="Audit Logging"          description="Track all asset access events"    checked={clientDrm.auditLog}     onChange={() => toggleDrm(client.id, "auditLog")} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Footer actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                    <Button variant="ghost" size="sm" onClick={() => toggle(client.id)} className="text-xs text-muted-foreground hover:text-primary gap-1.5 h-7 px-2">
                      {isUnmasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {isUnmasked ? "Mask Secrets" : "Reveal Secrets"}
                    </Button>
                    <div className="flex-1" />
                    {client.invoiceDue && <span className="text-[10px] font-mono text-red-400">{client.invoiceDue}</span>}
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary gap-1 h-7 px-2">
                      <ArrowUpRight className="w-3.5 h-3.5" /> Open
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] text-muted-foreground/50 font-mono pb-4">
        <Zap className="inline w-3 h-3 mr-1 mb-0.5" />
        {clients.length} clients · {totalProj} projects · vault encrypted
      </p>

      {/* Add Client Modal */}
      <AddClientModal
        open={modalOpen}
        clientCount={clients.length}
        onClose={() => setModalOpen(false)}
        onAdd={addClient}
      />
    </div>
  );
}