import { Request, Response } from "express";
import { z } from "zod";
import { io } from "../../app";
import { prisma } from "../../lib/prisma";

const lineItemSchema = z.object({
  description: z.string(),
  category: z.string(),
  quantity: z.number(),
  rate: z.number(),
});

const invoiceSchema = z.object({
  clientName: z.string(),
  clientEmail: z.string(),
  invoiceNumber: z.string(),
  dueDate: z.string(),
  currency: z.string().default("INR"),
  taxRate: z.number().default(18),
  discountType: z.string().default("percentage"),
  discountValue: z.number().default(0),
  paymentLink: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema),
});

export const getInvoices = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const invoices = await prisma.invoice.findMany({
      where: { organizationId },
      include: { lineItems: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(invoices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
};

export const getInvoiceById = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: req.params.id,
      },
      include: { lineItems: true },
    });
    
    if (!invoice || invoice.organizationId !== organizationId) {
       return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
};

export const createInvoice = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const result = invoiceSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Validation failed", details: result.error.issues });
    }

    const data = result.data;

    // Check if invoice number exists within organization
    const existing = await prisma.invoice.findUnique({
      where: { 
        organizationId_invoiceNumber: {
          organizationId,
          invoiceNumber: data.invoiceNumber
        } 
      },
    });

    if (existing) {
       return res.status(400).json({ error: "Invoice number already exists" });
    }

    const invoice = await prisma.invoice.create({
      data: {
        ...data,
        organizationId,
        lineItems: {
          create: data.lineItems,
        },
      },
      include: { lineItems: true },
    });
    
    io.emit("invalidate_dashboard");

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create invoice" });
  }
};

export const updateInvoice = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    const existing = await prisma.invoice.findUnique({ where: { id } });
    
    if (!existing || existing.organizationId !== organizationId) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    
    const result = invoiceSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Validation failed", details: result.error.issues });
    }

    const data = result.data;
    const updateData: any = { ...data };
    
    if (data.lineItems) {
      // First delete existing line items, then recreate.
      await prisma.lineItem.deleteMany({ where: { invoiceId: id } });
      updateData.lineItems = { create: data.lineItems };
    }
    
    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: { lineItems: true }
    });
    
    io.emit("invalidate_dashboard");
    io.emit("invalidate_invoices");
    res.json({ success: true, invoice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update invoice" });
  }
};

export const deleteInvoice = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const { id } = req.params;
    
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== organizationId) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    
    await prisma.invoice.delete({ where: { id } });
    
    io.emit("invalidate_dashboard");
    io.emit("invalidate_invoices");
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
};

export const renderInvoicePDF = async (req: any, res: Response) => {
  try {
    const organizationId = req.user.organizationId;
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { lineItems: true },
    });

    if (!invoice || invoice.organizationId !== organizationId) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const totalAmount = invoice.lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);

    // Call the Rust render service
    const renderUrl = process.env.RENDER_URL || "http://localhost:8082";
    
    const response = await fetch(`${renderUrl}/render/pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        invoice_id: invoice.id,
        amount: totalAmount,
        client_name: invoice.clientName,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Render Service Error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ error: "Failed to generate PDF in render service" });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error("Render Invoice Error:", error);
    res.status(500).json({ error: "Internal server error connecting to Render service" });
  }
};
