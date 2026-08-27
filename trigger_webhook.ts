import { triggerWebhooks } from "./src/server/webhooks.server";

async function testWebhook() {
  const userId = "5e04bfbf-5df2-485a-8e87-5572c7dac351";
  
  console.log(`Triggering webhook for user: ${userId}`);
  
  await triggerWebhooks(userId, "test.anomaly", {
    threatLevel: "critical",
    processName: "test_process.exe",
    analysis: "This is a test anomaly detected via Straxon AI engine!"
  });
  
  console.log("Triggered!");
}

testWebhook();
