import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { findUserById, findUserByUsername } from '../db/queries/users.js';
import { comparePassword } from '../utils/password.js';

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await findUserByUsername(String(username).trim().toLowerCase());

      if (!user) {
        return done(null, false, {
          message: 'Incorrect username or password.',
        });
      }

      const passwordMatches = await comparePassword(password, user.passwordHash);
      if (!passwordMatches) {
        return done(null, false, {
          message: 'Incorrect username or password.',
        });
      }

      return done(null, { id: user.id, username: user.username });
    } catch (error) {
      return done(error);
    }
  }),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findUserById(id);
    done(null, user || false);
  } catch (error) {
    done(error);
  }
});

export { passport };
