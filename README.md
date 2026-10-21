# QuizCraft

A full-stack quiz builder and quiz-taking app. Write a quiz, add four-answer
questions, publish it when it is ready, and take it one question at a time.
Every answer is checked on the server, and every finished attempt keeps a
snapshot of the questions and answers as they were when it was taken.

Built with React, Express and PostgreSQL. No TypeScript, no JWT, no ORM. The
database is queried with parameterised SQL, and the session lives in PostgreSQL
rather than in a token.

## What it does

- **Accounts.** Register with a username and password, log in, log out. Passwords
  are hashed with bcrypt and sessions are stored in PostgreSQL.
- **Authoring.** Create private drafts, edit the cover details, add up to 50
  questions, and edit or delete them. Each question has exactly four answers and
  exactly one correct answer, with an optional explanation.
- **Publishing.** A quiz is private until its owner publishes it. Publishing
  requires at least 10 questions, and a public quiz cannot be reduced below 10.
  Public quizzes appear in discovery and on the landing page.
- **Discovery.** Search public quizzes by title and filter by category and
  difficulty. A private quiz belongs to its owner alone.
- **Taking.** One question at a time, one answer locked in per question, immediate
  feedback and the explanation. A question can be skipped. The score is kept by
  the server, never by the browser.
- **Results.** A finished attempt has a score, a percentage, counts for correct,
  incorrect and skipped, and a full review.
- **History.** Every finished attempt is listed for its user, newest first.
- **Snapshots.** Editing a question after someone has taken it does not rewrite
  their old result. The review keeps the question, the chosen answer, the correct
  answer and the explanation from the moment the answer was submitted.

## Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| UI | React 19 | Function components and hooks |
| Build | Vite 6 | Dev server with an `/api` proxy |
| Routing | React Router 7 | Declarative `BrowserRouter` routes |
| HTTP | Fetch | A small `api.js` wrapper, cookies included |
| Server | Node.js + Express 4 | ES modules throughout |
| Auth | Passport Local + express-session | Session ID in an HTTP-only cookie |
| Sessions | connect-pg-simple | Sessions stored in PostgreSQL |
| Passwords | bcrypt | Cost 10 by default, 4 under test |
| Database | PostgreSQL + `pg` | Raw parameterised SQL, no ORM |
| Tests | Jest + Supertest | 22 integration tests |

## Requirements

- Node.js 20 or newer
- PostgreSQL 14 or newer
- npm

## Getting started

### 1. Install dependencies

The server and the client have separate package files:

```bash
npm install
npm --prefix client install
```

`bcrypt` compiles a native module on install. On Debian or Ubuntu you may need
`build-essential` and `python3`.

### 2. Create the databases

Create one database for development and, if you want to run the test suite, one
for tests:

```bash
createdb quizcraft
createdb quizcraft_test
```

You can use any PostgreSQL role and password. Put the matching connection
strings in the environment files in step 3.

### 3. Configure the environment

```bash
cp .env.example .env
cp .env.example .env.test
```

Then edit both files. At minimum:

- `DATABASE_URL` points at your PostgreSQL database.
- `SESSION_SECRET` is a long random string.

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The test file must point at a **disposable** database. The Jest global setup
drops and recreates its `public` schema on every run.

`.env.test` is read when `NODE_ENV=test`, which Jest sets automatically.

### 4. Create the schema and demo data

```bash
npm run db:setup
npm run db:seed
```

`db:setup` applies `server/db/schema.sql` with `CREATE TABLE IF NOT EXISTS`, so it
is safe to run more than once. `db:seed` is a no-op when the demo account already
exists.

### 5. Run the app

```bash
npm run dev
```

- App: <http://localhost:5173>
- API: <http://localhost:3000>
- Vite proxies `/api` requests to the API.

### Demo accounts

