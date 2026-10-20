export const CATEGORIES = [
  'Science',
  'History',
  'Geography',
  'Arts',
  'Music',
  'Film and TV',
  'Sports',
  'Technology',
  'Food',
  'General',
];

export const DIFFICULTIES = ['easy', 'medium', 'hard'];

export const MAX_QUESTIONS = 50;
export const MIN_PUBLISH_QUESTIONS = 10;

export function difficultyLabel(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}

export function percent(score, total) {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

export function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function pluralise(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
