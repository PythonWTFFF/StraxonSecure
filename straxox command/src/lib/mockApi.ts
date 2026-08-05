import { debugLog } from "@/components/DebugConsole";

// Simulated API delay
function simulateLatency(min = 200, max = 800): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min)) + min;
  debugLog("api", `Simulated latency: ${ms}ms`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockSaveInvoice(data: any): Promise<{ success: boolean; id: string }> {
  debugLog("api", `POST /api/invoices — saving ${data.invoiceNumber}`);
  await simulateLatency();
  const id = crypto.randomUUID();
  debugLog("api", `201 Created — invoice ${id}`);
  return { success: true, id };
}

export async function mockFireWebhook(event: string, payload: any): Promise<{ status: number; ok: boolean }> {
  debugLog("api", `POST /webhooks/fire — event: ${event}`);
  await simulateLatency(300, 1200);
  const success = Math.random() > 0.1;
  const status = success ? 200 : 500;
  debugLog(success ? "info" : "error", `Webhook ${event} → ${status} ${success ? "OK" : "FAIL"}`);
  return { status, ok: success };
}

export async function mockGenerateApiKey(): Promise<string> {
  debugLog("api", "POST /api/keys/generate");
  await simulateLatency();
  const key = `stx_live_${crypto.randomUUID().replace(/-/g, "").slice(0, 32)}`;
  debugLog("info", `API key generated: ${key.slice(0, 12)}...`);
  return key;
}

// Saved invoices in memory (simulated DB)
let savedInvoices: any[] = [];

export function getSavedInvoices() {
  return savedInvoices;
}

export function addSavedInvoice(invoice: any) {
  savedInvoices = [{ ...invoice, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: "draft" }, ...savedInvoices];
  return savedInvoices[0];
}

export function cloneInvoice(id: string) {
  const original = savedInvoices.find((inv) => inv.id === id);
  if (!original) return null;
  const cloned = {
    ...original,
    id: crypto.randomUUID(),
    invoiceNumber: original.invoiceNumber + "-COPY",
    createdAt: new Date().toISOString(),
    status: "draft",
  };
  savedInvoices = [cloned, ...savedInvoices];
  debugLog("info", `Cloned invoice ${original.invoiceNumber} → ${cloned.invoiceNumber}`);
  return cloned;
}
