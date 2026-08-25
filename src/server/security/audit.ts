import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface AuditEvent {
  requestId: string;
  actorUserId: string;
  orgId: string;
  action: string;
  target?: string;
  serverFn: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

/**
 * Appends an immutable audit log entry directly to the database using the
 * Supabase Service Role key (bypassing RLS insert restrictions).
 */
export async function logAudit(event: AuditEvent) {
  try {
    const { error } = await (supabaseAdmin as any).from("audit_log").insert({
      request_id: event.requestId,
      actor_user_id: event.actorUserId,
      org_id: event.orgId,
      action: event.action,
      target: event.target,
      server_fn: event.serverFn,
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
