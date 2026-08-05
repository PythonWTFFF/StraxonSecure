import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AlertCircle, FileText, CheckCircle2, ChevronRight, Plus, Save, Trash2, Globe } from "lucide-react";
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
  const [editSteps, setEditSteps] = useState<{title: string, detail: string}[]>([]);
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
        isPublic: editPublic
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

  if (!user) return <div className="p-12 text-center text-slate-400 font-mono">Sign in to access IR Playbooks.</div>;

  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      <SectionHeading eyebrow="// DEFENSE" title="IR Playbooks" description="Standardized operating procedures for critical incidents." />

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Col: Playbook List */}
        <div className="lg:col-span-1 space-y-6">
          <CyberCard variant="plain" className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2"><FileText className="h-4 w-4"/> LIBRARY</h3>
              <CyberButton onClick={handleCreateNew} size="sm" variant="cyan" className="px-2 py-1 h-7 text-xs"><Plus className="h-3 w-3 mr-1"/> New</CyberButton>
            </div>
            {playbooks.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono italic">No playbooks found.</div>
            ) : (
              <div className="space-y-2">
                {playbooks.map(pb => (
                  <button key={pb.id} onClick={() => handleSelect(pb)} className={`w-full text-left p-3 rounded border transition-all ${selectedPlaybook?.id === pb.id ? 'bg-[#00f3ff]/10 border-[#00f3ff]/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                    <div className="font-display font-bold text-white truncate">{pb.title}</div>
                    <div className="text-xs text-slate-400 font-mono truncate mt-1 flex justify-between">
                      <span>{pb.author?.display_name || 'System'}</span>
                      {pb.is_public && <Globe className="h-3 w-3 text-[#00f3ff]" />}
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
            <div className="h-[400px] border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-slate-500 space-y-4">
              <AlertCircle className="h-12 w-12 opacity-50" />
              <p className="font-mono text-sm">Select a playbook to view procedures</p>
            </div>
          ) : isEditing ? (
            <CyberCard variant="cyan" className="p-6 space-y-4">
              <Input value={editTitle} onChange={e=>setEditTitle(e.target.value)} className="font-display text-xl bg-black/40 border-[#00f3ff]/30" />
              <textarea value={editDesc} onChange={e=>setEditDesc(e.target.value)} className="w-full bg-black/40 border border-[#00f3ff]/30 rounded p-3 font-mono text-sm min-h-[100px] text-slate-300" />
              
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h4 className="font-mono text-sm text-[#00f3ff]">Response Steps</h4>
                {editSteps.map((step, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="w-8 h-8 rounded bg-[#00f3ff]/20 text-[#00f3ff] flex items-center justify-center font-bold">{i+1}</div>
                    <div className="flex-1 space-y-2">
                      <Input value={step.title} onChange={e => { const s = [...editSteps]; s[i].title = e.target.value; setEditSteps(s); }} className="bg-black/40 text-sm" />
                      <textarea value={step.detail} onChange={e => { const s = [...editSteps]; s[i].detail = e.target.value; setEditSteps(s); }} className="w-full bg-black/40 border border-white/20 rounded p-2 text-xs font-mono text-slate-400" />
                    </div>
                    <button onClick={() => setEditSteps(editSteps.filter((_, idx) => idx !== i))} className="p-2 text-red-400 hover:bg-red-500/20 rounded"><Trash2 className="h-4 w-4"/></button>
                  </div>
                ))}
                <CyberButton onClick={() => setEditSteps([...editSteps, {title: "New Phase", detail: ""}])} variant="ghost" size="sm"><Plus className="h-3 w-3 mr-1"/> Add Step</CyberButton>
              </div>

              <div className="flex justify-between items-center pt-6">
                <label className="flex items-center gap-2 text-sm font-mono text-slate-300">
                  <input type="checkbox" checked={editPublic} onChange={e=>setEditPublic(e.target.checked)} className="accent-[#00f3ff]" /> Make Public
                </label>
                <div className="flex gap-2">
                  <CyberButton onClick={() => setIsEditing(false)} variant="ghost">Cancel</CyberButton>
                  <CyberButton onClick={handleSave} variant="cyan"><Save className="h-4 w-4 mr-2"/> Save Playbook</CyberButton>
                </div>
              </div>
            </CyberCard>
          ) : (
            <CyberCard variant="plain" className="p-6 space-y-6">
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">{selectedPlaybook.title}</h2>
                  <p className="text-sm font-mono text-slate-400 mt-2">{selectedPlaybook.description}</p>
                </div>
                {selectedPlaybook.author_id === user.id && (
                  <div className="flex gap-2">
                    <CyberButton onClick={handleEdit} variant="ghost" size="sm">Edit</CyberButton>
                    <button onClick={handleDelete} className="p-2 text-red-400 hover:bg-red-500/20 rounded"><Trash2 className="h-4 w-4"/></button>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {selectedPlaybook.steps?.map((step: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center font-bold text-slate-300">{i+1}</div>
                      {i !== selectedPlaybook.steps.length - 1 && <div className="w-px h-full bg-slate-700 mt-2" />}
                    </div>
                    <div className="pb-6">
                      <h4 className="font-mono font-bold text-white">{step.title}</h4>
                      <p className="font-mono text-sm text-slate-400 mt-1">{step.detail}</p>
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
