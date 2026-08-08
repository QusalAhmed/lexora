// =============================================================================
// src/lib/supabase/server.ts
// Server-side Supabase client — safe to use in Server Components, Server
// Actions, Route Handlers, and Middleware (via the cookies() API).
// =============================================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client for use in Server Components and Server Actions.
 * Must be called inside an async context where next/headers cookies() works.
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options ?? {})
            );
          } catch {
            // Server Components can't set cookies — this is expected.
            // The middleware refreshes auth cookies automatically.
          }
        },
      },
    }
  );
}

/**
 * Returns the authenticated user from the Supabase server client.
 * Returns null if not authenticated.
 * Uses getUser() (not getSession()) to validate the JWT against Supabase Auth server.
 */
export async function getServerUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}
