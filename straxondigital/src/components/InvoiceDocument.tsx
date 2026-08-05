// Invoice rendering for the dashboard.
// Uses the same A4Document chrome so a print-to-PDF gives a clean signed invoice.

import { A4Document } from "@/components/A4Document";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { formatPrice } from "@/lib/services";

export interface InvoiceLike {
  id: string;
  invoice_number: string;
  amount_cents: number;
  tax_cents: number;
  total_cents: number;
  status: string;
  issued_at: string;
}

export interface InvoiceOrderContext {
  service_name: string;
  customer_email?: string | null;
  customer_name?: string | null;
}

interface Props {
  invoice: InvoiceLike;
  order: InvoiceOrderContext;
}

export const InvoiceDocument = ({ invoice, order }: Props) => {
  const issued = new Date(invoice.issued_at);
  const due = new Date(issued.getTime() + 14 * 24 * 60 * 60 * 1000);

  return (
    <div>
      <div className="no-print flex justify-between items-center mb-4 px-1">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Invoice</p>
          <p className="text-xs text-muted-foreground">{invoice.invoice_number}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button size="sm" onClick={() => window.print()} className="bg-gradient-primary text-primary-foreground border-0">
            <Download className="h-4 w-4 mr-2" /> Save PDF
          </Button>
        </div>
      </div>

      <A4Document>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8mm" }}>
          <div>
            <p style={{ margin: 0, fontSize: "9pt", color: "#666", textTransform: "uppercase", letterSpacing: "0.25em" }}>Invoice</p>
            <h1 style={{ margin: "1mm 0 0", fontSize: "26pt", fontWeight: 700, letterSpacing: "-0.02em" }}>
              STRAXON<span style={{ color: "hsl(200 100% 50%)" }}>.</span>
            </h1>
            <p style={{ margin: "1mm 0 0", fontSize: "9pt", color: "#666" }}>Straxon Digital · Cyber-Luxury Edition</p>
          </div>
          <div style={{ textAlign: "right", fontSize: "9pt", color: "#444" }}>
            <p style={{ margin: 0, fontFamily: "monospace", fontSize: "11pt", fontWeight: 700 }}>{invoice.invoice_number}</p>
            <p style={{ margin: "1mm 0 0" }}>Issued: {issued.toLocaleDateString()}</p>
            <p style={{ margin: 0 }}>Due: {due.toLocaleDateString()}</p>
            <p style={{
              margin: "2mm 0 0",
              display: "inline-block",
              padding: "0.5mm 2mm",
              borderRadius: "2mm",
              fontSize: "9pt",
              fontWeight: 600,
              background: invoice.status === "paid" ? "#dcfce7" : "#fef3c7",
              color: invoice.status === "paid" ? "#166534" : "#92400e",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}>
              {invoice.status}
            </p>
          </div>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6mm", marginBottom: "6mm" }}>
          <div>
            <p style={{ margin: 0, fontSize: "8pt", color: "#666", textTransform: "uppercase", letterSpacing: "0.2em" }}>Billed to</p>
            <p style={{ margin: "1mm 0 0", fontWeight: 600 }}>{order.customer_name || "Client"}</p>
            <p style={{ margin: 0, fontSize: "9pt", color: "#444" }}>{order.customer_email || "—"}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "8pt", color: "#666", textTransform: "uppercase", letterSpacing: "0.2em" }}>From</p>
            <p style={{ margin: "1mm 0 0", fontWeight: 600 }}>Straxon Digital</p>
            <p style={{ margin: 0, fontSize: "9pt", color: "#444" }}>billing@straxon.digital</p>
          </div>
        </section>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt", marginBottom: "5mm" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #0a0a0a" }}>
              <th style={{ textAlign: "left", padding: "2mm 0", textTransform: "uppercase", fontSize: "8pt", letterSpacing: "0.2em" }}>Description</th>
              <th style={{ textAlign: "right", padding: "2mm 0", textTransform: "uppercase", fontSize: "8pt", letterSpacing: "0.2em" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "3mm 0" }}>{order.service_name}</td>
              <td style={{ padding: "3mm 0", textAlign: "right", fontFamily: "monospace" }}>{formatPrice(invoice.amount_cents)}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginLeft: "auto", width: "60mm", fontSize: "10pt" }}>
          <Row label="Subtotal" value={formatPrice(invoice.amount_cents)} />
          <Row label="Tax (8%)" value={formatPrice(invoice.tax_cents)} />
          <div style={{ borderTop: "2px solid #0a0a0a", marginTop: "2mm", paddingTop: "2mm" }}>
            <Row label="Total" value={formatPrice(invoice.total_cents)} bold />
          </div>
        </div>

        <footer style={{ marginTop: "12mm", paddingTop: "4mm", borderTop: "1px solid #ddd", fontSize: "8.5pt", color: "#666" }}>
          <p style={{ margin: 0 }}>Thank you for your business. Questions? Reach us at billing@straxon.digital.</p>
          <p style={{ margin: "1mm 0 0" }}>This invoice was generated automatically by Straxon Digital · {invoice.invoice_number}</p>
        </footer>
      </A4Document>
    </div>
  );
};

const Row = ({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "1mm 0", fontWeight: bold ? 700 : 400 }}>
    <span style={{ color: bold ? "#0a0a0a" : "#444" }}>{label}</span>
    <span style={{ fontFamily: "monospace" }}>{value}</span>
  </div>
);
