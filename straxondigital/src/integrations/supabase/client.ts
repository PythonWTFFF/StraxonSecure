import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error("Missing Supabase environment variables. Check your .env file.");
}

// Ensure a single instance is used to prevent multiple GoTrueClient warnings during HMR
let client: ReturnType<typeof createClient<Database>>;

const createSupabaseClient = () => createClient<Database>(
  SUPABASE_URL || "", 
  SUPABASE_PUBLISHABLE_KEY || "", 
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  }
);

if (import.meta.hot) {
  if (!import.meta.hot.data.supabase) {
    import.meta.hot.data.supabase = createSupabaseClient();
  }
  client = import.meta.hot.data.supabase;
} else {
  client = createSupabaseClient();
}

export const supabase = client;