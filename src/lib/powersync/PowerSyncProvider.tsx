"use client";

// =============================================================================
// src/lib/powersync/PowerSyncProvider.tsx
// React provider that:
// 1. Creates the PowerSyncDatabase singleton
// 2. Connects it via the LexoraConnector (Supabase auth bridge)
// 3. Watches for auth state changes → reconnect on login, clear on logout
// 4. Exposes the database via PowerSyncContext for useQuery / usePowerSync
// =============================================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { PowerSyncContext } from "@powersync/react";
import type { PowerSyncDatabase } from "@powersync/web";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getDatabase, destroyDatabase } from "@/lib/powersync/database";
import { LexoraConnector } from "@/lib/powersync/connector";

// ---------------------------------------------------------------------------
// Auth context — provides userId to the rest of the app
// ---------------------------------------------------------------------------
interface AuthContextValue {
  userId: string | null;
  isLoadingAuth: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  userId: null,
  isLoadingAuth: true,
  signOut: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

// ---------------------------------------------------------------------------
// PowerSync + Auth Provider
// ---------------------------------------------------------------------------
interface PowerSyncProviderProps {
  readonly children: ReactNode;
}

export function LexoraPowerSyncProvider({
  children,
}: PowerSyncProviderProps): React.JSX.Element {
  const [db, setDb] = useState<PowerSyncDatabase | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const connectorRef = useRef<LexoraConnector | null>(null);

  // ---------------------------------------------------------------------------
  // Initialize the database and connector
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const database = getDatabase();
    const connector = new LexoraConnector();
    connectorRef.current = connector;
    setDb(database);

    return () => {
      // Don't destroy on unmount — this provider lives at the root
      // Destruction happens only on sign-out
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Watch Supabase auth state → connect/disconnect PowerSync accordingly
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // Get initial session synchronously (no await on mount)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      setIsLoadingAuth(false);
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const database = getDatabase();
      const newUserId = session?.user?.id ?? null;

      setUserId(newUserId);
      setIsLoadingAuth(false);

      if (event === "SIGNED_IN" && newUserId) {
        // Reconnect PowerSync with fresh credentials
        if (connectorRef.current) {
          await database.connect(connectorRef.current);
        }
      } else if (event === "SIGNED_OUT") {
        // Disconnect and clear local data on sign-out
        await database.disconnect();
      } else if (event === "TOKEN_REFRESHED") {
        // Supabase refreshed the JWT — reconnect with new token
        if (connectorRef.current) {
          await database.connect(connectorRef.current);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Trigger initial connection if the user is already signed in
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!db || !userId || !connectorRef.current) return;

    db.connect(connectorRef.current).catch((err: unknown) => {
      console.error("[PowerSync] Initial connect failed:", err);
    });
  }, [db, userId]);

  // ---------------------------------------------------------------------------
  // Sign out — disconnect PowerSync, clear local data, then Supabase sign-out
  // ---------------------------------------------------------------------------
  const signOut = useCallback(async (): Promise<void> => {
    const supabase = getSupabaseBrowserClient();

    try {
      // Clear local SQLite data first to prevent stale data showing
      await destroyDatabase();
      setDb(null);
    } catch (err) {
      console.error("[PowerSync] Clear failed on sign-out:", err);
    } finally {
      await supabase.auth.signOut();
    }
  }, []);

  const authValue = useMemo<AuthContextValue>(
    () => ({ userId, isLoadingAuth, signOut }),
    [userId, isLoadingAuth, signOut]
  );

  // Render children even without db — auth pages don't need PowerSync
  const content = db ? (
    <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>
  ) : (
    <>{children}</>
  );

  return <AuthContext.Provider value={authValue}>{content}</AuthContext.Provider>;
}
