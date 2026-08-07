// =============================================================================
// src/schemas/index.ts
// Zod validation schemas — single source of truth for client & server.
// All schemas mirror the DB constraints exactly so validation is consistent.
// =============================================================================

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enum schemas
// ---------------------------------------------------------------------------
export const QuizModeSchema = z.enum([
  'WORD_TO_MEANING',
  'MEANING_TO_WORD',
  'MEANING_TO_SPELLING',
]);

export const CardStateSchema = z.enum([
  'New',
  'Learning',
  'Review',
  'Relearning',
]);

export const PartOfSpeechSchema = z.enum([
  'noun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'preposition',
  'conjunction',
  'interjection',
  'article',
  'phrase',
]);

export const FsrsRatingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export const UserRoleSchema = z.enum(['user', 'admin']);

export const ThemePreferenceSchema = z.enum(['dark', 'light', 'system']);

// ---------------------------------------------------------------------------
// Tiptap Document schema (ProseMirror JSON)
// We use z.unknown() for recursive node references to avoid circular type
// issues with exactOptionalPropertyTypes, then re-cast at boundaries.
// ---------------------------------------------------------------------------
export const TiptapMarkSchema = z.object({
  type: z.string().min(1),
  attrs: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

// Recursive node — z.lazy() avoids the circular reference. We use
// z.unknown() for the nested arrays to sidestep exactOptionalPropertyTypes
// conflicts on the explicit ZodType generic annotation.
export const TiptapNodeSchema: z.ZodSchema = z.lazy(() =>
  z.object({
    type: z.string().min(1),
    attrs: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
    content: z.array(z.unknown()).optional(),
    marks: z.array(TiptapMarkSchema).optional(),
    text: z.string().optional(),
  }),
);

export const TiptapDocumentSchema = z.object({
  type: z.literal('doc'),
  content: z.array(TiptapNodeSchema),
});

// ---------------------------------------------------------------------------
// Schema: UserProfile
// ---------------------------------------------------------------------------
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  role: UserRoleSchema,
  theme_preference: ThemePreferenceSchema,
  daily_review_goal: z.number().int().min(1).max(500),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  version: z.number().int().nonnegative(),
  deleted_at: z.string().datetime().nullable(),
});

// ---------------------------------------------------------------------------
// Schema: Tag
// ---------------------------------------------------------------------------
export const TagSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1).max(50).trim(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color (e.g. #6366f1)'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  version: z.number().int().nonnegative(),
  deleted_at: z.string().datetime().nullable(),
});

/** Used in forms when creating/updating a tag */
export const CreateTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Tag name too long').trim(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')
    .default('#6366f1'),
});

// ---------------------------------------------------------------------------
// Schema: Word
// ---------------------------------------------------------------------------
export const WordSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  word: z.string().min(1).max(200).trim(),
  phonetics: z.string().max(300).nullable(),
  audio_url: z.string().url().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  version: z.number().int().nonnegative(),
  deleted_at: z.string().datetime().nullable(),
});

// ---------------------------------------------------------------------------
// Schema: Definition
// ---------------------------------------------------------------------------
export const DefinitionSchema = z.object({
  id: z.string().uuid(),
  word_id: z.string().uuid(),
  user_id: z.string().uuid(),
  meaning: z.string().min(1, 'Meaning is required').max(2000).trim(),
  part_of_speech: PartOfSpeechSchema,
  tiptap_note: TiptapDocumentSchema.nullable(),
  requested_ai_example_count: z.number().int().min(1).max(10).default(3),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  version: z.number().int().nonnegative(),
  deleted_at: z.string().datetime().nullable(),
});

// ---------------------------------------------------------------------------
// Schema: Example
// ---------------------------------------------------------------------------
export const ExampleSchema = z.object({
  id: z.string().uuid(),
  definition_id: z.string().uuid(),
  user_id: z.string().uuid(),
  sentence: z.string().min(1).max(1000).trim(),
  is_ai_generated: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  version: z.number().int().nonnegative(),
  deleted_at: z.string().datetime().nullable(),
});

