/**
 * Supabase browser client for use in Client Components.
 * Uses env NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * When env is missing, returns a client that will throw on first use (so the app still loads).
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Use placeholder values so the client is created; real requests will fail until env is set
  return createBrowserClient(
    url || "https://placeholder.supabase.co",
    key || "placeholder-anon-key"
  );
}
