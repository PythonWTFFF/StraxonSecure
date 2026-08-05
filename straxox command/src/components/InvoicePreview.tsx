import { motion } from "framer-motion";
import { Hexagon, Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvoicePreviewProps {
  data: {
    clientName: string;
    clientEmail: string;
    invoiceNumber: string;
    dueDate: string;
    currency: string;
    paymentLink?: string;
    // FIX: notes was missing from this interface even though it exists in the schema
    // and is now rendered in the form and PDF. Added here so TypeScript no longer
    // flags the prop as unknown when passed from Invoices.tsx.
    notes?: string;
    lineItems: Array<{
      description: string;
      category: string;
      quantity: number;
      rate: number;
    }>;
  };
  calculations: {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
  };
  currencySymbol: string;
  onDownload?: () => void;
  brandLogos?: {
    main: string;
    secure: string;
    dev: string;
    creative: string;
  };
}

export function InvoicePreview({
  data,
  calculations,
  currencySymbol,
  brandLogos,
  onDownload,
}: InvoicePreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-0 overflow-hidden sticky top-20"
    >
      {/* Control Bar */}
      <div className="p-3 border-b border-border flex items-center justify-between bg-muted/10">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
          Live Document Preview
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          className="text-xs border-primary/30 text-primary hover:bg-primary/10 transition-colors"
        >
          <Download className="w-3 h-3 mr-1" /> Export Document
        </Button>
      </div>

      {/* Invoice Document Canvas */}
      <div className="bg-[hsl(222,47%,6%)] p-8 min-h-[600px] text-sm relative z-0">
        {/* Subtle Background Watermark */}
        {brandLogos && (
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none -z-10">
            <img
              src={brandLogos.main}
              alt="watermark"
              className="w-96 h-auto grayscale"
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-12 border-b border-border/50 pb-6">
          <div className="flex items-center gap-4">
            {brandLogos ? (
              <div className="flex items-center">
                <img
                  src={brandLogos.main}
                  alt="Straxon Labs"
                  className="h-12 w-auto object-contain drop-shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                />
                <div className="h-10 w-px bg-border/80 mx-4"></div>
                <div className="flex gap-3 opacity-80">
                  <img
                    src={brandLogos.secure}
                    alt="Secure"
                    className="h-6 w-auto object-contain"
                  />
                  <img
                    src={brandLogos.dev}
                    alt="Dev"
                    className="h-6 w-auto object-contain"
                  />
                  <img
                    src={brandLogos.creative}
                    alt="Creative"
                    className="h-6 w-auto object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-cyan-purple rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Hexagon className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-base font-black text-foreground tracking-widest uppercase italic">
                    STRAXON LABS
                  </p>
                  <p className="text-[10px] text-cyan-500 font-mono">
                    Technology & Security Solutions
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-black tracking-widest text-primary uppercase">
              INVOICE
            </p>
            <p className="text-sm text-muted-foreground font-mono mt-1">
              {data.invoiceNumber || "STX-XXXX"}
            </p>
          </div>
        </div>

        {/* Bill To & Metadata */}
        <div className="grid grid-cols-2 gap-8 mb-10 bg-muted/5 p-4 rounded-lg border border-border/30">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
              Bill To
            </p>
            <p className="text-base font-bold text-foreground">
              {data.clientName || "Client Name"}
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {data.clientEmail || "client@email.com"}
            </p>
          </div>
          <div className="text-right flex flex-col justify-end">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Due Date
            </p>
            <p className="text-sm font-bold text-foreground font-mono">
              {data.dueDate || "YYYY-MM-DD"}
            </p>
            <p className="text-[10px] mt-1 font-mono text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded inline-block self-end">
              Currency: {data.currency}
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-border/60 rounded-lg overflow-hidden mb-8 shadow-sm">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-muted/40 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            <div className="col-span-5">Description</div>
            <div className="col-span-3">Category</div>
            <div className="col-span-1 text-right">Qty</div>
            <div className="col-span-1 text-right">Rate</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>
          <div className="divide-y divide-border/40 bg-muted/10">
            {data.lineItems?.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 px-4 py-3 text-xs hover:bg-muted/20 transition-colors"
              >
                <div className="col-span-5 text-foreground font-medium">
                  {item.description || "—"}
                </div>
                <div className="col-span-3 text-muted-foreground text-[11px]">
                  {item.category}
                </div>
                <div className="col-span-1 text-right font-mono text-muted-foreground">
                  {item.quantity}
                </div>
                <div className="col-span-1 text-right font-mono text-muted-foreground">
                  {currencySymbol}
                  {item.rate}
                </div>
                <div className="col-span-2 text-right font-mono text-foreground font-semibold">
                  {currencySymbol}
                  {((item.quantity || 0) * (item.rate || 0)).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary & Notes Layout */}
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column: Notes & Payment Link */}
          <div className="space-y-6">
            {data.paymentLink && (
              <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Secure Payment Link
                </p>
                <a
                  href={data.paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 break-all underline underline-offset-2"
                >
                  {data.paymentLink}
                </a>
              </div>
            )}

            {/* FIX: notes now correctly rendered in preview (prop interface was missing it) */}
            {data.notes && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                  Additional Notes
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/10 p-3 rounded border border-border/30">
                  {data.notes}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-[280px] space-y-3 text-xs font-mono bg-muted/5 p-5 rounded-lg border border-border/50">
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
                <span>Tax</span>
                <span>
                  {currencySymbol}
                  {calculations.taxAmount.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center text-foreground font-bold text-base pt-4 border-t border-primary/30 mt-2">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Total Due
                </span>
                <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)] text-lg">
                  {currencySymbol}
                  {calculations.total.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-4 border-t border-border/30 text-center">
          <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">
            Generated by Straxon Command Engine // Document ID:{" "}
            {data.invoiceNumber}
          </p>
        </div>
      </div>
    </motion.div>
  );
}