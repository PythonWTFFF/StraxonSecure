import { supabase } from "@/integrations/supabase/client";

/**
 * Calls a TanStack server function with the current user's bearer token attached.
 * Required for any server function that uses requireSupabaseAuth middleware.
 */
export async function callAuthed<T, A>(
  fn: (args: { data: A; headers?: Record<string, string> }) => Promise<T>,
  args: A,
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }
  return fn({ data: args, headers });
}
