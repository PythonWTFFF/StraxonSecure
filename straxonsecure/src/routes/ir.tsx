import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  AlertCircle,
  FileText,
  CheckCircle2,
  ChevronRight,
  Plus,
  Save,
  Trash2,
  Globe,
} from "lucide-react";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { SectionHeading } from "@/components/cyber/SectionHeading";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { callAuthed } from "@/lib/serverCall";
import { getPlaybooks, savePlaybook, deletePlaybook } from "@/server/ir";
import { toast } from "sonner";

export const Route = createFileRoute("/ir")({
  head: () => ({
    meta: [
      { title: "IR Playbooks — Straxon Secure" },
      { name: "description", content: "Interactive Incident Response Playbooks" },
    ],
  }),
  component: PlaybooksPage,
});

function PlaybooksPage() {
  const { user } = useAuth();
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<any | null>(null);

  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editSteps, setEditSteps] = useState<{ title: string; detail: string }[]>([]);
  const [editPublic, setEditPublic] = useState(false);

  const loadPlaybooks = async () => {
    try {
      const data = await callAuthed(getPlaybooks, undefined);
      setPlaybooks(data || []);
    } catch (e) {
      toast.error("Failed to load playbooks");
    }
  };

  useEffect(() => {
    if (user) loadPlaybooks();
  }, [user]);

  const handleSelect = (pb: any) => {
    setSelectedPlaybook(pb);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    setSelectedPlaybook({ id: null, author_id: user?.id });
    setEditTitle("New Playbook");
    setEditDesc("Description of incident scenario...");
    setEditSteps([{ title: "Identify", detail: "Detection and analysis phase..." }]);
    setEditPublic(false);
    setIsEditing(true);
  };

  const handleEdit = () => {
    if (!selectedPlaybook) return;
    setEditTitle(selectedPlaybook.title);
    setEditDesc(selectedPlaybook.description);
    setEditSteps(selectedPlaybook.steps || []);
    setEditPublic(selectedPlaybook.is_public);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await callAuthed(savePlaybook, {
        id: selectedPlaybook?.id || undefined,
        title: editTitle,
        description: editDesc,
        steps: editSteps,
        isPublic: editPublic,
      });
      toast.success("Playbook saved!");
      setIsEditing(false);
      loadPlaybooks();
      setSelectedPlaybook(null);
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
  };

  const handleDelete = async () => {
    if (!selectedPlaybook?.id) return;
    if (!confirm("Delete this playbook?")) return;
    try {
      await callAuthed(deletePlaybook, { id: selectedPlaybook.id });
      toast.success("Deleted");
      setSelectedPlaybook(null);
      loadPlaybooks();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  if (!user)
    return (
      <div className="p-12 text-center text-slate-400 font-mono">
        Sign in to access IR Playbooks.
      </div>
    );

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <SectionHeading
        eyebrow="// DEFENSE"
        title="IR Playbooks"
        description="Standardized operating procedures for critical incidents."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Col: Playbook List */}
        <div className="lg:col-span-1 space-y-6">
          <CyberCard
            variant="plain"
            className="p-5 bg-[#020610]/80 backdrop-blur-md border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
          >
            <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-2">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileText className="h-4 w-4 opacity-70" /> SOP LIBRARY
              </h3>
              <CyberButton
                onClick={handleCreateNew}
                size="sm"
                variant="cyan"
                className="px-3 py-1 h-7 text-[10px] shadow-[0_0_10px_rgba(0,243,255,0.2)]"
              >
                <Plus className="h-3 w-3 mr-1" /> New
              </CyberButton>
            </div>
            {playbooks.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic p-4 text-center bg-black/20 rounded border border-dashed border-white/10">
                No playbooks found.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {playbooks.map((pb) => (
                  <button
                    key={pb.id}
                    onClick={() => handleSelect(pb)}
                    className={`w-full text-left p-4 rounded-xl border transition-all shadow-sm ${selectedPlaybook?.id === pb.id ? "bg-[#00f3ff]/15 border-[#00f3ff]/60 shadow-[inset_0_0_15px_rgba(0,243,255,0.15)]" : "bg-black/40 border-white/10 hover:border-white/30 hover:bg-black/60"}`}
                  >
                    <div className="font-display font-bold text-white tracking-wide truncate">
                      {pb.title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate mt-2 bg-black/50 px-2 py-1 rounded border border-white/5 flex justify-between items-center">
                      <span className="uppercase tracking-wider">
                        {pb.author?.display_name || "System"}
                      </span>
                      {pb.is_public && (
                        <Globe className="h-3 w-3 text-[#00f3ff] drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CyberCard>
        </div>

        {/* Right Col: Playbook Viewer/Editor */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedPlaybook ? (
            <div className="h-[500px] border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-500 space-y-4 bg-[#020610]/40 shadow-inner">
              <AlertCircle className="h-16 w-16 opacity-30 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
              <p className="font-mono text-sm tracking-widest uppercase">
                Select an SOP to view procedures
              </p>
            </div>
          ) : isEditing ? (
            <CyberCard
              variant="cyan"
              className="p-6 space-y-5 bg-[#020610]/80 backdrop-blur-md shadow-[0_0_30px_rgba(0,243,255,0.1)]"
            >
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="font-display text-2xl font-bold bg-black/60 border-[#00f3ff]/40 shadow-[inset_0_0_15px_rgba(0,243,255,0.05)] focus-visible:border-[#00f3ff] h-14"
                placeholder="Playbook Title"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full bg-black/60 border border-[#00f3ff]/30 rounded-xl p-4 font-mono text-sm min-h-[120px] text-slate-300 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)] focus:border-[#00f3ff] outline-none transition-colors"
                placeholder="Playbook objective and scenario description..."
              />

              <div className="space-y-5 pt-6 border-t border-white/10">
                <h4 className="font-mono text-xs uppercase tracking-widest text-[#00f3ff] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 drop-shadow-[0_0_8px_rgba(0,243,255,0.6)]" />{" "}
                  Execution Phases
                </h4>
                {editSteps.map((step, i) => (
                  <div
                    key={i}
                    className="flex gap-4 items-start bg-black/30 p-4 rounded-xl border border-white/5"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#00f3ff]/10 border border-[#00f3ff]/30 text-[#00f3ff] flex items-center justify-center font-display font-bold text-lg shadow-[inset_0_0_10px_rgba(0,243,255,0.2)] shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                      <Input
                        value={step.title}
                        onChange={(e) => {
                          const s = [...editSteps];
                          s[i].title = e.target.value;
                          setEditSteps(s);
                        }}
                        className="bg-black/60 text-sm font-bold border-white/10"
                        placeholder="Phase Title (e.g. Triage)"
                      />
                      <textarea
                        value={step.detail}
                        onChange={(e) => {
                          const s = [...editSteps];
                          s[i].detail = e.target.value;
                          setEditSteps(s);
                        }}
                        className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-xs font-mono text-slate-400 min-h-[80px] outline-none focus:border-[#00f3ff]/50 transition-colors"
                        placeholder="Detailed procedural steps..."
                      />
                    </div>
                    <button
                      onClick={() => setEditSteps(editSteps.filter((_, idx) => idx !== i))}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors shrink-0"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <CyberButton
                  onClick={() => setEditSteps([...editSteps, { title: "New Phase", detail: "" }])}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center border border-dashed border-white/20 hover:border-[#00f3ff]/50 hover:bg-[#00f3ff]/5"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Execution Phase
                </CyberButton>
              </div>

              <div className="flex justify-between items-center pt-8 border-t border-white/10">
                <label className="flex items-center gap-3 text-[10px] font-mono text-slate-300 uppercase tracking-widest cursor-pointer group">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${editPublic ? "bg-[#00f3ff] border-[#00f3ff]" : "bg-black/50 border-white/30 group-hover:border-white/50"}`}
                  >
                    {editPublic && <CheckCircle2 className="h-3 w-3 text-black" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={editPublic}
                    onChange={(e) => setEditPublic(e.target.checked)}
                    className="hidden"
                  />
                  Global Visibility
                </label>
                <div className="flex gap-3">
                  <CyberButton onClick={() => setIsEditing(false)} variant="ghost" className="px-6">
                    Cancel
                  </CyberButton>
                  <CyberButton
                    onClick={handleSave}
                    variant="cyan"
                    className="px-8 shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                  >
                    <Save className="h-4 w-4 mr-2" /> Save SOP
                  </CyberButton>
                </div>
              </div>
            </CyberCard>
          ) : (
            <CyberCard
              variant="plain"
              className="p-8 space-y-8 bg-[#020610]/80 backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10"
            >
              <div className="flex justify-between items-start border-b border-white/10 pb-6">
                <div>
                  <h2 className="text-3xl font-display font-bold text-white tracking-wide">
                    {selectedPlaybook.title}
                  </h2>
                  <p className="text-sm font-mono text-slate-400 mt-3 leading-relaxed max-w-2xl">
                    {selectedPlaybook.description}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <span className="text-[9px] font-mono uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/10">
                      AUTHOR: {selectedPlaybook.author?.display_name || "System"}
                    </span>
                    {selectedPlaybook.is_public && (
                      <span className="text-[9px] font-mono uppercase tracking-widest bg-[#00f3ff]/10 text-[#00f3ff] px-2 py-1 rounded border border-[#00f3ff]/30 flex items-center gap-1">
                        <Globe className="h-3 w-3" /> GLOBAL
                      </span>
                    )}
                  </div>
                </div>
                {selectedPlaybook.author_id === user.id && (
                  <div className="flex gap-2 bg-black/40 p-1.5 rounded-lg border border-white/10">
                    <CyberButton onClick={handleEdit} variant="ghost" size="sm" className="h-8">
                      Edit
                    </CyberButton>
                    <button
                      onClick={handleDelete}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                {selectedPlaybook.steps?.map((step: any, i: number) => (
                  <div
                    key={i}
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#020610] bg-slate-800 text-slate-300 font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_0_2px_rgba(255,255,255,0.1)] group-hover:bg-[#00f3ff] group-hover:text-black group-hover:shadow-[0_0_15px_rgba(0,243,255,0.6)] transition-all z-10">
                      {i + 1}
                    </div>

                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-xl bg-black/40 border border-white/10 group-hover:border-white/30 transition-colors shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-mono font-bold text-[#00f3ff] tracking-wide uppercase text-sm">
                          {step.title}
                        </h4>
                      </div>
                      <p className="font-mono text-xs text-slate-400 leading-relaxed">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CyberCard>
          )}
        </div>
      </div>
    </div>
  );
}
