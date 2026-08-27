import type { ServerContext } from "@/server/context";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface AuditEvent {
  action: string;
  target?: string;
  metadata?: Record<string, any>;
  serverFn?: string;
  ipAddress?: string;
  requestId?: string;
  actorUserId?: string;
  orgId?: string;
}

/**
 * Appends an immutable audit log entry directly to the database using the
 * Supabase Service Role key (bypassing RLS insert restrictions).
 */
export async function logAudit(context: ServerContext, event: AuditEvent) {
  try {
    const reqId = event.requestId || context.requestId || "unknown";
    const userId = event.actorUserId || context.userId || "system";
    const orgId = event.orgId || context.orgId || "00000000-0000-0000-0000-000000000000";

    const { error } = await supabaseAdmin.from("audit_log").insert({
      request_id: reqId,
      actor_user_id: userId,
      org_id: orgId,
      action: event.action,
      target: event.target,
      server_fn: event.serverFn || "unknown",
      ip_address: event.ipAddress,
      metadata: event.metadata ?? {},
    });

    if (error) {
      console.error("[Audit Log Failed]", error);
      // In production, you might want to fail the request if logging fails for strict compliance
      // throw new Error("Failed to write audit log");
    }
  } catch (err) {
    console.error("[Audit Log Exception]", err);
  }
}
