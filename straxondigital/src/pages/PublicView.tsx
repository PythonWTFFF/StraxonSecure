import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProposalPreview } from "@/components/Proposals";
import { BrandMark } from "@/components/BrandMark";
import { Loader2, Lock } from "lucide-react";
import { motion } from "framer-motion";
import type { DeliverableContent } from "@/types/deliverables";

interface PublicOrder {
  id: string;
  service_name: string;
  service_type: string;
  generated_content: DeliverableContent | null;
  is_public: boolean;
  user_id: string;
  status: string;
  progress: number;
  price_cents: number;
  intake_data: Record<string, unknown>;
  deliverable_url: string | null;
  error_message: string | null;
  created_at: string;
}

const PublicView = () => {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("share_token", token)
        .eq("is_public", true)
        .maybeSingle();
      setOrder((data as unknown as PublicOrder) ?? null);
      setLoading(false);
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-strong p-12 rounded-2xl text-center max-w-md border-primary/20">
          <Lock className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold mb-2">Link unavailable</h1>
          <p className="text-muted-foreground">
            This deliverable is private or the share link has been revoked.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/40">
        <div className="container flex items-center justify-between py-4">
          <BrandMark />
          <a
            href="/"
            className="text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground hover:text-primary transition-colors"
          >
            Powered by Straxon Labs →
          </a>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="pt-32 pb-24"
      >
        <div className="container max-w-5xl">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-primary mb-2 text-center">
            / Shared Deliverable
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-gradient">
            {order.service_name}
          </h1>
          <div className="rounded-2xl overflow-hidden shadow-elegant bg-muted">
            <ProposalPreview order={order} />
          </div>
        </div>
      </motion.main>
    </div>
  );
};

export default PublicView;
