import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi, useDocumentTitle } from '../hooks.js';
import { LoadingBlock, ErrorNotice, EmptyState } from '../components/PageState.jsx';
import { Tag } from '../components/Tag.jsx';
import { difficultyLabel, formatDate, pluralise, percent } from '../constants.js';

export function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi('/me/dashboard');

  const stats = data?.stats;
  const quizzes = data?.quizzes ?? [];
  const attempts = data?.recentAttempts ?? [];

  return (
    <div className="container page">
      <header className="page-head">
        <div>
          <h1>Your desk</h1>
          <p className="page-head__lede">
            {stats
              ? findingFor(stats, quizzes)
              : `Signed in as ${user.username}. Loading the numbers.`}
          </p>
        </div>
        <Link className="button" to="/quizzes/new">
          New quiz
        </Link>
      </header>

      {loading && !data ? (
        <LoadingBlock rows={6} label="Loading your desk" />
      ) : null}

      {error && !data ? (
        <ErrorNotice
          title="Your desk did not load."
          message={error.message}
          onRetry={reload}
        />
      ) : null}

      {data ? (
        <>
          <dl className="stat-strip">
            <div className="stat">
              <dt>Quizzes written</dt>
              <dd className="stat__value num">{stats.quizCount}</dd>
            </div>
            <div className="stat">
              <dt>On the public shelf</dt>
              <dd className="stat__value num">{stats.publicCount}</dd>
            </div>
            <div className="stat">
              <dt>Taken by other people</dt>
              <dd className="stat__value num">{stats.receivedAttemptCount}</dd>
            </div>
            <div className="stat stat--accent">
              <dt>Your average score</dt>
              <dd className="stat__value num">{stats.averagePercent}%</dd>
            </div>
          </dl>

          <div className="desk-grid">
            <section className="desk-main" aria-labelledby="your-quizzes">
              <div className="section-head section-head--tight">
                <div>
                  <h2 id="your-quizzes">Your quizzes</h2>
                  <p>
                    {quizzes.length === 0
                      ? 'Nothing written yet.'
                      : `${pluralise(quizzes.length, 'quiz', 'quizzes')}, drafts and published.`}
                  </p>
                </div>
              </div>

              {quizzes.length === 0 ? (
                <EmptyState
                  title="The desk is clear."
                  action={
                    <Link className="button" to="/quizzes/new">
                      Start a quiz
                    </Link>
                  }
                >
                  <p>
                    A new quiz begins as a private draft. Add four-answer
                    questions, then publish when it is ready.
                  </p>
                </EmptyState>
              ) : (
                <div className="desk-list">
                  <div className="desk-list__head" aria-hidden="true">
                    <span>Quiz</span>
                    <span>Status</span>
                    <span>Questions</span>
                    <span>Attempts</span>
                    <span>Average</span>
                    <span>Actions</span>
                  </div>

                  <ul>
                    {quizzes.map((quiz) => (
                      <li className="desk-row" key={quiz.id}>
                        <div className="desk-row__title">
                          <Link to={`/quizzes/${quiz.id}/edit`}>
                            {quiz.title}
                          </Link>
                          <span className="desk-row__meta">
                            {quiz.category} / {difficultyLabel(quiz.difficulty)}
                            {' / updated '}
                            {formatDate(quiz.updatedAt)}
                          </span>
                        </div>

                        <div className="desk-row__status">
                          <Tag tone={quiz.isPublic ? 'ink' : 'outline'}>
                            {quiz.isPublic ? 'Public' : 'Draft'}
                          </Tag>
                        </div>

                        <div className="desk-row__figure">
                          <span className="desk-row__label">Questions</span>
                          <span className="num">{quiz.questionCount}</span>
                        </div>

                        <div className="desk-row__figure">
                          <span className="desk-row__label">Attempts</span>
                          <span className="num">{quiz.attemptCount}</span>
                        </div>

                        <div className="desk-row__figure">
                          <span className="desk-row__label">Average</span>
                          <span className="num">
                            {quiz.attemptCount > 0
                              ? `${quiz.averagePercent}%`
                              : 'No data'}
                          </span>
                        </div>

                        <div className="desk-row__actions">
                          {quiz.questionCount === 0 ? (
                            <Link
                              className="text-link text-link--small"
                              to={`/quizzes/${quiz.id}/edit`}
                            >
                              Add questions
                            </Link>
                          ) : (
                            <Link
                              className="text-link text-link--small"
                              to={`/quizzes/${quiz.id}`}
                            >
                              View
                            </Link>
                          )}
                          <Link
                            className="text-link text-link--small"
                            to={`/quizzes/${quiz.id}/edit`}
                          >
                            Edit
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <aside className="desk-side" aria-labelledby="recent-attempts">
              <div className="section-head section-head--tight">
                <div>
                  <h2 id="recent-attempts">Recent attempts</h2>
                  <p>The last five quizzes you finished.</p>
                </div>
              </div>

              {attempts.length === 0 ? (
                <div className="side-empty">
                  <p>
                    You have not finished a quiz yet. The public shelf is a
                    good place to start.
                  </p>
                  <Link className="link-bar" to="/discover">
                    Find a quiz
                  </Link>
                </div>
              ) : (
                <ul className="attempt-strip">
                  {attempts.map((attempt) => (
                    <li key={attempt.id}>
                      <Link
                        className="attempt-strip__link"
                        to={`/attempts/${attempt.id}/results`}
                      >
                        <span className="attempt-strip__title">
                          {attempt.quizTitle}
                        </span>
                        <span className="attempt-strip__meta">
                          {formatDate(attempt.completedAt)} / {attempt.category}
                        </span>
                        <span className="attempt-strip__score num">
                          {percent(attempt.score, attempt.totalQuestions)}%
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <Link className="link-bar desk-side__all" to="/history">
                All your attempts
              </Link>
            </aside>
          </div>
        </>
      ) : null}
    </div>
  );
}

function findingFor(stats, quizzes) {
  if (stats.quizCount === 0) {
    return 'Your desk is empty. Write the first question, then decide who gets to see it.';
  }

  const taken = quizzes
    .filter((quiz) => quiz.attemptCount > 0)
    .sort((a, b) => b.attemptCount - a.attemptCount)[0];

  if (taken) {
    return `${taken.title} has ${pluralise(taken.attemptCount, 'finished attempt')}. The average score is ${taken.averagePercent}%.`;
  }

  if (stats.publicCount === 0) {
    return 'Every quiz here is still a private draft. Publish one to put it on the shelf.';
  }

  return 'Your quizzes are public, but no one has finished one yet. Share a quiz page to start the first attempt.';
}
