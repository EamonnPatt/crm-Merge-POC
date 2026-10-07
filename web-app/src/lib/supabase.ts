import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

/** False when the two VITE_SUPABASE_* variables were not present at build time; the demo store keeps working without them. */
export const isSupabaseConfigured = Boolean(url && publishableKey);

/**
 * Browser client for the Supabase project. It only ever holds the publishable key: what a user can read or write is
 * decided by Row Level Security against their signed-in role, never by this key. Never put the service_role key
 * or the database password in a VITE_ variable, since Vite ships those to every visitor.
 */
export const supabase = createClient<Database>(url ?? "http://localhost:54321", publishableKey ?? "not-configured", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
