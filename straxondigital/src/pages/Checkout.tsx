import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  findService,
  findBundle,
  formatPrice,
  calculateCustomPrice,
  applyDiscount,
  PackageTier,
  PACKAGE_TIERS,
  GLOBAL_ADDONS,
  ORDER_BUMPS,
  PromoCode,
  IntakeField,
} from "@/lib/services";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { createCheckoutSession } from "@/lib/stripe";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  Sparkles,
  Sliders,
  ShieldCheck,
  Tag,
  Zap,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { IndianGlobalPaymentModal } from "@/components/IndianGlobalPaymentModal";

const DEFAULT_BUNDLE_INTAKE: IntakeField[] = [
  { name: "company_name", label: "Company or Brand Name", kind: "text", required: true, placeholder: "Acme Technologies" },
  { name: "industry", label: "Industry & Target Market", kind: "text", required: true, placeholder: "B2B SaaS / FinTech" },
  { name: "primary_goal", label: "Primary Objective", kind: "textarea", required: true, placeholder: "Describe what you need built and any specific guidelines..." },
  { name: "reference_links", label: "Reference Links / Current Website", kind: "textarea", placeholder: "https://example.com, competitor links..." },
  { name: "brand_voice", label: "Brand Tone & Style Preference", kind: "text", placeholder: "Authoritative, sleek, cyber-modern" },
];

