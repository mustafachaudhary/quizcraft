import { pool } from '../pool.js';
import { AppError } from '../../utils/AppError.js';

export async function startAttempt(quizId, userId, totalQuestions) {
  const inserted = await pool.query(
    `INSERT INTO quiz_attempts (quiz_id, user_id, total_questions)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, quiz_id) WHERE completed_at IS NULL
     DO NOTHING
     RETURNING
       id,
       quiz_id AS "quizId",
       user_id AS "userId",
       score,
       total_questions AS "totalQuestions",
       started_at AS "startedAt",
       completed_at AS "completedAt"`,
    [quizId, userId, totalQuestions],
  );

  if (inserted.rows[0]) {
    return { attempt: inserted.rows[0], created: true };
  }

  const existing = await pool.query(
    `SELECT
       id,
       quiz_id AS "quizId",
       user_id AS "userId",
       score,
       total_questions AS "totalQuestions",
       started_at AS "startedAt",
       completed_at AS "completedAt"
     FROM quiz_attempts
     WHERE quiz_id = $1 AND user_id = $2 AND completed_at IS NULL
     ORDER BY started_at DESC
     LIMIT 1`,
    [quizId, userId],
  );

  return { attempt: existing.rows[0] || null, created: false };
}

export async function getAttemptForUser(attemptId, userId) {
  const { rows } = await pool.query(
    `SELECT
       a.id,
       a.quiz_id AS "quizId",
       a.user_id AS "userId",
       a.score,
       a.total_questions AS "totalQuestions",
       a.started_at AS "startedAt",
       a.completed_at AS "completedAt",
       q.title AS "quizTitle",
       q.category,
       q.difficulty,
       q.is_public AS "isPublic",
       q.creator_id AS "creatorId",
       u.username AS "creatorUsername"
     FROM quiz_attempts a
     JOIN quizzes q ON q.id = a.quiz_id
     JOIN users u ON u.id = q.creator_id
     WHERE a.id = $1 AND a.user_id = $2`,
    [attemptId, userId],
  );
  return rows[0] || null;
}

export async function getAttemptAnswers(attemptId) {
  const { rows } = await pool.query(
    `SELECT
       question_id AS "questionId",
       answer_option_id AS "answerOptionId",
       question_position AS "questionPosition",
       question_text AS "questionText",
       selected_text AS "selectedText",
       correct_text AS "correctText",
       explanation,
       is_correct AS "isCorrect"
     FROM attempt_answers
     WHERE attempt_id = $1
     ORDER BY question_position`,
    [attemptId],
  );
  return rows;
}

