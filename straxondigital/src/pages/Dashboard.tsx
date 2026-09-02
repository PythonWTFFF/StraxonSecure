import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProposalPreview } from "@/components/Proposals";
import { GenerationTerminal } from "@/components/GenerationTerminal";
import { InvoiceDocument, InvoiceLike } from "@/components/InvoiceDocument";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Download, DollarSign, FileText, LifeBuoy, Loader2, Package, Receipt, Search, CheckCircle2, Clock, AlertCircle, Users } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { formatPrice } from "@/lib/services";
import { Skeleton } from "@/components/ui/skeleton";
import { DeliverableContent, parseDeliverable } from "@/types/deliverables";
import { Order, SupportTicket, Profile } from "@/types/database";
import { getSignedDeliverableUrl } from "@/lib/storage";
import { Footer } from "@/components/Footer";
import { BillingTab } from "@/components/BillingTab";
import { WorkspacePanel } from "@/components/WorkspacePanel";
import { OrderActions } from "@/components/OrderActions";
import { AutomationsHub } from "@/components/AutomationsHub";
import { AffiliateHub } from "@/components/AffiliateHub";
import { ClientProfitCenter } from "@/components/ClientProfitCenter";
import { AgencyLeadMagnet } from "@/components/AgencyLeadMagnet";
import { RevenueAnalyticsBrain } from "@/components/RevenueAnalyticsBrain";
import { EmailDigestEngine } from "@/components/EmailDigestEngine";
import { ClientReportGenerator } from "@/components/ClientReportGenerator";
import { OnboardingConcierge } from "@/components/OnboardingConcierge";
import { ContentEngine } from "@/components/ContentEngine";
import { DripCampaignGenerator } from "@/components/DripCampaignGenerator";
import { CompetitorTracker } from "@/components/CompetitorTracker";
import { SocialMediaEngine } from "@/components/SocialMediaEngine";
import { PricingOptimizer } from "@/components/PricingOptimizer";
import { ReviewEngine } from "@/components/ReviewEngine";
import { SecurityCenter } from "@/components/SecurityCenter";
import { RagVectorStudio } from "@/components/RagVectorStudio";
import { GstInvoiceGenerator } from "@/components/GstInvoiceGenerator";
import { TrendingUp as TrendingUpIcon, Mail as MailIcon, Compass as CompassIcon, PenTool, Send as SendIcon, Crosshair, Smartphone, LineChart, Star, ShieldCheck, Database, Building2 } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  processing: "bg-primary/20 text-primary border-primary/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-destructive/20 text-destructive",
};

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [invoices, setInvoices] = useState<InvoiceLike[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchParams] = useSearchParams();
  const focusOrderId = searchParams.get("order");

  const [showConcierge, setShowConcierge] = useState(false);
  const [selectedGstInvoice, setSelectedGstInvoice] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: o }, { data: inv }, { data: t }, { data: p }] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("invoices").select("*").order("issued_at", { ascending: false }),
        supabase.from("support_tickets").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
      ]);
      setOrders((o as unknown as Order[]) || []);
      setInvoices((inv as unknown as InvoiceLike[]) || []);
      setTickets((t as unknown as SupportTicket[]) || []);
      setProfile((p as Profile) ?? null);
    };
    load();

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();

    // Visual progress ticker (UI only — true status is server-driven)
    const tick = setInterval(() => {
      setOrders((prev) =>
        prev?.map((o) =>
          o.status === "processing" && o.progress < 92
            ? { ...o, progress: Math.min(92, o.progress + Math.random() * 5) }
            : o,
        ) ?? null,
      );
    }, 1200);

    return () => { supabase.removeChannel(channel); clearInterval(tick); };
  }, [user]);

  const filteredOrders = useMemo(() => {
    if (!orders) return null;
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!o.service_name.toLowerCase().includes(q) && !o.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [orders, query, statusFilter]);

  const stats = useMemo(() => {
    if (!orders) return { total: 0, active: 0, completed: 0, spend: 0 };
    const completed = orders.filter((o) => o.status === "completed");
    return {
      total: orders.length,
      active: orders.filter((o) => o.status === "processing" || o.status === "pending").length,
      completed: completed.length,
      spend: completed.reduce((s, o) => s + o.price_cents, 0),
    };
  }, [orders]);

  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container pt-32 pb-20">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-primary mb-2">/ Client Dashboard</p>
            <h1 className="text-3xl sm:text-4xl font-bold">Your command center</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConcierge(!showConcierge)}
              className="glass text-xs h-9"
            >
              <CompassIcon className="h-3.5 w-3.5 mr-1.5 text-primary" />
              {showConcierge ? "Close Concierge" : "AI Onboarding Concierge"}
            </Button>
            <Button asChild className="bg-gradient-primary text-primary-foreground border-0 h-9 text-xs">
              <a href="/services">+ New order</a>
            </Button>
          </div>
        </div>

        {/* AI Onboarding Concierge */}
        {(showConcierge || (orders !== null && orders.length === 0)) && (
          <div className="mb-8">
            <OnboardingConcierge onComplete={() => setShowConcierge(false)} />
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat icon={Package} label="Orders" value={String(stats.total)} />
          <Stat icon={Clock} label="Active" value={String(stats.active)} />
          <Stat icon={CheckCircle2} label="Completed" value={String(stats.completed)} />
          <Stat icon={Receipt} label="Lifetime spend" value={formatPrice(stats.spend)} />
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <div className="overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="glass inline-flex w-max min-w-full sm:min-w-0 p-1.5 gap-1 rounded-2xl border border-primary/20 backdrop-blur-xl">
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="rag-studio">
                <Database className="h-3.5 w-3.5 mr-1 text-primary" />RAG Studio
              </TabsTrigger>
              <TabsTrigger value="automations">Automations</TabsTrigger>
              <TabsTrigger value="analytics">
                <TrendingUpIcon className="h-3.5 w-3.5 mr-1 text-primary" />Analytics Brain
              </TabsTrigger>
              <TabsTrigger value="reports">
                <FileText className="h-3.5 w-3.5 mr-1" />Client Reports
              </TabsTrigger>
              <TabsTrigger value="digests">
                <MailIcon className="h-3.5 w-3.5 mr-1" />Email Digest
              </TabsTrigger>
              <TabsTrigger value="invoices">
                Invoices {invoices.length > 0 && <span className="ml-1.5 text-xs text-primary">({invoices.length})</span>}
              </TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="workspace">Workspace</TabsTrigger>
              <TabsTrigger value="reseller">
                <DollarSign className="h-3.5 w-3.5 mr-1" />Client Profit
              </TabsTrigger>
              <TabsTrigger value="content">
                <PenTool className="h-3.5 w-3.5 mr-1" />Auto-Blogger
              </TabsTrigger>
              <TabsTrigger value="drip">
                <SendIcon className="h-3.5 w-3.5 mr-1" />Drip Campaigns
              </TabsTrigger>
              <TabsTrigger value="intel">
                <Crosshair className="h-3.5 w-3.5 mr-1" />Competitor Intel
              </TabsTrigger>
              <TabsTrigger value="social">
                <Smartphone className="h-3.5 w-3.5 mr-1" />Social Growth
              </TabsTrigger>
              <TabsTrigger value="pricing">
                <LineChart className="h-3.5 w-3.5 mr-1" />Price AI
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <Star className="h-3.5 w-3.5 mr-1" />Review Harvest
              </TabsTrigger>
              <TabsTrigger value="leads">
                <Users className="h-3.5 w-3.5 mr-1" />Agency Leads
              </TabsTrigger>
              <TabsTrigger value="affiliates">Partners (30%)</TabsTrigger>
              <TabsTrigger value="support">
                Support {tickets.length > 0 && <span className="ml-1.5 text-xs text-primary">({tickets.length})</span>}
              </TabsTrigger>
              <TabsTrigger value="security">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" />Security Center
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="security" className="mt-6">
            <SecurityCenter />
          </TabsContent>

          <TabsContent value="rag-studio" className="mt-6">
            <RagVectorStudio />
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by service or order ID…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 glass"
                />
              </div>
              <div className="flex gap-1">
                {["all", "pending", "processing", "completed", "cancelled"].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={statusFilter === s ? "default" : "outline"}
                    onClick={() => setStatusFilter(s)}
                    className={statusFilter === s ? "bg-gradient-primary text-primary-foreground border-0 capitalize" : "border-primary/30 capitalize"}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            {filteredOrders === null ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
              </div>
            ) : filteredOrders.length === 0 ? (
              <Card className="glass-strong p-12 text-center border-primary/20">
                <Package className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h2 className="text-xl font-semibold mb-2">{orders?.length === 0 ? "No orders yet" : "No matches"}</h2>
                <p className="text-muted-foreground mb-6">
                  {orders?.length === 0 ? "Your deliverables will appear here once you place an order." : "Try a different search or filter."}
                </p>
                {orders?.length === 0 && (
                  <Button asChild className="bg-gradient-primary text-primary-foreground border-0">
                    <a href="/services">Browse services</a>
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredOrders.map((o, i) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    index={i}
                    autoOpen={focusOrderId === o.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="automations" className="mt-6">
            <AutomationsHub />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <RevenueAnalyticsBrain />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <ClientReportGenerator />
          </TabsContent>

          <TabsContent value="digests" className="mt-6">
            <EmailDigestEngine />
          </TabsContent>

          <TabsContent value="invoices" className="mt-6">
            <InvoicesTab invoices={invoices} orders={orders ?? []} profile={profile} />
          </TabsContent>

          <TabsContent value="billing" className="mt-6">
            <BillingTab userId={user.id} />
          </TabsContent>

          <TabsContent value="workspace" className="mt-6">
            <WorkspacePanel userId={user.id} />
          </TabsContent>

          <TabsContent value="reseller" className="mt-6">
            <ClientProfitCenter />
          </TabsContent>
          
          <TabsContent value="content" className="mt-6">
            <ContentEngine />
          </TabsContent>

          <TabsContent value="drip" className="mt-6">
            <DripCampaignGenerator />
          </TabsContent>

          <TabsContent value="intel" className="mt-6">
            <CompetitorTracker />
          </TabsContent>

          <TabsContent value="social" className="mt-6">
            <SocialMediaEngine />
          </TabsContent>

          <TabsContent value="pricing" className="mt-6">
            <PricingOptimizer />
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <ReviewEngine />
          </TabsContent>

          <TabsContent value="leads" className="mt-6">
            <AgencyLeadMagnet />
          </TabsContent>

          <TabsContent value="affiliates" className="mt-6">
            <AffiliateHub />
          </TabsContent>

          <TabsContent value="support" className="mt-6">
            <SupportTab tickets={tickets} />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
      {selectedGstInvoice && (
        <GstInvoiceGenerator
          isOpen={Boolean(selectedGstInvoice)}
          onClose={() => setSelectedGstInvoice(null)}
          orderData={selectedGstInvoice}
        />
      )}
    </div>
  );
};

const SupportTab = ({ tickets }: { tickets: SupportTicket[] }) => {
  const statusColor: Record<string, string> = {
    open: "bg-primary/20 text-primary border-primary/30",
    in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    resolved: "bg-green-500/20 text-green-400 border-green-500/30",
    closed: "bg-muted text-muted-foreground",
  };
  const priorityColor: Record<string, string> = {
    urgent: "bg-destructive/20 text-destructive border-destructive/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    normal: "bg-muted text-muted-foreground",
    low: "bg-muted text-muted-foreground",
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <p className="text-sm text-muted-foreground">
          Need help with an order or have a question? Open a ticket — we respond within 24h.
        </p>
        <Button asChild className="bg-gradient-primary text-primary-foreground border-0">
          <Link to="/contact"><LifeBuoy className="h-4 w-4 mr-2" /> New ticket</Link>
        </Button>
      </div>

      {tickets.length === 0 ? (
        <Card className="glass-strong p-12 text-center border-primary/20">
          <LifeBuoy className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-2">No support tickets</h2>
          <p className="text-muted-foreground mb-6">All quiet on the support front. We're here whenever you need us.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {tickets.map((t) => (
            <Card key={t.id} className="glass p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold">{t.subject}</h3>
                    <Badge variant="outline" className={statusColor[t.status]}>{t.status.replace("_", " ")}</Badge>
                    <Badge variant="outline" className={priorityColor[t.priority]}>{t.priority}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    #{t.id.slice(0, 8)} · {t.category} · {new Date(t.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">{t.message}</p>
              {t.admin_response && (
                <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 p-3">
                  <p className="text-xs font-mono uppercase tracking-wider text-primary mb-1">Straxon Labs reply</p>
                  <p className="text-sm whitespace-pre-wrap">{t.admin_response}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const InvoicesTab = ({
  invoices,
  orders,
  profile,
}: {
  invoices: InvoiceLike[];
  orders: Order[];
  profile: Profile | null;
}) => {
  if (invoices.length === 0) {
    return (
      <Card className="glass-strong p-12 text-center border-primary/20">
        <Receipt className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2">No invoices yet</h2>
        <p className="text-muted-foreground">Each order generates an invoice automatically.</p>
      </Card>
    );
  }

  const orderById = new Map(orders.map((o) => [o.id, o]));

  return (
    <div className="grid gap-3">
      {invoices.map((inv) => {
        const orderId = (inv as unknown as { order_id: string }).order_id;
        const order = orderById.get(orderId);
        return (
          <Card key={inv.id} className="glass p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-mono font-semibold">{inv.invoice_number}</p>
                <Badge
                  variant="outline"
                  className={inv.status === "paid"
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-muted text-muted-foreground"}
                >
                  {inv.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {order?.service_name ?? "Order"} · {new Date(inv.issued_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-gradient">{formatPrice(inv.total_cents)}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedGstInvoice({
                  id: inv.invoice_number || inv.id,
                  serviceName: order?.service_name ?? "Autonomous RAG Service Suite",
                  amountCents: inv.total_cents,
                  clientName: profile?.full_name,
                  clientEmail: profile?.email,
                  date: new Date(inv.issued_at).toLocaleDateString(),
                })}
                className="border-primary/30 text-primary hover:bg-primary/10 text-xs h-9"
              >
                <Building2 className="h-3.5 w-3.5 mr-1" /> GST / B2B Tax
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" /> View
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-muted">
                  <DialogTitle className="sr-only">Invoice Details</DialogTitle>
                  <DialogDescription className="sr-only">View invoice details</DialogDescription>
                  <InvoiceDocument
                    invoice={inv}
                    order={{
                      service_name: order?.service_name ?? "Service",
                      customer_email: profile?.email,
                      customer_name: profile?.full_name,
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

const OrderCard = ({ order, index, autoOpen }: { order: Order; index: number; autoOpen: boolean }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const validatedContent = useMemo(() => parseDeliverable(order.generated_content), [order.generated_content]);
  const hasInvalidContent = order.generated_content && !validatedContent;

  useEffect(() => {
    if (order.status !== "completed") return;
    let cancelled = false;
    getSignedDeliverableUrl(order.user_id, order.id).then((url) => {
      if (!cancelled && url) setSignedUrl(url);
    });
    return () => { cancelled = true; };
  }, [order.status, order.user_id, order.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={`glass p-6 hover:border-primary/30 transition-colors ${
          autoOpen ? "ring-2 ring-primary/40" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-lg font-semibold">{order.service_name}</h3>
              <Badge variant="outline" className={statusColors[order.status]}>{order.status}</Badge>
              {hasInvalidContent && (
                <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">
                  <AlertCircle className="h-3 w-3 mr-1" /> schema error
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleString()} · {formatPrice(order.price_cents)}
            </p>
            {order.error_message && (
              <p className="text-xs text-destructive mt-1">⚠ {order.error_message}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
              <Link to={`/contact?order=${order.id}&category=order_issue`}>
                <LifeBuoy className="h-4 w-4 mr-2" /> Need help?
              </Link>
            </Button>
            <Dialog defaultOpen={autoOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" /> Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-muted">
                <DialogTitle className="sr-only">Preview Deliverable</DialogTitle>
                <DialogDescription className="sr-only">Preview the generated deliverable content</DialogDescription>
                <ProposalPreview order={order} />
              </DialogContent>
            </Dialog>
            {order.status === "completed" && (
              signedUrl ? (
                <Button asChild className="bg-gradient-primary text-primary-foreground border-0 shadow-glow">
                  <a href={signedUrl} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4 mr-2" /> Signed PDF
                  </a>
                </Button>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-primary text-primary-foreground border-0 shadow-glow">
                      <Download className="h-4 w-4 mr-2" /> Get deliverable
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-muted">
                    <DialogTitle className="sr-only">Get Deliverable</DialogTitle>
                    <DialogDescription className="sr-only">Download or preview your generated deliverable</DialogDescription>
                    <ProposalPreview order={order} />
                  </DialogContent>
                </Dialog>
              )
            )}
          </div>
        </div>

        {order.status === "completed" && (
          <div className="mt-4 pt-4 border-t border-border/40">
            <OrderActions
              orderId={order.id}
              workspaceId={order.workspace_id}
              isPublic={order.is_public}
              shareToken={order.share_token}
            />
            {order.revisions_count > 0 && (
              <p className="text-xs text-muted-foreground mt-2 font-mono">↻ {order.revisions_count} revision{order.revisions_count > 1 ? "s" : ""}</p>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {order.status === "processing" && (
            <motion.div
              key="terminal"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 overflow-hidden"
            >
              <GenerationTerminal progress={order.progress} />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

const Stat = ({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) => (
  <Card className="glass p-4 sm:p-5 border border-primary/20 hover:border-primary/40 transition-all shadow-sm">
    <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] sm:text-xs uppercase tracking-wider font-mono mb-1.5">
      <Icon className="h-3.5 w-3.5 text-primary shrink-0" /> <span className="truncate">{label}</span>
    </div>
    <p className="text-xl sm:text-2xl font-bold text-gradient truncate">{value}</p>
  </Card>
);

const FullPageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export default Dashboard;
