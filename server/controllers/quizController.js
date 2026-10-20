import { MAX_QUESTIONS, MIN_PUBLISH_QUESTIONS } from '../constants.js';
import {
  createQuestion,
  createQuiz,
  deleteQuestion,
  deleteQuiz,
  findOwnedQuiz,
  findQuizById,
  findQuizOwner,
  getOwnerQuestions,
  getQuestionCount,
  listPublicQuizzes,
  touchQuiz,
  updateQuestion,
  updateQuiz,
} from '../db/queries/quizzes.js';
import { AppError } from '../utils/AppError.js';
import { parseId } from '../utils/validate.js';
import { validateQuestion, validateQuizDetails } from '../utils/validators.js';

async function requireOwnedQuiz(quizId, userId) {
  const owned = await findOwnedQuiz(quizId, userId);
  if (owned) return owned;

  const owner = await findQuizOwner(quizId);
  if (!owner) {
    throw new AppError(404, 'Quiz not found.');
  }

  throw new AppError(403, 'You can only change your own quizzes.');
}

function textQuery(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function listQuizzes(req, res) {
  const search = textQuery(req.query.q).slice(0, 80);
  const category = textQuery(req.query.category);
  const difficulty = textQuery(req.query.difficulty);
  const quizzes = await listPublicQuizzes({
    search,
    category,
    difficulty,
  });
  res.json({ quizzes });
}

export async function getQuiz(req, res) {
  const id = parseId(req.params.id, 'quiz id');
  const quiz = await findQuizById(id);

  if (!quiz) {
    throw new AppError(404, 'Quiz not found.');
  }

  const isOwner = req.user?.id === quiz.creatorId;
  if (!quiz.isPublic && !isOwner) {
    throw new AppError(404, 'Quiz not found.');
  }

  res.json({ quiz: { ...quiz, isOwner } });
}

export async function getQuizForEditing(req, res) {
  const id = parseId(req.params.id, 'quiz id');
  const quiz = await requireOwnedQuiz(id, req.user.id);
  const questions = await getOwnerQuestions(id);
  res.json({ quiz: { ...quiz, questions } });
}

export async function createNewQuiz(req, res) {
  const details = validateQuizDetails(req.body || {});
  const quiz = await createQuiz(req.user.id, {
    ...details,
    isPublic: false,
  });
  res.status(201).json({ quiz });
}

export async function updateQuizDetails(req, res) {
  const id = parseId(req.params.id, 'quiz id');
  const existing = await requireOwnedQuiz(id, req.user.id);
  const body = req.body || {};

  const details = validateQuizDetails({
    title: body.title === undefined ? existing.title : body.title,
    description:
      body.description === undefined ? existing.description : body.description,
    category: body.category === undefined ? existing.category : body.category,
    difficulty:
      body.difficulty === undefined ? existing.difficulty : body.difficulty,
    isPublic: body.isPublic === undefined ? existing.isPublic : body.isPublic,
  });

  if (details.isPublic && existing.questionCount < MIN_PUBLISH_QUESTIONS) {
    const remaining = MIN_PUBLISH_QUESTIONS - existing.questionCount;
    throw new AppError(
      400,
      `Add at least ${MIN_PUBLISH_QUESTIONS} questions before making this quiz public.`,
      {
        isPublic: `Add ${remaining} more ${remaining === 1 ? 'question' : 'questions'} first.`,
      },
    );
  }

  const quiz = await updateQuiz(id, req.user.id, details);
  res.json({ quiz });
}

export async function removeQuiz(req, res) {
  const id = parseId(req.params.id, 'quiz id');
  await requireOwnedQuiz(id, req.user.id);
  await deleteQuiz(id, req.user.id);
  res.status(204).end();
}

export async function addQuestion(req, res) {
  const quizId = parseId(req.params.id, 'quiz id');
  await requireOwnedQuiz(quizId, req.user.id);

  const count = await getQuestionCount(quizId);
  if (count >= MAX_QUESTIONS) {
    throw new AppError(400, `A quiz can hold at most ${MAX_QUESTIONS} questions.`);
  }

  const question = validateQuestion(req.body || {});
  const saved = await createQuestion(quizId, question);
  await touchQuiz(quizId);
  res.status(201).json({ question: saved });
}

export async function editQuestion(req, res) {
  const quizId = parseId(req.params.id, 'quiz id');
  const questionId = parseId(req.params.questionId, 'question id');
  await requireOwnedQuiz(quizId, req.user.id);

  const question = validateQuestion(req.body || {});
  const saved = await updateQuestion(quizId, questionId, question);

  if (!saved) {
    throw new AppError(404, 'Question not found.');
  }

  await touchQuiz(quizId);
  res.json({ question: saved });
}

export async function removeQuestion(req, res) {
  const quizId = parseId(req.params.id, 'quiz id');
  const questionId = parseId(req.params.questionId, 'question id');
  const quiz = await requireOwnedQuiz(quizId, req.user.id);

  if (quiz.isPublic && quiz.questionCount <= MIN_PUBLISH_QUESTIONS) {
    throw new AppError(
      400,
      `A public quiz keeps at least ${MIN_PUBLISH_QUESTIONS} questions. Unpublish it before removing one.`,
    );
  }

  const deleted = await deleteQuestion(quizId, questionId);
  if (!deleted) {
    throw new AppError(404, 'Question not found.');
  }

  await touchQuiz(quizId);
  res.status(204).end();
}
