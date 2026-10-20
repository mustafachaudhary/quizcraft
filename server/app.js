import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { config } from './config.js';
import { pool } from './db/pool.js';
import { passport } from './auth/passport.js';
import { authRouter } from './routes/auth.js';
import { quizRouter } from './routes/quizzes.js';
import { attemptRouter } from './routes/attempts.js';
import { meRouter } from './routes/me.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

const PgSession = connectPgSimple(session);

export const app = express();

app.disable('x-powered-by');
if (config.isProduction) {
  app.set('trust proxy', 1);
}

app.use(express.json({ limit: '128kb' }));

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    name: 'quizcraft.sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.isProduction,
      maxAge: config.sessionMaxAgeMs,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRouter);
app.use('/api/quizzes', quizRouter);
app.use('/api/attempts', attemptRouter);
app.use('/api/me', meRouter);

app.use('/api', notFoundHandler);

const clientIndex = path.join(config.clientDist, 'index.html');
if (fs.existsSync(clientIndex)) {
  app.use(express.static(config.clientDist, { index: false }));
  app.get('*', (req, res) => res.sendFile(clientIndex));
}

app.use(notFoundHandler);
app.use(errorHandler);
