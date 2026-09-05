import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, Webhook, Plus, Trash2, ChevronRight, ChevronLeft, Check, Loader2, Search, Microscope, Radar } from "lucide-react";
import { toast } from "sonner";
import { AIChat, KnowledgeBaseUpload, VectorPlayground } from "./AIChat";
import { CompetitiveRadar } from "./CompetitiveRadar";

interface Workspace { id: string; name: string; owner_id: string; }
interface BrandBrain {
  id?: string;
  workspace_id: string;
  brand_name: string | null;
  mission: string | null;
  audience: string | null;
  tone_professional: number;
  tone_playful: number;
  tone_bold: number;
  tone_warm: number;
  palette: { name: string; hex: string }[];
  dos: string[];
  donts: string[];
  is_configured: boolean;
}
interface Integration { id: string; workspace_id: string; platform_name: string; webhook_url: string; enabled: boolean; }

export const WorkspacePanel = ({ userId }: { userId: string }) => {
  const [ws, setWs] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("workspaces")
        .select("id,name,owner_id")
        .eq("owner_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      setWs(data as Workspace | null);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!ws) return <Card className="glass p-8 text-center text-muted-foreground">No workspace yet. Refresh.</Card>;

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-primary mb-1">/ Workspace</p>
        <h2 className="text-2xl font-bold text-gradient">{ws.name}</h2>
      </div>
      <Tabs defaultValue="brand" className="w-full">
        <TabsList className="glass flex-wrap">
          <TabsTrigger value="brand"><Brain className="h-3.5 w-3.5 mr-1.5" /> Brand Brain</TabsTrigger>
          <TabsTrigger value="knowledge"><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Knowledge Base</TabsTrigger>
          <TabsTrigger value="rag-chat"><Search className="h-3.5 w-3.5 mr-1.5" /> RAG Assistant</TabsTrigger>
          <TabsTrigger value="rag-playground"><Microscope className="h-3.5 w-3.5 mr-1.5" /> Vector Playground</TabsTrigger>
          <TabsTrigger value="radar"><Radar className="h-3.5 w-3.5 mr-1.5 text-primary" /> Competitor Radar</TabsTrigger>
          <TabsTrigger value="integrations"><Webhook className="h-3.5 w-3.5 mr-1.5" /> Integrations</TabsTrigger>
        </TabsList>
        <TabsContent value="brand" className="mt-6"><BrandBrainWizard workspaceId={ws.id} /></TabsContent>
        <TabsContent value="knowledge" className="mt-6"><KnowledgeBaseTab workspaceId={ws.id} /></TabsContent>
        <TabsContent value="rag-chat" className="mt-6"><AIChat workspaceId={ws.id} /></TabsContent>
        <TabsContent value="rag-playground" className="mt-6">
          <Card className="glass-strong p-6 border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Microscope className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Vector Semantic Search Playground</h3>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 font-mono">pgvector HNSW</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-5">Test queries against your indexed Knowledge Base and inspect cosine similarity scores for each matched chunk.</p>
            <VectorPlayground workspaceId={ws.id} />
          </Card>
        </TabsContent>
        <TabsContent value="radar" className="mt-6">
          <CompetitiveRadar workspaceId={ws.id} />
        </TabsContent>
        <TabsContent value="integrations" className="mt-6"><IntegrationsTab workspaceId={ws.id} /></TabsContent>
      </Tabs>
    </div>
  );
};

// ---------------- BRAND BRAIN WIZARD ----------------
const STEPS = ["Identity", "Tone", "Palette", "Rules"] as const;

