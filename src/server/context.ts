import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface ServerContext {
  userId: string;
  user?: any;
  supabase?: SupabaseClient<Database>;
  requestId?: string;
  teamId?: string;
  teamRole?: string;
  isAdmin?: boolean;
  orgId?: string;
}
