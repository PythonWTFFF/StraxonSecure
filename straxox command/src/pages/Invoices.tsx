"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Plus, Trash2, Download, Eye, Copy, Save, Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvoicePreview } from "@/components/InvoicePreview";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { generateInvoicePDF, type InvoiceData } from "@/lib/generateInvoicePDF";
import { addSavedInvoice, getSavedInvoices, cloneInvoice } from "@/lib/mockApi";
import { debugLog } from "@/components/DebugConsole";
import { useWorkspace } from "@/lib/workspaces";
import { toast } from "sonner";

// --- IMPORT YOUR LOCAL ASSETS ---
import straxonLogo from "@/assets/straxonlogo.png";
import secureIcon from "@/assets/secure.svg";
import devIcon from "@/assets/dev.svg";
import creativeIcon from "@/assets/creative.svg";

const categories = ["Web Development", "Cybersecurity", "EdTech Consulting", "Domain Hosting", "Design"];
const currencies = [
  { code: "INR", symbol: "₹" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
];

const lineItemSchema = z.object({
  description: z.string().min(1, "Required"),
  category: z.string().min(1, "Required"),
  quantity: z.coerce.number().min(1, "Min 1"),
  rate: z.coerce.number().min(0, "Min 0"),
});

const invoiceSchema = z.object({
  clientName: z.string().min(1, "Client name required"),
  clientEmail: z.string().email("Valid email required"),
  invoiceNumber: z.string().min(1, "Invoice # required"),
  dueDate: z.string().min(1, "Due date required"),
  currency: z.string().default("INR"),
  taxRate: z.coerce.number().min(0).max(100).default(18),
  discountType: z.enum(["percentage", "flat"]).default("percentage"),
  discountValue: z.coerce.number().min(0).default(0),
  paymentLink: z.string().optional(),
  // FIX 1: notes was in schema but never rendered in the form UI
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, "Add at least one item"),
});

type InvoiceForm = z.infer<typeof invoiceSchema>;

