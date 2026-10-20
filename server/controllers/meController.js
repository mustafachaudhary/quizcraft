import {
  getCreatorStats,
  getOwnedQuizzesWithStats,
} from '../db/queries/quizzes.js';
import { listUserAttempts } from '../db/queries/attempts.js';

export async function getDashboard(req, res) {
  const [stats, quizzes, recentAttempts] = await Promise.all([
    getCreatorStats(req.user.id),
    getOwnedQuizzesWithStats(req.user.id),
    listUserAttempts(req.user.id, 5),
  ]);

  res.json({ stats, quizzes, recentAttempts });
}

export async function getAttemptHistory(req, res) {
  const attempts = await listUserAttempts(req.user.id, 100);
  res.json({ attempts });
}
