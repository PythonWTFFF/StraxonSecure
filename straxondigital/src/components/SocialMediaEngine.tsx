import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const SocialMediaEngine = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("LinkedIn");
  const [loading, setLoading] = useState(false);
  const [postContent, setPostContent] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: "Topic required", description: "Please enter a topic to post about.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setPostContent("");
    try {
      const { data, error } = await supabase.functions.invoke("generate-social-content", {
        body: { topic, platform, user_id: user?.id },
      });
      if (error) throw error;
      setPostContent(data.postContent);
      toast({ title: "Post Generated", description: "Your social media content is ready." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Generation failed", description: err.message || "An error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
          <Smartphone className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Social Media Engine</h2>
          <p className="text-muted-foreground text-sm">Generate viral social posts automatically curated from your Knowledge Base.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            Post Configuration
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Core Topic / Angle</Label>
              <Input
                placeholder="e.g., Automating SaaS growth with AI"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="glass"
              />
            </div>
            <div className="space-y-2">
              <Label>Target Platform</Label>
              <div className="flex gap-2">
                {["LinkedIn", "Twitter", "Instagram"].map(p => (
                  <Button
                    key={p}
                    variant={platform === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPlatform(p)}
                    className={platform === p ? "bg-primary text-primary-foreground" : ""}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-border/40">
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-gradient-primary text-primary-foreground border-0 shadow-glow"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                {loading ? "Drafting Content..." : "Generate Viral Post"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="glass p-6 flex flex-col h-full min-h-[400px]">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" /> Output Preview
          </h3>
          <div className="flex-1 bg-black/20 border border-border/40 rounded-lg p-4 font-mono text-sm overflow-y-auto whitespace-pre-wrap text-muted-foreground">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-primary/60">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Synthesizing Brand Voice...</p>
              </div>
            ) : postContent ? (
              <span className="text-foreground">{postContent}</span>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50">
                <AlertCircle className="h-8 w-8 mb-4" />
                <p>No post generated yet.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
