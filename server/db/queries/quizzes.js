import { pool } from '../pool.js';

const QUIZ_WITH_COUNTS = `
  SELECT
    q.id,
    q.creator_id AS "creatorId",
    q.title,
    q.description,
    q.category,
    q.difficulty,
    q.is_public AS "isPublic",
    q.created_at AS "createdAt",
    q.updated_at AS "updatedAt",
    u.username AS "creatorUsername",
    (SELECT count(*)::int FROM questions qu WHERE qu.quiz_id = q.id) AS "questionCount",
    (SELECT count(*)::int FROM quiz_attempts a
      WHERE a.quiz_id = q.id AND a.completed_at IS NOT NULL) AS "attemptCount"
  FROM quizzes q
  JOIN users u ON u.id = q.creator_id
`;

export async function listPublicQuizzes({ search, category, difficulty }) {
  const { rows } = await pool.query(
    `${QUIZ_WITH_COUNTS}
     WHERE q.is_public = TRUE
       AND ($1::text IS NULL OR q.title ILIKE '%' || $1 || '%')
       AND ($2::text IS NULL OR q.category = $2)
       AND ($3::text IS NULL OR q.difficulty = $3)
     ORDER BY q.created_at DESC, q.id DESC
     LIMIT 60`,
    [search || null, category || null, difficulty || null],
  );
  return rows;
}

export async function findQuizById(id) {
  const { rows } = await pool.query(
    `${QUIZ_WITH_COUNTS} WHERE q.id = $1`,
    [id],
  );
  return rows[0] || null;
}

export async function findQuizOwner(id) {
  const { rows } = await pool.query(
    'SELECT id, creator_id AS "creatorId" FROM quizzes WHERE id = $1',
    [id],
  );
  return rows[0] || null;
}

export async function findOwnedQuiz(id, creatorId) {
  const { rows } = await pool.query(
    `${QUIZ_WITH_COUNTS} WHERE q.id = $1 AND q.creator_id = $2`,
    [id, creatorId],
  );
  return rows[0] || null;
}

export async function createQuiz(creatorId, details) {
  const { rows } = await pool.query(
    `INSERT INTO quizzes (creator_id, title, description, category, difficulty, is_public)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING
       id,
       creator_id AS "creatorId",
       title,
       description,
       category,
       difficulty,
       is_public AS "isPublic",
       created_at AS "createdAt",
       updated_at AS "updatedAt"`,
    [
      creatorId,
      details.title,
      details.description,
      details.category,
      details.difficulty,
      details.isPublic,
    ],
  );
  return rows[0];
}

export async function updateQuiz(id, creatorId, details) {
  const { rows } = await pool.query(
    `UPDATE quizzes
     SET title = $3,
         description = $4,
         category = $5,
         difficulty = $6,
         is_public = $7,
         updated_at = now()
     WHERE id = $1 AND creator_id = $2
     RETURNING
       id,
       creator_id AS "creatorId",
       title,
       description,
       category,
       difficulty,
       is_public AS "isPublic",
       created_at AS "createdAt",
       updated_at AS "updatedAt"`,
    [
      id,
      creatorId,
      details.title,
      details.description,
      details.category,
      details.difficulty,
      details.isPublic,
    ],
  );
  return rows[0] || null;
}

export async function deleteQuiz(id, creatorId) {
  const result = await pool.query(
    'DELETE FROM quizzes WHERE id = $1 AND creator_id = $2',
    [id, creatorId],
  );
  return result.rowCount > 0;
}

export async function touchQuiz(quizId) {
  await pool.query('UPDATE quizzes SET updated_at = now() WHERE id = $1', [
    quizId,
  ]);
}

export async function getQuestionCount(quizId) {
  const { rows } = await pool.query(
    'SELECT count(*)::int AS count FROM questions WHERE quiz_id = $1',
    [quizId],
  );
  return rows[0].count;
}

export async function getOwnerQuestions(quizId) {
  const questionsResult = await pool.query(
    `SELECT
       id,
       quiz_id AS "quizId",
       text,
       explanation,
       position
     FROM questions
     WHERE quiz_id = $1
     ORDER BY position, id`,
    [quizId],
  );

  const optionsResult = await pool.query(
    `SELECT
       ao.id,
       ao.question_id AS "questionId",
       ao.text,
       ao.is_correct AS "isCorrect",
       ao.position
     FROM answer_options ao
     JOIN questions q ON q.id = ao.question_id
     WHERE q.quiz_id = $1
     ORDER BY ao.question_id, ao.position`,
    [quizId],
  );

  const optionsByQuestion = new Map();
  for (const option of optionsResult.rows) {
    const list = optionsByQuestion.get(option.questionId) || [];
    list.push({
      id: option.id,
      text: option.text,
      isCorrect: option.isCorrect,
      position: option.position,
    });
    optionsByQuestion.set(option.questionId, list);
  }

  return questionsResult.rows.map((question) => ({
    id: question.id,
    text: question.text,
    explanation: question.explanation,
    position: question.position,
    options: optionsByQuestion.get(question.id) || [],
  }));
}

