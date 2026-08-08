// =============================================================================
// src/lib/powersync/connector.ts
// PowerSync Backend Connector — bridges the PowerSync local SQLite engine
// with Supabase (auth tokens + CRUD upload).
//
// Responsibilities:
// 1. fetchCredentials: Provide a valid JWT so PowerSync can authenticate
//    with the PowerSync sync service.
// 2. uploadData: Flush the local CRUD queue to Supabase, applying each
//    pending operation to the correct Supabase table.
// =============================================================================

import type {
  PowerSyncBackendConnector,
  AbstractPowerSyncDatabase,
  CrudEntry,
} from "@powersync/web";
import { UpdateType } from "@powersync/web";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Tables that store boolean columns as SQLite integers (0/1).
// These must be coerced back to Postgres booleans on upload.
// ---------------------------------------------------------------------------
const BOOLEAN_COLUMNS: Record<string, readonly string[]> = {
  flashcards: ["is_active"],
  examples: ["is_ai_generated"],
} as const;

// ---------------------------------------------------------------------------
// Tables that store JSONB columns as SQLite text (JSON strings).
// These must be parsed back to JSON objects on upload.
// ---------------------------------------------------------------------------
const JSONB_COLUMNS: Record<string, readonly string[]> = {
  definitions: ["tiptap_note"],
} as const;

/**
 * Coerces a SQLite row (all values are text/integer/real) back into the
 * correct Postgres types before uploading to Supabase.
 */
function coerceRowForSupabase(
  tableName: string,
  row: Record<string, unknown>
): Record<string, unknown> {
  const coerced: Record<string, unknown> = { ...row };

  // Coerce integer booleans → actual booleans
  const boolCols = BOOLEAN_COLUMNS[tableName] ?? [];
  for (const col of boolCols) {
    if (col in coerced && coerced[col] !== null) {
      coerced[col] = coerced[col] === 1 || coerced[col] === "1";
    }
  }

  // Coerce JSON text strings → objects
  const jsonCols = JSONB_COLUMNS[tableName] ?? [];
  for (const col of jsonCols) {
    if (col in coerced && coerced[col] !== null && typeof coerced[col] === "string") {
      try {
        coerced[col] = JSON.parse(coerced[col] as string);
      } catch {
        // If JSON is malformed, set to null to avoid Supabase error
        coerced[col] = null;
      }
    }
  }

  return coerced;
}

/**
 * Processes a single CRUD entry against Supabase.
 * Returns the Supabase error if one occurred, or null on success.
 */
async function processCrudEntry(
  entry: CrudEntry
): Promise<{ message: string } | null> {
  const supabase = getSupabaseBrowserClient();
  const table = supabase.from(entry.table);

  switch (entry.op) {
    case UpdateType.PUT: {
      // PUT = local INSERT or REPLACE — use upsert for idempotency
      const opData = coerceRowForSupabase(entry.table, {
        id: entry.id,
        ...(entry.opData ?? {}),
      });
      const { error } = await table.upsert(opData, {
        onConflict: "id",
        ignoreDuplicates: false,
      });
      // 409 Conflict means the row already exists with same data — safe to skip
      if (error && error.code !== "23505" && error.code !== "409") {
        return error;
      }
      return null;
    }

    case UpdateType.PATCH: {
      // PATCH = local UPDATE
      if (!entry.opData) return null;
      const opData = coerceRowForSupabase(entry.table, entry.opData);
      const { error } = await table.update(opData).eq("id", entry.id);
      return error ?? null;
    }

    case UpdateType.DELETE: {
      // DELETE = hard delete (we use soft deletes, but handle this as a fallback)
      const { error } = await table.delete().eq("id", entry.id);
      return error ?? null;
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// LexoraConnector — implements PowerSyncBackendConnector
// ---------------------------------------------------------------------------
export class LexoraConnector implements PowerSyncBackendConnector {
  /**
   * Provides auth credentials to the PowerSync sync service.
   * PowerSync validates the Supabase JWT using the configured Supabase
   * project URL and JWT secret in the PowerSync dashboard.
   */
  async fetchCredentials(): Promise<{
    endpoint: string;
    token: string;
    expiresAt?: Date;
    userId?: string;
  } | null> {
    const supabase = getSupabaseBrowserClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      // Not authenticated — PowerSync will pause sync until credentials arrive
      return null;
    }

    const powerSyncUrl = process.env.NEXT_PUBLIC_POWERSYNC_URL;
    if (!powerSyncUrl) {
      throw new Error("NEXT_PUBLIC_POWERSYNC_URL is not defined in your .env.local");
    }

    return {
      endpoint: powerSyncUrl,
      token: session.access_token,
      expiresAt: new Date(session.expires_at! * 1000),
      userId: session.user.id,
    };
  }

  /**
   * Uploads the pending local CRUD operations to Supabase.
   * Called by PowerSync when the device is online and has queued operations.
   *
   * Strategy:
   * - Process all operations in the current transaction atomically
   * - On non-retriable errors (constraint violations), log and complete
   *   the transaction anyway to avoid an infinite retry loop
   * - On retriable errors (network), throw so PowerSync retries
   */
  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    let lastError: { message: string } | null = null;

    try {
      for (const entry of transaction.crud) {
        const error = await processCrudEntry(entry);

        if (error) {
          lastError = error;
          console.error(
            `[PowerSync] Upload error on ${entry.table}[${entry.id}]:`,
            error
          );

          // Non-retriable constraint errors: complete the transaction to
          // unblock the queue. The data inconsistency will be resolved by
          // the next full sync.
          const isConstraintError =
            error.message?.includes("violates") ||
            error.message?.includes("duplicate");

          if (!isConstraintError) {
            // Retriable (network/timeout) — throw to trigger retry
            throw new Error(error.message);
          }
        }
      }

      await transaction.complete();

      if (lastError) {
        console.warn(
          "[PowerSync] Transaction completed with non-fatal constraint errors:",
          lastError.message
        );
      }
    } catch (error) {
      // Don't call transaction.complete() on retriable errors —
      // PowerSync will retry automatically
      throw error;
    }
  }
}
