import { createUser } from '../db/queries/users.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword } from '../utils/password.js';
import { validateLogin, validateRegistration } from '../utils/validators.js';
import { passport } from '../auth/passport.js';

function login(req, user) {
  return new Promise((resolve, reject) => {
    req.login(user, (error) => (error ? reject(error) : resolve()));
  });
}

export async function register(req, res) {
  const { username, password } = validateRegistration(req.body || {});
  const passwordHash = await hashPassword(password);

  let user;
  try {
    user = await createUser(username, passwordHash);
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError(409, 'That username is already taken.', {
        username: 'That username is already taken.',
      });
    }
    throw error;
  }

  await login(req, user);
  res.status(201).json({ user });
}

export function loginUser(req, res, next) {
  const credentials = validateLogin(req.body || {});

  passport.authenticate('local', (error, user, info) => {
    if (error) return next(error);

    if (!user) {
      return res
        .status(401)
        .json({ error: info?.message || 'Incorrect username or password.' });
    }

    login(req, user)
      .then(() => res.json({ user }))
      .catch(next);
  })(req, res, next);
}

export async function logout(req, res, next) {
  req.logout((logoutError) => {
    if (logoutError) return next(logoutError);

    req.session.destroy((sessionError) => {
      if (sessionError) return next(sessionError);
      res.clearCookie('quizcraft.sid');
      res.status(204).end();
    });
  });
}

export function getCurrentUser(req, res) {
  res.json({ user: req.user || null });
}
