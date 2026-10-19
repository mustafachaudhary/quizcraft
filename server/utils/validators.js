import { CATEGORIES, DIFFICULTIES, MAX_OPTIONS } from '../constants.js';
import { AppError } from '../utils/AppError.js';
import { cleanText } from '../utils/validate.js';

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

export function normaliseUsername(value) {
  return cleanText(value).toLowerCase();
}

export function validateRegistration(body) {
  const username = normaliseUsername(body.username);
  const password = typeof body.password === 'string' ? body.password : '';
  const fields = {};

  if (!username) {
    fields.username = 'Choose a username.';
  } else if (!USERNAME_PATTERN.test(username)) {
    fields.username =
      'Use 3 to 24 characters: lowercase letters, numbers and underscores.';
  }

  if (password.length < 8) {
    fields.password = 'Use at least 8 characters.';
  } else if (password.length > 72) {
    fields.password = 'Keep the password under 72 characters.';
  }

  if (Object.keys(fields).length > 0) {
    throw new AppError(400, 'Please check the form.', fields);
  }

  return { username, password };
}

export function validateLogin(body) {
  const username = normaliseUsername(body.username);
  const password = typeof body.password === 'string' ? body.password : '';
  const fields = {};

  if (!username) fields.username = 'Enter your username.';
  if (!password) fields.password = 'Enter your password.';

  if (Object.keys(fields).length > 0) {
    throw new AppError(400, 'Please check the form.', fields);
  }

  return { username, password };
}

export function validateQuizDetails(body) {
  const title = cleanText(body.title);
  const description = cleanText(body.description);
  const category = cleanText(body.category);
  const difficulty = cleanText(body.difficulty).toLowerCase();
  const isPublic = Boolean(body.isPublic);
  const fields = {};

  if (title.length < 3) {
    fields.title = 'Give the quiz a title of at least 3 characters.';
  } else if (title.length > 120) {
    fields.title = 'Keep the title under 120 characters.';
  }

  if (description.length > 800) {
    fields.description = 'Keep the description under 800 characters.';
  }

  if (!CATEGORIES.includes(category)) {
    fields.category = 'Choose a category from the list.';
  }

  if (!DIFFICULTIES.includes(difficulty)) {
    fields.difficulty = 'Choose easy, medium or hard.';
  }

  if (Object.keys(fields).length > 0) {
    throw new AppError(400, 'Please check the quiz details.', fields);
  }

  return { title, description, category, difficulty, isPublic };
}

export function validateQuestion(body) {
  const text = cleanText(body.text);
  const explanation = cleanText(body.explanation);
  const rawOptions = Array.isArray(body.options) ? body.options : [];
  const fields = {};

  if (text.length < 5) {
    fields.text = 'Write a question of at least 5 characters.';
  } else if (text.length > 400) {
    fields.text = 'Keep the question under 400 characters.';
  }

  if (explanation.length > 600) {
    fields.explanation = 'Keep the explanation under 600 characters.';
  }

  if (rawOptions.length !== MAX_OPTIONS) {
    fields.options = 'Every question needs exactly four answers.';
  }

  const options = rawOptions.slice(0, MAX_OPTIONS).map((option) => ({
    text: cleanText(option?.text),
    isCorrect: option?.isCorrect === true,
  }));

  options.forEach((option, index) => {
    if (!option.text) {
      fields.options = `Answer ${String.fromCharCode(65 + index)} is empty.`;
    } else if (option.text.length > 200) {
      fields.options = `Answer ${String.fromCharCode(65 + index)} is too long.`;
    }
  });

  const uniqueTexts = new Set(options.map((option) => option.text.toLowerCase()));
  if (options.every((option) => option.text) && uniqueTexts.size !== MAX_OPTIONS) {
    fields.options = 'The four answers need to be different.';
  }

  if (options.filter((option) => option.isCorrect).length !== 1) {
    fields.correct = 'Mark exactly one answer as correct.';
  }

  if (Object.keys(fields).length > 0) {
    throw new AppError(400, 'Please check the question.', fields);
  }

  return {
    text,
    explanation: explanation || null,
    options,
  };
}
