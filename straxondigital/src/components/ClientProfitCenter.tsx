import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  DollarSign, TrendingUp, Building2, Copy, CheckCircle2, Sparkles, Zap,
  ChevronRight, ArrowRight, Users, ShieldCheck, Globe, Loader2, FileText,
  ExternalLink, Trash2, RefreshCw, Eye, MessageSquare, Check, Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useCurrency } from "@/context/CurrencyContext";
import { useAuth } from "@/hooks/useAuth";

const DELIVERABLE_SERVICES = [
  { name: "High-Conversion Website Blueprint", wholesale: 89, retail: 997 },
  { name: "Brand Identity Kit", wholesale: 69, retail: 799 },
  { name: "Autonomous SEO Growth Plan", wholesale: 49, retail: 499 },
  { name: "ATS Executive Resume Rewrite", wholesale: 29, retail: 299 },
  { name: "12-Slide Investor Pitch Deck", wholesale: 99, retail: 1299 },
  { name: "SaaS Architecture Specification", wholesale: 119, retail: 1499 },
  { name: "30-Day Social Content Calendar", wholesale: 49, retail: 599 },
  { name: "AI Voice Agent Script", wholesale: 89, retail: 1099 },
];

export const ClientProfitCenter = () => {
  const { user } = useAuth();
  const { formatPrice, currency } = useCurrency();
  const [clientCount, setClientCount] = useState(5);
  const [avgRetainer, setAvgRetainer] = useState(2500);
  const [agencyName, setAgencyName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [selectedService, setSelectedService] = useState(DELIVERABLE_SERVICES[0]);
  const [markup, setMarkup] = useState(180); // % markup over wholesale
  const [generatingPortal, setGeneratingPortal] = useState(false);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [copiedPortal, setCopiedPortal] = useState(false);
  const [userPortals, setUserPortals] = useState<any[]>([]);
  const [loadingPortals, setLoadingPortals] = useState(false);
  // Proposal generator
  const [proposalClient, setProposalClient] = useState("");
  const [proposalItems, setProposalItems] = useState<{ name: string; price: number }[]>([]);
  const [proposalNotes, setProposalNotes] = useState("");
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [proposalOutput, setProposalOutput] = useState<string | null>(null);

  const [portalFeedback, setPortalFeedback] = useState<any[]>([]);

  const loadUserPortals = async () => {
    if (!user) return;
    setLoadingPortals(true);
    const { data } = await supabase
      .from("client_portals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setUserPortals(data || []);

    // Load feedback for these portals
    if (data && data.length > 0) {
      const portalIds = data.map((p) => p.id);
      const { data: fb } = await supabase
        .from("portal_feedback")
        .select("*")
        .in("portal_id", portalIds)
        .order("created_at", { ascending: false })
        .limit(15);
      setPortalFeedback(fb || []);
    }
    setLoadingPortals(false);
  };

  useEffect(() => {
    loadUserPortals();
  }, [user]);

  const updateFeedbackStatus = async (id: string, newStatus: string) => {
    await supabase.from("portal_feedback").update({ status: newStatus }).eq("id", id);
    toast.success(`Feedback updated to ${newStatus}`);
    loadUserPortals();
  };

  const deletePortal = async (id: string) => {
    await supabase.from("client_portals").delete().eq("id", id);
    toast.success("Client portal link removed");
    loadUserPortals();
  };

  // ===== PROFIT CALCULATIONS =====
  const grossRevenue = clientCount * avgRetainer;
  const straxonCost = clientCount * 350 + 149; // $350 avg wholesale + Agency plan
  const netProfit = grossRevenue - straxonCost;
  const margin = Math.round((netProfit / grossRevenue) * 100);

  const retailPrice = Math.round(selectedService.wholesale * (1 + markup / 100));
  const profitPerDeal = retailPrice - selectedService.wholesale;
  const profitMarginPct = Math.round((profitPerDeal / retailPrice) * 100);

  // ===== PORTAL GENERATOR =====
  const generatePortal = async () => {
    if (!agencyName.trim() || !clientName.trim()) {
      toast.error("Enter agency name and client name first");
      return;
    }
    if (!user) { toast.error("Please sign in"); return; }
    setGeneratingPortal(true);
    try {
      // Get workspace
      const { data: ws } = await supabase.from("workspaces").select("id").eq("owner_id", user.id).limit(1).maybeSingle();
      if (!ws) throw new Error("No workspace found");

      const { data, error } = await supabase.from("client_portals").insert({
        workspace_id: ws.id,
        user_id: user.id,
        agency_name: agencyName,
        client_name: clientName,
        client_email: clientEmail || null,
        retail_price_cents: retailPrice * 100,
        wholesale_price_cents: selectedService.wholesale * 100,
        custom_message: proposalNotes || null,
        branding_config: { service: selectedService.name, markup_pct: markup },
      }).select("portal_token").single();

      if (error) throw error;
      const url = `${window.location.origin}/view/${data.portal_token}`;
      setPortalUrl(url);
      toast.success("White-label client portal generated!", { description: `Branded as "${agencyName}" for ${clientName}` });
      loadUserPortals();
    } catch (e: any) {
      toast.error(e.message || "Failed to generate portal");
    } finally {
      setGeneratingPortal(false);
    }
  };

  const copyPortalUrl = () => {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl);
    setCopiedPortal(true);
    toast.success("Portal link copied!");
    setTimeout(() => setCopiedPortal(false), 2500);
  };

  // ===== PROPOSAL GENERATOR =====
  const generateProposal = () => {
    if (!proposalClient.trim() || proposalItems.length === 0) {
      toast.error("Add a client name and at least one service");
      return;
    }
    setGeneratingProposal(true);

    const total = proposalItems.reduce((s, i) => s + i.price, 0);
    const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const output = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CLIENT PROPOSAL — ${agencyName || "Your Agency"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Prepared for: ${proposalClient}
Date: ${date}
Valid for: 14 days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCOPE OF WORK & INVESTMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${proposalItems.map((item, i) => `${i + 1}. ${item.name}\n   Investment: $${item.price.toLocaleString()}`).join("\n\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL INVESTMENT: $${total.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAYMENT TERMS:
• 50% deposit ($${Math.round(total / 2).toLocaleString()}) required to begin
• 50% balance ($${Math.round(total / 2).toLocaleString()}) upon delivery
• Payments accepted via: Bank Transfer, Stripe, PayPal

DELIVERY SLA:
• Standard delivery: 24-48 hours per deliverable
• Full package completion: 3-7 business days
• Unlimited revisions within scope

${proposalNotes ? `ADDITIONAL NOTES:\n${proposalNotes}\n` : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACCEPTANCE

By proceeding with the deposit payment, ${proposalClient} agrees to the scope, timeline, and payment terms outlined in this proposal.

Questions? Reply to this proposal or contact ${agencyName || "our team"} directly.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    setTimeout(() => {
      setProposalOutput(output);
      setGeneratingProposal(false);
      toast.success("Proposal generated! Ready to send.");
    }, 800);
  };

  const addProposalItem = (service: typeof DELIVERABLE_SERVICES[0]) => {
    if (proposalItems.find(i => i.name === service.name)) return;
    setProposalItems(prev => [...prev, { name: service.name, price: Math.round(service.wholesale * (1 + markup / 100)) }]);
  };

  return (
    <div className="space-y-8">
      {/* Agency ROI Simulator */}
      <Card className="glass-strong p-6 sm:p-10 rounded-3xl border-primary/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex items-center gap-2 mb-2">
          <Badge className="bg-gradient-primary text-primary-foreground border-0 shadow-glow font-mono text-xs uppercase tracking-wider">
            Agency Profit Engine
          </Badge>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">Agency ROI & Margin Simulator</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Adjust your active retainer client count and average billing rate to project your net cashflow.
        </p>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-semibold">
                <span>Active Retainer Clients</span>
                <span className="font-mono text-primary">{clientCount} Clients</span>
              </div>
              <Slider value={[clientCount]} min={1} max={30} step={1} onValueChange={v => setClientCount(v[0])} />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>1 client</span><span>15 clients</span><span>30 clients</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm font-semibold">
                <span>Avg. Monthly Retainer Billed to Client</span>
                <span className="font-mono text-primary">{formatPrice(avgRetainer * 100)}/mo</span>
              </div>
              <Slider value={[avgRetainer]} min={500} max={10000} step={250} onValueChange={v => setAvgRetainer(v[0])} />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>{formatPrice(500 * 100)}/mo</span><span>{formatPrice(5000 * 100)}/mo</span><span>{formatPrice(10000 * 100)}/mo</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Gross Client Revenue", value: `${formatPrice(grossRevenue * 100)}/mo`, highlight: false, icon: DollarSign },
              { label: "Straxon Fulfillment Cost", value: `${formatPrice(straxonCost * 100)}/mo`, highlight: false, icon: Zap },
              { label: "Net Agency Profit", value: `${formatPrice(netProfit * 100)}/mo`, highlight: true, icon: TrendingUp },
              { label: "Gross Margin", value: `${margin}%`, highlight: margin > 70, icon: ShieldCheck },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className={`p-4 rounded-2xl text-center ${stat.highlight ? "bg-primary/15 border border-primary/30 shadow-glow" : "bg-muted/20 border border-border/40"}`}>
                  <Icon className={`h-5 w-5 mx-auto mb-2 ${stat.highlight ? "text-primary" : "text-muted-foreground"}`} />
                  <div className={`text-xl font-bold ${stat.highlight ? "text-gradient" : "text-foreground"}`}>{stat.value}</div>
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border/40 flex gap-3 flex-wrap">
          <Button asChild className="bg-gradient-primary text-primary-foreground border-0 shadow-glow font-semibold">
            <Link to="/checkout/conversion-website?tier=enterprise">
              Activate Agency License ({formatPrice(149 * 100)}/mo) <ArrowRight className="h-4 w-4 ml-1.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-primary/30">
            <Link to="/reseller">Full Reseller Guide <ChevronRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </div>
      </Card>

      {/* Per-Deliverable Margin Calculator */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-strong p-6 border-primary/20">
          <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" /> Deliverable Margin Calculator
          </h3>
          <p className="text-xs text-muted-foreground mb-5">Set your retail markup over wholesale fulfillment cost.</p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1.5">Select Service</label>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {DELIVERABLE_SERVICES.map(svc => (
                  <button
                    key={svc.name}
                    onClick={() => setSelectedService(svc)}
                    className={`w-full flex justify-between items-center p-2.5 rounded-lg border text-xs text-left transition-all ${
                      selectedService.name === svc.name ? "border-primary bg-primary/10" : "border-border/40 hover:border-primary/30"
                    }`}
                  >
                    <span>{svc.name}</span>
                    <span className="font-mono text-muted-foreground">{formatPrice(svc.wholesale * 100)} → {formatPrice(Math.round(svc.wholesale * (1 + markup / 100)) * 100)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span>Your Markup</span>
                <span className="font-mono text-primary">+{markup}%</span>
              </div>
              <Slider value={[markup]} min={50} max={900} step={10} onValueChange={v => setMarkup(v[0])} />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              <div className="p-3 rounded-xl bg-muted/20 border border-border/40">
                <p className="text-[10px] text-muted-foreground font-mono">Wholesale</p>
                <p className="text-base sm:text-lg font-bold">{formatPrice(selectedService.wholesale * 100)}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-[10px] text-muted-foreground font-mono">Your Price</p>
                <p className="text-base sm:text-lg font-bold text-gradient">{formatPrice(retailPrice * 100)}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-[10px] text-muted-foreground font-mono">Net Profit</p>
                <p className="text-base sm:text-lg font-bold text-green-400">{profitMarginPct}%</p>
              </div>
            </div>
          </div>
        </Card>

        {/* White-Label Portal Generator */}
        <Card className="glass-strong p-6 border-primary/20">
          <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" /> White-Label Portal Generator
          </h3>
          <p className="text-xs text-muted-foreground mb-5">Generate a branded client-facing delivery link under your agency name.</p>

          <div className="space-y-3">
            <Input placeholder="Your Agency Name" value={agencyName} onChange={e => setAgencyName(e.target.value)} className="glass text-sm" />
            <Input placeholder="Client Name or Company" value={clientName} onChange={e => setClientName(e.target.value)} className="glass text-sm" />
            <Input placeholder="Client Email (optional)" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="glass text-sm" type="email" />

            <Button
              onClick={generatePortal}
              disabled={generatingPortal || !agencyName.trim() || !clientName.trim()}
              className="w-full bg-gradient-primary text-primary-foreground border-0 shadow-glow font-semibold"
            >
              {generatingPortal ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Globe className="h-4 w-4 mr-2" />}
              Generate White-Label Portal Link
            </Button>

            {portalUrl && (
              <div className="space-y-2 pt-2 border-t border-border/40">
                <p className="text-xs font-mono uppercase tracking-wider text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Portal Generated
                </p>
                <div className="flex gap-2">
                  <Input readOnly value={portalUrl} className="font-mono text-xs text-primary glass" />
                  <Button size="sm" onClick={copyPortalUrl} variant="outline" className="border-primary/30 shrink-0">
                    {copiedPortal ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Share this URL with your client. It displays the deliverable branded as {agencyName}.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Active Client Delivery Portals */}
      {userPortals.length > 0 && (
        <Card className="glass-strong p-6 sm:p-8 border-primary/20 rounded-3xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-semibold text-lg sm:text-xl flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> Active Client Delivery Portals ({userPortals.length})
              </h3>
              <p className="text-xs text-muted-foreground">White-labeled delivery links generated under your agency branding.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={loadUserPortals} disabled={loadingPortals} className="h-8 text-xs">
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loadingPortals ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {userPortals.map((p) => {
              const url = `${window.location.origin}/view/${p.portal_token}`;
              const retail = p.retail_price_cents ? `$${(p.retail_price_cents / 100).toLocaleString()}` : "$997";
              return (
                <div key={p.id} className="p-4 rounded-2xl bg-muted/20 border border-border/40 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{p.client_name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">{p.branding_config?.service || "Agency Deliverable"}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 shrink-0 font-mono">
                      {retail}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono pt-1 border-t border-border/30">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3 text-primary" /> {p.access_count || 0} views
                    </span>
                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 text-xs border-primary/30"
                      onClick={() => {
                        navigator.clipboard.writeText(url);
                        toast.success("Portal link copied to clipboard!");
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy Link
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      asChild
                    >
                      <a href={url} target="_blank" rel="noopener noreferrer" title="Preview Portal">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => deletePortal(p.id)}
                      title="Delete Portal"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Client Feedback & Approvals Inbox */}
      {portalFeedback.length > 0 && (
        <Card className="glass-strong p-6 sm:p-8 border-primary/20 rounded-3xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-semibold text-lg sm:text-xl flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" /> Client Revisions & Approvals Inbox ({portalFeedback.length})
              </h3>
              <p className="text-xs text-muted-foreground">Real-time feedback submitted by clients on your white-label portals.</p>
            </div>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/25 font-mono">
              Live Client Sync
            </Badge>
          </div>

          <div className="space-y-2.5">
            {portalFeedback.map((fb) => (
              <div
                key={fb.id}
                className={`p-4 rounded-2xl border transition-all ${
                  fb.status === "unread"
                    ? "bg-primary/10 border-primary/40 shadow-glow"
                    : "bg-muted/15 border-border/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{fb.client_name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono uppercase ${
                        fb.feedback_type === "approval"
                          ? "bg-green-500/15 text-green-400 border-green-500/30"
                          : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {fb.feedback_type === "approval" ? "Approved" : "Revision Request"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {new Date(fb.created_at).toLocaleDateString()}
                    </span>
                    <select
                      value={fb.status}
                      onChange={(e) => updateFeedbackStatus(fb.id, e.target.value)}
                      className="bg-muted/40 border border-border/50 rounded-lg px-2 py-0.5 text-[10px] font-mono text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="unread">Unread</option>
                      <option value="acknowledged">Acknowledged</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed pl-1 font-mono">
                  "{fb.message}"
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Proposal Generator */}
      <Card className="glass-strong p-6 sm:p-8 border-primary/20 rounded-3xl">
        <h3 className="font-semibold text-xl mb-1 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Instant Client Proposal Generator
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Build a professional proposal in 30 seconds. Select services, set prices, and generate a ready-to-send proposal document.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input
              placeholder="Client / Company Name"
              value={proposalClient}
              onChange={e => setProposalClient(e.target.value)}
              className="glass"
            />

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-2">Add Services to Proposal</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {DELIVERABLE_SERVICES.map(svc => {
                  const inList = proposalItems.find(i => i.name === svc.name);
                  return (
                    <button
                      key={svc.name}
                      onClick={() => inList
                        ? setProposalItems(prev => prev.filter(i => i.name !== svc.name))
                        : addProposalItem(svc)
                      }
                      className={`w-full flex justify-between items-center p-2.5 rounded-lg border text-xs text-left transition-all ${
                        inList ? "border-primary bg-primary/10 text-primary" : "border-border/40 hover:border-primary/30"
                      }`}
                    >
                      <span>{svc.name}</span>
                      <span className="font-mono">${Math.round(svc.wholesale * (1 + markup / 100))}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Textarea
              value={proposalNotes}
              onChange={e => setProposalNotes(e.target.value)}
              placeholder="Additional notes for the proposal..."
              rows={3}
              className="glass text-xs"
            />

            {proposalItems.length > 0 && (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-sm font-mono">
                <span className="text-muted-foreground">Total: </span>
                <span className="text-gradient font-bold">${proposalItems.reduce((s, i) => s + i.price, 0).toLocaleString()}</span>
                <span className="text-muted-foreground text-xs ml-2">({proposalItems.length} items)</span>
              </div>
            )}

            <Button
              onClick={generateProposal}
              disabled={generatingProposal || !proposalClient.trim() || proposalItems.length === 0}
              className="w-full bg-gradient-primary text-primary-foreground border-0 shadow-glow font-semibold"
            >
              {generatingProposal ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              Generate Proposal Document
            </Button>
          </div>

          {proposalOutput ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono uppercase tracking-wider text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Proposal Ready
                </p>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => { navigator.clipboard.writeText(proposalOutput); toast.success("Proposal copied!"); }}
                  className="h-7 text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />Copy
                </Button>
              </div>
              <div className="rounded-xl p-4 bg-muted/20 border border-border/40 text-xs font-mono whitespace-pre-wrap max-h-[420px] overflow-y-auto leading-relaxed">
                {proposalOutput}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border/40 text-muted-foreground text-xs text-center p-8">
              <div>
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Select services and click "Generate Proposal" to produce a client-ready proposal document.</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
