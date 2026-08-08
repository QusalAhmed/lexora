"use client";

// =============================================================================
// src/hooks/useDatabase.ts
// Typed hook for accessing the PowerSync database instance from context.
// Re-exports @powersync/react hooks with proper typing guards.
// =============================================================================

import { usePowerSync, useQuery, useStatus } from "@powersync/react";
import type { PowerSyncDatabase } from "@powersync/web";
import type { SyncStatus } from "@powersync/web";

/**
 * Returns the PowerSync database instance from context.
 * Throws a descriptive error if used outside of LexoraPowerSyncProvider.
 */
export function useDatabase(): PowerSyncDatabase {
  const db = usePowerSync();
  if (!db) {
    throw new Error(
      "[useDatabase] Must be used inside <LexoraPowerSyncProvider>. " +
        "Wrap your app with <LexoraPowerSyncProvider> in layout.tsx."
    );
  }
  return db as PowerSyncDatabase;
}

/**
 * Returns the current PowerSync sync status.
 * Useful for showing connection state, sync progress, upload queue size, etc.
 */
export function useSyncStatus(): SyncStatus {
  return useStatus() as SyncStatus;
}

// Re-export useQuery for convenience (typed via AppSchema inference)
export { useQuery };
