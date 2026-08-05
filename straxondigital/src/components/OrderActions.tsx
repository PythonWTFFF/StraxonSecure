import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Share2, Send, Sparkles, Copy, Loader2 } from "lucide-react";

interface Integration { id: string; platform_name: string; }

interface Props {
  orderId: string;
  workspaceId: string | null;
  isPublic: boolean;
  shareToken: string;
  onChanged?: () => void;
}

export const OrderActions = ({ orderId, workspaceId, isPublic, shareToken, onChanged }: Props) => {
  const [pub, setPub] = useState(isPublic);
  const [feedback, setFeedback] = useState("");
  const [revising, setRevising] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [chosenInteg, setChosenInteg] = useState<string>("");
  const [dispatching, setDispatching] = useState(false);

  useEffect(() => { setPub(isPublic); }, [isPublic]);

  useEffect(() => {
    if (!workspaceId) return;
    supabase.from("workspace_integrations").select("id,platform_name").eq("workspace_id", workspaceId).eq("enabled", true)
      .then(({ data }) => setIntegrations((data as Integration[]) || []));
  }, [workspaceId]);

  const togglePublic = async (next: boolean) => {
    setPub(next);
    const { error } = await supabase.from("orders").update({ is_public: next }).eq("id", orderId);
    if (error) { toast.error(error.message); setPub(!next); return; }
    onChanged?.();
  };

  const shareUrl = `${window.location.origin}/view/${shareToken}`;
  const copyShare = async () => { await navigator.clipboard.writeText(shareUrl); toast.success("Share link copied"); };

  const requestRevision = async () => {
    if (feedback.trim().length < 4) { toast.error("Tell us what to change"); return; }
    setRevising(true);
    const { data: { session } } = await supabase.auth.getSession();
    const r = await fetch(`https://vkmcxvjmtkkcyrehrpav.supabase.co/functions/v1/revise-deliverable`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ order_id: orderId, feedback }),
    });
    const j = await r.json();
    setRevising(false);
    if (!r.ok) { toast.error(j.error || "Revision failed"); return; }
    setFeedback("");
    toast.success("Revising — your deliverable is being regenerated.");
    onChanged?.();
  };

  const dispatch = async () => {
    if (!chosenInteg) { toast.error("Choose an integration"); return; }
    setDispatching(true);
    const { data: { session } } = await supabase.auth.getSession();
    const r = await fetch(`https://vkmcxvjmtkkcyrehrpav.supabase.co/functions/v1/dispatch-webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ order_id: orderId, integration_id: chosenInteg }),
    });
    setDispatching(false);
    if (!r.ok) { const j = await r.json().catch(() => ({})); toast.error(j.error || "Dispatch failed"); return; }
    toast.success("Dispatched 🚀");
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Revision */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="border-primary/40 hover:border-primary">
            <Sparkles className="h-4 w-4 mr-2" /> Request revision
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>What should we change?</DialogTitle></DialogHeader>
          <Textarea rows={5} placeholder="Make it punchier. Use more concrete numbers. Change the brand color references to navy."
            value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          <Button onClick={requestRevision} disabled={revising} className="bg-gradient-primary text-primary-foreground border-0">
            {revising ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Regenerate
          </Button>
        </DialogContent>
      </Dialog>

      {/* Share */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm"><Share2 className="h-4 w-4 mr-2" /> Share</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Public share link</DialogTitle></DialogHeader>
          <div className="flex items-center justify-between p-3 rounded-lg glass">
            <div>
              <p className="text-sm font-medium">Public viewing</p>
              <p className="text-xs text-muted-foreground">Anyone with the link can view this deliverable.</p>
            </div>
            <Switch checked={pub} onCheckedChange={togglePublic} />
          </div>
          {pub && (
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="font-mono text-xs" />
              <Button onClick={copyShare} variant="outline" size="icon"><Copy className="h-4 w-4" /></Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dispatch */}
      {integrations.length > 0 && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Send className="h-4 w-4 mr-2" /> Dispatch</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Push to integration</DialogTitle></DialogHeader>
            <Select value={chosenInteg} onValueChange={setChosenInteg}>
              <SelectTrigger><SelectValue placeholder="Choose webhook…" /></SelectTrigger>
              <SelectContent>
                {integrations.map((i) => <SelectItem key={i.id} value={i.id}>{i.platform_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={dispatch} disabled={dispatching} className="bg-gradient-primary text-primary-foreground border-0">
              {dispatching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send payload
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
