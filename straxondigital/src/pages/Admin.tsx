import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldAlert, TrendingUp, Users, Package, DollarSign, LifeBuoy } from "lucide-react";
import { formatPrice } from "@/lib/services";
import { toast } from "sonner";
import { ProposalPreview } from "@/components/Proposals";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";

import { DeliverableContent } from "@/types/deliverables";
import { Order, SupportTicket, Lead } from "@/types/database";



const Admin = () => {
  const { user, role, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    if (role !== "admin") return;
    const load = async () => {
      const [{ data: o }, { data: l }, { data: t }] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("support_tickets").select("*").order("created_at", { ascending: false }),
      ]);
      setOrders((o as unknown as Order[]) || []);
      setLeads((l as Lead[]) || []);
      setTickets((t as unknown as SupportTicket[]) || []);
    };
    load();
    const ch = supabase
      .channel("admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [role]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (role !== "admin") return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container pt-32 max-w-md">
        <Card className="glass-strong p-8 text-center border-destructive/30">
          <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin only</h1>
          <p className="text-muted-foreground">Your account doesn't have admin access. Ask the owner to grant you the admin role from the database.</p>
        </Card>
      </div>
    </div>
  );

  type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
  const updateStatus = async (id: string, status: OrderStatus) => {
    const progress = status === "completed" ? 100 : status === "processing" ? 25 : 0;
    const { error } = await supabase.from("orders").update({ status, progress }).eq("id", id);
    if (error) toast.error(error.message); else toast.success(`Order → ${status}`);
  };

  const regenerate = async (id: string) => {
    await supabase.from("orders").update({ status: "pending", progress: 0, error_message: null, generated_content: null }).eq("id", id);
    const { error } = await supabase.from("orders").update({ status: "processing", progress: 5 }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Re-running generation engine");
  };

  const totalRevenue = orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.price_cents, 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const processing = orders.filter((o) => o.status === "processing").length;
  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

  const revByDay = (() => {
    const map = new Map<string, number>();
    orders.filter((o) => o.status === "completed").forEach((o) => {
      const d = new Date(o.created_at).toLocaleDateString();
      map.set(d, (map.get(d) || 0) + o.price_cents / 100);
    });
    return Array.from(map.entries()).map(([day, revenue]) => ({ day, revenue }));
  })();

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container pt-32 pb-20">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-primary mb-2">/ Command Center</p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-8">Straxon Labs Admin</h1>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Stat icon={DollarSign} label="Revenue" value={formatPrice(totalRevenue)} />
          <Stat icon={Package} label="Pending" value={String(pending)} />
          <Stat icon={Loader2} label="Processing" value={String(processing)} />
          <Stat icon={Users} label="Leads" value={String(leads.length)} />
          <Stat icon={LifeBuoy} label="Open tickets" value={String(openTickets)} />
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="glass">
            <TabsTrigger value="orders">Order Queue</TabsTrigger>
            <TabsTrigger value="tickets">
              Support {openTickets > 0 && <span className="ml-1.5 text-xs text-primary">({openTickets})</span>}
            </TabsTrigger>
            <TabsTrigger value="leads">CRM / Leads</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="compute">Compute & Cost</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6 space-y-3">
            {orders.length === 0 ? <Card className="glass p-8 text-center text-muted-foreground">No orders yet.</Card> :
              orders.map((o) => (
                <Card key={o.id} className="glass p-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{o.service_name}</h3>
                        <Badge variant="outline">{o.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        #{o.id.slice(0, 8)} · {formatPrice(o.price_cents)} · {new Date(o.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild><Button variant="outline" size="sm">Open</Button></DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-muted">
                          <DialogTitle className="sr-only">Order Preview</DialogTitle>
                          <DialogDescription className="sr-only">Preview order details</DialogDescription>
                          <ProposalPreview order={o} />
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" size="sm" onClick={() => regenerate(o.id)} title="Re-run generation">
                        ↻
                      </Button>
                      <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as OrderStatus)}>
                        <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {o.error_message && (
                    <p className="text-xs text-destructive mt-2">⚠ {o.error_message}</p>
                  )}
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="tickets" className="mt-6 space-y-3">
            {tickets.length === 0 ? (
              <Card className="glass p-8 text-center text-muted-foreground">No tickets yet.</Card>
            ) : (
              tickets.map((t) => <TicketRow key={t.id} ticket={t} />)
            )}
          </TabsContent>

          <TabsContent value="leads" className="mt-6 space-y-3">
            {leads.length === 0 ? <Card className="glass p-8 text-center text-muted-foreground">No leads yet.</Card> :
              leads.map((l) => (
                <Card key={l.id} className="glass p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-medium">{l.name || l.email}</p>
                    <p className="text-xs text-muted-foreground font-mono">{l.email} · {new Date(l.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Score {l.score}</Badge>
                    <Badge>{l.status}</Badge>
                  </div>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card className="glass p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Revenue by day</h3>
              </div>
              {revByDay.length === 0 ? (
                <p className="text-muted-foreground text-sm">No completed orders yet.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revByDay}>
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="compute" className="mt-6">
            <ComputeTab orders={orders} />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

const TicketRow = ({ ticket }: { ticket: SupportTicket }) => {
  type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
  const [response, setResponse] = useState(ticket.admin_response ?? "");
  const [status, setStatus] = useState<TicketStatus>(ticket.status as TicketStatus);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("support_tickets")
      .update({ admin_response: response || null, status })
      .eq("id", ticket.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Ticket updated");
  };

  return (
    <Card className="glass p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
        <div className="flex-1 min-w-[240px]">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{ticket.subject}</h3>
            <Badge variant="outline">{ticket.priority}</Badge>
            <Badge variant="outline">{ticket.category}</Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {ticket.contact_name ?? "—"} · {ticket.contact_email} · {new Date(ticket.created_at).toLocaleString()}
          </p>
          {ticket.order_id && (
            <p className="text-xs text-primary font-mono mt-1">↳ Order #{ticket.order_id.slice(0, 8)}</p>
          )}
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as TicketStatus)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-3 p-3 rounded-lg bg-muted/30 border border-border/40">
        {ticket.message}
      </p>
      <div className="mt-3">
        <Textarea
          rows={3}
          placeholder="Type your reply to the client…"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
        />
        <div className="mt-2 flex justify-end">
          <Button onClick={save} disabled={saving} size="sm" className="bg-gradient-primary text-primary-foreground border-0">
            {saving ? "Saving…" : "Save reply"}
          </Button>
        </div>
      </div>
    </Card>
  );
};

const Stat = ({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) => (
  <Card className="glass p-5">
    <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-mono mb-2">
      <Icon className="h-3.5 w-3.5" /> {label}
    </div>
    <p className="text-2xl font-bold text-gradient">{value}</p>
  </Card>
);

const ComputeTab = ({ orders }: { orders: Order[] }) => {
  const completed = orders.filter((o) => o.status === "completed");
  const totalGenerated = completed.length;
  const totalRevisions = orders.reduce((s, o) => s + (o.revisions_count ?? 0), 0);
  const avgRevisions = totalGenerated > 0 ? (totalRevisions / totalGenerated).toFixed(2) : "0.00";

  // top workspaces
  const wsCounts = new Map<string, number>();
  orders.forEach((o) => {
    if (o.workspace_id) wsCounts.set(o.workspace_id, (wsCounts.get(o.workspace_id) || 0) + 1);
  });
  const topWorkspaces = Array.from(wsCounts.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([id, count]) => ({ workspace: id.slice(0, 8), orders: count }));

  // by service type
  const typeCounts = new Map<string, number>();
  completed.forEach((o) => typeCounts.set(o.service_type, (typeCounts.get(o.service_type) || 0) + 1));
  const byType = Array.from(typeCounts.entries()).map(([type, count]) => ({ type, count }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={Package} label="Generated" value={String(totalGenerated)} />
        <Stat icon={Loader2} label="Revisions" value={String(totalRevisions)} />
        <Stat icon={TrendingUp} label="Avg revisions/order" value={avgRevisions} />
        <Stat icon={Users} label="Active workspaces" value={String(wsCounts.size)} />
      </div>

      <Card className="glass p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Top workspaces by order volume</h3>
        {topWorkspaces.length === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topWorkspaces}>
                <XAxis dataKey="workspace" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="glass p-6">
        <h3 className="font-semibold mb-4">Deliverables by service type</h3>
        {byType.length === 0 ? <p className="text-sm text-muted-foreground">No data yet.</p> : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType}>
                <XAxis dataKey="type" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Admin;