| Username | Password | What it has |
| --- | --- | --- |
| `northstar` | `quizcraft123` | Six quizzes (five public, one draft) and two finished attempts |
| `paper_plane` | `quizcraft123` | Five public quizzes and one finished attempt |

The login page also has a button that fills in the demo details.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | none, required | PostgreSQL connection string |
| `SESSION_SECRET` | none, required | Signs the session cookie |
| `PORT` | `3000` | API server port |
| `NODE_ENV` | `development` | Chooses `.env` or `.env.test`; enables production cookie rules |
| `BCRYPT_ROUNDS` | `10` | Password hashing cost |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the API with `--watch` and Vite together |
| `npm run dev:server` | Starts only the API |
| `npm run dev:client` | Starts only Vite |
| `npm run db:setup` | Applies the SQL schema |
| `npm run db:seed` | Adds the demo users, quizzes and attempts |
| `npm test` | Runs the Jest and Supertest suite |
| `npm run build` | Builds the client into `client/dist` |
| `npm start` | Starts the API and serves the built client, if present |

## Project layout

```text
QuizKraft/
├── client/
│   ├── public/favicon.svg
│   └── src/
│       ├── assets/fonts/        Self-hosted Inter woff2 files
│       ├── components/          Layout, forms, rows, tags, state blocks
│       ├── context/             AuthContext
│       ├── pages/               One file per route
│       ├── styles/              Tokens, base elements, pages, theme
│       ├── api.js               Fetch wrapper and ApiError
│       ├── App.jsx              Routes
│       └── main.jsx
├── server/
│   ├── auth/passport.js         Local strategy and session serialisation
│   ├── controllers/             Request handling, validation, authorisation
│   ├── db/
│   │   ├── queries/             Parameterised SQL, grouped by resource
│   │   ├── pool.js              pg Pool
│   │   ├── schema.sql           Tables, constraints and indexes
│   │   ├── seed.js              Demo data
│   │   └── setup.js             Applies the schema
│   ├── middleware/              requireAuth and error handling
│   ├── routes/                  Express routers
│   ├── utils/                   AppError, validation, password helpers
│   ├── app.js                   Express app and session wiring
│   └── server.js                Startup and shutdown
├── scripts/dev.mjs              Runs the API and Vite together
├── tests/                       Jest and Supertest tests
├── .env.example
├── README.md
└── learn.md                     A full walkthrough of how it all works
```

## API overview

All endpoints return JSON. Authenticated endpoints use the session cookie, so a
client must send cookies (`credentials: 'same-origin'` in Fetch).

### Authentication

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | no | Create an account and log in |
| `POST` | `/api/auth/login` | no | Log in |
| `POST` | `/api/auth/logout` | no | Destroy the session |
| `GET` | `/api/auth/me` | no | Current user, or `null` |

### Quizzes

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/quizzes?q=&category=&difficulty=` | no | Public quizzes only |
| `GET` | `/api/quizzes/:id` | optional | Public detail, or one's own private quiz; no questions or answers |
| `GET` | `/api/quizzes/:id/manage` | owner | Detail plus questions and correct answers |
| `POST` | `/api/quizzes` | yes | Create a private draft |
| `PATCH` | `/api/quizzes/:id` | owner | Update details and publish or unpublish |
| `DELETE` | `/api/quizzes/:id` | owner | Delete the quiz and everything under it |
| `POST` | `/api/quizzes/:id/questions` | owner | Add a question |
| `PATCH` | `/api/quizzes/:id/questions/:questionId` | owner | Replace a question |
| `DELETE` | `/api/quizzes/:id/questions/:questionId` | owner | Delete a question |
| `POST` | `/api/quizzes/:id/attempts` | yes | Start or resume an attempt |

### Attempts

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/attempts/:id/play` | owner of attempt | Questions without correct answers, plus answers already submitted |
| `POST` | `/api/attempts/:id/answers` | owner of attempt | Submit `{ questionId, optionId }` |
| `POST` | `/api/attempts/:id/skip` | owner of attempt | Submit `{ questionId }` with no answer |
| `GET` | `/api/attempts/:id/results` | owner of attempt | Finished result and review; `409` while unfinished |

