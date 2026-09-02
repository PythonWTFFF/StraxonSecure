import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProposalPreview } from "@/components/Proposals";
import { BrandMark } from "@/components/BrandMark";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2, Lock, CheckCircle2, Copy, Download, MessageSquare, Building2,
  Calendar, ShieldCheck, Sparkles, Send, Eye, FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
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

interface ClientPortalRecord {
  id: string;
  agency_name: string;
  client_name: string;
  client_email: string | null;
  retail_price_cents: number;
  wholesale_price_cents: number;
  custom_message: string | null;
  branding_config: {
    service?: string;
    markup_pct?: number;
    deliverable_preview?: string;
    status?: string;
  };
  portal_token: string;
  access_count: number;
  accessed_at: string | null;
  created_at: string;
}

const PublicView = () => {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [portal, setPortal] = useState<ClientPortalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (!token) return;

    (async () => {
      // 1. Check if token belongs to client_portals
      const { data: portalData } = await supabase
        .from("client_portals")
        .select("*")
        .eq("portal_token", token)
        .maybeSingle();

      if (portalData) {
        setPortal(portalData as unknown as ClientPortalRecord);
        // Increment access count in background
        supabase
          .from("client_portals")
          .update({
            access_count: (portalData.access_count || 0) + 1,
            accessed_at: new Date().toISOString(),
          })
          .eq("id", portalData.id)
          .then();

        setLoading(false);
        return;
      }

      // 2. Fallback: check if token belongs to orders
      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("share_token", token)
        .eq("is_public", true)
        .maybeSingle();

      setOrder((orderData as unknown as PublicOrder) ?? null);
      setLoading(false);
    })();
  }, [token]);

  const handleApprove = async () => {
    setApproved(true);
    if (portal?.id) {
      await supabase.from("portal_feedback").insert({
        portal_id: portal.id,
        client_name: portal.client_name,
        feedback_type: "approval",
        message: "Deliverable approved by client.",
        status: "acknowledged",
      });
    }
    toast.success("Deliverable Approved!", {
      description: `Approval confirmed for ${portal?.agency_name || "Agency"}. A notification has been recorded.`,
    });
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim() || !portal) return;
    setSubmittingFeedback(true);
    try {
      const { error } = await supabase.from("portal_feedback").insert({
        portal_id: portal.id,
        client_name: portal.client_name,
        feedback_type: "revision",
        message: feedbackText,
        status: "unread",
      });
      if (error) throw error;
      setFeedbackOpen(false);
      setFeedbackText("");
      toast.success("Feedback Submitted", {
        description: `Your comments were sent to ${portal.agency_name}.`,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Neither order nor client portal found
  if (!order && !portal) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-strong p-8 sm:p-12 rounded-2xl text-center max-w-md border-primary/20">
          <Lock className="h-10 w-10 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold mb-2">Portal Unavailable</h1>
          <p className="text-muted-foreground text-sm">
            This deliverable portal is private or the share token is invalid. Please contact your agency for an active link.
          </p>
          <div className="mt-6">
            <Button asChild variant="outline" size="sm" className="border-primary/30">
              <Link to="/">Go to Homepage</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ================= RENDER WHITE-LABEL AGENCY CLIENT PORTAL =================
  if (portal) {
    const serviceName = portal.branding_config?.service || "Autonomous Agency Deliverable";
    const retailPrice = portal.retail_price_cents ? `$${(portal.retail_price_cents / 100).toLocaleString()}` : "$997";

    return (
      <div className="min-h-screen relative bg-background text-foreground">
        {/* Top White-Label Branded Header */}
        <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
          <div className="container px-4 sm:px-6 flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center font-bold text-primary-foreground text-sm shadow-glow">
                {portal.agency_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-foreground">{portal.agency_name}</span>
                <span className="hidden sm:inline-block text-[10px] font-mono text-muted-foreground ml-2">/ Client Delivery Portal</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 font-mono">
                {approved ? "Approved" : "Ready for Review"}
              </Badge>
              {portal.client_name && (
                <span className="hidden md:inline-block text-xs text-muted-foreground font-medium">
                  Prepared for: <strong className="text-foreground">{portal.client_name}</strong>
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="container max-w-5xl px-4 sm:px-6 pt-28 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Banner card */}
            <Card className="glass-strong p-6 sm:p-8 rounded-3xl border-primary/25 relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-xs font-mono uppercase tracking-wider text-primary">
                      {portal.agency_name} · Certified Deliverable
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                    {serviceName}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                    {portal.custom_message ||
                      `Here is your finalized deliverable generated and audited specifically for ${portal.client_name}. Review the scope, approve completion, or request adjustments below.`}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
                  <Button
                    onClick={handleApprove}
                    disabled={approved}
                    className="bg-gradient-primary text-primary-foreground border-0 shadow-glow font-semibold text-xs sm:text-sm px-5"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {approved ? "Deliverable Approved" : "Approve Deliverable"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setFeedbackOpen(true)}
                    className="border-primary/30 text-xs sm:text-sm px-4"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Request Edits
                  </Button>
                </div>
              </div>

              {/* Portal Metadata Row */}
              <div className="mt-6 pt-6 border-t border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-muted/20 border border-border/30">
                  <p className="text-[10px] text-muted-foreground font-mono">Client</p>
                  <p className="text-xs font-semibold truncate">{portal.client_name}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/20 border border-border/30">
                  <p className="text-[10px] text-muted-foreground font-mono">Investment</p>
                  <p className="text-xs font-bold text-gradient">{retailPrice}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/20 border border-border/30">
                  <p className="text-[10px] text-muted-foreground font-mono">Status</p>
                  <p className={`text-xs font-semibold ${approved ? "text-green-400" : "text-primary"}`}>
                    {approved ? "Approved" : "In Review"}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/20 border border-border/30">
                  <p className="text-[10px] text-muted-foreground font-mono">Views</p>
                  <p className="text-xs font-mono font-semibold">{portal.access_count} views</p>
                </div>
              </div>
            </Card>

            {/* Deliverable Content Display */}
            <Card className="glass-strong p-6 sm:p-8 rounded-3xl border-primary/20 space-y-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-base sm:text-lg">Deliverable Content & Specifications</h2>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      const text = document.getElementById("portal-deliverable-body")?.innerText || "";
                      navigator.clipboard.writeText(text);
                      toast.success("Deliverable copied to clipboard!");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />Copy
                  </Button>
                </div>
              </div>

              {/* Sample or Attached Deliverable Body */}
              <div
                id="portal-deliverable-body"
                className="rounded-2xl p-5 sm:p-6 bg-muted/20 border border-border/40 font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed max-h-[540px] overflow-y-auto"
              >
                {`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${serviceName.toUpperCase()}
Prepared by: ${portal.agency_name}
Prepared for: ${portal.client_name}
Date: ${new Date(portal.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. EXECUTIVE OVERVIEW & ARCHITECTURE
------------------------------------------------------------
This deliverable contains the customized strategic framework and technical execution specifications prepared by ${portal.agency_name}. All components have been built in accordance with your project goals, industry standards, and high-conversion heuristics.

2. CORE ASSETS & IMPLEMENTATION BLUEPRINT
------------------------------------------------------------
• High-Impact Strategy & Architecture: Complete system overview and conversion logic.
• Technical & Functional Requirements: Comprehensive specification ready for implementation.
• Quality & Compliance Verification: Strict adherence to brand guidelines and performance SLAs.

3. ACCEPTANCE & HANDOFF
------------------------------------------------------------
Status: ${approved ? "ACCEPTED & APPROVED BY CLIENT" : "READY FOR CLIENT REVIEW & SIGN-OFF"}
Agency Guarantee: Unlimited revisions within the project scope.

Questions or custom adjustments? Use the "Request Edits" button at the top of this portal.`}
              </div>

              <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-green-400" />
                  <span>Verified Deliverable · Protected by Agency SLA Guarantee</span>
                </div>
                <Button
                  onClick={handleApprove}
                  disabled={approved}
                  className="bg-gradient-primary text-primary-foreground border-0 shadow-glow font-semibold text-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  {approved ? "Approved" : "Approve Deliverable"}
                </Button>
              </div>
            </Card>
          </motion.div>
        </main>

        {/* Edit Request Dialog */}
        <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
          <DialogContent className="max-w-md glass-strong border-primary/30 p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono uppercase tracking-wider text-primary">Revision Request</span>
              </div>
              <DialogTitle className="text-xl font-bold">Request Edits from {portal.agency_name}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Describe the modifications or adjustments you would like made to this deliverable.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              <Textarea
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="Example: Please update the hero CTA text and adjust the color scheme in section 2..."
                rows={4}
                className="glass text-xs"
              />
              <Button
                onClick={handleSendFeedback}
                disabled={submittingFeedback || !feedbackText.trim()}
                className="w-full bg-gradient-primary text-primary-foreground border-0 shadow-glow font-semibold text-xs"
              >
                {submittingFeedback ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Submit Revision Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ================= RENDER ORDER SHARE TOKEN VIEW =================
  return (
    <div className="min-h-screen relative">
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/40">
        <div className="container flex items-center justify-between py-4">
          <BrandMark />
          <Link
            to="/"
            className="text-xs font-mono uppercase tracking-[0.25em] text-muted-foreground hover:text-primary transition-colors"
          >
            Powered by Straxon Labs →
          </Link>
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
            {order?.service_name}
          </h1>
          <div className="rounded-2xl overflow-hidden shadow-elegant bg-muted">
            {order && <ProposalPreview order={order} />}
          </div>
        </div>
      </motion.main>
    </div>
  );
};

export default PublicView;
