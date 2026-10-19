-- QuizCraft schema. Run with `npm run db:setup`.
-- The session table is created automatically by connect-pg-simple.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_username_format
    CHECK (username = lower(username) AND char_length(username) BETWEEN 3 AND 24)
);

CREATE TABLE IF NOT EXISTS quizzes (
  id          SERIAL PRIMARY KEY,
  creator_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL,
  difficulty  TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_public   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT quizzes_title_length CHECK (char_length(title) BETWEEN 3 AND 120)
);

CREATE INDEX IF NOT EXISTS quizzes_public_created_idx
  ON quizzes (created_at DESC)
  WHERE is_public = TRUE;

CREATE INDEX IF NOT EXISTS quizzes_creator_idx ON quizzes (creator_id);

CREATE TABLE IF NOT EXISTS questions (
  id          SERIAL PRIMARY KEY,
  quiz_id     INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  explanation TEXT,
  position    INTEGER NOT NULL CHECK (position > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (quiz_id, position)
);

CREATE INDEX IF NOT EXISTS questions_quiz_idx ON questions (quiz_id, position);

CREATE TABLE IF NOT EXISTS answer_options (
  id          SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  is_correct  BOOLEAN NOT NULL DEFAULT FALSE,
  position    INTEGER NOT NULL CHECK (position BETWEEN 1 AND 4),
  UNIQUE (question_id, position)
);

CREATE INDEX IF NOT EXISTS answer_options_question_idx
  ON answer_options (question_id, position);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id              SERIAL PRIMARY KEY,
  quiz_id         INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score           INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  CONSTRAINT quiz_attempts_score_range
    CHECK (score >= 0 AND score <= total_questions),
  CONSTRAINT quiz_attempts_has_questions CHECK (total_questions > 0)
);

-- A user can have at most one unfinished attempt for a quiz.
CREATE UNIQUE INDEX IF NOT EXISTS quiz_attempts_one_active_idx
  ON quiz_attempts (user_id, quiz_id)
  WHERE completed_at IS NULL;

CREATE INDEX IF NOT EXISTS quiz_attempts_user_idx
  ON quiz_attempts (user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS quiz_attempts_quiz_idx ON quiz_attempts (quiz_id);

CREATE TABLE IF NOT EXISTS attempt_answers (
  id                SERIAL PRIMARY KEY,
  attempt_id        INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id       INTEGER REFERENCES questions(id) ON DELETE SET NULL,
  answer_option_id  INTEGER REFERENCES answer_options(id) ON DELETE SET NULL,
  question_position INTEGER NOT NULL,
  question_text     TEXT NOT NULL,
  selected_text     TEXT,
  correct_text      TEXT NOT NULL,
  explanation       TEXT,
  is_correct        BOOLEAN NOT NULL DEFAULT FALSE,
  answered_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS attempt_answers_attempt_idx
  ON attempt_answers (attempt_id, question_position);
