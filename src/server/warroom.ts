import { traceRequest } from "@/server/telemetry-middleware";
import type { ServerContext } from "@/server/context";
import { createServerFn } from "@tanstack/react-start";
import { requireRequestId } from "@/server/security/requestId";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const getWarrooms = createServerFn({ method: "GET" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: sessions, error } = await supabaseAdmin
      .from("warroom_sessions")
      .select("*, owner:profiles(display_name)")
      .order("created_at", { ascending: false });

    if (error) throw new Error("Failed to load warrooms");
    return sessions;
  });

export const createWarroom = createServerFn({ method: "POST" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .validator((d) => z.object({ title: z.string(), scenario: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: session, error } = await supabaseAdmin
      .from("warroom_sessions")
      .insert({
        title: data.title,
        scenario: data.scenario,
        owner_id: (context as ServerContext).userId as string,
      })
      .select()
      .single();

    if (error) throw new Error("Failed to create warroom");
    return session;
  });

export const getMessages = createServerFn({ method: "GET" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .validator((d) => z.object({ sessionId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: messages, error } = await supabaseAdmin
      .from("warroom_messages")
      .select("*, profiles(display_name)")
      .eq("session_id", data.sessionId)
      .order("created_at", { ascending: true });

    if (error) throw new Error("Failed to load messages");
    return messages;
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([traceRequest, requireRequestId, requireSupabaseAuth])
  .validator((d) => z.object({ sessionId: z.string().uuid(), content: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin.from("warroom_messages").insert({
      session_id: data.sessionId,
      user_id: (context as ServerContext).userId as string,
      content: data.content,
    });

    if (error) throw new Error("Failed to send message");
    return { success: true };
  });
