import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Printer, Download, Building2, CheckCircle2, ShieldCheck, FileText, QrCode } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { toast } from "sonner";

interface GstInvoiceProps {
  isOpen: boolean;
  onClose: () => void;
  orderData?: {
    id: string;
    serviceName: string;
    amountCents: number;
    clientName?: string;
    clientEmail?: string;
    clientGstin?: string;
    date?: string;
  };
}

export const GstInvoiceGenerator: React.FC<GstInvoiceProps> = ({
  isOpen,
  onClose,
  orderData = {
    id: "INV-2026-8492",
    serviceName: "Autonomous RAG Knowledge Engine & Agency License",
    amountCents: 14900,
    clientName: "Apex Growth Labs Pvt Ltd",
    clientEmail: "billing@apexgrowth.io",
    clientGstin: "29AABCS1429B1ZX",
    date: new Date().toLocaleDateString("en-IN")
  }
}) => {
  const { formatPrice, currency } = useCurrency();
  const [clientGstin, setClientGstin] = useState(orderData.clientGstin || "29AABCS1429B1ZX");
  const [clientCompanyName, setClientCompanyName] = useState(orderData.clientName || "Apex Growth Labs Pvt Ltd");

  const isIndia = currency === "INR";
  const baseCents = orderData.amountCents;
  const gstRate = isIndia ? 0.18 : 0;
  const gstCents = Math.round(baseCents * gstRate);
  const cgstCents = Math.round(gstCents / 2);
  const sgstCents = Math.round(gstCents / 2);
  const totalCents = baseCents + gstCents;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    toast.success("GST Tax Invoice Generated!", {
      description: "Ready for your tax filing and input credit claim."
    });
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto glass-strong border-white/20 p-6 sm:p-8">
        <DialogHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary border-primary/30 font-mono text-xs">
                {isIndia ? "Tax Invoice (GST Compliant)" : "Commercial Tax Invoice"}
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">SAC: 998314</span>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <Button size="sm" variant="outline" onClick={handlePrint} className="h-8 text-xs border-white/10">
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
              </Button>
              <Button size="sm" onClick={handleDownloadPdf} className="bg-gradient-primary text-primary-foreground border-0 h-8 text-xs shadow-glow">
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export PDF
              </Button>
            </div>
          </div>
          <DialogTitle className="text-xl font-bold mt-2">
            Invoice #{orderData.id.slice(0, 12)}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Official tax receipt for business expense and input tax credit (ITC) reconciliation.
          </DialogDescription>
        </DialogHeader>

        {/* Invoice Body (Styled for Screen & Print) */}
        <div className="py-4 space-y-6 text-xs text-gray-300 print:text-black">
          {/* Header Info: Seller & Buyer */}
          <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-black/40 border border-white/10">
            <div>
              <p className="font-mono text-[10px] uppercase text-primary font-bold tracking-wider mb-1">
                Issuer / Service Provider
              </p>
              <h4 className="font-bold text-sm text-white">Straxon Labs Technologies</h4>
              <p className="text-muted-foreground text-[11px] leading-relaxed mt-1">
                AI & Autonomous Cloud Fulfillment Division<br />
                GSTIN: <span className="font-mono text-foreground font-semibold">27AAECS9841K1Z5</span><br />
                State Code: 27 (Maharashtra / Global Tech Node)<br />
                SAC Code: 998314 (IT & AI Software)
              </p>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase text-primary font-bold tracking-wider mb-1">
                Billed To (Recipient)
              </p>
              <h4 className="font-bold text-sm text-white">{clientCompanyName}</h4>
              <p className="text-muted-foreground text-[11px] leading-relaxed mt-1">
                Email: {orderData.clientEmail || "billing@client.com"}<br />
                Client GSTIN: <span className="font-mono text-primary font-semibold">{clientGstin}</span><br />
                Date: {orderData.date || "Today"}<br />
                Payment Mode: {isIndia ? "UPI / Net Banking / Cards" : "Stripe 256-Bit SSL"}
              </p>
            </div>
          </div>

          {/* Line Item Table */}
          <div className="border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left font-mono">
              <thead className="bg-white/5 border-b border-white/10 text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-4">SAC Code</th>
                  <th className="py-3 px-4 text-right">Taxable Value</th>
                  {isIndia && <th className="py-3 px-4 text-right">GST Rate</th>}
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="py-4 px-4 font-sans font-medium text-white">
                    {orderData.serviceName}
                    <span className="block text-[11px] text-muted-foreground font-mono mt-0.5">
                      Autonomous RAG semantic indexing, AI agents & deliverable deployment
                    </span>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground">998314</td>
                  <td className="py-4 px-4 text-right">{formatPrice(baseCents)}</td>
                  {isIndia && <td className="py-4 px-4 text-right text-emerald-400">18%</td>}
                  <td className="py-4 px-4 text-right font-bold text-white">{formatPrice(totalCents)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Computation Summary */}
          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-2 p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Taxable Amount:</span>
                <span>{formatPrice(baseCents)}</span>
              </div>
              {isIndia && (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>CGST (9.0%):</span>
                    <span>+{formatPrice(cgstCents)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>SGST (9.0%):</span>
                    <span>+{formatPrice(sgstCents)}</span>
                  </div>
                </>
              )}
              <div className="pt-2 border-t border-white/10 flex justify-between font-bold text-sm text-white">
                <span>Grand Total:</span>
                <span className="text-primary">{formatPrice(totalCents)}</span>
              </div>
            </div>
          </div>

          {/* Compliance & Signature Seal */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-4 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Electronically signed & certified. No physical signature required.</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <QrCode className="w-4 h-4 text-primary" />
              <span>IRN: 4892-a1f9-straxon-gst</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
