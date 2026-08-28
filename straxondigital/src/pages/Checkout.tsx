import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { findService, formatPrice } from "@/lib/services";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { createCheckoutSession } from "@/lib/stripe";
import { Check, ChevronLeft, ChevronRight, Lock, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Checkout = () => {
  const { slug = "" } = useParams();
  const service = useMemo(() => findService(slug), [slug]);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate(`/auth?redirect=/checkout/${slug}`);
  }, [user, loading, navigate, slug]);

  if (!service) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container pt-32 text-center">
          <h1 className="text-3xl font-bold">Service not found</h1>
          <Button asChild className="mt-6"><Link to="/services">Back to services</Link></Button>
        </div>
      </div>
    );
  }

  const fields = service.intake;
  const fieldsPerStep = 3;
  const totalSteps = Math.ceil(fields.length / fieldsPerStep) + 1; // + review
  const isReview = step === totalSteps - 1;
  const stepFields = isReview ? [] : fields.slice(step * fieldsPerStep, (step + 1) * fieldsPerStep);
  const progress = ((step + 1) / totalSteps) * 100;

  const validateStep = (): boolean => {
    for (const f of stepFields) {
      if (f.required && !data[f.name]?.trim()) {
        toast.error(`${f.label} is required`);
        return false;
      }
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, totalSteps - 1)); };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { data: order, error } = await supabase.from("orders").insert({
        user_id: user.id,
        service_type: service.type,
        service_name: service.name,
        price_cents: service.priceCents,
        intake_data: data,
        status: "pending",
        progress: 0,
      }).select().single();
      if (error) throw error;
      
      const { url } = await createCheckoutSession({
        service,
        orderId: order.id,
        email: user.email || "",
      });

      if (url) {
        window.location.href = url;
      } else {
        toast.success("Order placed. Tracking it now.");
        navigate(`/dashboard?order=${order.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container max-w-3xl pt-32 pb-20">
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-primary mb-2">/ Checkout</p>
          <h1 className="text-3xl sm:text-4xl font-bold">{service.name}</h1>
          <p className="text-muted-foreground mt-1">{service.tagline}</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider mb-2">
            <span>Step {step + 1} of {totalSteps}</span>
            <span className="text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        <Card className="glass-strong p-6 sm:p-8 border-primary/20">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {!isReview ? (
                <div className="space-y-5">
                  {stepFields.map((f) => (
                    <div key={f.name}>
                      <Label htmlFor={f.name}>
                        {f.label} {f.required && <span className="text-primary">*</span>}
                      </Label>
                      {f.kind === "textarea" ? (
                        <Textarea
                          id={f.name}
                          value={data[f.name] || ""}
                          onChange={(e) => setData({ ...data, [f.name]: e.target.value })}
                          placeholder={f.placeholder}
                          rows={4}
                        />
                      ) : f.kind === "select" ? (
                        <Select value={data[f.name] || ""} onValueChange={(v) => setData({ ...data, [f.name]: v })}>
                          <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                          <SelectContent>
                            {f.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={f.name}
                          type={f.kind === "email" ? "email" : f.kind === "url" ? "url" : "text"}
                          value={data[f.name] || ""}
                          onChange={(e) => setData({ ...data, [f.name]: e.target.value })}
                          placeholder={f.placeholder}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> Review & confirm
                  </h2>
                  <dl className="space-y-3 mb-6 text-sm">
                    {fields.map((f) => (
                      <div key={f.name} className="grid grid-cols-3 gap-4 py-2 border-b border-border/40">
                        <dt className="text-muted-foreground">{f.label}</dt>
                        <dd className="col-span-2 break-words">{data[f.name] || <span className="text-muted-foreground italic">—</span>}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="flex items-center justify-between rounded-xl bg-gradient-luxury p-4 border border-primary/20">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Total today</p>
                      <p className="text-3xl font-bold text-gradient">{formatPrice(service.priceCents)}{service.cadence}</p>
                    </div>
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/40">
            <Button variant="ghost" onClick={back} disabled={step === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {!isReview ? (
              <Button onClick={next} className="bg-gradient-primary text-primary-foreground border-0">
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={submitting} className="bg-gradient-primary text-primary-foreground border-0 shadow-glow">
                {submitting ? "Placing…" : <>Place order <Check className="h-4 w-4 ml-1" /></>}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Checkout;
