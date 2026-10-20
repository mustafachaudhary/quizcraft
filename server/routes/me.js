import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  getAttemptHistory,
  getDashboard,
} from '../controllers/meController.js';

export const meRouter = Router();

meRouter.use(requireAuth);

meRouter.get('/dashboard', asyncHandler(getDashboard));
meRouter.get('/attempts', asyncHandler(getAttemptHistory));
