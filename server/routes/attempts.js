import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  answerQuestion,
  getAttemptResults,
  getAttemptToPlay,
  skipQuestion,
} from '../controllers/attemptController.js';

export const attemptRouter = Router();

attemptRouter.use(requireAuth);

attemptRouter.get('/:id/play', asyncHandler(getAttemptToPlay));
attemptRouter.get('/:id/results', asyncHandler(getAttemptResults));
attemptRouter.post('/:id/answers', asyncHandler(answerQuestion));
attemptRouter.post('/:id/skip', asyncHandler(skipQuestion));
