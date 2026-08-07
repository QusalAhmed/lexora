-- =============================================================================
-- Migration: 20240801000000_initial_schema.sql
-- Description: Initial schema for Lexora - English Vocabulary PWA
-- Includes: All tables, RLS policies, indexes, triggers, and enums
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy word search

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE quiz_mode AS ENUM (
  'WORD_TO_MEANING',
  'MEANING_TO_WORD',
  'MEANING_TO_SPELLING'
);

CREATE TYPE card_state AS ENUM (
  'New',
  'Learning',
  'Review',
  'Relearning'
);

CREATE TYPE part_of_speech AS ENUM (
  'noun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'preposition',
  'conjunction',
  'interjection',
  'article',
  'phrase'
);

CREATE TYPE user_role AS ENUM (
  'user',
  'admin'
);

-- ---------------------------------------------------------------------------
-- Helper: updated_at auto-update trigger function
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Table: users (extends auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE public.users (
  id             UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role           user_role   NOT NULL DEFAULT 'user',
  theme_preference TEXT      NOT NULL DEFAULT 'dark'
                               CHECK (theme_preference IN ('dark', 'light', 'system')),
  daily_review_goal INT      NOT NULL DEFAULT 20 CHECK (daily_review_goal BETWEEN 1 AND 500),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version        BIGINT      NOT NULL DEFAULT 0,
  deleted_at     TIMESTAMPTZ
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Table: tags
-- ---------------------------------------------------------------------------
CREATE TABLE public.tags (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 50),
  color      TEXT        NOT NULL DEFAULT '#6366f1'
                           CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version    BIGINT      NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  UNIQUE (user_id, name)
);

CREATE TRIGGER tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Table: words
-- ---------------------------------------------------------------------------
CREATE TABLE public.words (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  word        TEXT          NOT NULL CHECK (char_length(word) BETWEEN 1 AND 200),
  phonetics   TEXT,
  audio_url   TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  version     BIGINT        NOT NULL DEFAULT 0,
  deleted_at  TIMESTAMPTZ,
  UNIQUE (user_id, word)
);

CREATE TRIGGER words_updated_at
  BEFORE UPDATE ON public.words
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Table: word_tags (junction)
-- ---------------------------------------------------------------------------
CREATE TABLE public.word_tags (
  word_id    UUID NOT NULL REFERENCES public.words(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (word_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- Table: definitions
-- ---------------------------------------------------------------------------
CREATE TABLE public.definitions (
  id                        UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  word_id                   UUID           NOT NULL REFERENCES public.words(id) ON DELETE CASCADE,
  user_id                   UUID           NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  meaning                   TEXT           NOT NULL CHECK (char_length(meaning) BETWEEN 1 AND 2000),
  part_of_speech            part_of_speech NOT NULL,
  tiptap_note               JSONB,
  requested_ai_example_count INT           NOT NULL DEFAULT 3
                                             CHECK (requested_ai_example_count BETWEEN 1 AND 10),
  created_at                TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  version                   BIGINT         NOT NULL DEFAULT 0,
  deleted_at                TIMESTAMPTZ
);

CREATE TRIGGER definitions_updated_at
  BEFORE UPDATE ON public.definitions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Table: examples
-- ---------------------------------------------------------------------------
CREATE TABLE public.examples (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  definition_id   UUID        NOT NULL REFERENCES public.definitions(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sentence        TEXT        NOT NULL CHECK (char_length(sentence) BETWEEN 1 AND 1000),
  is_ai_generated BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version         BIGINT      NOT NULL DEFAULT 0,
  deleted_at      TIMESTAMPTZ
);

CREATE TRIGGER examples_updated_at
  BEFORE UPDATE ON public.examples
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Table: flashcards
-- ---------------------------------------------------------------------------
CREATE TABLE public.flashcards (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  definition_id   UUID        NOT NULL REFERENCES public.definitions(id) ON DELETE CASCADE,
  quiz_mode       quiz_mode   NOT NULL,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  due_date        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stability       DOUBLE PRECISION NOT NULL DEFAULT 0,
  difficulty      DOUBLE PRECISION NOT NULL DEFAULT 0,
  elapsed_days    INTEGER     NOT NULL DEFAULT 0,
  scheduled_days  INTEGER     NOT NULL DEFAULT 0,
  reps            INTEGER     NOT NULL DEFAULT 0,
  lapses          INTEGER     NOT NULL DEFAULT 0,
  state           card_state  NOT NULL DEFAULT 'New',
  last_review     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version         BIGINT      NOT NULL DEFAULT 0,
  deleted_at      TIMESTAMPTZ,
  UNIQUE (user_id, definition_id, quiz_mode)
);

CREATE TRIGGER flashcards_updated_at
  BEFORE UPDATE ON public.flashcards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Table: review_logs (append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE public.review_logs (
  id                  UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  flashcard_id        UUID             NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  user_id             UUID             NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating              SMALLINT         NOT NULL CHECK (rating BETWEEN 1 AND 4),
  review_time         TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  previous_state      card_state       NOT NULL,
  new_state           card_state       NOT NULL,
  previous_stability  DOUBLE PRECISION NOT NULL DEFAULT 0,
  new_stability       DOUBLE PRECISION NOT NULL DEFAULT 0,
  previous_difficulty DOUBLE PRECISION NOT NULL DEFAULT 0,
  new_difficulty      DOUBLE PRECISION NOT NULL DEFAULT 0,
  elapsed_days        INTEGER          NOT NULL DEFAULT 0,
  scheduled_days      INTEGER          NOT NULL DEFAULT 0,
  review_duration_ms  INTEGER          CHECK (review_duration_ms >= 0),
  created_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX idx_words_user_id         ON public.words(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_words_word_trgm       ON public.words USING GIN (word gin_trgm_ops);
CREATE INDEX idx_words_created_at      ON public.words(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_tags_user_id          ON public.tags(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_word_tags_tag_id      ON public.word_tags(tag_id);
CREATE INDEX idx_word_tags_word_id     ON public.word_tags(word_id);
CREATE INDEX idx_definitions_word_id   ON public.definitions(word_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_definitions_user_id   ON public.definitions(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_examples_definition_id ON public.examples(definition_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_flashcards_user_due    ON public.flashcards(user_id, due_date ASC)
  WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_flashcards_user_mode   ON public.flashcards(user_id, quiz_mode)
  WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_flashcards_definition  ON public.flashcards(definition_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_flashcards_state       ON public.flashcards(user_id, state)
  WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_review_logs_flashcard  ON public.review_logs(flashcard_id, review_time DESC);
CREATE INDEX idx_review_logs_user_time  ON public.review_logs(user_id, review_time DESC);
CREATE INDEX idx_review_logs_user_daily ON public.review_logs(user_id, review_time)
  WHERE review_time >= NOW() - INTERVAL '90 days';

-- =============================================================================
-- PowerSync: version increment triggers
-- =============================================================================
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$;

CREATE TRIGGER words_version
  BEFORE UPDATE ON public.words
  FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER tags_version
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER definitions_version
  BEFORE UPDATE ON public.definitions
  FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER examples_version
  BEFORE UPDATE ON public.examples
  FOR EACH ROW EXECUTE FUNCTION increment_version();

CREATE TRIGGER flashcards_version
  BEFORE UPDATE ON public.flashcards
  FOR EACH ROW EXECUTE FUNCTION increment_version();

-- =============================================================================
-- Row Level Security
-- =============================================================================
ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.words       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.word_tags   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examples    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_logs ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Service role can insert users"
  ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- tags
CREATE POLICY "Users can manage own tags"
  ON public.tags FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- words
CREATE POLICY "Users can manage own words"
  ON public.words FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- word_tags
CREATE POLICY "Users can manage own word_tags"
  ON public.word_tags FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.words w WHERE w.id = word_tags.word_id AND w.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.words w WHERE w.id = word_tags.word_id AND w.user_id = auth.uid())
  );

-- definitions
CREATE POLICY "Users can manage own definitions"
  ON public.definitions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- examples
CREATE POLICY "Users can manage own examples"
  ON public.examples FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- flashcards
CREATE POLICY "Users can manage own flashcards"
  ON public.flashcards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- review_logs (append-only, no update/delete)
CREATE POLICY "Users can view own review_logs"
  ON public.review_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own review_logs"
  ON public.review_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- Realtime CDC for PowerSync
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.words;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tags;
ALTER PUBLICATION supabase_realtime ADD TABLE public.word_tags;
ALTER PUBLICATION supabase_realtime ADD TABLE public.definitions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.examples;
ALTER PUBLICATION supabase_realtime ADD TABLE public.flashcards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.review_logs;

-- =============================================================================
-- Auto-create profile on signup
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, role, theme_preference)
  VALUES (NEW.id, 'user', 'dark')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- Function: soft_delete_word (cascades soft-delete)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.soft_delete_word(p_word_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.words WHERE id = p_word_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Word not found or access denied';
  END IF;

  UPDATE public.flashcards
  SET deleted_at = v_now, is_active = FALSE
  WHERE definition_id IN (
    SELECT id FROM public.definitions WHERE word_id = p_word_id
  );

  UPDATE public.examples
  SET deleted_at = v_now
  WHERE definition_id IN (
    SELECT id FROM public.definitions WHERE word_id = p_word_id
  );

  UPDATE public.definitions
  SET deleted_at = v_now
  WHERE word_id = p_word_id;

  UPDATE public.words
  SET deleted_at = v_now
  WHERE id = p_word_id;
END;
$$;

-- =============================================================================
-- Statistics view
-- =============================================================================
CREATE OR REPLACE VIEW public.daily_review_stats AS
SELECT
  user_id,
  DATE(review_time AT TIME ZONE 'UTC') AS review_date,
  COUNT(*) AS total_reviews,
  COUNT(*) FILTER (WHERE rating = 4) AS easy_count,
  COUNT(*) FILTER (WHERE rating = 3) AS good_count,
  COUNT(*) FILTER (WHERE rating = 2) AS hard_count,
  COUNT(*) FILTER (WHERE rating = 1) AS again_count,
  AVG(review_duration_ms) AS avg_duration_ms
FROM public.review_logs
GROUP BY user_id, DATE(review_time AT TIME ZONE 'UTC');
