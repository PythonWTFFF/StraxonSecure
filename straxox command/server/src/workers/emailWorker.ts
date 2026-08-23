import { Worker, Job } from "bullmq";
import { redisConnection } from "../lib/queue";
import { Resend } from "resend";
import { prisma } from "../lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY || "re_fallback_key_to_prevent_crash_123");

export const emailWorker = new Worker(
  "emailQueue",
  async (job: Job) => {
    switch (job.name) {
      case "sendInvoiceEmail":
        const { invoiceId, email, token, url } = job.data;
        console.log(`[Worker] Processing sendInvoiceEmail for invoice ${invoiceId}`);

        try {
          // You could generate the PDF buffer here or fetch invoice details
          const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
          if (!invoice) throw new Error("Invoice not found");

          const response = await resend.emails.send({
            from: "Straxon <invoices@straxon.com>", // Replace with your verified domain
            to: email,
            subject: `Invoice #${invoice.invoiceNumber} from Straxon Labs`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>You have a new invoice from Straxon Labs</h2>
                <p>Hello ${invoice.clientName},</p>
                <p>Your invoice <strong>#${invoice.invoiceNumber}</strong> is ready.</p>
                <div style="margin: 30px 0;">
                  <a href="${url}" style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View and Pay Invoice</a>
                </div>
                <p>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
                <p>If you have any questions, please reply to this email.</p>
              </div>
            `,
          });

          return response;
        } catch (error) {
          console.error("[Worker] Failed to send invoice email:", error);
          throw error;
        }

      default:
        console.warn(`[Worker] Unknown job name: ${job.name}`);
    }
  },
  { connection: redisConnection }
);
