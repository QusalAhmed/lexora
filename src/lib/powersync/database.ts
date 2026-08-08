// =============================================================================
// src/lib/powersync/database.ts
// PowerSync database singleton factory.
//
// The PowerSyncDatabase is browser-only (uses IndexedDB + WebAssembly).
// We guard against SSR by checking `typeof window`.
// The singleton pattern ensures only one database connection exists
// across the entire React tree.
// =============================================================================

import { PowerSyncDatabase, WASQLiteOpenFactory } from "@powersync/web";
import { AppSchema } from "@/db/AppSchema";

let _database: PowerSyncDatabase | null = null;

/**
 * Returns the singleton PowerSyncDatabase instance.
 * Creates it on first call (browser only).
 *
 * @throws Error if called on the server (SSR)
 */
export function getDatabase(): PowerSyncDatabase {
  if (typeof window === "undefined") {
    throw new Error(
      "[Lexora] PowerSyncDatabase cannot be instantiated on the server. " +
        "Make sure this is called only from a Client Component or useEffect."
    );
  }

  if (!_database) {
    _database = new PowerSyncDatabase({
      schema: AppSchema,
      database: new WASQLiteOpenFactory({
        dbFilename: "lexora.db",
        flags: {
          // Enable multi-tab sync if SharedArrayBuffer is available
          // (requires COOP/COEP headers — configured in next.config.ts)
          enableMultiTabs: typeof SharedArrayBuffer !== "undefined",
          // Use the async WebAssembly build for better performance
          useWebWorker: typeof SharedArrayBuffer !== "undefined",
        },
      }),
    });
  }

  return _database;
}

/**
 * Closes and destroys the singleton database instance.
 * Called on sign-out to clean up local state.
 */
export async function destroyDatabase(): Promise<void> {
  if (_database) {
    await _database.disconnectAndClear();
    _database = null;
  }
}
