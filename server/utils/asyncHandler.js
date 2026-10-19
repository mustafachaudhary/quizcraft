/**
 * Express 4 does not catch rejected promises from async route handlers.
 * This wrapper forwards them to the central error handler instead.
 */
export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