const Checkout = () => {
  const { slug = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const service = useMemo(() => findService(slug), [slug]);
  const bundle = useMemo(() => findBundle(slug), [slug]);
  const isBundle = Boolean(bundle && !service);

  const initialTier = (searchParams.get("tier") as PackageTier) || "starter";
  const initialAddons = (searchParams.get("addons")?.split(",").filter(Boolean)) || [];

  const [tier, setTier] = useState<PackageTier>(
    ["starter", "pro", "enterprise"].includes(initialTier) ? initialTier : "starter"
  );
  const [selectedAddons, setSelectedAddons] = useState<string[]>(initialAddons);
  const [selectedBumps, setSelectedBumps] = useState<string[]>([]);
  const [promoInput, setPromoInput] = useState(searchParams.get("coupon") || "");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate(`/auth?redirect=/checkout/${slug}`);
  }, [user, loading, navigate, slug]);

  // If promo param passed in URL, auto-apply
  useEffect(() => {
    if (promoInput.trim()) {
      const res = applyDiscount(10000, promoInput);
      if (res.promo) {
        setAppliedPromo(res.promo);
      }
    }
  }, []);

  const availableAddons = service?.customAddons || GLOBAL_ADDONS;

  const basePriceCents = isBundle ? bundle!.bundlePriceCents : (service?.priceCents || 0);

  const pricing = useMemo(() => {
    if (isBundle) {
      return { totalCents: basePriceCents, tierCents: basePriceCents, addonsCents: 0 };
    }
    if (!service) return { totalCents: 0, tierCents: 0, addonsCents: 0 };
    return calculateCustomPrice(service.priceCents, tier, selectedAddons, availableAddons);
  }, [isBundle, basePriceCents, service, tier, selectedAddons, availableAddons]);

  // Order bumps total
  const bumpsCents = useMemo(() => {
    return selectedBumps.reduce((sum, bumpId) => {
      const bump = ORDER_BUMPS.find((b) => b.id === bumpId);
      return sum + (bump ? bump.priceCents : 0);
    }, 0);
  }, [selectedBumps]);

  // Subtotal before coupon
  const subtotalCents = pricing.totalCents + bumpsCents;

  // Final price after coupon
  const discountResult = useMemo(() => {
    return applyDiscount(subtotalCents, appliedPromo?.code);
  }, [subtotalCents, appliedPromo]);

  if (!service && !bundle) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container pt-32 text-center">
          <h1 className="text-3xl font-bold">Offer not found</h1>
          <p className="text-muted-foreground mt-2">The requested service or bundle could not be located.</p>
          <Button asChild className="mt-6"><Link to="/services">Back to services</Link></Button>
        </div>
      </div>
    );
  }

  const fields: IntakeField[] = isBundle ? DEFAULT_BUNDLE_INTAKE : service!.intake;
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

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const toggleBump = (bumpId: string) => {
    setSelectedBumps((prev) =>
      prev.includes(bumpId) ? prev.filter((id) => id !== bumpId) : [...prev, bumpId]
    );
  };

  const handleApplyCoupon = () => {
    if (!promoInput.trim()) return;
    const res = applyDiscount(10000, promoInput);
    if (res.promo) {
      setAppliedPromo(res.promo);
      toast.success(`Coupon applied: ${res.promo.description}!`);
    } else {
      toast.error("Invalid discount code. Try LAUNCH25 for 25% off.");
    }
  };

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { data: ws } = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      const intakePayload = {
        ...data,
        _customization: {
          isBundle,
          bundleSlug: bundle?.slug,
          tier: isBundle ? "bundle" : tier,
          tierName: isBundle ? "Empire Bundle" : PACKAGE_TIERS[tier].name,
          selectedAddonIds: selectedAddons,
          selectedBumpIds: selectedBumps,
          appliedCoupon: appliedPromo?.code,
          discountCents: discountResult.discountCents,
          finalPriceCents: discountResult.finalCents,
        },
      };

      const displayName = isBundle
        ? bundle!.name
        : `${service!.name} (${PACKAGE_TIERS[tier].name})`;

      const { data: order, error } = await supabase.from("orders").insert({
        user_id: user.id,
        workspace_id: ws?.id || null,
        service_type: isBundle ? "website" : service!.type,
        service_name: displayName,
        price_cents: discountResult.finalCents,
        intake_data: intakePayload,
        status: "pending",
        progress: 0,
      }).select().single();

      if (error) throw error;
      setCreatedOrderId(order.id);
      setShowPaymentModal(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!createdOrderId) return;
    try {
      await supabase
        .from("orders")
        .update({ status: "processing", progress: 15 })
        .eq("id", createdOrderId);

      toast.success("Order placed successfully! Redirecting to tracking center.");
      navigate(`/dashboard?order=${createdOrderId}`);
    } catch (err) {
      toast.error("Failed to update order status.");
    }
  };

  const currentTitle = isBundle ? bundle!.name : service!.name;
  const currentTagline = isBundle ? bundle!.tagline : service!.tagline;
  const currentCadence = isBundle ? bundle!.cadence : service!.cadence;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container max-w-3xl pt-32 pb-20">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono uppercase tracking-[0.3em] text-primary">
              {isBundle ? "/ Turnkey Bundle" : "/ Order Customizer"}
            </span>
            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
              {isBundle ? "Multi-Service Suite" : service!.category}
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">{currentTitle}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{currentTagline}</p>
        </div>

        {/* Tier Bar for services (or Bundle Info Banner) */}
        {!isBundle ? (
          <div className="glass rounded-xl p-4 mb-8 flex flex-wrap items-center justify-between gap-4 border-border/50">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium">Selected Tier:</span>
              <div className="flex gap-1.5">
                {(["starter", "pro", "enterprise"] as PackageTier[]).map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant={tier === t ? "default" : "outline"}
                    onClick={() => setTier(t)}
                    className={`h-7 text-xs ${
                      tier === t ? "bg-gradient-primary text-primary-foreground border-0" : "border-border/60"
                    }`}
                  >
                    {PACKAGE_TIERS[t].name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block font-mono">Current Total</span>
              <span className="text-xl font-bold text-gradient">{formatPrice(discountResult.finalCents)}</span>
            </div>
          </div>
        ) : (
          <div className="glass rounded-xl p-4 mb-8 flex items-center justify-between gap-4 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2.5">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <span className="text-xs font-semibold text-foreground">Complete Bundle Package</span>
                <span className="text-[11px] text-muted-foreground block">
                  Includes {bundle!.includedServiceSlugs.length} comprehensive services
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-green-400 block uppercase tracking-wider">{bundle!.badge}</span>
              <span className="text-xl font-bold text-gradient">{formatPrice(discountResult.finalCents)}</span>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider mb-2">
            <span>Step {step + 1} of {totalSteps}: {isReview ? "Review & Order Bumps" : "Project Intake"}</span>
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
                      <Label htmlFor={f.name} className="text-sm font-medium mb-1.5 block">
                        {f.label} {f.required && <span className="text-primary">*</span>}
                      </Label>
                      {f.kind === "textarea" ? (
                        <Textarea
                          id={f.name}
                          value={data[f.name] || ""}
                          onChange={(e) => setData({ ...data, [f.name]: e.target.value })}
                          placeholder={f.placeholder}
                          rows={4}
                          className="glass text-xs"
                        />
                      ) : f.kind === "select" ? (
                        <Select value={data[f.name] || ""} onValueChange={(v) => setData({ ...data, [f.name]: v })}>
                          <SelectTrigger className="glass text-xs"><SelectValue placeholder="Select an option…" /></SelectTrigger>
                          <SelectContent>
                            {f.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={f.name}
                          name={f.name}
                          type={f.kind === "email" ? "email" : f.kind === "url" ? "url" : "text"}
                          value={data[f.name] || ""}
                          onChange={(e) => setData({ ...data, [f.name]: e.target.value })}
                          placeholder={f.placeholder}
                          className="glass text-xs"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" /> Review & Maximize Your Order
                    </h2>
                    <p className="text-xs text-muted-foreground">Verify details, claim instant order bumps, and apply promo discounts.</p>
                  </div>

                  {/* High-Converting Order Bumps Section */}
                  <div className="rounded-xl p-4 bg-gradient-luxury border border-primary/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-mono uppercase tracking-wider text-primary flex items-center gap-1.5 font-semibold">
                        <Zap className="h-3.5 w-3.5 fill-primary" /> Exclusive 1-Click Order Bumps
                      </h3>
                      <span className="text-[10px] text-muted-foreground">Optional add-on specials</span>
                    </div>

                    <div className="space-y-2.5">
                      {ORDER_BUMPS.map((bump) => {
                        const isChecked = selectedBumps.includes(bump.id);
                        return (
                          <div
                            key={bump.id}
                            onClick={() => toggleBump(bump.id)}
                            className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                              isChecked
                                ? "bg-primary/10 border-primary ring-1 ring-primary/30"
                                : "bg-muted/20 border-border/40 hover:border-primary/30"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => toggleBump(bump.id)}
                                  className="mt-0.5"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground">{bump.title}</span>
                                    <Badge variant="outline" className="text-[9px] bg-green-500/20 text-green-400 border-green-500/30">
                                      {bump.badge}
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">{bump.description}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[10px] text-muted-foreground line-through block">
                                  {formatPrice(bump.originalPriceCents)}
                                </span>
                                <span className="font-mono text-sm font-bold text-primary">
                                  +{formatPrice(bump.priceCents)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Promo Code Input Box */}
                  <div className="rounded-xl p-4 bg-muted/20 border border-border/40 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <Tag className="h-4 w-4 text-primary shrink-0" />
                      <Input
                        id="promoCode"
                        name="promoCode"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        placeholder="Discount Code (e.g. LAUNCH25)"
                        className="glass font-mono text-xs uppercase h-8"
                      />
                      <Button size="sm" onClick={handleApplyCoupon} variant="outline" className="h-8 text-xs border-primary/30">
                        Apply
                      </Button>
                    </div>
                    {appliedPromo && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-mono text-xs">
                        ✓ {appliedPromo.code} Active (-{appliedPromo.discountType === "percentage" ? `${appliedPromo.discountValue}%` : formatPrice(appliedPromo.discountValue)})
                      </Badge>
                    )}
                  </div>

                  {/* Order Line-Item Receipt */}
                  <div className="rounded-2xl p-5 bg-muted/30 border border-border/50 space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground pb-2 border-b border-border/40 font-mono uppercase tracking-wider text-[10px]">
                      <span>Line Item</span>
                      <span>Amount</span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span>{currentTitle} {!isBundle && `(${PACKAGE_TIERS[tier].name})`}</span>
                      <span className="font-mono">{formatPrice(pricing.tierCents)}</span>
                    </div>

                    {selectedAddons.map((addonId) => {
                      const item = availableAddons.find((a) => a.id === addonId);
                      if (!item) return null;
                      return (
                        <div key={addonId} className="flex justify-between text-muted-foreground">
                          <span>+ {item.name}</span>
                          <span className="font-mono">+{formatPrice(item.priceCents)}</span>
                        </div>
                      );
                    })}

                    {selectedBumps.map((bumpId) => {
                      const bump = ORDER_BUMPS.find((b) => b.id === bumpId);
                      if (!bump) return null;
                      return (
                        <div key={bumpId} className="flex justify-between text-primary">
                          <span>+ {bump.title}</span>
                          <span className="font-mono">+{formatPrice(bump.priceCents)}</span>
                        </div>
                      );
                    })}

                    {discountResult.discountCents > 0 && (
                      <div className="flex justify-between text-green-400 font-semibold pt-1 border-t border-border/30">
                        <span>Promo Discount ({appliedPromo?.code})</span>
                        <span className="font-mono">-{formatPrice(discountResult.discountCents)}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">Net total today</p>
                        <p className="text-3xl font-bold text-gradient">
                          {formatPrice(discountResult.finalCents)}
                          {currentCadence && <span className="text-sm font-normal text-muted-foreground">{currentCadence}</span>}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1 text-[11px] text-muted-foreground font-mono">
                        <div className="flex items-center gap-1 text-green-400">
                          <ShieldCheck className="h-4 w-4" /> 14-Day Money-Back Guarantee
                        </div>
                        <div className="flex items-center gap-1">
                          <Lock className="h-3.5 w-3.5 text-primary" /> Stripe 256-Bit SSL Encrypted
                        </div>
                      </div>
                    </div>
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
              <Button onClick={next} className="bg-gradient-primary text-primary-foreground border-0 shadow-glow">
                Continue to Order Review <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={submit}
                disabled={submitting}
                className="bg-gradient-primary text-primary-foreground border-0 shadow-glow px-6 font-semibold hover:scale-[1.02] active:scale-95 transition-transform"
              >
                {submitting ? "Launching Secure Checkout…" : <>Complete & Place Order ({formatPrice(discountResult.finalCents)}) <Check className="h-4 w-4 ml-1.5" /></>}
              </Button>
            )}
          </div>
        </Card>
      </div>
      <IndianGlobalPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amountCents={discountResult.finalCents}
        serviceName={currentTitle}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default Checkout;
