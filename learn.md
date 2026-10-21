# QuizCraft: a full-stack learning guide

This is the long-form companion to the README. It explains how QuizCraft works,
why each layer is built the way it is, and what you would need to know to rebuild
it or take it further. It follows the real code in this repository, not an
idealised version of it.

The guide assumes you can read modern JavaScript and have met React, Express and
SQL before. Where a pattern matters, the relevant source file is named so you can
open it beside the explanation.

## Contents

1. [The product, the rules, and the stack](#1-the-product-the-rules-and-the-stack)
2. [Repository tour and the development loop](#2-repository-tour-and-the-development-loop)
3. [The database, table by table](#3-the-database-table-by-table)
4. [Authentication and sessions](#4-authentication-and-sessions)
5. [Authorization and visibility](#5-authorization-and-visibility)
6. [Creating and editing quizzes](#6-creating-and-editing-quizzes)
7. [Taking a quiz: a server-owned state machine](#7-taking-a-quiz-a-server-owned-state-machine)
8. [The HTTP API](#8-the-http-api)
9. [The React frontend](#9-the-react-frontend)
10. [The visual system](#10-the-visual-system)
11. [Testing, debugging and verification](#11-testing-debugging-and-verification)
12. [Running it from scratch, and what to build next](#12-running-it-from-scratch-and-what-to-build-next)

---

## 1. The product, the rules, and the stack

### What the app is

QuizCraft has three kinds of things in it:

- **People**, identified by a username and a password.
- **Quizzes**, each owned by one person, made of ordered questions.
- **Attempts**, each belonging to one person and one quiz, made of ordered
  answers.

A person can be both an author and a player. Authors write quizzes and decide when
a quiz becomes public. Players take public quizzes, one question at a time, and
get a score and a review at the end.

### The rules that shape the code

Most of the architecture follows from a short list of product rules:

1. **The server owns the answer key.** The browser must never receive the correct
   option, or the explanation, for a question it has not answered yet.
2. **The server owns the score.** The browser can choose an option, but it cannot
   increment a score. The database does that inside a transaction.
3. **One active attempt per person per quiz.** Starting the same quiz twice
   resumes the first attempt instead of creating a second one.
4. **Attempts are snapshots.** If an author edits a question after someone has
   taken it, the old review still shows what was asked and what was answered.
5. **Ownership is enforced on every write.** A quiz id in a URL is not proof of
   permission.
6. **Drafts are private.** A quiz is invisible to everyone but its owner until it
   is published. Publishing needs at least ten questions, and a public quiz
   cannot be cut back below ten.
7. **Every question has exactly four answers and exactly one correct answer.**
   This is validated on the server, not only in the form.
8. **Questions are presented one at a time.** The client asks for the next
   unanswered question. The server enforces one recorded answer per question and
   completes the attempt when every question has one. It does not need to enforce
   display order, because order does not change the score.

### The stack, and why

| Layer | Choice | Why this one |
| --- | --- | --- |
| UI | React 19 | Components and hooks are enough for a form-heavy app |
| Build | Vite 6 | Fast dev server, simple proxy, small production build |
| Routing | React Router 7 | Nested layouts and protected routes without a framework |
| HTTP | Fetch | No extra dependency; cookies work with one option |
| Server | Express 4 | Small, familiar, easy to read |
| Auth | Passport Local | A standard strategy, no token handling in the client |
| Sessions | express-session + connect-pg-simple | Session data survives a server restart |
| Passwords | bcrypt | Slow by design, with a configurable cost |
| Database | PostgreSQL + `pg` | Constraints, transactions and partial indexes do real work here |
| SQL | Raw parameterised queries | Every query is visible; no ORM magic |
| Tests | Jest + Supertest | The real Express app is exercised over HTTP |

The project deliberately avoids TypeScript, Next.js, MongoDB, JWTs, Redux,
GraphQL, Socket.IO, Prisma, Tailwind and component libraries. None of them are
bad; the point is to show the underlying mechanics with as little indirection as
possible.

### One request, end to end

When you click "Log in", this is the path:

```text
browser
  fetch('/api/auth/login', { method: 'POST', credentials: 'same-origin' })
    -> Vite dev server on :5173
      -> proxy rule for /api
        -> Express on :3000
          -> express.json parses the body
          -> express-session loads the session by cookie
          -> Passport initialises, the route matches
          -> authController.loginUser
            -> validateLogin
            -> passport.authenticate('local')
              -> LocalStrategy
                -> findUserByUsername (parameterised SQL)
                -> bcrypt.compare
            -> req.login writes the user id into the session
          -> response JSON + Set-Cookie
        -> proxy returns it to the browser
      -> AuthContext stores the user
    -> React Router navigates to the dashboard
```

In production the first two steps disappear: Express serves the built client and
the API from the same origin.

---

## 2. Repository tour and the development loop

### Two package files, on purpose

There is no npm workspace. The root `package.json` owns the server and the tests;
`client/package.json` owns React and Vite. That keeps the server dependencies
(including the native `bcrypt` module) separate from the browser build, at the
cost of running two installs:

```bash
npm install
npm --prefix client install
```

### The dev script

`scripts/dev.mjs` starts two child processes and forwards signals to both:

```js
const children = [
  spawn(process.execPath, ['--watch', 'server/server.js'], { stdio: 'inherit' }),
  spawn(npm, ['--prefix', 'client', 'run', 'dev'], { stdio: 'inherit' }),
];

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
```

The server uses Node's built-in `--watch`. Vite handles hot module replacement.
If either child exits, the parent stops the other one, so you do not leave a
half-running app behind.

### Two ports in development, one origin in production

`client/vite.config.js` proxies `/api` to port 3000:

```js
server: {
  port: 5173,
  proxy: {
    '/api': { target: 'http://localhost:3000', changeOrigin: false },
  },
},
```

`changeOrigin: false` keeps the `Host` header as localhost:5173. The API does not
care, but keeping the browser's origin consistent means cookies and redirects
behave the way they will in production.

`server/app.js` only serves static files if `client/dist/index.html` exists:

```js
const clientIndex = path.join(config.clientDist, 'index.html');
if (fs.existsSync(clientIndex)) {
  app.use(express.static(config.clientDist, { index: false }));
  app.get('*', (req, res) => res.sendFile(clientIndex));
}
```

The fallback is what makes client-side routes such as `/quizzes/7/edit` work after
a hard refresh. API routes are registered first, so an unknown `/api/...` path
never falls through to the React app.

### Configuration and fail-fast environment loading

`server/config.js` chooses `.env` or `.env.test` based on `NODE_ENV`, then throws
before the server starts if `DATABASE_URL` or `SESSION_SECRET` is missing:

```js
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.join(rootDir, envFile) });
```

Failing at startup is better than a confusing 500 on the first request. Jest sets
`NODE_ENV=test` automatically, which is how the test suite picks up `.env.test`.

### A reading order for the codebase

If you want to understand the whole app in one sitting, read in this order:

1. `server/db/schema.sql` for the data model.
2. `server/app.js` for middleware and wiring.
3. `server/routes/*.js` for the URL surface.
4. `server/controllers/*.js` for rules and status codes.
5. `server/db/queries/*.js` for the SQL.
6. `client/src/App.jsx` for routes.
7. `client/src/pages/TakeQuizPage.jsx` for the most interesting UI flow.
8. `client/src/styles/tokens.css` for the visual system.

---

## 3. The database, table by table

### The shape

```text
users
  id, username, password_hash, created_at
    │
    └──< quizzes (creator_id)
           id, title, description, category, difficulty,
           is_public, created_at, updated_at
             │
             ├──< questions (quiz_id)
             │      id, text, explanation, position
             │        │
             │        └──< answer_options (question_id)
             │               id, text, is_correct, position
             │
             └──< quiz_attempts (quiz_id)
                    id, user_id, score, total_questions,
                    started_at, completed_at
                      │
                      └──< attempt_answers (attempt_id)
                             question_id, answer_option_id,
                             question_position, question_text,
                             selected_text, correct_text,
                             explanation, is_correct, answered_at
```

There is also a `session` table created by `connect-pg-simple`. It is not in
`schema.sql` because the store creates it on first use.

### `users`

```sql
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_username_format
    CHECK (username = lower(username) AND char_length(username) BETWEEN 3 AND 24)
);
```

The check constraint makes the normalisation rule part of the database. Even a
buggy controller cannot insert `Alice` or a two-character username. The
application still lowercases and validates first, so users get a helpful message
rather than a raw constraint error.

`password_hash` is never selected by `findUserById`, which is the function
Passport uses to deserialise a session. Only the login query asks for the hash.

### `quizzes`

```sql
CREATE TABLE quizzes (
  id          SERIAL PRIMARY KEY,
  creator_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL,
  difficulty  TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_public   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT quizzes_title_length CHECK (char_length(title) BETWEEN 3 AND 120)
);
```

Deleting a user cascades to their quizzes. Deleting a quiz cascades to its
questions and attempts. There are indexes for the public shelf and for a
creator's own list.

### `questions` and `answer_options`

Questions are ordered by `position`, unique within a quiz. Options are ordered by
`position`, unique within a question, and constrained to positions 1 to 4. Those
two unique constraints are what let the code treat "four answers in order" as a
database guarantee, not just a UI convention.

`explanation` is nullable because an explanation is optional. The app normalises
an empty explanation to `null` before saving.

### `quiz_attempts`

```sql
CREATE TABLE quiz_attempts (
  id              SERIAL PRIMARY KEY,
  quiz_id         INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score           INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  CONSTRAINT quiz_attempts_score_range
    CHECK (score >= 0 AND score <= total_questions),
  CONSTRAINT quiz_attempts_has_questions CHECK (total_questions > 0)
);

CREATE UNIQUE INDEX quiz_attempts_one_active_idx
  ON quiz_attempts (user_id, quiz_id)
  WHERE completed_at IS NULL;
```

The partial unique index is the most important line in the schema. It says: among
all rows for one user and one quiz, at most one may have `completed_at IS NULL`.
Finished attempts are outside the index, so a user can take the same quiz again
after finishing it.

`total_questions` is fixed when the attempt starts. That makes the score
denominator stable even if the quiz is edited later.

### `attempt_answers`

This table is a deliberate copy, not a normalised pointer:

```sql
CREATE TABLE attempt_answers (
  id                SERIAL PRIMARY KEY,
  attempt_id        INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id       INTEGER REFERENCES questions(id) ON DELETE SET NULL,
  answer_option_id  INTEGER REFERENCES answer_options(id) ON DELETE SET NULL,
  question_position INTEGER NOT NULL,
  question_text     TEXT NOT NULL,
  selected_text     TEXT,
  correct_text      TEXT NOT NULL,
  explanation       TEXT,
  is_correct        BOOLEAN NOT NULL DEFAULT FALSE,
  answered_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);
```

If the review joined back to `questions` and `answer_options`, every edit would
rewrite history. Instead, the answer submission copies the question text, the
chosen answer, the correct answer and the explanation into the row. The foreign
keys use `ON DELETE SET NULL`, so an author can delete a question without
destroying the attempt; the copied text is enough to render the review.

`UNIQUE (attempt_id, question_id)` is the database's guarantee that one attempt
cannot record two answers for the same question. The controller checks this first
for a friendlier message, but the constraint is the real backstop.

### camelCase at the SQL boundary

PostgreSQL uses `snake_case`; the JavaScript API uses `camelCase`. Rather than
write a mapper for every row, each query aliases the columns:

```sql
SELECT
  q.id,
  q.creator_id AS "creatorId",
  q.is_public AS "isPublic",
  q.created_at AS "createdAt",
  u.username AS "creatorUsername"
FROM quizzes q
JOIN users u ON u.id = q.creator_id
```

Quoted aliases preserve case. This keeps the controllers free of renaming code,
at the cost of slightly longer SQL. It also makes the API shape visible directly
in the query.

### Schema setup and seeding

`server/db/setup.js` reads `schema.sql` and runs it. Every statement uses
`IF NOT EXISTS`, so running `npm run db:setup` twice is safe.

`server/db/seed.js` is intentionally simple:

- it checks whether `northstar` exists and stops if so;
- it inserts two users with the same hashed password;
- it inserts eleven quizzes and their questions, ten questions per quiz;
- it inserts three finished attempts by walking each quiz's questions and
  choosing correct or wrong options.

There are no migrations. For this project, the schema is created once. A
production version would use numbered migrations so existing data could be
changed safely.

---

## 4. Authentication and sessions

### Registration, step by step

`POST /api/auth/register` flows through `server/controllers/authController.js`:

```js
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
```

There are four things worth noticing:

1. **Normalisation happens before validation.** `normaliseUsername` lowercases
   and trims, so `Alice_1` and `alice_1` are the same account.
2. **The password is hashed before it reaches SQL.** `bcrypt.hash` uses
   `BCRYPT_ROUNDS`, which is 10 in development and 4 in tests.
3. **The unique violation is handled by code, not by pre-checking.** `23505` is
   PostgreSQL's unique violation. Pre-checking would introduce a race between two
   registrations; the constraint is authoritative.
4. **Registration logs the user in.** `req.login` is wrapped in a promise because
   Passport uses a callback.

The response deliberately contains `{ id, username, createdAt }` and no hash.
`createUser` returns only those columns.

### Login and the local strategy

`validateLogin` rejects missing fields with a 400. Passport then handles the
credential check:

```js
passport.use(
  new LocalStrategy(async (username, password, done) => {
    const user = await findUserByUsername(String(username).trim().toLowerCase());
    if (!user) {
      return done(null, false, { message: 'Incorrect username or password.' });
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);
    if (!passwordMatches) {
      return done(null, false, { message: 'Incorrect username or password.' });
    }

    return done(null, { id: user.id, username: user.username });
  }),
);
```

Both failure paths return the same message. That prevents an attacker from using
the login form to discover which usernames exist.

A successful login returns a minimal user object, not the database row. The
password hash never enters the session.

### The session

Sessions are configured in `server/app.js`:

```js
app.use(
  session({
    store: new PgSession({ pool, tableName: 'session', createTableIfMissing: true }),
    name: 'quizcraft.sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.isProduction,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);
```

- `httpOnly` keeps JavaScript from reading the cookie, which limits the damage
  from a cross-site scripting bug.
- `sameSite: 'lax'` stops the cookie from being sent on most cross-site form
  submissions while still allowing normal navigation.
- `secure` is on only in production, because it requires HTTPS.
- `resave: false` and `saveUninitialized: false` avoid writing empty sessions.
- The store is PostgreSQL, so a server restart does not log everyone out.

Passport stores only the user id in the session:

```js
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await findUserById(id);
  done(null, user || false);
});
```

On every request, `deserializeUser` re-reads the user. A deleted user therefore
loses access immediately, and the request only carries an id, not a stale copy of
the profile.

### Logout

```js
req.logout((error) => {
  if (error) return next(error);
  req.session.destroy((sessionError) => {
    if (sessionError) return next(sessionError);
    res.clearCookie('quizcraft.sid');
    res.status(204).end();
  });
});
```

Both layers matter: `req.logout` removes the Passport user from the session;
`session.destroy` deletes the server-side row; clearing the cookie removes the
client's handle.

### Protecting routes

`requireAuth` is a tiny middleware:

```js
export function requireAuth(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return next(new AppError(401, 'Log in to continue.'));
}
```

It is applied to whole routers (`/api/attempts`, `/api/me`) and to individual
quiz writes. Reads such as `GET /api/quizzes/:id` stay public, because a logged-out
visitor is allowed to look at a public quiz.

On the client, `RequireAuth` waits for the auth bootstrap, then redirects to
`/login` with the attempted location in router state:

```jsx
if (loading) return <BootScreen />;
if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
return children || <Outlet />;
```

`LoginPage` reads `location.state.from` and navigates back after a successful
login. That is why a protected deep link works: you land on the login screen, log
in, and continue where you were going.

### The client-side auth state

`AuthContext` calls `GET /api/auth/me` once on mount. Its three actions are thin
wrappers around the API:

```js
async function login(username, password) {
  const data = await api.post('/auth/login', { username, password });
  setUser(data.user);
}

async function register(username, password) { /* same shape */ }
async function logout() {
  await api.post('/auth/logout');
  setUser(null);
}
```

There is no token in localStorage and no auth header. The session cookie is sent
automatically because `api.js` sets `credentials: 'same-origin'`.

### What this design does not include

- No password reset or email verification.
- No rate limiting or account lockout.
- No CSRF token. `sameSite: 'lax'` plus JSON-only endpoints reduces the exposure,
  but a production app should add an explicit CSRF defence.
- No "remember me" choice. Sessions last seven days.

Knowing the gaps is part of understanding the design.

---

## 5. Authorization and visibility

### Owner or nothing

Every quiz write goes through one helper in `quizController.js`:

```js
async function requireOwnedQuiz(quizId, userId) {
  const owned = await findOwnedQuiz(quizId, userId);
  if (owned) return owned;

  const owner = await findQuizOwner(quizId);
  if (!owner) throw new AppError(404, 'Quiz not found.');

  throw new AppError(403, 'You can only change your own quizzes.');
}
```

The distinction is intentional:

- **404** means the quiz does not exist at all.
- **403** means it exists, but this user may not change it.

Some systems return 404 in both cases to avoid revealing that a resource exists.
QuizCraft returns 403 for a quiz the requester can already see, and 404 when the
quiz is private or missing. The tests assert 403 for editing another user's quiz.

### Private drafts

`GET /api/quizzes/:id` loads the quiz and then checks:

```js
const isOwner = req.user?.id === quiz.creatorId;
if (!quiz.isPublic && !isOwner) {
  throw new AppError(404, 'Quiz not found.');
}
```

A private quiz is a 404 to everyone except its owner. Even the fact that the id
exists is hidden. The owner gets `isOwner: true` so the UI can show "Edit this
quiz" and "Take your quiz".

### Discovery

`listPublicQuizzes` always filters on `q.is_public = TRUE`. Search is a
parameterised `ILIKE` on the title, while category and difficulty are exact
matches. All three filters are optional:

```sql
WHERE q.is_public = TRUE
  AND ($1::text IS NULL OR q.title ILIKE '%' || $1 || '%')
  AND ($2::text IS NULL OR q.category = $2)
  AND ($3::text IS NULL OR q.difficulty = $3)
ORDER BY q.created_at DESC, q.id DESC
LIMIT 60
```

The `$1::text IS NULL` pattern lets one query serve every combination of filters
without string concatenation. User input is never interpolated into SQL.

### Attempt ownership

Attempts use the same principle, keyed by the authenticated user rather than an
owner column:

```sql
WHERE a.id = $1 AND a.user_id = $2
```

A foreign attempt id produces a 404 from `getAttemptForUser` or
`getAttemptResult`. The author of the quiz cannot read someone else's attempt.

### The answer-leak boundary

This is the most security-sensitive pair of queries in the app.

`getQuestionsForTaking(quizId)` returns questions and options **without**
`is_correct` and **without** `explanation`:

```js
questions: [{ id, text, position, options: [{ id, text, position }] }]
```

`getOwnerQuestions(quizId)` is only used by the management endpoint and includes
both:

```js
options: [{ id, text, isCorrect, position }]
```

`tests/attempts.test.js` serialises the whole play response and asserts that the
string does not contain `isCorrect`, `explanation` or `correctOption`. This is a
stronger test than checking one field: it catches an accidental spread of an
internal object into the response.

Correctness is revealed only in the feedback returned by `POST /answers` or
`POST /skip`, after the answer has been recorded. The results endpoint is only
available after completion, and it reads from the stored snapshots.

### Publishing

New quizzes are always private, even if a client sends `isPublic: true`:

```js
const quiz = await createQuiz(req.user.id, { ...details, isPublic: false });
```

Publishing is a later update. The controller merges the incoming fields with the
existing ones, then checks:

```js
if (details.isPublic && existing.questionCount < MIN_PUBLISH_QUESTIONS) {
  const remaining = MIN_PUBLISH_QUESTIONS - existing.questionCount;
  throw new AppError(
    400,
    'Add at least 10 questions before making this quiz public.',
    { isPublic: `Add ${remaining} more ${remaining === 1 ? 'question' : 'questions'} first.` },
  );
}
```

`MIN_PUBLISH_QUESTIONS` lives in `server/constants.js` and the same number is
used by the editor, so the disabled checkbox and the server rule cannot drift
apart.

Unpublishing is always allowed, even if the quiz has attempts. The attempt
snapshots remain readable because they do not depend on the quiz staying public.
Deleting a question from a public quiz is blocked while the quiz sits at ten, so
the public shelf cannot drift below the minimum. Unpublish first, then delete.

---

## 6. Creating and editing quizzes

### The quiz details

`validateQuizDetails` is shared by create and update. It checks:

| Field | Rule |
| --- | --- |
| `title` | 3 to 120 characters |
| `description` | at most 800 characters, may be empty |
| `category` | one of the ten values in `server/constants.js` |
| `difficulty` | `easy`, `medium` or `hard` |
| `isPublic` | coerced to a boolean |

Failures throw an `AppError` with a `fields` object. The response looks like:

```json
{
  "error": "Please check the quiz details.",
  "fields": { "title": "Give the quiz a title of at least 3 characters." }
}
```

The client maps `error.fields` onto the form inputs, so the user sees the message
next to the field rather than in a generic banner.

### PATCH is a merge

`PATCH /api/quizzes/:id` allows a client to send only the field it wants to
change. The controller fills the gaps from the current row before validating:

```js
const details = validateQuizDetails({
  title: body.title === undefined ? existing.title : body.title,
  description: body.description === undefined ? existing.description : body.description,
  category: body.category === undefined ? existing.category : body.category,
  difficulty: body.difficulty === undefined ? existing.difficulty : body.difficulty,
  isPublic: body.isPublic === undefined ? existing.isPublic : body.isPublic,
});
```

One subtlety: `isPublic` is coerced with `Boolean(body.isPublic)`, so sending the
string `"false"` would be truthy. The UI always sends a real boolean from a
checkbox. A stricter API would validate the type explicitly.

### Adding a question

`POST /api/quizzes/:id/questions` checks ownership and the 50-question limit,
then calls `validateQuestion`, then `createQuestion`.

The validation enforces:

- question text: 5 to 400 characters;
- explanation: at most 600 characters, or `null`;
- exactly four options;
- every option non-empty and at most 200 characters;
- no duplicate option text, compared case-insensitively;
- exactly one correct option.

The unique-answer rule is a product choice, not a database constraint. Two answers
with the same text would be ambiguous in the interface, so the validator rejects
them.

`createQuestion` runs in a transaction:

```js
await client.query('BEGIN');
const positionResult = await client.query(
  `SELECT COALESCE(MAX(position), 0) + 1 AS next FROM questions WHERE quiz_id = $1`,
  [quizId],
);
// insert the question, then its four options
await client.query('COMMIT');
```

The transaction matters because a question without its four options would violate
the product's central rule. If any insert fails, the whole question disappears.

### Editing a question

`updateQuestion` replaces the question text and explanation, then deletes and
re-inserts the four options. Again, all inside a transaction.

This is simpler than diffing options, and it is safe for history because attempts
store their own copies. The option ids change, but no submitted attempt points at
an option id for its display text; `attempt_answers` keeps `selected_text` and
`correct_text`.

### Deleting and timestamps

Deleting a question removes its options by cascade. Both question changes and
detail changes call `touchQuiz`, which sets `updated_at = now()`. That timestamp
drives the "last updated" line in the editor and the ordering on the dashboard.

The dashboard orders owned quizzes by `updated_at`, so editing a question moves
its quiz to the top of the author's desk.

### The editor UI

`EditQuizPage` keeps three pieces of local state:

- `details`, a copy of the editable quiz fields, seeded from the loaded quiz;
- `editor`, either `null`, `{ question: null }` for a new question, or
  `{ question }` for an existing one;
- `confirmQuestion` and `confirmQuiz` for inline delete confirmations.

Saving details calls `PATCH /quizzes/:id`, then `reload()` from `useApi`. Saving a
question calls `POST` or `PATCH` on the question endpoint, closes the editor,
reloads, and shows a short status note.

`QuestionForm` is a controlled component. It keeps its own copy of the question
while editing, validates locally for fast feedback, and calls `onSave` only when
the local checks pass. The server validates again. That duplication is
intentional: the client check is a convenience, the server check is the rule.

### A concurrency note

The 50-question limit is checked with a count before insert. Two simultaneous
requests could both pass the check. In practice this is a single-user editor, and
the unique `(quiz_id, position)` constraint would reject one of the resulting
position collisions. A production version might lock the quiz row or use a
database-level counter. Recognising where the guarantee is soft is more useful
than pretending it is airtight.

---

## 7. Taking a quiz: a server-owned state machine

### Starting and resuming

`POST /api/quizzes/:id/attempts` first loads the quiz and checks:

- the quiz exists;
- it is public, or the requester owns it;
- it has at least one question (a public quiz will always have ten);

Then `startAttempt` runs:

```sql
INSERT INTO quiz_attempts (quiz_id, user_id, total_questions)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, quiz_id) WHERE completed_at IS NULL
DO NOTHING
RETURNING ...
```

If the insert returns a row, the response is `201` and `resumed: false`. If it
returns nothing, an unfinished attempt already exists; the query selects it and
the response is `200` with `resumed: true`. The partial unique index from part 3
is what makes `ON CONFLICT` possible.

This means "Take it again" on the results page can safely call the same endpoint.
A previous attempt is complete, so it is outside the unique index, and a fresh
row is created.

### What the play endpoint returns

`GET /api/attempts/:id/play`:

- returns the attempt, quiz summary, questions and answers already submitted;
- omits `isCorrect`, explanations and correct option ids;
- returns `{ completed: true }` if the attempt is finished, and the client
  redirects to the results page.

The client uses `data.answers.length` as the starting index, so a reload or a
return visit resumes at the first unanswered question.

### Submitting an answer

`submitAnswer` is the heart of the app. It runs in one transaction:

1. **Lock the attempt.**
   ```sql
   SELECT id, quiz_id, total_questions, completed_at
   FROM quiz_attempts
   WHERE id = $1 AND user_id = $2
   FOR UPDATE
   ```
   `FOR UPDATE` serialises concurrent submissions for the same attempt. Two
   requests cannot both read the same score and then increment it independently.

2. **Check it is unfinished.** A completed attempt returns 409.

3. **Check the question belongs to the quiz.** A question from another quiz
   returns 400, even if its id is valid.

4. **Reject a duplicate answer.** The controller checks first and returns a 409.
   The unique `(attempt_id, question_id)` constraint is the final backstop.

5. **Find the correct option.** If a question is broken and has no correct option,
   the transaction fails with a 500 rather than scoring it wrongly.

6. **Validate the selected option.** If an option id is provided, it must belong
   to that question. A mismatched option returns 400. A `null` option is a skip.

7. **Insert the snapshot.** The row stores the question text, selected text,
   correct text, explanation and a boolean.

8. **Increment the score.**
   ```sql
   UPDATE quiz_attempts
   SET score = score + $2
   WHERE id = $1
   RETURNING score, total_questions
   ```

9. **Count the answers.** If `answeredCount >= total_questions`, set
   `completed_at = now()`.

10. **Commit and return feedback.** The feedback contains the correctness, the
    correct option id and text, the explanation, the running score, and whether
    the attempt is complete.

The client never computes any of those values. It renders what came back.

### Skipping

`POST /api/attempts/:id/skip` takes only `{ questionId }` and calls the same
`submitAnswer` with `optionId: null`.

- `answer_option_id` is `NULL`;
- `selected_text` is `NULL`;
- `is_correct` is `FALSE`;
- the score does not change;
- the answer count still increases, so the attempt can complete.

In the review, a skipped question is recognised by `selectedText` being null. It
is counted separately from an incorrect answer.

### Completion and results

`getAttemptResult` derives the summary from the stored rows:

```js
const correctCount = review.filter((answer) => answer.isCorrect).length;
const skippedCount = review.filter((answer) => !answer.selectedText).length;
const incorrectCount = review.length - correctCount - skippedCount;
const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
```

The attempt row stores `score`; it does not store the percentage or the counts.
Those are cheap to derive and cannot drift out of sync with the review. The
review itself is ordered by `question_position`.

### Worked example

A three-question quiz:

| Question | Result | Score |
| --- | --- | --- |
| 1 | correct | 1 |
| 2 | wrong | 0 |
| 3 | skipped | 0 |

The results endpoint returns `score: 1`, `percentage: 33`, `correctCount: 1`,
`incorrectCount: 1`, `skippedCount: 1`. The review has three rows, the third with
`selectedText: null`.

### Honest boundaries

- **Order is a client convention.** The API accepts any question belonging to the
  quiz, in any order. It guarantees one answer per question and completion when
  all are answered. If a product needed strict order, `quiz_attempts` would need a
  `current_position` and the submit query would reject out-of-order questions.
- **The question set is not frozen at attempt start.** `total_questions` is
  frozen, but `getQuestionsForTaking` reads the current questions. Editing a quiz
  while an attempt is in progress can produce a mismatch. A production version
  would create an `attempt_questions` table at start and read from it for the
  whole attempt. This is called out in the README's known limits.
- **No timer.** The attempt can sit unfinished indefinitely. The partial unique
  index still prevents a second one.
- **The owner can take their own quiz.** The play payload is the same as for any
  other participant, so the owner does not see answers early.

---

## 8. The HTTP API

### Conventions

- All endpoints are under `/api`.
- Bodies and responses are JSON, except `204 No Content`.
- Authentication is the session cookie, not an `Authorization` header.
- Successful creates return `201`, deletes return `204`, everything else `200`.
- Errors use `{ error, fields? }`.
- Unknown `/api/...` routes return a JSON 404, not the React app.

### Status codes

| Code | Used for |
| --- | --- |
| 200 | Successful read or update, resumed attempt |
| 201 | Registered, created quiz/question/answer, started attempt |
| 204 | Logged out, deleted quiz/question |
| 400 | Validation failure, invalid id, answer outside the attempt |
| 401 | No session on a protected endpoint |
| 403 | Authenticated, but not the owner of the quiz |
| 404 | Missing resource, private quiz to a non-owner, foreign attempt |
| 409 | Duplicate username, duplicate answer, attempt already complete, results before completion |
| 500 | Unexpected server error; production hides the message |

### The error pipeline

Controllers throw `AppError`:

```js
export class AppError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
```

Async route handlers are wrapped:

```js
export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
```

Express 4 does not catch rejected promises from async handlers on its own. The
wrapper forwards them to the central error middleware, which decides what the
client sees:

```js
const status = error.status || 500;
if (status >= 500) console.error(error);

const body = {
  error: status >= 500 && config.isProduction
    ? 'Something went wrong on our side.'
    : error.message || 'Something went wrong.',
};
if (error.fields) body.fields = error.fields;
res.status(status).json(body);
```

The production branch matters: internal messages and stack traces should not
reach users.

### Parsing ids and text

`parseId` rejects anything that is not a positive integer and returns a 400
instead of letting PostgreSQL produce a type error. `cleanText` trims strings and
turns non-strings into an empty string, so validators never call `.trim()` on
`undefined`.

### The client error type

`client/src/api.js` turns any failed response into an `ApiError` with `status` and
`fields`. Pages can then branch on `error.status` to choose a specific title, as
the quiz detail and results pages do.

### Fixed limits

There is no pagination. The API caps:

- discovery at 60 quizzes;
- attempt history at 100;
- dashboard recent attempts at 5;
- a quiz at 50 questions;
- request bodies at 128 kB.

These are deliberate product-sized limits. Part 12 suggests pagination as an
exercise.

### A curl walkthrough

The API can be driven without the UI. Save cookies in a jar:

```bash
# Register (or log in with the demo account)
curl -i -c cookies.txt -H 'Content-Type: application/json' \
  -d '{"username":"northstar","password":"quizcraft123"}' \
  http://localhost:3000/api/auth/login

# Create a private draft
curl -s -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"title":"A Curl Quiz","description":"Made at the terminal.","category":"General","difficulty":"easy"}' \
  http://localhost:3000/api/quizzes

# Add a question (replace :id). Repeat until the quiz has ten.
curl -s -b cookies.txt -H 'Content-Type: application/json' \
  -d '{"text":"Which tool made this quiz?","options":[{"text":"curl","isCorrect":true},{"text":"A browser","isCorrect":false},{"text":"A notebook","isCorrect":false},{"text":"A printer","isCorrect":false}]}' \
  http://localhost:3000/api/quizzes/:id/questions

# Publish it. This returns 400 until the quiz has ten questions.
curl -s -b cookies.txt -X PATCH -H 'Content-Type: application/json' \
  -d '{"isPublic":true}' \
  http://localhost:3000/api/quizzes/:id
```

If a request returns 401, check that you passed `-b cookies.txt`. If it returns
403, you are authenticated but do not own the quiz.

---

## 9. The React frontend

### Routes and the two shells

`client/src/App.jsx` defines every route:

| Path | Page | Shell | Protected |
| --- | --- | --- | --- |
| `/` | Landing | site | no |
| `/login` | Log in | site | no |
| `/register` | Register | site | no |
| `/discover` | Discover | site | no |
| `/quizzes/:id` | Quiz detail | site | no |
| `/dashboard` | Your desk | site | yes |
| `/history` | Attempts | site | yes |
| `/quizzes/new` | New quiz | site | yes |
| `/quizzes/:id/edit` | Editor | site | yes |
| `/attempts/:id/results` | Results | site | yes |
| `/attempts/:id` | Take a quiz | focused, headerless | yes |
| `*` | Not found | site | no |

The take route is deliberately outside `SiteLayout`. It has its own minimal
header with the wordmark, the quiz title and a "Leave quiz" link. The question
should own the screen; navigation and footer can wait.

`ScrollToTop` runs on every pathname change. It uses a `useEffect`, so it runs
after navigation, and it does not fight the browser's own scroll restoration on a
reload.

### The site shell

`components/Layout.jsx` contains:

- a skip link to `#main`;
- the wordmark, a menu button, and navigation;
- account controls (log in / join, or username and log out);
- the footer with link groups and a quiet colophon line.

On narrow screens the menu collapses behind a square button with
`aria-expanded` and `aria-controls`. Escape closes it, and a pathname change also
closes it. That last effect prevents the menu from staying open after tapping a
link.

### Loading data with `useApi`

Almost every page needs the same three-state pattern: loading, error, data. The
hook keeps the last good data while a reload is in flight:

```js
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: Boolean(path) });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    // fetch, guard against setting state after unmount
  }, [path, version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);
  return { ...state, reload };
}
```

The `active` flag in the effect prevents a late response from an old path
overwriting newer data. `reload()` is just a version bump; changing it re-runs the
effect.

Pages distinguish "first load" from "refresh" by checking `loading && !data`.
That lets a screen keep showing useful content while a save is refreshing it,
rather than flashing a skeleton.

### The API wrapper

`api.js` centralises four things:

- prefixing `/api`;
- setting `Content-Type` when there is a body;
- sending cookies with `credentials: 'same-origin'`;
- turning failures into `ApiError`.

It also handles the awkward case of an empty `204` response: it reads the
response as text and only parses when there is text.

### Page-local state

There is no global store. Each page owns what it needs:

- **Dashboard and history:** no local data state beyond `useApi`.
- **Quiz detail:** `starting` and `startError` around the start button.
- **Editor:** details, question editor, confirmation state, busy flags.
- **Take:** selected option, feedback, current index, busy, action error.
- **Results:** retake busy and error.

This is enough because pages do not share mutable state. The auth user is the one
piece that crosses routes, and that lives in `AuthContext`.

The trade-off is a little repetition. In exchange, every page can be read on its
own, and there is no cache invalidation puzzle.

### Forms and server field errors

Every form is controlled. On submit, the page clears the previous error, sets a
busy flag, calls the API, and either navigates or stores the error.

`ApiError.fields` maps directly to inline messages:

```jsx
{fields.title ? <span className="field__error">{fields.title}</span> : null}
```

The submit button is disabled while busy, which prevents most double submits.
The server still protects against duplicates where it matters (answers,
usernames).

### The attempt screen in detail

`TakeQuizPage` is worth reading closely:

```js
const currentIndex = index ?? data.answers?.length ?? 0;
const question = questions[currentIndex];
```

- On first load, `index` is null, so the page starts at the number of answers
  already recorded. That is the resume behaviour.
- After a submission, `feedback` is set but `index` does not change, so the same
  question stays on screen with its feedback.
- "Next question" clears the feedback and selection, then increments `index`.
- On the last question, the button becomes "See your score" and navigates to the
  results route.

The progress bar uses `answeredCount` from the feedback when present, otherwise
the current index. That makes it jump forward immediately after a lock-in.

Option state is derived, not stored:

```js
function optionState(option) {
  if (!feedback) return option.id === selected ? ' is-selected' : '';
  if (option.id === feedback.correctOptionId) return ' is-correct';
  if (!feedback.skipped && option.id === selected) return ' is-wrong';
  return ' is-muted';
}
```

One function covers selection, correctness, the chosen wrong answer, and the
muted leftovers. When feedback appears, the options are disabled, so the state
cannot change until the next question.

The feedback is announced through `aria-live="polite"` and appears above the
"Next question" action in the DOM, so a keyboard or screen-reader user reads the
result before the next action.

### Accessibility in practice

- The skip link is the first focusable element.
- Every input has a visible label; option letters have visually hidden labels.
- `aria-invalid` is set when a field has a server error.
- Feedback and form-level errors use live regions or `role="alert"`.
- The mobile menu button reports its state.
- The take options use `aria-pressed`.
- Focus rings are global and visible; the focus ring is a white outline on the
  dark ground, and the primary control is a white pill.
- `prefers-reduced-motion` turns off the transitions and smooth scrolling.
- Empty, loading and error states are real states, not blank screens.

### What is deliberately absent

No Redux, no Zustand, no React Query, no optimistic updates. The app is small
enough that a fetch-on-mount hook plus local state is clearer. Adding a query
cache would be reasonable if dashboards started polling or if several components
needed the same remote data at once.

---

## 10. The visual system

### The direction

QuizCraft is dark because people read it in long stretches, one question after
another, rather than skimming it like a marketing page:

- the header, the page and the footers share one near-black ground;
- elevation is a lightness step: `#0e0d0c` ground, `#181716` surface, `#2a2a2a`
  nested panel, with no resting borders or shadows;
- colour is kept for data — the correct-answer state, the score, the question
  tally, the answer key — and never on a button, tab or nav;
- the one filled control is a white pill with black text;
- Inter serves every role, weights 400 to 600, self-hosted.

It should not read like a generic admin template. There is no violet gradient, no
floating dashboard preview, no coloured active pill on a sidebar, no row of KPI
tiles with icons in tinted circles, and no 01 / 02 / 03 markers. The question with
four answers is the picture.

### Tokens

`client/src/styles/tokens.css` holds the design decisions:

```css
--color-paper: #0e0d0c;      /* near-black warm ground */
--color-paper-2: #181716;    /* one step up: surfaces */
--color-paper-3: #2a2a2a;    /* two steps up: nested panels */
--color-ink: #ffffff;
--color-muted: #b4b4b4;
--color-border: #1a1a1a;
--color-accent: #c6f24e;     /* data only */
--color-accent-deep: #d9ff7a;
--color-accent-ink: #0e0d0c;

--font-display: "Inter", ui-sans-serif, system-ui, sans-serif;
--font-body: "Inter", ui-sans-serif, system-ui, sans-serif;

--text-display: clamp(2.125rem, 3.2vw + 0.7rem, 3.5rem);
--text-page: clamp(1.5rem, 1vw + 1.2rem, 1.75rem);
--text-section: clamp(1.25rem, 0.8vw + 1.05rem, 1.5rem);
--text-question: clamp(1.75rem, 2vw + 1rem, 2.25rem);

--space-xs: 8px;
--space-sm: 12px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;
--space-4xl: 96px;

--rule-hair: 1px;
--rule-bar: 1px;
--radius-card: 20px;
--radius-input: 999px;
--button-height: 36px;
--shadow-card: none;
```

Everything else is composed from these. If you want to change the palette, change
the values here and then check contrast again; do not sprinkle new hex values
through the pages.

The style-specific overrides live in `client/src/styles/theme.css`, which loads
last so it can restate the older structural rules without rewrites.

### Layout language

- **Container:** 1120px maximum with a fluid gutter.
- **Page head:** a title, a short lede, actions on the right. The rule under it is
  a border, not a heavy band.
- **Section head:** title and supporting line on the left, one action on the
  right.
- **Wells:** form panels, notices and notes blocks are surfaces lifted by
  lightness, with no border and no shadow.
- **Rows over cards:** quizzes, questions, attempts and reviews are ruled rows,
  divided by a 1px `--color-border` line.
- **Accent budget:** under 3%, nearly all of it on data. The score, the correct
  answer and the answer-key mark are the only green on a screen.

### Type

One family, Inter, carries every role. Headings are weight 600 with tight
tracking; body text is 400 at a comfortable line height. `h1` and `h2` use
`text-wrap: balance`; paragraphs use `text-wrap: pretty`. Figures use
`font-variant-numeric: tabular-nums` where they sit in columns (scores, stats,
question counts).

The landing headline is a full-width display:

```text
Write a question.
Find out who knows.
```

At 390px each sentence still holds to a single line (34px), so the headline stays
two lines from 320px up. The measure is uncapped; the two spans are already the
line breaks, so `text-wrap: balance` has nothing left to balance.

### The signature: the live tally and the answer key

Two pieces say more about the product than a screenshot would:

- the **sample slip** on the landing page is a real interactive question with four
  lettered wells that marks the correct answer and explains the result;
- the **ten-notch tally** across the top of the take-quiz screen shows how many
  questions are done, which is current, and which remain. The progress bar of a
  generic quiz app is replaced by a row of notches that reads at a glance.

### Responsive behaviour

The main breakpoints in `pages.css` and `theme.css` are:

- `80rem`: the landing steps become one column.
- `70rem`: editor and desk sidebars collapse.
- `60rem`: hero splits, auth, quiz hero and score board stack.
- `48rem`: header menu folds, two-column rows become one column, the stat strip
  wraps to two rows.
- `40rem`: display sizes step down, question options simplify, review answers
  stack.

The layout has been checked at 320, 390, 768, 1024 and 1440 pixels with no
horizontal overflow. The dashboard and discovery tables become stacked rows
rather than forcing a horizontal scroll.

### Motion

Transitions are limited to background, border, colour and a 1px press transform.
There is no `transition: all`, no width or height animation, and no looping
attention animation. Under `prefers-reduced-motion: reduce`, transitions and
smooth scrolling are removed.

### Outlines instead of shadows

Selected and answered options are marked with a 1px inset outline plus a lightness
step, never a drop shadow. Every resting surface is shadowless; the only outlines
on the page are those state rings, drawn inset. Elevation is entirely lightness.

### The design checks

The look was checked two ways: by reading the rendered pages at several widths and
fixing what looked wrong, and by a pass over the source for the habits worth
avoiding — stacked borders and shadows, gratuitous gradients, coloured chrome,
slogan headings.

The layout holds at 320, 390, 768, 1024 and 1440 pixels. A few deliberate choices
look like mistakes until you know why:

- the page title is display-sized, to give the app a face;
- the sign-in column sits in a centred canvas with equal margins;
- the lime stays on data, never chrome;
- column gaps scale with the section instead of one fixed gap for every row.

The browser is the final authority. If a change makes a page worse at 390px, clean
source does not save it.

---

## 11. Testing, debugging and verification

### How the test suite is wired

`package.json` sets:

```json
"jest": {
  "testEnvironment": "node",
  "globalSetup": "<rootDir>/tests/globalSetup.js",
  "setupFilesAfterEnv": ["<rootDir>/tests/jest.setup.js"],
  "maxWorkers": 1
}
```

The important parts:

- `globalSetup.js` connects to `.env.test`, drops the `public` schema, recreates
  it, and applies `schema.sql`. Every run starts from an empty schema.
- `jest.setup.js` truncates `users` before each test with
  `TRUNCATE ... RESTART IDENTITY CASCADE`, which also clears quizzes, questions,
  attempts and answers through the foreign keys.
- `maxWorkers: 1` avoids two test files fighting over the same database.

The suite uses `supertest.agent(app)` so cookies persist across requests within
one test. Each test that needs a fresh identity creates a new agent.

### What the tests cover

**Authentication**

- registration hashes the password and starts a session;
- duplicate usernames return 409 with a field message;
- a short password returns 400;
- correct and incorrect logins;
- logout clears the session;
- protected endpoints return 401.

**Quiz management**

- a new quiz is private and cannot be published below ten questions;
- a public quiz refuses to drop below ten questions;
- public detail omits the answer key; the owner management response includes it;
- non-owners get 403 on every write and on management;
- private quizzes are 404 to others and absent from discovery;
- search, category and difficulty filters;
- question shape and the single-correct-answer rule;
- editing and deleting questions, then deleting the quiz.

**Attempts**

- starting requires authentication;
- the play payload does not contain `isCorrect`, `explanation` or correct option
  identifiers;
- scoring, duplicate prevention, completion, and result counts;
- questions and options outside the attempt are rejected;
- an unfinished attempt resumes;
- skips score zero and appear in the review;
- private quizzes cannot be attempted by others, but the owner can preview;
- an empty quiz cannot be started.

### Writing another test

The helpers in `tests/helpers.js` keep tests readable:

```js
const author = makeAgent();
await registerUser(author, 'author');
const { quiz } = await createPublishedQuiz(author);

const player = makeAgent();
await registerUser(player, 'player');

const start = await player.post(`/api/quizzes/${quiz.id}/attempts`);
const play = await player.get(`/api/attempts/${start.body.attempt.id}/play`);
```

`createPublishedQuiz` returns ten questions. `correctOption` and `wrongOption`
read from the owner response, which is the only response that contains the key.

A good new test follows the same shape: arrange users and a quiz through the API,
act as the player, assert status and body, and check the database only when the
API cannot prove the point.

### What the tests do not cover

There are no component tests and no browser tests in the repository. The visual
and interactive behaviour was checked with a Playwright script during
development: login, create a quiz, add ten questions, publish, take it, edit the
question, and confirm the old review kept its snapshot. That script is not part
of `npm test` because it needs a running server and a browser.

If you add browser tests, the highest-value flows are:

1. register, log in, log out;
2. create a draft, add ten questions, publish;
3. take a quiz with correct, wrong and skipped answers;
4. edit a question after an attempt and reopen the review.

### Debugging recipes

**The API will not start.** The server checks the database first and prints
`Could not reach PostgreSQL. Is the database running?`. Check `DATABASE_URL`,
the port, and the database process. The API does not start in a half-working
state.

**Login returns 500 with `relation "session" does not exist`.** The session table
was dropped while the server was running. `connect-pg-simple` creates it on first
use, but the running process may have cached the failure. Restart the API after a
schema reset.

**Every request is 401 in production over plain HTTP.** The production cookie is
`secure`, so the browser refuses to store it on `http://`. Run behind HTTPS, or
use `NODE_ENV=development` for a local preview of the built client.

**A save seems to do nothing.** Open the network panel. A 400 carries `fields`;
a 403 means ownership; a 409 means the answer or attempt state is stale. The UI
surfaces the server message, so read the red text before guessing.

**Inspect the database without `psql`.** The project already has `pg`:

```bash
node -e "
import('pg').then(async ({ default: pg }) => {
  const client = new pg.Client({ connectionString: 'postgresql://user:pass@host:5432/quizcraft' });
  await client.connect();
  const { rows } = await client.query('SELECT id, title, is_public FROM quizzes ORDER BY id');
  console.table(rows);
  await client.end();
});
"
```

**Start over in development.** Drop the schema, apply it again, and reseed:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

```bash
npm run db:setup
npm run db:seed
```

`db:seed` only runs on an empty database (it stops if `northstar` exists), so a
full reset is the way back to the demo state.

### A manual end-to-end checklist

1. Log in as `northstar`.
2. Create a quiz. It lands in the editor as a private draft.
3. Try to publish with fewer than ten questions. The checkbox is disabled and
   the server would reject it anyway.
4. Add ten questions, each with four answers and one correct answer.
5. Publish it. Check "View the quiz": the public page shows no questions before
   an attempt, only the question count.
6. Take the quiz. Answer one correctly, one incorrectly, skip one. Confirm the
   feedback and the running score.
7. Finish. The results page shows the percentage and a review with all three
   states.
8. Return to the editor and change the question text.
9. Open the old attempt from history. The review still shows the old text and the
   old explanation.
10. Log out and open the quiz as a logged-out visitor. You can see the public
    detail but not take it.

---

## 12. Running it from scratch, and what to build next

### The complete setup, in order

```bash
# 1. Install both packages
npm install
npm --prefix client install

# 2. Create the databases
createdb quizcraft
createdb quizcraft_test

# 3. Configure
cp .env.example .env
cp .env.example .env.test
# edit DATABASE_URL and SESSION_SECRET in both

# 4. Create the schema and demo data
npm run db:setup
npm run db:seed

# 5. Run
npm run dev
```

Then open <http://localhost:5173> and log in as `northstar` with
`quizcraft123`.

If you only want the API, `npm run dev:server` and use `curl` or Supertest. If
you only want the client, `npm run dev:client` still needs the API for data.

### Deployment checklist

1. Provision PostgreSQL and apply `schema.sql`.
2. Set `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV=production` and `PORT`.
3. Build the client with `npm run build`.
4. Start with `npm start` behind a reverse proxy that terminates HTTPS.
5. Keep `trust proxy` enabled (it is set in production) so secure cookies and
   client IPs behave.
6. Add rate limiting at the proxy for `/api/auth/login` and
   `/api/auth/register`.
7. Back up the database, including the `session` table.
8. Replace `schema.sql` with versioned migrations before changing an existing
   production schema.

The app has no Dockerfile, no CI configuration and no hosted deployment. The
development database used while building this project was a local PostgreSQL
cluster, which is why the README treats `DATABASE_URL` as the only database
contract.

### Exercises, in rough order of difficulty

1. **Strict question order.** Add `current_position` to `quiz_attempts` and reject
   answers for any other position. Update the play payload to return only the
   current question.
2. **Freeze the question set.** Create `attempt_questions` when an attempt starts
   and read it for the whole attempt. This fixes the edit-mid-attempt edge case.
3. **Pagination.** Add `limit` and `offset` to discovery and history, with a
   "Load more" control. Keep the server caps.
4. **Password change and reset.** Add a settings form. A reset needs email or a
   one-time token; both are deliberately out of scope here.
5. **Categories as data.** Move the category list into a table with a foreign key.
   Add an admin-only endpoint.
6. **Leaderboard.** Add a per-quiz best-score query and a public leaderboard. Be
   careful not to expose other users' full attempt history.
7. **CSV export.** Let an owner download the completed attempts for their quiz.
   This is a good exercise in authorization and streaming.
8. **Duplicate a quiz.** Copy the quiz, questions and options in one transaction,
   with positions recalculated.
9. **Component tests.** Add React Testing Library around `QuestionForm` and
   `TakeQuizPage`'s option logic. Keep them focused on behaviour, not class names.
10. **Accessibility audit.** Run a screen reader through the take flow and the
    editor. Check focus order after feedback appears and after the inline delete
    confirmation opens.

### What this project teaches

- **Authority belongs on the server.** Hiding an answer in the UI is not enough;
  the play payload must not contain it.
- **Constraints are documentation.** The partial unique index, the one-correct
  answer rule and the option positions describe the product in a way that
  survives bugs in the controller.
- **Snapshots beat joins for history.** Copying the text at answer time is a
  deliberate denormalisation. It makes edits safe.
- **Transactions are for invariants.** A question and its four options, an answer
  and its score, an attempt and its completion, each group moves together.
- **A small client is a feature.** `useApi` plus local state is enough here. The
  code stays readable because there is no cache to invalidate.
- **A design system is a set of refusals.** No shadows, no rounded cards, no
  second accent colour, no decorative numbering. The refusals are what make the
  pages feel like one product.
- **Test the boundary, not the implementation.** The answer-leak test serialises
  the whole response. It does not care which function built it.

### Glossary

| Term | Meaning here |
| --- | --- |
| **Attempt** | One user's run through one quiz, finished or in progress |
| **Snapshot** | The copied question, answers and explanation stored with an answer |
| **Partial index** | A PostgreSQL index with a `WHERE` clause; here, only unfinished attempts |
| **Session** | A server-side record keyed by a cookie |
| **Passport strategy** | The function that checks a username and password |
| **Play payload** | The questions and options sent to the browser while taking a quiz |
| **Field error** | A validation message attached to a form field |
| **Well** | A flat raised panel in the visual system |
| **Slip** | The landing page's sample-question figure |
| **Tally** | The row of notches across the take screen showing progress |

### Where to look for what

| Concept | File |
| --- | --- |
| Schema and constraints | `server/db/schema.sql` |
| Session and middleware | `server/app.js` |
| Password login | `server/auth/passport.js` |
| Registration and logout | `server/controllers/authController.js` |
| Ownership rules | `server/controllers/quizController.js` |
| Answer-scoring transaction | `server/db/queries/attempts.js` |
| Play payload without answers | `server/db/queries/quizzes.js` (`getQuestionsForTaking`) |
| API error shape | `server/middleware/error.js` |
| Routes | `client/src/App.jsx` |
| Auth state | `client/src/context/AuthContext.jsx` |
| Data loading | `client/src/hooks.js` |
| Attempt UI | `client/src/pages/TakeQuizPage.jsx` |
| Editor UI | `client/src/pages/EditQuizPage.jsx` and `client/src/components/QuestionForm.jsx` |
| Design tokens | `client/src/styles/tokens.css` |
| Style statement and shared rules | `client/src/styles/main.css` |
| App-screen theme overrides | `client/src/styles/theme.css` |
| Responsive layout | `client/src/styles/pages.css` |
| Component styles | `client/src/styles/base.css` |
| Test setup | `tests/globalSetup.js`, `tests/jest.setup.js` |
| Behavioural tests | `tests/auth.test.js`, `tests/quizzes.test.js`, `tests/attempts.test.js` |

Read the tests next. They are the shortest description of what the server
promises.
