import { config } from '../config.js';
import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, res, next) {
  next(new AppError(404, 'Not found.'));
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request body is not valid JSON.' });
  }

  const status = error.status || 500;

  if (status >= 500) {
    console.error(error);
  }

  const body = {
    error:
      status >= 500 && config.isProduction
        ? 'Something went wrong on our side.'
        : error.message || 'Something went wrong.',
  };

  if (error.fields) {
    body.fields = error.fields;
  }

  res.status(status).json(body);
}