const BrandBrainWizard = ({ workspaceId }: { workspaceId: string }) => {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [bb, setBb] = useState<BrandBrain | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("brand_brain").select("*").eq("workspace_id", workspaceId).maybeSingle();
      setBb((data as unknown as BrandBrain) ?? {
        workspace_id: workspaceId, brand_name: "", mission: "", audience: "",
        tone_professional: 70, tone_playful: 40, tone_bold: 60, tone_warm: 50,
        palette: [{ name: "Primary", hex: "#00BFFF" }], dos: [], donts: [], is_configured: false,
      });
    })();
  }, [workspaceId]);

  if (!bb) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  const set = <K extends keyof BrandBrain>(k: K, v: BrandBrain[K]) => setBb({ ...bb, [k]: v });

  const save = async (markConfigured = false) => {
    setSaving(true);
    const payload = { ...bb, is_configured: markConfigured || bb.is_configured };
    const { error } = await supabase.from("brand_brain").upsert(payload, { onConflict: "workspace_id" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setBb(payload);
    toast.success(markConfigured ? "Brand Brain activated 🧠" : "Saved");
  };

  return (
    <Card className="glass-strong p-6 border-primary/20 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground">
            Step {step + 1} / {STEPS.length} · {STEPS[step]}
          </p>
        </div>
        {bb.is_configured && <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>}
      </div>

      <div className="flex gap-1 mb-6">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-primary shadow-glow" : "bg-muted"}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="space-y-4 min-h-[280px]"
        >
          {step === 0 && (
            <>
              <Field label="Brand name">
                <Input value={bb.brand_name ?? ""} onChange={(e) => set("brand_name", e.target.value)} placeholder="Acme Labs" />
              </Field>
              <Field label="Mission (one line)">
                <Textarea rows={2} value={bb.mission ?? ""} onChange={(e) => set("mission", e.target.value)} placeholder="Help indie founders ship faster." />
              </Field>
              <Field label="Target audience">
                <Textarea rows={2} value={bb.audience ?? ""} onChange={(e) => set("audience", e.target.value)} placeholder="Series-A B2B SaaS marketing leads in NA/EU." />
              </Field>
            </>
          )}
          {step === 1 && (
            <>
              <ToneSlider label="Professional ↔ Casual" value={bb.tone_professional} onChange={(v) => set("tone_professional", v)} />
              <ToneSlider label="Serious ↔ Playful" value={bb.tone_playful} onChange={(v) => set("tone_playful", v)} />
              <ToneSlider label="Subtle ↔ Bold" value={bb.tone_bold} onChange={(v) => set("tone_bold", v)} />
              <ToneSlider label="Cold ↔ Warm" value={bb.tone_warm} onChange={(v) => set("tone_warm", v)} />
            </>
          )}
          {step === 2 && <PaletteEditor palette={bb.palette} onChange={(p) => set("palette", p)} />}
          {step === 3 && (
            <div className="grid md:grid-cols-2 gap-4">
              <RuleList title="Always (Do)" items={bb.dos} onChange={(v) => set("dos", v)} placeholder="Use active voice" />
              <RuleList title="Never (Don't)" items={bb.donts} onChange={(v) => set("donts", v)} placeholder="No buzzwords" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between mt-6 pt-4 border-t border-border/40">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => save(false)} disabled={saving}>Save draft</Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} className="bg-gradient-primary text-primary-foreground border-0 shadow-glow">
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => save(true)} disabled={saving} className="bg-gradient-primary text-primary-foreground border-0 shadow-glow">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Activate Brand Brain
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 block">{label}</label>
    {children}
  </div>
);

const ToneSlider = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs font-mono text-primary">{value}</span>
    </div>
    <Slider value={[value]} min={0} max={100} step={1} onValueChange={(v) => onChange(v[0])} />
  </div>
);

const PaletteEditor = ({ palette, onChange }: { palette: { name: string; hex: string }[]; onChange: (p: { name: string; hex: string }[]) => void }) => (
  <div className="space-y-3">
    <p className="text-xs text-muted-foreground">Brand colors injected into every deliverable prompt.</p>
    {palette.map((c, i) => (
      <div key={i} className="flex gap-2 items-center">
        <input type="color" value={c.hex} onChange={(e) => { const cp = [...palette]; cp[i] = { ...c, hex: e.target.value }; onChange(cp); }} className="h-10 w-14 rounded border-0 bg-transparent cursor-pointer" />
        <Input value={c.name} onChange={(e) => { const cp = [...palette]; cp[i] = { ...c, name: e.target.value }; onChange(cp); }} placeholder="Name" />
        <Input value={c.hex} onChange={(e) => { const cp = [...palette]; cp[i] = { ...c, hex: e.target.value }; onChange(cp); }} className="font-mono w-32" />
        <Button variant="ghost" size="icon" onClick={() => onChange(palette.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
      </div>
    ))}
    <Button variant="outline" size="sm" onClick={() => onChange([...palette, { name: "", hex: "#ffffff" }])}><Plus className="h-4 w-4 mr-1" /> Add color</Button>
  </div>
);

const RuleList = ({ title, items, onChange, placeholder }: { title: string; items: string[]; onChange: (v: string[]) => void; placeholder: string }) => {
  const [val, setVal] = useState("");
  return (
    <div>
      <p className="text-sm font-semibold mb-2">{title}</p>
      <div className="flex gap-2 mb-2">
        <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) { onChange([...items, val.trim()]); setVal(""); } }} />
        <Button variant="outline" size="icon" onClick={() => { if (val.trim()) { onChange([...items, val.trim()]); setVal(""); } }}><Plus className="h-4 w-4" /></Button>
      </div>
      <div className="space-y-1.5">
        {items.map((it, i) => (
          <div key={i} className="flex items-center justify-between gap-2 p-2 rounded bg-muted/30 border border-border/40 text-sm">
            <span>{it}</span>
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------- INTEGRATIONS ----------------
const IntegrationsTab = ({ workspaceId }: { workspaceId: string }) => {
  const [list, setList] = useState<Integration[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("workspace_integrations").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false });
    setList((data as Integration[]) || []);
  };
  useEffect(() => { load(); }, [workspaceId]);

  const add = async () => {
    if (!name.trim() || !url.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("workspace_integrations").insert({ workspace_id: workspaceId, platform_name: name.trim(), webhook_url: url.trim() });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setName(""); setUrl("");
    toast.success("Webhook added");
    load();
  };
  const remove = async (id: string) => {
    await supabase.from("workspace_integrations").delete().eq("id", id);
    load();
  };

  return (
    <Card className="glass-strong p-6 border-primary/20">
      <div className="flex items-center gap-2 mb-1">
        <Webhook className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">Outbound Webhooks</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-5">Paste a Zapier, Make, or n8n webhook URL. Push completed deliverables out with one click.</p>

      <div className="grid md:grid-cols-[1fr_2fr_auto] gap-2 mb-5">
        <Input placeholder="Platform (e.g. Zapier)" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="https://hooks.zapier.com/…" value={url} onChange={(e) => setUrl(e.target.value)} className="font-mono text-xs" />
        <Button onClick={add} disabled={saving} className="bg-gradient-primary text-primary-foreground border-0">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      <div className="space-y-2">
        {list.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No integrations yet.</p> :
          list.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/30 border border-border/40">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{i.platform_name}</p>
                <p className="text-xs font-mono text-muted-foreground truncate">{i.webhook_url}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(i.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
      </div>

      {/* Embeddable RAG Chat Widget Snippet */}
      <div className="mt-8 pt-6 border-t border-border/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-sm text-foreground">Embeddable RAG AI Chat Widget</h4>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-primary border-primary/20">
            White-Label Client Embed
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Deploy your autonomous RAG assistant and lead-capture agent on any client website or Webflow/WordPress landing page.
        </p>

        <div className="p-3 rounded-xl bg-black/40 border border-border/40 font-mono text-[11px] text-muted-foreground flex items-center justify-between gap-3 overflow-x-auto">
          <code>
            {`<script src="${window.location.origin}/chat-widget.js" data-workspace="${workspaceId}" data-brand="AI Assistant"></script>`}
          </code>
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0 h-7 text-xs text-primary hover:text-primary-foreground"
            onClick={() => {
              navigator.clipboard.writeText(`<script src="${window.location.origin}/chat-widget.js" data-workspace="${workspaceId}" data-brand="AI Assistant"></script>`);
              toast.success("Chat widget snippet copied to clipboard!");
            }}
          >
            Copy Script
          </Button>
        </div>
      </div>
    </Card>
  );
};

// ---------------- KNOWLEDGE BASE TAB ----------------
const KnowledgeBaseTab = ({ workspaceId }: { workspaceId: string }) => {
  const [docs, setDocs] = useState<any[]>([]);

  const loadDocs = async () => {
    const { data } = await supabase
      .from("documents")
      .select("id, metadata, created_at, title, source_type")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    setDocs(data || []);
  };

  useEffect(() => {
    loadDocs();
  }, [workspaceId]);

  const deleteDoc = async (id: string) => {
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Document removed from Knowledge Base");
      loadDocs();
    }
  };

  const sourceTypeLabel: Record<string, string> = {
    manual: "Manual",
    file_upload: "File",
    url_scrape: "URL",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="glass-strong p-6 border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold">Knowledge Base (RAG)</h3>
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 font-mono">
            pgvector HNSW
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
          Ingest brand guidelines, product specs, URLs, or any document. The AI vectorizes with 1536-dimension embeddings for semantic retrieval across all automations and the RAG assistant.
        </p>
        <KnowledgeBaseUpload workspaceId={workspaceId} onSuccess={loadDocs} />
      </Card>

      <Card className="glass-strong p-6 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-sm font-mono uppercase tracking-wider text-muted-foreground">
            Indexed Chunks ({docs.length})
          </h4>
          <Button variant="ghost" size="sm" onClick={loadDocs} className="h-7 text-xs">
            Refresh
          </Button>
        </div>

        {docs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">
            No documents indexed yet. Use the upload panel to ingest your first document.
          </p>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {docs.map(d => (
              <div key={d.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/20 border border-border/30 text-xs">
                <div className="min-w-0 flex-1 pr-3">
                  <p className="font-medium truncate">{d.title || d.metadata?.title || "Document Chunk"}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {new Date(d.created_at).toLocaleDateString()} · {sourceTypeLabel[d.source_type || "manual"] || d.source_type}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20">
                    Vectorized
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteDoc(d.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
