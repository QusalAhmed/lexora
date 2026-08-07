// =============================================================================
// src/db/AppSchema.ts
// PowerSync local SQLite schema definition.
//
// Rules:
// - Column types: text | integer | real (SQLite primitives only)
// - Booleans → integer (0/1)
// - TIMESTAMPTZ → text (ISO 8601)
// - JSONB → text (JSON.stringify)
// - UUIDs → text
// - Enums → text (validated via Zod on read)
// - PowerSync auto-adds `id` (text PRIMARY KEY) — never redeclare it
// =============================================================================

import {
  Schema,
  Table,
  Column,
  ColumnType,
} from '@powersync/web';

// ---------------------------------------------------------------------------
// Helper: shorthand column constructors
// ---------------------------------------------------------------------------
const text = (name: string): Column => new Column({ name, type: ColumnType.TEXT });
const integer = (name: string): Column => new Column({ name, type: ColumnType.INTEGER });
const real = (name: string): Column => new Column({ name, type: ColumnType.REAL });

// ---------------------------------------------------------------------------
// Table: users
// ---------------------------------------------------------------------------
const usersTable = new Table(
  {
    // id is auto-added by PowerSync
    role: text('role'),
    theme_preference: text('theme_preference'),
    daily_review_goal: integer('daily_review_goal'),
    created_at: text('created_at'),
    updated_at: text('updated_at'),
    version: integer('version'),
    deleted_at: text('deleted_at'),
  },
  { indexes: {} },
);

// ---------------------------------------------------------------------------
// Table: tags
// ---------------------------------------------------------------------------
const tagsTable = new Table(
  {
    user_id: text('user_id'),
    name: text('name'),
    color: text('color'),
    created_at: text('created_at'),
    updated_at: text('updated_at'),
    version: integer('version'),
    deleted_at: text('deleted_at'),
  },
  {
    indexes: {
      by_user: ['user_id'],
    },
  },
);

// ---------------------------------------------------------------------------
// Table: words
// ---------------------------------------------------------------------------
const wordsTable = new Table(
  {
    user_id: text('user_id'),
    word: text('word'),
    phonetics: text('phonetics'),
    audio_url: text('audio_url'),
    created_at: text('created_at'),
    updated_at: text('updated_at'),
    version: integer('version'),
    deleted_at: text('deleted_at'),
  },
  {
    indexes: {
      by_user: ['user_id'],
      by_user_word: ['user_id', 'word'],
    },
  },
);

// ---------------------------------------------------------------------------
// Table: word_tags (junction — no FSRS data, simple pivot)
// PowerSync requires an 'id' column. We synthesise: word_id + ':' + tag_id
// ---------------------------------------------------------------------------
const wordTagsTable = new Table(
  {
    word_id: text('word_id'),
    tag_id: text('tag_id'),
    created_at: text('created_at'),
  },
  {
    indexes: {
      by_word: ['word_id'],
      by_tag: ['tag_id'],
    },
  },
);

// ---------------------------------------------------------------------------
// Table: definitions
// ---------------------------------------------------------------------------
const definitionsTable = new Table(
  {
    word_id: text('word_id'),
    user_id: text('user_id'),
    meaning: text('meaning'),
    part_of_speech: text('part_of_speech'),
    tiptap_note: text('tiptap_note'), // JSON.stringify(TiptapDocument) | null
    requested_ai_example_count: integer('requested_ai_example_count'),
    created_at: text('created_at'),
    updated_at: text('updated_at'),
    version: integer('version'),
    deleted_at: text('deleted_at'),
  },
  {
    indexes: {
      by_word: ['word_id'],
      by_user: ['user_id'],
    },
  },
);

// ---------------------------------------------------------------------------
// Table: examples
// ---------------------------------------------------------------------------
const examplesTable = new Table(
  {
    definition_id: text('definition_id'),
    user_id: text('user_id'),
    sentence: text('sentence'),
    is_ai_generated: integer('is_ai_generated'), // 0 | 1
    created_at: text('created_at'),
    updated_at: text('updated_at'),
    version: integer('version'),
    deleted_at: text('deleted_at'),
  },
  {
    indexes: {
      by_definition: ['definition_id'],
    },
  },
);

// ---------------------------------------------------------------------------
// Table: flashcards
// ---------------------------------------------------------------------------
const flashcardsTable = new Table(
  {
    user_id: text('user_id'),
    definition_id: text('definition_id'),
    quiz_mode: text('quiz_mode'),
    is_active: integer('is_active'), // 0 | 1
    // FSRS fields
    due_date: text('due_date'),
    stability: real('stability'),
    difficulty: real('difficulty'),
    elapsed_days: integer('elapsed_days'),
    scheduled_days: integer('scheduled_days'),
    reps: integer('reps'),
    lapses: integer('lapses'),
    state: text('state'),
    last_review: text('last_review'),
    created_at: text('created_at'),
    updated_at: text('updated_at'),
    version: integer('version'),
    deleted_at: text('deleted_at'),
  },
  {
    indexes: {
      // Primary review queue: active cards ordered by due_date
      by_user_due: ['user_id', 'is_active', 'due_date'],
      // Filter by quiz mode deck
      by_user_mode: ['user_id', 'quiz_mode', 'is_active'],
      // Look up flashcards for a definition
      by_definition: ['definition_id'],
      // Statistics / state breakdown
      by_user_state: ['user_id', 'state', 'is_active'],
    },
  },
);

// ---------------------------------------------------------------------------
// Table: review_logs (append-only, synced up for server stats)
// ---------------------------------------------------------------------------
const reviewLogsTable = new Table(
  {
    flashcard_id: text('flashcard_id'),
    user_id: text('user_id'),
    rating: integer('rating'),
    review_time: text('review_time'),
    previous_state: text('previous_state'),
    new_state: text('new_state'),
    previous_stability: real('previous_stability'),
    new_stability: real('new_stability'),
    previous_difficulty: real('previous_difficulty'),
    new_difficulty: real('new_difficulty'),
    elapsed_days: integer('elapsed_days'),
    scheduled_days: integer('scheduled_days'),
    review_duration_ms: integer('review_duration_ms'),
    created_at: text('created_at'),
  },
  {
    indexes: {
      by_flashcard: ['flashcard_id'],
      by_user_time: ['user_id', 'review_time'],
    },
  },
);

// =============================================================================
// AppSchema — registered with PowerSyncDatabase
// =============================================================================
export const AppSchema = new Schema({
  users: usersTable,
  tags: tagsTable,
  words: wordsTable,
  word_tags: wordTagsTable,
  definitions: definitionsTable,
  examples: examplesTable,
  flashcards: flashcardsTable,
  review_logs: reviewLogsTable,
});

// ---------------------------------------------------------------------------
// Type helper: extract the row type for a given table name
// Used in useQuery hooks to get strongly-typed results.
// ---------------------------------------------------------------------------
export type Database = (typeof AppSchema)['types'];
