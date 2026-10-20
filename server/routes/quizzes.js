import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  addQuestion,
  createNewQuiz,
  editQuestion,
  getQuiz,
  getQuizForEditing,
  listQuizzes,
  removeQuestion,
  removeQuiz,
  updateQuizDetails,
} from '../controllers/quizController.js';
import { beginAttempt } from '../controllers/attemptController.js';

export const quizRouter = Router();

quizRouter.get('/', asyncHandler(listQuizzes));
quizRouter.get('/:id', asyncHandler(getQuiz));
quizRouter.get('/:id/manage', requireAuth, asyncHandler(getQuizForEditing));

quizRouter.post('/', requireAuth, asyncHandler(createNewQuiz));
quizRouter.patch('/:id', requireAuth, asyncHandler(updateQuizDetails));
quizRouter.delete('/:id', requireAuth, asyncHandler(removeQuiz));

quizRouter.post('/:id/questions', requireAuth, asyncHandler(addQuestion));
quizRouter.patch(
  '/:id/questions/:questionId',
  requireAuth,
  asyncHandler(editQuestion),
);
quizRouter.delete(
  '/:id/questions/:questionId',
  requireAuth,
  asyncHandler(removeQuestion),
);

quizRouter.post('/:id/attempts', requireAuth, asyncHandler(beginAttempt));
