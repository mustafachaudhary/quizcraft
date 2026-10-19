import { AppError } from '../utils/AppError.js';

export function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return next(new AppError(401, 'Log in to continue.'));
}
