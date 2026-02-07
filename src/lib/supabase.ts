import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Optional: app works without Supabase (local-only). Supabase used only if env is set.
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
