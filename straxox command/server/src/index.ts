import "./instrumentation";
import { httpServer } from "./app";
import "./workers/emailWorker";
import "./workers/scheduledWorker";
import "./workers/aiWorker";
import "./workers/webhookWorker";
import { logger } from "./utils/logger";
import { scheduledQueue } from "./lib/queue";

const port = process.env.PORT || 3000;

httpServer.listen(port, async () => {
  logger.info(`Server & WebSocket running on http://localhost:${port}`);

  // Add daily invoice reminders job
  await scheduledQueue.upsertJobScheduler(
    "dailyInvoiceReminders-scheduler",
    { pattern: "0 8 * * *" }, // Every day at 8:00 AM
    {
      name: "dailyInvoiceReminders",
      data: {}
    }
  );
  
  // Add daily deal scoring job
  await scheduledQueue.upsertJobScheduler(
    "dailyDealScoring-scheduler",
    { pattern: "0 2 * * *" }, // Every day at 2:00 AM
    {
      name: "dailyDealScoring",
      data: {}
    }
  );
  
  // Add daily deal copilot job
  await scheduledQueue.upsertJobScheduler(
    "dailyDealCopilot-scheduler",
    { pattern: "30 2 * * *" }, // Every day at 2:30 AM
    {
      name: "dailyDealCopilot",
      data: {}
    }
  );
  
  // Add daily database backup job
  await scheduledQueue.upsertJobScheduler(
    "dailyDatabaseBackup-scheduler",
    { pattern: "0 3 * * *" }, // Every day at 3:00 AM
    {
      name: "dailyDatabaseBackup",
      data: {}
    }
  );
  
  // Add daily retention sweep job
  await scheduledQueue.upsertJobScheduler(
    "retentionSweep-scheduler",
    { pattern: "0 4 * * *" }, // Every day at 4:00 AM
    {
      name: "retentionSweep",
      data: {}
    }
  );
  
  logger.info("Scheduled cron jobs registered.");
});
