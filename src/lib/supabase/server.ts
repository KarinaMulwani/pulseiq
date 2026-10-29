import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl.startsWith("http") &&
  supabaseServiceKey &&
  supabaseServiceKey.length > 10
);

export function getServerSupabase() {
  if (!isServerSupabaseConfigured) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
