import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { motion } from "framer-motion";
import { CheckCircle2, LifeBuoy, Mail, MessageCircle, ShieldCheck, Zap } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const schema = z.object({
  contact_name: z.string().trim().min(1, "Name is required").max(100),
  contact_email: z.string().trim().email("Enter a valid email").max(255),
  subject: z.string().trim().min(3, "Subject is too short").max(150),
  category: z.enum(["order_issue", "billing", "technical", "general", "feedback"]),
  message: z.string().trim().min(10, "Tell us a bit more").max(2000),
  order_id: z.string().trim().max(100).optional(),
});

const categoryLabels: Record<string, string> = {
  order_issue: "Order issue / didn't get my deliverable",
  billing: "Billing or invoice",
  technical: "Technical / login problem",
  general: "General question",
  feedback: "Product feedback",
};

const Contact = () => {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const presetOrderId = params.get("order") ?? "";
  const presetCategory = (params.get("category") as keyof typeof categoryLabels) || "general";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<string>(presetCategory);
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState(presetOrderId);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail((prev) => prev || user.email || "");
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.full_name) setName((prev) => prev || data.full_name);
      });
  }, [user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      contact_name: name,
      contact_email: email,
      subject,
      category,
      message,
      order_id: orderId || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user?.id ?? null,
        order_id: parsed.data.order_id || null,
        contact_name: parsed.data.contact_name,
        contact_email: parsed.data.contact_email,
        subject: parsed.data.subject,
        category: parsed.data.category,
        message: parsed.data.message,
        priority: parsed.data.category === "order_issue" ? "high" : "normal",
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Message sent. The Straxon Labs team will reply shortly.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="container pt-32 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-xs uppercase tracking-[0.3em] font-mono text-primary mb-3">/ Contact Straxon Labs</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4">
            Didn't get your job done? <span className="text-gradient">We fix it.</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Every Straxon Labs order is backed by a real human team. Tell us what's wrong and we'll
            resolve it — or refund it. No hoops, no scripts.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-4 mt-10">
          {[
            { icon: Zap, title: "<24h response", body: "Tickets are triaged within one business day." },
            { icon: ShieldCheck, title: "Money-back guarantee", body: "If we can't fix it, you don't pay." },
            { icon: LifeBuoy, title: "Real humans", body: "No bots. Senior operators read every ticket." },
          ].map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
            >
              <Card className="glass p-5 h-full hover:border-primary/40 transition-colors">
                <c.icon className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-semibold mb-1">{c.title}</h3>
                <p className="text-sm text-muted-foreground">{c.body}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container pb-20 grid lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="glass-strong p-6 sm:p-8 border-primary/20">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center"
              >
                <CheckCircle2 className="h-14 w-14 mx-auto text-primary mb-4 animate-pulse-glow rounded-full" />
                <h2 className="text-2xl font-bold mb-2">Ticket received</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  A senior operator at Straxon Labs will reach out at <span className="text-foreground font-mono">{email}</span> within 24 hours.
                </p>
                <Button
                  className="mt-6 bg-gradient-primary text-primary-foreground border-0"
                  onClick={() => {
                    setSubmitted(false);
                    setSubject("");
                    setMessage("");
                    setOrderId("");
                  }}
                >
                  Submit another
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Your name *</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">What's this about? *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="order_id">Order ID (optional)</Label>
                    <Input
                      id="order_id"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="e.g. 8a0f2837…"
                      maxLength={100}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={150} placeholder="Briefly: what happened?" />
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    maxLength={2000}
                    placeholder="Walk us through it. Include order IDs, screenshots links, and what you expected vs. got."
                  />
                  <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                    {message.length}/2000
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  size="lg"
                  className="w-full bg-gradient-primary text-primary-foreground border-0 shadow-glow hover:opacity-90"
                >
                  {submitting ? "Sending…" : "Send to Straxon Labs"}
                </Button>
              </form>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <Card className="glass p-6">
            <Mail className="h-5 w-5 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Email</h3>
            <a href="mailto:support@straxonlabs.com" className="text-sm text-primary story-link">
              support@straxonlabs.com
            </a>
          </Card>
          <Card className="glass p-6">
            <MessageCircle className="h-5 w-5 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Existing order?</h3>
            <p className="text-sm text-muted-foreground">
              Open it from your dashboard and click <em>Need help?</em> — your ticket auto-links to the order.
            </p>
          </Card>
          <Card className="glass p-6">
            <ShieldCheck className="h-5 w-5 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Our promise</h3>
            <p className="text-sm text-muted-foreground">
              If we can't deliver what you ordered to your satisfaction, we refund 100%. No questions asked.
            </p>
          </Card>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
