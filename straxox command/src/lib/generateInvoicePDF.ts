import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface InvoiceData {
  id?: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  dueDate: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  discountType: "percentage" | "flat";
  discountValue: number;
  paymentLink?: string;
  notes?: string;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id?: string;
  description: string;
  category: string;
  quantity: number;
  rate: number;
}

export interface InvoiceCalculations {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

export function calculateInvoiceTotals(data: InvoiceData): InvoiceCalculations {
  const subtotal = data.lineItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.rate || 0),
    0
  );
  const discountAmount =
    data.discountType === "percentage"
      ? subtotal * ((data.discountValue || 0) / 100)
      : data.discountValue || 0;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * ((data.taxRate || 0) / 100);
  const total = afterDiscount + taxAmount;
  return { subtotal, discountAmount, taxAmount, total };
}

// --- BULLETPROOF ASYNC RASTERIZER ---
// Converts any Vite image path (PNG or SVG) into pure, jsPDF-safe Base64 binary data.
const rasterizeImage = (src: any): Promise<string | null> => {
  return new Promise((resolve) => {
    const url = typeof src === "object" ? src.src || src.default : src;
    if (!url) return resolve(null);

    const img = new Image();
    img.crossOrigin = "Anonymous"; // Prevent Vite CORS canvas tainting

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        // Force dimensions for SVGs that lack intrinsic sizes
        canvas.width = img.naturalWidth || 512;
        canvas.height = img.naturalHeight || 512;

        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Extract raw Base64 (strips the 'data:image/png;base64,' prefix)
        const base64Raw = canvas.toDataURL("image/png").split(",")[1];
        resolve(base64Raw);
      } catch (e) {
        console.warn("Failed to rasterize image:", url, e);
        resolve(null);
      }
    };

    img.onerror = () => {
      console.warn("Failed to load image path:", url);
      resolve(null);
    };

    img.src = url;
  });
};

// FIX: jsPDF does NOT expose `doc.GState` as a constructor on the instance.
// The correct pattern for controlling opacity in jsPDF is to use saveGraphicsState /
// restoreGraphicsState together with setGState({ opacity }) via the internal API, or
// simply draw the image at the desired opacity by pre-processing the canvas pixel data.
// We use the canvas alpha approach here — it works across all jsPDF versions reliably.
const rasterizeImageWithOpacity = (
  src: any,
  opacity: number
): Promise<string | null> => {
  return new Promise((resolve) => {
    const url = typeof src === "object" ? src.src || src.default : src;
    if (!url) return resolve(null);

    const img = new Image();
    img.crossOrigin = "Anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 512;
        canvas.height = img.naturalHeight || 512;

        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        // Apply global alpha before drawing — this bakes the opacity into the PNG
        ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const base64Raw = canvas.toDataURL("image/png").split(",")[1];
        resolve(base64Raw);
      } catch (e) {
        console.warn("Failed to rasterize image with opacity:", url, e);
        resolve(null);
      }
    };

    img.onerror = () => {
      console.warn("Failed to load image path:", url);
      resolve(null);
    };

    img.src = url;
  });
};

