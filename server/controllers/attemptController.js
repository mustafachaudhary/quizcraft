import { findQuizById, getQuestionsForTaking } from '../db/queries/quizzes.js';
import {
  getAttemptAnswers,
  getAttemptForUser,
  getAttemptResult,
  startAttempt,
  submitAnswer,
} from '../db/queries/attempts.js';
import { AppError } from '../utils/AppError.js';
import { parseId } from '../utils/validate.js';

export async function beginAttempt(req, res) {
  const quizId = parseId(req.params.id, 'quiz id');
  const quiz = await findQuizById(quizId);

  if (!quiz) {
    throw new AppError(404, 'Quiz not found.');
  }

  const isOwner = quiz.creatorId === req.user.id;
  if (!quiz.isPublic && !isOwner) {
    throw new AppError(404, 'Quiz not found.');
  }

  if (quiz.questionCount === 0) {
    throw new AppError(400, 'This quiz has no questions yet.');
  }

  const { attempt, created } = await startAttempt(
    quizId,
    req.user.id,
    quiz.questionCount,
  );

  if (!attempt) {
    throw new AppError(500, 'The attempt could not be started.');
  }

  res.status(created ? 201 : 200).json({
    attempt,
    resumed: !created,
    quiz: {
      id: quiz.id,
      title: quiz.title,
      category: quiz.category,
      difficulty: quiz.difficulty,
      creatorUsername: quiz.creatorUsername,
    },
  });
}

export async function getAttemptToPlay(req, res) {
  const attemptId = parseId(req.params.id, 'attempt id');
  const attempt = await getAttemptForUser(attemptId, req.user.id);

  if (!attempt) {
    throw new AppError(404, 'Attempt not found.');
  }

  if (attempt.completedAt) {
    return res.json({ completed: true, attemptId: attempt.id });
  }

  const questions = await getQuestionsForTaking(attempt.quizId);
  const answers = await getAttemptAnswers(attempt.id);

  res.json({
    completed: false,
    attempt,
    quiz: {
      id: attempt.quizId,
      title: attempt.quizTitle,
      category: attempt.category,
      difficulty: attempt.difficulty,
      creatorUsername: attempt.creatorUsername,
    },
    questions,
    answers,
  });
}

async function submit(req, res, optionId) {
  const attemptId = parseId(req.params.id, 'attempt id');
  const questionId = parseId(req.body?.questionId, 'question id');

  const feedback = await submitAnswer({
    attemptId,
    userId: req.user.id,
    questionId,
    optionId,
  });

  res.status(201).json({ feedback });
}

export async function answerQuestion(req, res) {
  if (req.body?.optionId === undefined || req.body?.optionId === null) {
    throw new AppError(400, 'Choose an answer before submitting.');
  }

  const optionId = parseId(req.body.optionId, 'answer id');
  await submit(req, res, optionId);
}

export async function skipQuestion(req, res) {
  await submit(req, res, null);
}

export async function getAttemptResults(req, res) {
  const attemptId = parseId(req.params.id, 'attempt id');
  const attempt = await getAttemptResult(attemptId, req.user.id);

  if (!attempt) {
    throw new AppError(404, 'Attempt not found.');
  }

  if (!attempt.completedAt) {
    throw new AppError(409, 'This attempt is not finished yet.');
  }

  res.json({ attempt });
}
