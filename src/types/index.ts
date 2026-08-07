// =============================================================================
// src/types/index.ts
// Shared TypeScript interfaces for Lexora.
// These mirror the Supabase DB schema exactly. Never use `any`.
// =============================================================================

// ---------------------------------------------------------------------------
// Enums (must stay in sync with Supabase enum definitions)
// ---------------------------------------------------------------------------
export type QuizMode =
  | 'WORD_TO_MEANING'
  | 'MEANING_TO_WORD'
  | 'MEANING_TO_SPELLING';

export type CardState = 'New' | 'Learning' | 'Review' | 'Relearning';

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'interjection'
  | 'article'
  | 'phrase';

export type UserRole = 'user' | 'admin';

export type ThemePreference = 'dark' | 'light' | 'system';

// ---------------------------------------------------------------------------
// FSRS Rating (1=Again, 2=Hard, 3=Good, 4=Easy)
// ---------------------------------------------------------------------------
export type FsrsRating = 1 | 2 | 3 | 4;

// ---------------------------------------------------------------------------
// Offline-first base fields (shared by all synced entities)
// ---------------------------------------------------------------------------
interface OfflineFields {
  version: number;
  deleted_at: string | null;
}

// ---------------------------------------------------------------------------
// Entity: UserProfile
// ---------------------------------------------------------------------------
export interface UserProfile extends OfflineFields {
  id: string;
  role: UserRole;
  theme_preference: ThemePreference;
  daily_review_goal: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Entity: Tag
// ---------------------------------------------------------------------------
export interface Tag extends OfflineFields {
  id: string;
  user_id: string;
  name: string;
  color: string; // #RRGGBB hex
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Entity: Word
// ---------------------------------------------------------------------------
export interface Word extends OfflineFields {
  id: string;
  user_id: string;
  word: string;
  phonetics: string | null;
  audio_url: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Entity: WordTag (junction)
// ---------------------------------------------------------------------------
export interface WordTag {
  word_id: string;
  tag_id: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Entity: Definition
// ---------------------------------------------------------------------------
export interface Definition extends OfflineFields {
  id: string;
  word_id: string;
  user_id: string;
  meaning: string;
  part_of_speech: PartOfSpeech;
  tiptap_note: TiptapDocument | null;
  requested_ai_example_count: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Entity: Example
// ---------------------------------------------------------------------------
export interface Example extends OfflineFields {
  id: string;
  definition_id: string;
  user_id: string;
  sentence: string;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Entity: Flashcard (contains all FSRS fields)
// ---------------------------------------------------------------------------
export interface Flashcard extends OfflineFields {
  id: string;
  user_id: string;
  definition_id: string;
  quiz_mode: QuizMode;
  is_active: boolean;

  // FSRS fields
  due_date: string; // ISO 8601 string
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: CardState;
  last_review: string | null;

  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Entity: ReviewLog (append-only)
// ---------------------------------------------------------------------------
export interface ReviewLog {
  id: string;
  flashcard_id: string;
  user_id: string;
  rating: FsrsRating;
  review_time: string;
  previous_state: CardState;
  new_state: CardState;
  previous_stability: number;
  new_stability: number;
  previous_difficulty: number;
  new_difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  review_duration_ms: number | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Tiptap Document shape (ProseMirror JSON)
// ---------------------------------------------------------------------------
export interface TiptapDocument {
  type: 'doc';
  content: TiptapNode[];
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, string | number | boolean | null>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
}

export interface TiptapMark {
  type: string;
  attrs?: Record<string, string | number | boolean | null>;
}

// ---------------------------------------------------------------------------
// Composite / View types (enriched queries, never persisted directly)
// ---------------------------------------------------------------------------

/** Word with its definitions, tags, and examples — for the detail view */
export interface WordDetail extends Word {
  definitions: DefinitionWithExamples[];
  tags: Tag[];
}

/** Definition enriched with its examples */
export interface DefinitionWithExamples extends Definition {
  examples: Example[];
  flashcards: Flashcard[];
}

/** Flashcard enriched with definition + word for the review UI */
export interface FlashcardWithContext extends Flashcard {
  definition: Definition;
  word: Word;
  examples: Example[];
}

/** Stats view row */
export interface DailyReviewStat {
  user_id: string;
  review_date: string;
  total_reviews: number;
  easy_count: number;
  good_count: number;
  hard_count: number;
  again_count: number;
  avg_duration_ms: number | null;
}

// ---------------------------------------------------------------------------
// PowerSync local row shapes (SQLite columns are snake_case strings)
// These are used by AppSchema table definitions and useQuery hooks.
// ---------------------------------------------------------------------------
export type PowerSyncRow = Record<string, string | number | null>;
