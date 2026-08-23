import { Worker, Job } from "bullmq";
import { redisConnection, emailQueue, aiQueue } from "../lib/queue";
import { prisma } from "../lib/prisma";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export const scheduledWorker = new Worker(
  "scheduledQueue",
  async (job: Job) => {
    switch (job.name) {
      case "dailyInvoiceReminders":
        console.log(`[Scheduled Worker] Running daily invoice reminders check`);
        
        try {
          // Find all unpaid invoices due in exactly 3 days
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + 3);
          
          const startOfDay = new Date(targetDate.setHours(0,0,0,0));
          const endOfDay = new Date(targetDate.setHours(23,59,59,999));
          
          const dueInvoices = await prisma.invoice.findMany({
            where: {
              status: "pending",
              dueDate: {
                gte: startOfDay.toISOString(),
                lte: endOfDay.toISOString(),
              }
            }
          });
          
          console.log(`[Scheduled Worker] Found ${dueInvoices.length} invoices due in 3 days.`);
          
          for (const invoice of dueInvoices) {
            // Queue an email job for each
            await emailQueue.add("sendInvoiceEmail", {
              invoiceId: invoice.id,
              email: invoice.clientEmail,
              token: "dummy_token",
              url: `https://straxon.com/portal/invoices/${invoice.id}`,
              isReminder: true
            });
          }
        } catch (error) {
          console.error("[Scheduled Worker] Failed to process invoice reminders:", error);
          throw error;
        }
        break;

      case "dailyDealScoring":
        console.log(`[Scheduled Worker] Running daily deal scoring`);
        try {
          const activeDeals = await prisma.deal.findMany({
            where: { stage: { notIn: ["Won", "Lost"] } }
          });
          
          let updatedCount = 0;
          for (const deal of activeDeals) {
            let newProb = deal.probability || 0;
            const daysInPipeline = Math.floor((Date.now() - deal.createdAt.getTime()) / (1000 * 3600 * 24));
            
            // Baseline probabilities
            switch(deal.stage) {
              case "Lead": newProb = 10; break;
              case "Qualified": newProb = 30; break;
              case "Proposal": newProb = 60; break;
              case "Negotiation": newProb = 80; break;
            }
            
            // Penalty for stalling (> 30 days)
            if (daysInPipeline > 30) {
               newProb = Math.max(5, newProb - 10);
            }
            // Major penalty for > 60 days
            if (daysInPipeline > 60) {
               newProb = Math.max(5, newProb - 20);
            }

            if (newProb !== deal.probability) {
              await prisma.deal.update({
                where: { id: deal.id },
                data: { probability: newProb }
              });
              updatedCount++;
            }
          }
          console.log(`[Scheduled Worker] Updated probability for ${updatedCount} deals.`);
        } catch (error) {
           console.error("[Scheduled Worker] Failed to process deal scoring:", error);
           throw error;
        }
        break;

      case "dailyDealCopilot":
        console.log(`[Scheduled Worker] Running daily deal copilot`);
        try {
          const stalledDate = new Date();
          stalledDate.setDate(stalledDate.getDate() - 14);
          
          const stalledDeals = await prisma.deal.findMany({
            where: {
              stage: { notIn: ["Won", "Lost"] },
              updatedAt: { lt: stalledDate },
              probability: { gt: 30 } // Only focus on somewhat qualified deals
            }
          });
          
          for (const deal of stalledDeals) {
            await aiQueue.add("aiDealCopilot", { dealId: deal.id });
          }
          console.log(`[Scheduled Worker] Enqueued ${stalledDeals.length} deals for AI Copilot.`);
        } catch (error) {
          console.error("[Scheduled Worker] Failed to run deal copilot:", error);
          throw error;
        }
        break;

      case "retentionSweep":
        console.log(`[Scheduled Worker] Running data retention sweep`);
        try {
          const policies = await prisma.retentionPolicy.findMany();
          
          let deletedCount = 0;
          for (const policy of policies) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);
            
            // Note: In a full implementation, each entity type would have logic to anonymize or delete based on policy.onExpiry
            if (policy.entityType === "AuditLogEntry") {
               const result = await prisma.auditLogEntry.deleteMany({
                 where: {
                   organizationId: policy.organizationId,
                   createdAt: { lt: cutoffDate }
                 }
               });
               deletedCount += result.count;
            }
            // Add other entities as needed
          }
          console.log(`[Scheduled Worker] Data retention sweep completed. Deleted ${deletedCount} records.`);
        } catch (error) {
          console.error("[Scheduled Worker] Failed to run retention sweep:", error);
          throw error;
        }
        break;

      case "dailyDatabaseBackup":
        console.log(`[Scheduled Worker] Running daily database backup`);
        try {
          const backupDir = path.join(__dirname, "../../../backups");
          if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
          }
          
          const dateStr = new Date().toISOString().split('T')[0];
          const backupPath = path.join(backupDir, `backup-${dateStr}.sql`);
          
          // Ensure we have the DB URL from env
          const dbUrl = process.env.DATABASE_URL;
          if (!dbUrl) {
             throw new Error("DATABASE_URL is not set");
          }
          
          const cmd = `pg_dump "${dbUrl}" -F c -f "${backupPath}"`;
          
          await new Promise<void>((resolve, reject) => {
            exec(cmd, (error, stdout, stderr) => {
              if (error) {
                console.error(`[Scheduled Worker] pg_dump error: ${stderr}`);
                return reject(error);
              }
              resolve();
            });
          });
          
          console.log(`[Scheduled Worker] Database backup created at ${backupPath}`);
        } catch (error) {
          console.error("[Scheduled Worker] Failed to run database backup:", error);
          throw error;
        }
        break;

      default:
        console.warn(`[Scheduled Worker] Unknown job name: ${job.name}`);
    }
  },
  { connection: redisConnection }
);
