import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export const getPlaybooks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (supabaseAdmin as any)
      .from("ir_playbooks")
      .select("*, author:profiles(display_name)")
      .or(`is_public.eq.true,author_id.eq.${context.userId}`)
      .order("created_at", { ascending: false });

    if (error) throw new Error("Failed to load playbooks");
    return data;
  });

export const savePlaybook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({
    id: z.string().uuid().optional(),
    title: z.string(),
    description: z.string(),
    steps: z.array(z.any()),
    isPublic: z.boolean()
  }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.id) {
      // Update
      const { error } = await (supabaseAdmin as any)
        .from("ir_playbooks")
        .update({
          title: data.title,
          description: data.description,
          steps: data.steps,
          is_public: data.isPublic
        })
        .eq("id", data.id)
        .eq("author_id", context.userId);
      if (error) throw new Error("Failed to update playbook");
    } else {
      // Insert
      const { error } = await (supabaseAdmin as any)
        .from("ir_playbooks")
        .insert({
          title: data.title,
          description: data.description,
          steps: data.steps,
          is_public: data.isPublic,
          author_id: context.userId
        });
      if (error) throw new Error("Failed to create playbook");
    }
    return { success: true };
  });

export const deletePlaybook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await (supabaseAdmin as any)
      .from("ir_playbooks")
      .delete()
      .eq("id", data.id)
      .eq("author_id", context.userId);
    
    if (error) throw new Error("Failed to delete playbook");
    return { success: true };
  });
