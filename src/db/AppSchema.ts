// =============================================================================
// src/db/AppSchema.ts
// PowerSync local SQLite schema — uses the modern TableV2 column syntax.
//
// Column type rules:
//   column.text    → TEXT  (UUIDs, ISO timestamps, enums, JSON strings)
//   column.integer → INTEGER (booleans as 0/1, counts, version)
//   column.real    → REAL  (FSRS stability, difficulty floats)
//
// PowerSync auto-adds `id TEXT PRIMARY KEY` — never declare it manually.
// =============================================================================

import { Schema, Table, column } from '@powersync/web';

// ---------------------------------------------------------------------------
// Table: users
// ---------------------------------------------------------------------------
const usersTable = new Table(
  {
    role:              column.text,
    theme_preference:  column.text,
    daily_review_goal: column.integer,
    created_at:        column.text,
    updated_at:        column.text,
    version:           column.integer,
    deleted_at:        column.text,
  },
  { indexes: {} },
);

// ---------------------------------------------------------------------------
// Table: tags
// ---------------------------------------------------------------------------
const tagsTable = new Table(
  {
    user_id:    column.text,
    name:       column.text,
    color:      column.text,
    created_at: column.text,
    updated_at: column.text,
    version:    column.integer,
    deleted_at: column.text,
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
    user_id:    column.text,
    word:       column.text,
    phonetics:  column.text,
    audio_url:  column.text,
    created_at: column.text,
    updated_at: column.text,
    version:    column.integer,
    deleted_at: column.text,
  },
  {
    indexes: {
      by_user:      ['user_id'],
      by_user_word: ['user_id', 'word'],
    },
  },
);

// ---------------------------------------------------------------------------
// Table: word_tags (junction)
// PowerSync requires an `id` column per table.
// We synthesise it client-side as `${word_id}:${tag_id}`.
// ---------------------------------------------------------------------------
const wordTagsTable = new Table(
  {
    word_id:    column.text,
    tag_id:     column.text,
    created_at: column.text,
  },
  {
    indexes: {
      by_word: ['word_id'],
      by_tag:  ['tag_id'],
    },
  },
);

// ---------------------------------------------------------------------------
// Table: definitions
// ---------------------------------------------------------------------------
const definitionsTable = new Table(
  {
    word_id:                    column.text,
    user_id:                    column.text,
    meaning:                    column.text,
    part_of_speech:             column.text,
    tiptap_note:                column.text, // JSON.stringify(TiptapDocument) | null
    requested_ai_example_count: column.integer,
    created_at:                 column.text,
    updated_at:                 column.text,
    version:                    column.integer,
    deleted_at:                 column.text,
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
    definition_id:   column.text,
    user_id:         column.text,
    sentence:        column.text,
    is_ai_generated: column.integer, // 0 | 1
    created_at:      column.text,
    updated_at:      column.text,
    version:         column.integer,
    deleted_at:      column.text,
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
    user_id:        column.text,
    definition_id:  column.text,
    quiz_mode:      column.text,
    is_active:      column.integer, // 0 | 1

    // FSRS algorithm fields
    due_date:       column.text,    // ISO 8601 string
    stability:      column.real,
    difficulty:     column.real,
    elapsed_days:   column.integer,
    scheduled_days: column.integer,
    reps:           column.integer,
    lapses:         column.integer,
    state:          column.text,    // 'New' | 'Learning' | 'Review' | 'Relearning'
    last_review:    column.text,    // ISO 8601 string | null

    created_at:     column.text,
    updated_at:     column.text,
    version:        column.integer,
    deleted_at:     column.text,
  },
  {
    indexes: {
      // Primary review queue: active cards by due date
      by_user_due:   ['user_id', 'is_active', 'due_date'],
      // Deck view: filter by quiz mode
      by_user_mode:  ['user_id', 'quiz_mode', 'is_active'],
      // Look up all cards for a definition
      by_definition: ['definition_id'],
      // Statistics: breakdown by state
      by_user_state: ['user_id', 'state', 'is_active'],
    },
  },
);

// ---------------------------------------------------------------------------
// Table: review_logs (append-only, synced up for server statistics)
// ---------------------------------------------------------------------------
const reviewLogsTable = new Table(
  {
    flashcard_id:        column.text,
    user_id:             column.text,
    rating:              column.integer,  // 1=Again | 2=Hard | 3=Good | 4=Easy
    review_time:         column.text,
    previous_state:      column.text,
    new_state:           column.text,
    previous_stability:  column.real,
    new_stability:       column.real,
    previous_difficulty: column.real,
    new_difficulty:      column.real,
    elapsed_days:        column.integer,
    scheduled_days:      column.integer,
    review_duration_ms:  column.integer,
    created_at:          column.text,
  },
  {
    indexes: {
      by_flashcard:  ['flashcard_id'],
      by_user_time:  ['user_id', 'review_time'],
    },
  },
);

// =============================================================================
// AppSchema — registered with PowerSyncDatabase
// =============================================================================
export const AppSchema = new Schema({
  users:       usersTable,
  tags:        tagsTable,
  words:       wordsTable,
  word_tags:   wordTagsTable,
  definitions: definitionsTable,
  examples:    examplesTable,
  flashcards:  flashcardsTable,
  review_logs: reviewLogsTable,
});

// ---------------------------------------------------------------------------
// Type helper: strongly-typed row results for useQuery hooks
// ---------------------------------------------------------------------------
export type Database = (typeof AppSchema)['types'];
