// =============================================================================
// src/lib/supabase/client.ts
// Browser-side Supabase client — safe to import in Client Components.
// Uses @supabase/ssr's createBrowserClient for proper cookie handling.
// =============================================================================

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Lazily created singleton — avoids creating multiple clients in the browser
let _client: SupabaseClient | null = null;

/**
 * Returns the browser-side Supabase client singleton.
 *
 * NOTE: NEXT_PUBLIC_* vars are embedded at compile time by Turbopack.
 * If they're missing, it means the .env.local file wasn't present when
 * the dev server started. Restart the dev server after creating .env.local.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!url || !anonKey) {
    console.error(
      "[Lexora] Supabase environment variables are not set.\n" +
        "Copy .env.local.example to .env.local and restart the dev server."
    );
    // Return a dummy client — will fail on actual requests, not on render
    _client = createBrowserClient("https://placeholder.supabase.co", "placeholder");
    return _client;
  }

  _client = createBrowserClient(url, anonKey);
  return _client;
}

/**
 * Resets the singleton (used after sign-out to force fresh initialization).
 */
export function resetSupabaseBrowserClient(): void {
  _client = null;
}