// ---------------------------------------------------------------------------
// Schema: Flashcard
// ---------------------------------------------------------------------------
export const FlashcardSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  definition_id: z.string().uuid(),
  quiz_mode: QuizModeSchema,
  is_active: z.boolean(),
  due_date: z.string().datetime(),
  stability: z.number().nonnegative(),
  difficulty: z.number().min(0).max(10),
  elapsed_days: z.number().int().nonnegative(),
  scheduled_days: z.number().int().nonnegative(),
  reps: z.number().int().nonnegative(),
  lapses: z.number().int().nonnegative(),
  state: CardStateSchema,
  last_review: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  version: z.number().int().nonnegative(),
  deleted_at: z.string().datetime().nullable(),
});

// ---------------------------------------------------------------------------
// Schema: ReviewLog
// ---------------------------------------------------------------------------
export const ReviewLogSchema = z.object({
  id: z.string().uuid(),
  flashcard_id: z.string().uuid(),
  user_id: z.string().uuid(),
  rating: FsrsRatingSchema,
  review_time: z.string().datetime(),
  previous_state: CardStateSchema,
  new_state: CardStateSchema,
  previous_stability: z.number().nonnegative(),
  new_stability: z.number().nonnegative(),
  previous_difficulty: z.number().min(0).max(10),
  new_difficulty: z.number().min(0).max(10),
  elapsed_days: z.number().int().nonnegative(),
  scheduled_days: z.number().int().nonnegative(),
  review_duration_ms: z.number().int().nonnegative().nullable(),
  created_at: z.string().datetime(),
});

// =============================================================================
// Form Schemas
// =============================================================================

/**
 * A single definition entry in the "Add Word" form.
 * The form manages an array of these.
 */
export const DefinitionFormEntrySchema = z.object({
  meaning: z
    .string()
    .min(1, 'Meaning is required')
    .max(2000, 'Meaning too long')
    .trim(),
  part_of_speech: PartOfSpeechSchema,
  tiptap_note: TiptapDocumentSchema.nullable().default(null),
  requested_ai_example_count: z
    .number()
    .int()
    .min(1, 'At least 1 example required')
    .max(10, 'Maximum 10 examples')
    .default(3),
  /** Which quiz modes to auto-generate for this definition */
  quiz_modes: z
    .array(QuizModeSchema)
    .min(1, 'Select at least one quiz mode')
    .default(['WORD_TO_MEANING']),
});

/**
 * The main "Add Word" form schema.
 */
export const AddWordFormSchema = z.object({
  word: z
    .string()
    .min(1, 'Word is required')
    .max(200, 'Word is too long')
    .trim()
    .transform((w) => w.toLowerCase()),
  phonetics: z.string().max(300).trim().optional().default(''),
  tag_ids: z.array(z.string().uuid()).default([]),
  definitions: z
    .array(DefinitionFormEntrySchema)
    .min(1, 'At least one definition is required')
    .max(20, 'Maximum 20 definitions per word'),
});

/**
 * Form schema for creating/editing a tag.
 */
export const TagFormSchema = CreateTagSchema;

/**
 * Schema for the FSRS review submission.
 */
export const ReviewSubmissionSchema = z.object({
  flashcard_id: z.string().uuid(),
  rating: FsrsRatingSchema,
  review_duration_ms: z.number().int().nonnegative().max(600_000), // max 10 min
});

/**
 * Schema for the AI example generation webhook payload.
 */
export const AiExampleRequestSchema = z.object({
  definition_id: z.string().uuid(),
  word: z.string().min(1).max(200),
  meaning: z.string().min(1).max(2000),
  part_of_speech: PartOfSpeechSchema,
  count: z.number().int().min(1).max(10),
  user_id: z.string().uuid(),
});

/**
 * Validated shape of the AI model's JSON response.
 */
export const AiExampleResponseSchema = z
  .array(z.string().min(1).max(1000).trim())
  .min(1)
  .max(10);

// ---------------------------------------------------------------------------
// Inferred types from schemas
// ---------------------------------------------------------------------------
export type AddWordFormData = z.infer<typeof AddWordFormSchema>;
export type DefinitionFormEntry = z.infer<typeof DefinitionFormEntrySchema>;
export type TagFormData = z.infer<typeof TagFormSchema>;
export type ReviewSubmissionData = z.infer<typeof ReviewSubmissionSchema>;
export type AiExampleRequestData = z.infer<typeof AiExampleRequestSchema>;