export async function generateInvoicePDF(
  data: InvoiceData,
  calculations: InvoiceCalculations,
  logos?: { main: any; secure: any; dev: any; creative: any }
): Promise<jsPDF> {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // FIX 1: jsPDF built-in fonts (helvetica, courier) are Latin-1 only.
  // The ₹ (U+20B9), € (U+20AC) and many other Unicode currency glyphs are
  // NOT in that charset — jsPDF renders them as individual broken boxes.
  // Solution: map each currency code to an ASCII-safe abbreviation that the
  // built-in fonts can always render correctly.
  const CURRENCY_LABEL: Record<string, string> = {
    INR: "INR ",   // e.g.  "INR 12,000"
    USD: "USD ",
    EUR: "EUR ",
    GBP: "GBP ",
    JPY: "JPY ",
    AUD: "AUD ",
    CAD: "CAD ",
  };
  const sym = CURRENCY_LABEL[data.currency] ?? (data.currencySymbol || data.currency + " ");

  // High-End Cyber Colors
  const bgDark = [11, 14, 20] as const;
  const boxBg = [15, 19, 28] as const;
  const borderGray = [30, 41, 59] as const;
  const cyan = [0, 230, 255] as const;
  const grayText = [120, 135, 155] as const;
  const whiteText = [240, 245, 250] as const;

  // Background Fill
  doc.setFillColor(...bgDark);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // ==========================================
  // 1. RENDER LOGOS & WATERMARK
  // ==========================================
  if (logos) {
    // FIX: Rasterize watermark version separately with baked-in 3% opacity
    // instead of using doc.GState (which does NOT exist as an instance constructor)
    const [mainB64, mainWatermarkB64, secB64, devB64, creB64] =
      await Promise.all([
        rasterizeImage(logos.main),
        rasterizeImageWithOpacity(logos.main, 0.03), // 3% opacity watermark
        rasterizeImage(logos.secure),
        rasterizeImage(logos.dev),
        rasterizeImage(logos.creative),
      ]);

    if (mainB64) {
      // Background Watermark (Centered, 3% opacity — baked into PNG)
      if (mainWatermarkB64) {
        doc.addImage(mainWatermarkB64, "PNG", 35, 70, 140, 140);
      }

      // Main Header Logo (full opacity)
      doc.addImage(mainB64, "PNG", 15, 15, 28, 12);

      // Vertical Divider
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.5);
      doc.line(48, 16, 48, 26);

      // Sub-Logos at 80% opacity — bake opacity via canvas
      const [secFaded, devFaded, creFaded] = await Promise.all([
        secB64 ? rasterizeImageWithOpacity(logos.secure, 0.8) : Promise.resolve(null),
        devB64 ? rasterizeImageWithOpacity(logos.dev, 0.8) : Promise.resolve(null),
        creB64 ? rasterizeImageWithOpacity(logos.creative, 0.8) : Promise.resolve(null),
      ]);

      if (secFaded) doc.addImage(secFaded, "PNG", 54, 18, 7, 7);
      if (devFaded) doc.addImage(devFaded, "PNG", 65, 18, 7, 7);
      if (creFaded) doc.addImage(creFaded, "PNG", 76, 18, 7, 7);
    } else {
      // Text Fallback if main logo path is broken
      doc.setFontSize(16);
      doc.setTextColor(...cyan);
      doc.setFont("helvetica", "bold");
      doc.text("STRAXON LABS", 15, 22);
    }
  }

  // ==========================================
  // 2. HEADER TITLE
  // ==========================================
  doc.setFontSize(22);
  doc.setTextColor(...cyan);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth - 15, 22, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(...grayText);
  doc.setFont("helvetica", "normal");
  doc.text(data.invoiceNumber || "STX-XXXX", pageWidth - 15, 29, {
    align: "right",
  });

  // Top Divider
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.line(15, 40, pageWidth - 15, 40);

  // ==========================================
  // 3. BILLING INFO (Rounded Boxes)
  // ==========================================
  let y = 50;

  // Bill To Box (Left)
  doc.setFillColor(...boxBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(15, y, 90, 32, 3, 3, "FD");

  doc.setFontSize(7);
  doc.setTextColor(...grayText);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", 22, y + 8);

  doc.setFontSize(12);
  doc.setTextColor(...whiteText);
  doc.text(data.clientName || "—", 22, y + 16);

  doc.setFontSize(9);
  doc.setTextColor(...grayText);
  doc.setFont("courier", "normal");
  doc.text(data.clientEmail || "—", 22, y + 24);

  // Due Date Box (Right)
  doc.setFillColor(...boxBg);
  doc.roundedRect(pageWidth - 65, y, 50, 32, 3, 3, "FD");

  doc.setFontSize(7);
  doc.setTextColor(...grayText);
  doc.setFont("helvetica", "bold");
  doc.text("DUE DATE", pageWidth - 22, y + 8, { align: "right" });

  doc.setFontSize(11);
  doc.setTextColor(...whiteText);
  doc.setFont("helvetica", "bold");
  doc.text(data.dueDate || "—", pageWidth - 22, y + 16, { align: "right" });

  // Currency Pill
  doc.setFillColor(4, 31, 40);
  doc.roundedRect(pageWidth - 48, y + 20, 26, 6, 1.5, 1.5, "F");
  doc.setFontSize(7);
  doc.setTextColor(...cyan);
  doc.setFont("helvetica", "normal");
  doc.text(`Currency: ${data.currency}`, pageWidth - 24, y + 24, {
    align: "right",
  });

  // ==========================================
  // 4. LINE ITEMS TABLE
  // ==========================================
  y = 95;
  const tableData = data.lineItems.map((item) => [
    item.description || "—",
    item.category,
    String(item.quantity),
    `${sym}${item.rate.toLocaleString()}`,
    `${sym}${((item.quantity || 0) * (item.rate || 0)).toLocaleString()}`,
  ]);

  autoTable(doc, {
    startY: y + 2,
    head: [["DESCRIPTION", "CATEGORY", "QTY", "RATE", "AMOUNT"]],
    body: tableData,
    theme: "plain",
    margin: { left: 15, right: 15 },
    styles: {
      fontSize: 9,
      textColor: [226, 232, 240],
      cellPadding: { top: 6, bottom: 6, left: 6, right: 6 },
    },
    headStyles: {
      fillColor: [15, 19, 28],
      textColor: [120, 135, 155],
      fontSize: 7,
      fontStyle: "bold",
      cellPadding: { top: 8, bottom: 8, left: 6, right: 6 },
    },
    // FIX 2: Column widths must add up to exactly 180mm (page 210 - 15 left - 15 right).
    // Previous widths (70+auto+15+30+35) left category column unconstrained and
    // caused description text to overflow into adjacent cells.
    // New layout: Desc=72, Category=40, Qty=13, Rate=27, Amount=28 = 180mm total.
    columnStyles: {
      0: { cellWidth: 72 },                         // Description
      1: { cellWidth: 40 },                         // Category
      2: { halign: "right" as const, cellWidth: 13 }, // Qty
      3: { halign: "right" as const, cellWidth: 27 }, // Rate
      4: { halign: "right" as const, cellWidth: 28 }, // Amount
    },
    didDrawCell: (data) => {
      if (data.row.section === "body") {
        doc.setDrawColor(...borderGray);
        doc.setLineWidth(0.1);
        doc.line(
          data.cell.x,
          data.cell.y,
          data.cell.x + data.cell.width,
          data.cell.y
        );
      }
    },
  });

  // FIX: Use the proper jspdf-autotable finalY accessor pattern
  const finalY: number =
    (doc as any).lastAutoTable?.finalY ?? y + 30;

  // Outer Table Border
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, y, 180, finalY - y, 3, 3, "S");

  // ==========================================
  // 5. TOTALS BOX
  // ==========================================
  let totalsY = finalY + 15;
  const totalsX = 115;

  // FIX 3: Dynamically compute box height so "TOTAL DUE" is never clipped.
  // Base rows: Subtotal + Tax + divider + Total = ~36mm
  // With discount row: add 8mm more.
  const hasDiscount = calculations.discountAmount > 0;
  const totalsBoxHeight = hasDiscount ? 46 : 38;

  doc.setFillColor(...boxBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(totalsX, totalsY, 80, totalsBoxHeight, 3, 3, "FD");

  const drawTotalLine = (
    label: string,
    value: string,
    color: readonly [number, number, number] = grayText,
    bold: boolean,
    yOff: number
  ) => {
    doc.setFontSize(9);
    doc.setTextColor(...color);
    doc.setFont("courier", bold ? "bold" : "normal");
    doc.text(label, totalsX + 6, totalsY + yOff);
    doc.text(value, pageWidth - 20, totalsY + yOff, { align: "right" });
    doc.setFont("helvetica", "normal");
  };

  drawTotalLine(
    "Subtotal",
    `${sym}${calculations.subtotal.toLocaleString()}`,
    grayText,
    false,
    10
  );

  // FIX 3 continued: use consistent spacing so rows don't overlap
  let taxOffset = 20;
  if (hasDiscount) {
    drawTotalLine(
      "Discount",
      `-${sym}${calculations.discountAmount.toLocaleString()}`,
      [34, 197, 94],
      false,
      20
    );
    taxOffset = 30;
  }

  drawTotalLine(
    `Tax (${data.taxRate}%)`,
    `${sym}${calculations.taxAmount.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`,
    grayText,
    false,
    taxOffset
  );

  // Cyan Divider
  doc.setDrawColor(0, 100, 120);
  doc.setLineWidth(0.5);
  doc.line(
    totalsX + 6,
    totalsY + taxOffset + 6,
    pageWidth - 20,
    totalsY + taxOffset + 6
  );

  // Total Due label
  doc.setFontSize(8);
  doc.setTextColor(...grayText);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL DUE", totalsX + 6, totalsY + taxOffset + 14);

  // Total Due value
  doc.setFontSize(14);
  doc.setTextColor(...cyan);
  doc.setFont("courier", "bold");
  doc.text(
    `${sym}${calculations.total.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`,
    pageWidth - 20,
    totalsY + taxOffset + 14,
    { align: "right" }
  );

  // ==========================================
  // 6. NOTES SECTION
  // ==========================================
  // FIX 4: Anchor Y position to bottom of totals box, not to taxOffset,
  // so notes never overlap the totals box regardless of discount presence.
  const afterTotalsY = totalsY + totalsBoxHeight + 8;

  if (data.notes?.trim()) {
    doc.setFontSize(7);
    doc.setTextColor(...grayText);
    doc.setFont("helvetica", "bold");
    doc.text("NOTES", 15, afterTotalsY);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 190, 210);
    const lines = doc.splitTextToSize(data.notes.trim(), 180);
    doc.text(lines, 15, afterTotalsY + 6);
  }

  // ==========================================
  // 7. PAYMENT LINK
  // ==========================================
  // FIX 4 continued: position below notes (or below totals if no notes)
  if (data.paymentLink?.trim()) {
    const noteBlockHeight = data.notes?.trim()
      ? 8 + Math.ceil(data.notes.trim().split("\n").length * 5)
      : 0;
    const linkBaseY = afterTotalsY + noteBlockHeight + (data.notes?.trim() ? 6 : 0);

    doc.setFontSize(7);
    doc.setTextColor(...grayText);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT LINK", 15, linkBaseY);

    doc.setFontSize(8);
    doc.setFont("courier", "normal");
    doc.setTextColor(...cyan);
    const linkLines = doc.splitTextToSize(data.paymentLink.trim(), 180);
    doc.text(linkLines, 15, linkBaseY + 6);
  }

  // ==========================================
  // 8. FOOTER
  // ==========================================
  doc.setFontSize(6);
  doc.setTextColor(...borderGray);
  doc.setFont("helvetica", "bold");
  doc.text(
    `GENERATED BY STRAXON COMMAND ENGINE // DOCUMENT ID: ${
      data.invoiceNumber || "STX-XXXX"
    }`,
    pageWidth / 2,
    287,
    { align: "center" }
  );

  return doc;
}