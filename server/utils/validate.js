import { AppError } from './AppError.js';

export function parseId(value, label = 'id') {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError(400, `Invalid ${label}.`);
  }
  return id;
}

export function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function isBlank(value) {
  return cleanText(value).length === 0;
}