export async function getQuestionsForTaking(quizId) {
  const questionsResult = await pool.query(
    `SELECT id, text, position
     FROM questions
     WHERE quiz_id = $1
     ORDER BY position, id`,
    [quizId],
  );

  const optionsResult = await pool.query(
    `SELECT
       ao.id,
       ao.question_id AS "questionId",
       ao.text,
       ao.position
     FROM answer_options ao
     JOIN questions q ON q.id = ao.question_id
     WHERE q.quiz_id = $1
     ORDER BY ao.question_id, ao.position`,
    [quizId],
  );

  const optionsByQuestion = new Map();
  for (const option of optionsResult.rows) {
    const list = optionsByQuestion.get(option.questionId) || [];
    list.push({
      id: option.id,
      text: option.text,
      position: option.position,
    });
    optionsByQuestion.set(option.questionId, list);
  }

  return questionsResult.rows.map((question) => ({
    id: question.id,
    text: question.text,
    position: question.position,
    options: optionsByQuestion.get(question.id) || [],
  }));
}

export async function createQuestion(quizId, question) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const positionResult = await client.query(
      `SELECT COALESCE(MAX(position), 0) + 1 AS next
       FROM questions
       WHERE quiz_id = $1`,
      [quizId],
    );

    const questionResult = await client.query(
      `INSERT INTO questions (quiz_id, text, explanation, position)
       VALUES ($1, $2, $3, $4)
       RETURNING id, quiz_id AS "quizId", text, explanation, position`,
      [quizId, question.text, question.explanation, positionResult.rows[0].next],
    );

    const savedQuestion = questionResult.rows[0];
    for (const [index, option] of question.options.entries()) {
      await client.query(
        `INSERT INTO answer_options (question_id, text, is_correct, position)
         VALUES ($1, $2, $3, $4)`,
        [savedQuestion.id, option.text, option.isCorrect, index + 1],
      );
    }

    await client.query('COMMIT');
    return { ...savedQuestion, options: question.options };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateQuestion(quizId, questionId, question) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const questionResult = await client.query(
      `UPDATE questions
       SET text = $3, explanation = $4
       WHERE id = $1 AND quiz_id = $2
       RETURNING id, quiz_id AS "quizId", text, explanation, position`,
      [questionId, quizId, question.text, question.explanation],
    );

    if (questionResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(
      'DELETE FROM answer_options WHERE question_id = $1',
      [questionId],
    );

    for (const [index, option] of question.options.entries()) {
      await client.query(
        `INSERT INTO answer_options (question_id, text, is_correct, position)
         VALUES ($1, $2, $3, $4)`,
        [questionId, option.text, option.isCorrect, index + 1],
      );
    }

    await client.query('COMMIT');
    return { ...questionResult.rows[0], options: question.options };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteQuestion(quizId, questionId) {
  const result = await pool.query(
    'DELETE FROM questions WHERE id = $1 AND quiz_id = $2',
    [questionId, quizId],
  );
  return result.rowCount > 0;
}

export async function getOwnedQuizzesWithStats(userId) {
  const { rows } = await pool.query(
    `SELECT
       q.id,
       q.title,
       q.category,
       q.difficulty,
       q.is_public AS "isPublic",
       q.created_at AS "createdAt",
       q.updated_at AS "updatedAt",
       (SELECT count(*)::int FROM questions qu WHERE qu.quiz_id = q.id) AS "questionCount",
       (SELECT count(*)::int FROM quiz_attempts a
         WHERE a.quiz_id = q.id AND a.completed_at IS NOT NULL) AS "attemptCount",
       COALESCE((
         SELECT round(avg(a.score::numeric / a.total_questions * 100))::int
         FROM quiz_attempts a
         WHERE a.quiz_id = q.id AND a.completed_at IS NOT NULL
       ), 0) AS "averagePercent"
     FROM quizzes q
     WHERE q.creator_id = $1
     ORDER BY q.updated_at DESC, q.id DESC`,
    [userId],
  );
  return rows;
}

export async function getCreatorStats(userId) {
  const { rows } = await pool.query(
    `SELECT
       (SELECT count(*)::int FROM quizzes WHERE creator_id = $1) AS "quizCount",
       (SELECT count(*)::int FROM quizzes WHERE creator_id = $1 AND is_public = TRUE) AS "publicCount",
       (SELECT count(*)::int FROM quiz_attempts
         WHERE user_id = $1 AND completed_at IS NOT NULL) AS "attemptCount",
       COALESCE((
         SELECT round(avg(score::numeric / total_questions * 100))::int
         FROM quiz_attempts
         WHERE user_id = $1 AND completed_at IS NOT NULL
       ), 0) AS "averagePercent",
       (SELECT count(*)::int FROM quiz_attempts a
         JOIN quizzes q ON q.id = a.quiz_id
         WHERE q.creator_id = $1 AND a.completed_at IS NOT NULL) AS "receivedAttemptCount"`,
    [userId],
  );
  return rows[0];
}
