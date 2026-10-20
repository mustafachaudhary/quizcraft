import { Router } from 'express';
import {
  getCurrentUser,
  loginUser,
  logout,
  register,
} from '../controllers/authController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRouter = Router();

authRouter.post('/register', asyncHandler(register));
authRouter.post('/login', asyncHandler(loginUser));
authRouter.post('/logout', asyncHandler(logout));
authRouter.get('/me', getCurrentUser);
