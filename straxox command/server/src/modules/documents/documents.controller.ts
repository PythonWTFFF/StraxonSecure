import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import puppeteer from "puppeteer";

const generateInvoiceHTML = (invoice: any) => {
  const subtotal = invoice.lineItems.reduce((acc: number, item: any) => acc + (item.rate * item.quantity), 0);
  const total = subtotal + (subtotal * (invoice.taxRate / 100));

  const itemsHtml = invoice.lineItems.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.description}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${invoice.currency} ${item.rate.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${invoice.currency} ${(item.quantity * item.rate).toFixed(2)}</td>
    </tr>
  `).join("");

  return `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif; padding: 40px; color: #333; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .header h1 { font-size: 36px; margin: 0; color: #111; }
          .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th { text-align: left; padding: 10px; border-bottom: 2px solid #ddd; background-color: #f9f9f9; }
          .totals { width: 50%; float: right; }
          .totals-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .totals-row.final { font-weight: bold; font-size: 1.2em; border-bottom: none; border-top: 2px solid #333; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>INVOICE</h1>
            <p>#${invoice.invoiceNumber}</p>
          </div>
          <div style="text-align: right;">
            <strong>Straxon Labs</strong><br>
            contact@straxonlabs.com
          </div>
        </div>
        <div class="details">
          <div>
            <strong>Billed To:</strong><br>
            ${invoice.clientName}<br>
            ${invoice.clientEmail}
          </div>
          <div style="text-align: right;">
            <strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}<br>
            <strong>Due Date:</strong> ${invoice.dueDate}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="totals">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>${invoice.currency} ${subtotal.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>Tax (${invoice.taxRate}%)</span>
            <span>${invoice.currency} ${(subtotal * (invoice.taxRate / 100)).toFixed(2)}</span>
          </div>
          <div class="totals-row final">
            <span>Total</span>
            <span>${invoice.currency} ${total.toFixed(2)}</span>
          </div>
        </div>
      </body>
    </html>
  `;
};

const generateProposalHTML = (proposal: any) => {
  return `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif; padding: 50px; color: #333; line-height: 1.6; }
          h1 { font-size: 42px; margin-bottom: 10px; color: #111; }
          h2 { font-size: 24px; margin-top: 40px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
          .meta { margin-bottom: 50px; color: #666; }
          .section { margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <h1>${proposal.projectName}</h1>
        <div class="meta">
          <strong>Prepared for:</strong> ${proposal.clientName}<br>
          <strong>Date:</strong> ${proposal.date}<br>
          <strong>Reference:</strong> ${proposal.refNum}
        </div>
        
        <div class="section">
          <h2>Executive Summary</h2>
          <p>${proposal.executiveSummary}</p>
        </div>
        
        ${proposal.systemScope ? `
        <div class="section">
          <h2>System Scope</h2>
          <p>${proposal.systemScope}</p>
        </div>
        ` : ''}
        
        ${proposal.objectives ? `
        <div class="section">
          <h2>Objectives</h2>
          <p>${proposal.objectives}</p>
        </div>
        ` : ''}
        
        <div class="section">
          <h2>Budget Overview</h2>
          <p>Total Estimated Budget: <strong>${proposal.budgetTotal || "TBD"}</strong></p>
        </div>
      </body>
    </html>
  `;
};

export const renderDocument = async (req: any, res: Response) => {
  try {
    const { type, id } = req.body;
    const organizationId = req.user.organizationId;
    
    if (!type || !id) {
      return res.status(400).json({ error: "type and id are required" });
    }

    let html = "";
    let filename = "";

    if (type === "invoice") {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { lineItems: true }
      });
      if (!invoice || invoice.organizationId !== organizationId) return res.status(404).json({ error: "Invoice not found" });
      html = generateInvoiceHTML(invoice);
      filename = `invoice-${invoice.invoiceNumber}.pdf`;
    } else if (type === "proposal") {
      const proposal = await prisma.proposal.findUnique({
        where: { id }
      });
      if (!proposal || proposal.organizationId !== organizationId) return res.status(404).json({ error: "Proposal not found" });
      html = generateProposalHTML(proposal);
      filename = `proposal-${proposal.refNum}.pdf`;
    } else {
      return res.status(400).json({ error: "Invalid document type" });
    }

    const browser = await puppeteer.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });
    
    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length.toString()
    });
    
    // Puppeteer returns a Uint8Array in newer versions, which is compatible with res.send
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("PDF Render Error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};