export default function Invoices() {
  const [showPreview, setShowPreview] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [savedInvoices, setSavedInvoices] = useState(getSavedInvoices());
  const { workspace } = useWorkspace();
  const lastSaveRef = useRef<string>("");

  const form = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema) as any,
    mode: "onChange",
    defaultValues: {
      clientName: "",
      clientEmail: "",
      invoiceNumber: workspace.invoicePrefix + "-" + String(Date.now()).slice(-4),
      dueDate: "",
      currency: workspace.defaultCurrency,
      taxRate: workspace.defaultTaxRate,
      discountType: "percentage",
      discountValue: 0,
      paymentLink: "",
      notes: "",
      lineItems: [{ description: "", category: "Web Development", quantity: 1, rate: 0 }],
    },
  });

  // FIX 2: Use workspace.id in deps array to prevent stale closure on workspace change
  useEffect(() => {
    form.setValue("currency", workspace.defaultCurrency);
    form.setValue("taxRate", workspace.defaultTaxRate);
    form.setValue(
      "invoiceNumber",
      workspace.invoicePrefix + "-" + String(Date.now()).slice(-4)
    );
    debugLog(
      "state",
      `Workspace switched → ${workspace.name} (tax: ${workspace.defaultTaxRate}%, currency: ${workspace.defaultCurrency})`
    );
  }, [workspace.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lineItems" });
  const watchedValues = form.watch();
  const errors = form.formState.errors;

  // Auto-save to localStorage every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const data = JSON.stringify(watchedValues);
      if (data !== lastSaveRef.current) {
        localStorage.setItem("straxon_invoice_draft", data);
        lastSaveRef.current = data;
        window.dispatchEvent(new Event("straxon:sync"));
        debugLog("state", "Auto-saved invoice draft to localStorage");
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [watchedValues]);

  // Restore draft on mount
  useEffect(() => {
    const saved = localStorage.getItem("straxon_invoice_draft");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        Object.entries(data).forEach(([key, value]) => {
          form.setValue(key as any, value as any);
        });
        debugLog("info", "Restored draft from localStorage");
      } catch {
        // ignore corrupt data
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Log form state changes to debug console
  useEffect(() => {
    const sub = form.watch((_, { name }) => {
      if (name) {
        debugLog("state", `Form field changed: ${name}`);
      }
    });
    return () => sub.unsubscribe();
  }, [form]); // FIX 3: depend on form, not form.watch

  const calculations = useMemo(() => {
    const items = watchedValues.lineItems || [];
    const subtotal = items.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.rate || 0),
      0
    );
    const discountAmount =
      watchedValues.discountType === "percentage"
        ? subtotal * ((watchedValues.discountValue || 0) / 100)
        : watchedValues.discountValue || 0;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * ((watchedValues.taxRate || 0) / 100);
    const total = afterDiscount + taxAmount;
    return { subtotal, discountAmount, taxAmount, total };
  }, [watchedValues]);

  const currencySymbol =
    currencies.find((c) => c.code === watchedValues.currency)?.symbol || "₹";

  // FIX 4: Memoize brandLogos so it doesn't cause stale closures in handleDownloadPDF
  const brandLogos = useMemo(
    () => ({
      main:
        typeof straxonLogo === "string"
          ? straxonLogo
          : (straxonLogo as any).src,
      secure:
        typeof secureIcon === "string"
          ? secureIcon
          : (secureIcon as any).src,
      dev:
        typeof devIcon === "string" ? devIcon : (devIcon as any).src,
      creative:
        typeof creativeIcon === "string"
          ? creativeIcon
          : (creativeIcon as any).src,
    }),
    [] // asset imports are module-level constants — stable reference is fine
  );

  // FIX 5: brandLogos added to useCallback deps (was missing, causing stale closure)
  const handleDownloadPDF = useCallback(async () => {
    setIsExporting(true);
    const toastId = toast.loading("Generating Secure PDF...");

    const invoiceData: InvoiceData = {
      ...watchedValues,
      currencySymbol,
      discountType: watchedValues.discountType as "percentage" | "flat",
    };

    try {
      const doc = await generateInvoicePDF(invoiceData, calculations, brandLogos);
      doc.save(`${watchedValues.invoiceNumber || "invoice"}.pdf`);
      toast.success(`${watchedValues.invoiceNumber}.pdf downloaded`, {
        id: toastId,
      });
      debugLog("info", `PDF generated: ${watchedValues.invoiceNumber}`);
    } catch (e) {
      toast.error("Failed to generate PDF", { id: toastId });
      debugLog("error", `PDF generation failed: ${e}`);
    } finally {
      setIsExporting(false);
    }
  }, [watchedValues, calculations, currencySymbol, brandLogos]); // FIX 5 applied here

  const handleSaveInvoice = useCallback(() => {
    const result = invoiceSchema.safeParse(watchedValues);
    if (!result.success) {
      const firstError = result.error.issues[0];
      toast.error(`Validation failed: ${firstError.message}`, {
        description: `Field: ${firstError.path.join(".")}`,
      });
      debugLog(
        "warn",
        `Validation failed: ${firstError.path.join(".")} — ${firstError.message}`
      );
      return;
    }
    const saved = addSavedInvoice(watchedValues);
    setSavedInvoices(getSavedInvoices());
    toast.success(`Invoice ${saved.invoiceNumber} saved`);
    debugLog("info", `Invoice saved: ${saved.invoiceNumber}`);
  }, [watchedValues]);

  const handleClone = useCallback((id: string) => {
    const cloned = cloneInvoice(id);
    if (cloned) {
      setSavedInvoices(getSavedInvoices());
      toast.success(`Cloned → ${cloned.invoiceNumber}`);
    }
  }, []);

  const fieldError = (name: string): string | undefined => {
    const parts = name.split(".");
    let err: any = errors;
    for (const p of parts) {
      err = err?.[p];
    }
    return err?.message as string | undefined;
  };

  const errorClass = (name: string) =>
    fieldError(name)
      ? "border-destructive shadow-[0_0_8px_hsl(0_84%_60%/0.3)]"
      : "";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* BRANDING HEADER WITH 4 LOGOS */}
      <div className="bg-background border border-border rounded-xl p-4 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-muted/20 p-3 rounded-lg border border-border/50">
            <img
              src={brandLogos.main}
              alt="Straxon Main"
              className="h-8 w-auto object-contain"
            />
            <img
              src={brandLogos.secure}
              alt="Secure"
              className="h-6 w-auto object-contain opacity-80"
            />
            <img
              src={brandLogos.dev}
              alt="Dev"
              className="h-6 w-auto object-contain opacity-80"
            />
            <img
              src={brandLogos.creative}
              alt="Creative"
              className="h-6 w-auto object-contain opacity-80"
            />

            <div className="flex items-center gap-2 ml-2 border-l border-border pl-4">
              <Activity className="w-5 h-5 text-primary" />
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-widest text-foreground uppercase">
                  Invoice Engine
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {workspace.name} Workspace
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveInvoice}
            className="text-xs font-mono border-success/30 text-success hover:bg-success/10 whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Save Draft
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="text-xs font-mono border-primary/30 text-primary hover:bg-primary/10 whitespace-nowrap"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 mr-1.5" />
            )}
            {isExporting ? "Rendering..." : "Export PDF"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs font-mono border-border text-muted-foreground hover:text-foreground whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            {showPreview ? "Hide" : "Show"} Preview
          </Button>
        </div>
      </div>

      <div
        className={`grid gap-6 ${
          showPreview ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 max-w-3xl"
        }`}
      >
        {/* Form */}
        <ErrorBoundary fallbackTitle="Invoice Form">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-6 space-y-6"
          >
            {/* Client Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Client Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                    Client Name
                  </label>
                  <Input
                    {...form.register("clientName")}
                    placeholder="Acme Corp"
                    className={`bg-muted/30 border-border text-sm ${errorClass("clientName")}`}
                  />
                  {fieldError("clientName") && (
                    <p className="text-[10px] text-destructive mt-0.5 font-mono">
                      {fieldError("clientName")}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                    Email
                  </label>
                  <Input
                    {...form.register("clientEmail")}
                    placeholder="billing@acme.com"
                    className={`bg-muted/30 border-border text-sm ${errorClass("clientEmail")}`}
                  />
                  {fieldError("clientEmail") && (
                    <p className="text-[10px] text-destructive mt-0.5 font-mono">
                      {fieldError("clientEmail")}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                    Invoice #
                  </label>
                  <Input
                    {...form.register("invoiceNumber")}
                    className={`bg-muted/30 border-border text-sm font-mono ${errorClass("invoiceNumber")}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                    Due Date
                  </label>
                  <Input
                    type="date"
                    {...form.register("dueDate")}
                    className={`bg-muted/30 border-border text-sm ${errorClass("dueDate")}`}
                  />
                  {fieldError("dueDate") && (
                    <p className="text-[10px] text-destructive mt-0.5 font-mono">
                      {fieldError("dueDate")}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                    Currency
                  </label>
                  <Select
                    value={watchedValues.currency}
                    onValueChange={(v) => form.setValue("currency", v)}
                  >
                    <SelectTrigger className="bg-muted/30 border-border text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.symbol} {c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Line Items
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      description: "",
                      category: "Web Development",
                      quantity: 1,
                      rate: 0,
                    })
                  }
                  className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Item
                </Button>
              </div>
              {fields.map((field, index) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-12 gap-2 items-end"
                >
                  <div className="col-span-4">
                    {index === 0 && (
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                        Description
                      </label>
                    )}
                    <Input
                      {...form.register(`lineItems.${index}.description`)}
                      placeholder="Service..."
                      className={`bg-muted/30 border-border text-sm ${errorClass(
                        `lineItems.${index}.description`
                      )}`}
                    />
                  </div>
                  <div className="col-span-3">
                    {index === 0 && (
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                        Category
                      </label>
                    )}
                    <Select
                      value={watchedValues.lineItems?.[index]?.category}
                      onValueChange={(v) =>
                        form.setValue(`lineItems.${index}.category`, v)
                      }
                    >
                      <SelectTrigger className="bg-muted/30 border-border text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    {index === 0 && (
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                        Qty
                      </label>
                    )}
                    <Input
                      type="number"
                      {...form.register(`lineItems.${index}.quantity`)}
                      className={`bg-muted/30 border-border text-sm ${errorClass(
                        `lineItems.${index}.quantity`
                      )}`}
                    />
                  </div>
                  <div className="col-span-2">
                    {index === 0 && (
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                        Rate
                      </label>
                    )}
                    <Input
                      type="number"
                      {...form.register(`lineItems.${index}.rate`)}
                      className={`bg-muted/30 border-border text-sm ${errorClass(
                        `lineItems.${index}.rate`
                      )}`}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fields.length > 1 && remove(index)}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Tax & Discount */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tax & Discount
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                    Tax Rate (%)
                  </label>
                  <Input
                    type="number"
                    {...form.register("taxRate")}
                    className="bg-muted/30 border-border text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                    Discount Type
                  </label>
                  <Select
                    value={watchedValues.discountType}
                    onValueChange={(v: "percentage" | "flat") =>
                      form.setValue("discountType", v)
                    }
                  >
                    <SelectTrigger className="bg-muted/30 border-border text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="flat">Flat Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                    Discount Value
                  </label>
                  <Input
                    type="number"
                    {...form.register("discountValue")}
                    className="bg-muted/30 border-border text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Payment Link */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                Payment Link (Stripe / Razorpay)
              </label>
              <Input
                {...form.register("paymentLink")}
                placeholder="https://pay.stripe.com/..."
                className="bg-muted/30 border-border text-sm font-mono"
              />
            </div>

            {/* FIX 1: Notes field was in schema but never rendered — now added */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                Additional Notes
              </label>
              <Textarea
                {...form.register("notes")}
                placeholder="Payment terms, thank-you note, bank details..."
                rows={3}
                className="bg-muted/30 border-border text-sm resize-none"
              />
            </div>

            {/* Summary */}
            <div className="border-t border-border pt-4 space-y-2 font-mono text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>
                  {currencySymbol}
                  {calculations.subtotal.toLocaleString()}
                </span>
              </div>
              {calculations.discountAmount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>
                    -{currencySymbol}
                    {calculations.discountAmount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Tax ({watchedValues.taxRate}%)</span>
                <span>
                  {currencySymbol}
                  {calculations.taxAmount.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-foreground font-bold text-base pt-2 border-t border-border">
                <span>Total</span>
                <span className="glow-text-cyan">
                  {currencySymbol}
                  {calculations.total.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </motion.div>
        </ErrorBoundary>

        {/* Preview */}
        {showPreview && (
          <ErrorBoundary fallbackTitle="Invoice Preview">
            <InvoicePreview
              data={watchedValues}
              calculations={calculations}
              currencySymbol={currencySymbol}
              brandLogos={brandLogos}
              onDownload={handleDownloadPDF}
            />
          </ErrorBoundary>
        )}
      </div>

      {/* Saved Invoices Table */}
      {savedInvoices.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card overflow-hidden"
        >
          <div className="p-4 border-b border-border/50">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Saved Invoices
            </h3>
          </div>
          <div className="divide-y divide-border/30">
            {savedInvoices.map((inv: any) => (
              <div
                key={inv.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-muted/10 transition-colors"
              >
                <span className="text-xs font-mono text-primary font-semibold w-28">
                  {inv.invoiceNumber}
                </span>
                <span className="text-xs text-foreground flex-1">
                  {inv.clientName}
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {inv.createdAt?.split("T")[0]}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                  {inv.status}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleClone(inv.id)}
                  className="text-muted-foreground hover:text-primary p-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}