### Account

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/me/dashboard` | yes | Creator stats, owned quizzes, five recent attempts |
| `GET` | `/api/me/attempts` | yes | Up to 100 finished attempts |

Errors look like `{ "error": "Message", "fields": { "title": "..." } }`. Field
messages are optional and are used by the forms.

## How scoring works

The browser never receives the correct answer while a question is unanswered,
and it never increments a score. Starting an attempt creates a row in
`quiz_attempts`. Every submitted answer runs in a database transaction that:

1. locks the attempt row and checks that it belongs to the user and is unfinished;
2. checks that the question belongs to the attempt's quiz;
3. rejects a second answer for the same question;
4. validates the selected option against that question;
5. writes a snapshot of the question, the selected answer, the correct answer and
   the explanation into `attempt_answers`;
6. increments `score` when the answer is correct;
7. marks the attempt complete when every question has an answer.

A skipped question stores no selected answer and scores zero. A partial unique
index, `(user_id, quiz_id) WHERE completed_at IS NULL`, guarantees one unfinished
attempt per user per quiz. Asking to start the quiz again resumes it.

`learn.md` walks through the queries and the rest of the app line by line.

## Testing

Create `.env.test` first. Then:

```bash
npm test
```

The suite is 22 integration tests across three files:

- `tests/auth.test.js`: registration, hashing, duplicate usernames, login,
  logout, protected routes.
- `tests/quizzes.test.js`: drafts, publishing rules, ownership, private
  visibility, search and filters, question validation, editing and deleting.
- `tests/attempts.test.js`: answer leakage, scoring, duplicate answers, skips,
  resume, foreign attempts, empty quizzes.

Each test runs against the real Express app with Supertest. `globalSetup.js`
drops and recreates the test schema, and `jest.setup.js` truncates `users` before
each test. Tests run in band because they share one database.

## Production build

```bash
npm run build
NODE_ENV=production npm start
```

Express serves `client/dist` and falls back to `index.html` for client-side
routes. In production the session cookie is `secure`, so the app must be behind
HTTPS. For a quick local check of the built client, use `NODE_ENV=development`,
which keeps the cookie usable over plain HTTP.

## Design notes

The app runs on a near-black ground (`#0e0d0c`). Panels sit one lightness step
above it (`#181716`) and nested panels two (`#2a2a2a`), so nothing needs a border
or a shadow to separate it from the page. The only strong colour is one lime
(`#c6f24e`), and it is spent on data: the score, the correct answer, the answer-key
mark. Buttons and navigation stay neutral, and the single filled control is a
white pill with black text. Inter is the only typeface, self-hosted.

A few pieces carry the product without a screenshot. The landing page opens with
a display headline beside a working sample question. The public shelf is a ruled
index rather than a grid of cards. Taking a quiz drops the site header so the
question gets the whole screen, and a row of ten notches shows where you are in
the set.

The CSS lives in `client/src/styles/`. `tokens.css` holds the values, `base.css`
the element defaults, `pages.css` the page layouts, `theme.css` the surface and
colour overrides, and `main.css` loads them in order. The choices worth knowing:

- responsive from 320px up, with the headline holding to two lines at every width;
- state is shown with an inset outline plus a lightness step, never a shadow;
- focus rings, a skip link, labelled controls, live regions for feedback and
  `prefers-reduced-motion` support throughout;
- the play payload omits correct answers and explanations, so the browser cannot
  leak them.

## Known limits

QuizCraft is a complete project, not a production service. It has no email
verification, password reset, rate limiting, pagination beyond fixed limits,
image uploads, or account deletion. Sessions last seven days. The seed script
expects to start from a database without the `northstar` user.