export async function submitAnswer({
  attemptId,
  userId,
  questionId,
  optionId,
}) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const attemptResult = await client.query(
      `SELECT id, quiz_id, total_questions, completed_at
       FROM quiz_attempts
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [attemptId, userId],
    );

    const attempt = attemptResult.rows[0];
    if (!attempt) {
      throw new AppError(404, 'Attempt not found.');
    }
    if (attempt.completed_at) {
      throw new AppError(409, 'This attempt is already complete.');
    }

    const questionResult = await client.query(
      `SELECT id, text, explanation, position
       FROM questions
       WHERE id = $1 AND quiz_id = $2`,
      [questionId, attempt.quiz_id],
    );

    const question = questionResult.rows[0];
    if (!question) {
      throw new AppError(400, 'That question is not part of this attempt.');
    }

    const alreadyResult = await client.query(
      'SELECT 1 FROM attempt_answers WHERE attempt_id = $1 AND question_id = $2',
      [attemptId, questionId],
    );
    if (alreadyResult.rowCount > 0) {
      throw new AppError(409, 'You already answered this question.');
    }

    const correctResult = await client.query(
      `SELECT id, text
       FROM answer_options
       WHERE question_id = $1 AND is_correct = TRUE
       LIMIT 1`,
      [questionId],
    );
    const correctOption = correctResult.rows[0];
    if (!correctOption) {
      throw new AppError(500, 'This question is missing its correct answer.');
    }

    let selectedOption = null;
    if (optionId !== null) {
      const selectedResult = await client.query(
        `SELECT id, text, is_correct
         FROM answer_options
         WHERE id = $1 AND question_id = $2`,
        [optionId, questionId],
      );
      selectedOption = selectedResult.rows[0] || null;

      if (!selectedOption) {
        throw new AppError(400, 'That answer does not belong to this question.');
      }
    }

    const isCorrect = Boolean(selectedOption?.is_correct);

    await client.query(
      `INSERT INTO attempt_answers
         (attempt_id, question_id, answer_option_id, question_position,
          question_text, selected_text, correct_text, explanation, is_correct)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        attemptId,
        question.id,
        selectedOption?.id ?? null,
        question.position,
        question.text,
        selectedOption?.text ?? null,
        correctOption.text,
        question.explanation,
        isCorrect,
      ],
    );

    const scoreResult = await client.query(
      `UPDATE quiz_attempts
       SET score = score + $2
       WHERE id = $1
       RETURNING score, total_questions`,
      [attemptId, isCorrect ? 1 : 0],
    );

    const countResult = await client.query(
      'SELECT count(*)::int AS count FROM attempt_answers WHERE attempt_id = $1',
      [attemptId],
    );

    const answeredCount = countResult.rows[0].count;
    const totalQuestions = scoreResult.rows[0].total_questions;
    const completed = answeredCount >= totalQuestions;

    if (completed) {
      await client.query(
        'UPDATE quiz_attempts SET completed_at = now() WHERE id = $1',
        [attemptId],
      );
    }

    await client.query('COMMIT');

    return {
      questionId,
      isCorrect,
      skipped: selectedOption === null,
      selectedOptionId: selectedOption?.id ?? null,
      correctOptionId: correctOption.id,
      correctOptionText: correctOption.text,
      explanation: question.explanation,
      score: scoreResult.rows[0].score,
      answeredCount,
      totalQuestions,
      completed,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      throw new AppError(409, 'You already answered this question.');
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function getAttemptResult(attemptId, userId) {
  const { rows } = await pool.query(
    `SELECT
       a.id,
       a.quiz_id AS "quizId",
       a.user_id AS "userId",
       a.score,
       a.total_questions AS "totalQuestions",
       a.started_at AS "startedAt",
       a.completed_at AS "completedAt",
       q.title AS "quizTitle",
       q.category,
       q.difficulty,
       q.is_public AS "isPublic",
       u.username AS "creatorUsername"
     FROM quiz_attempts a
     JOIN quizzes q ON q.id = a.quiz_id
     JOIN users u ON u.id = q.creator_id
     WHERE a.id = $1 AND a.user_id = $2`,
    [attemptId, userId],
  );

  const attempt = rows[0];
  if (!attempt) return null;

  const review = await getAttemptAnswers(attemptId);
  const correctCount = review.filter((answer) => answer.isCorrect).length;
  const skippedCount = review.filter((answer) => !answer.selectedText).length;
  const incorrectCount = review.length - correctCount - skippedCount;
  const percentage =
    attempt.totalQuestions > 0
      ? Math.round((attempt.score / attempt.totalQuestions) * 100)
      : 0;

  return {
    ...attempt,
    percentage,
    correctCount,
    incorrectCount,
    skippedCount,
    review,
  };
}

export async function listUserAttempts(userId, limit = 100) {
  const { rows } = await pool.query(
    `SELECT
       a.id,
       a.score,
       a.total_questions AS "totalQuestions",
       a.started_at AS "startedAt",
       a.completed_at AS "completedAt",
       q.id AS "quizId",
       q.title AS "quizTitle",
       q.category,
       q.difficulty
     FROM quiz_attempts a
     JOIN quizzes q ON q.id = a.quiz_id
     WHERE a.user_id = $1 AND a.completed_at IS NOT NULL
     ORDER BY a.completed_at DESC, a.id DESC
     LIMIT $2`,
    [userId, limit],
  );
  return rows;
}
