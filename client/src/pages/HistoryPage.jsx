import { Link } from 'react-router-dom';
import { useApi, useDocumentTitle } from '../hooks.js';
import { LoadingBlock, ErrorNotice, EmptyState } from '../components/PageState.jsx';
import { formatDate, percent, pluralise } from '../constants.js';

export function HistoryPage() {
  useDocumentTitle('Attempts');
  const { data, loading, error, reload } = useApi('/me/attempts');
  const attempts = data?.attempts ?? [];

  const average =
    attempts.length > 0
      ? Math.round(
          attempts.reduce(
            (total, attempt) =>
              total + percent(attempt.score, attempt.totalQuestions),
            0,
          ) / attempts.length,
        )
      : 0;

  const best =
    attempts.length > 0
      ? Math.max(...attempts.map((attempt) => percent(attempt.score, attempt.totalQuestions)))
      : 0;

  return (
    <div className="container page">
      <header className="page-head page-head--plain">
        <div>
          <h1>Attempts</h1>
          <p className="page-head__lede">
            Every finished quiz, newest first. Open one to read the review.
          </p>
        </div>
        <Link className="button" to="/discover">
          Take another quiz
        </Link>
      </header>

      {loading && !data ? <LoadingBlock rows={5} label="Loading attempts" /> : null}

      {error && !data ? (
        <ErrorNotice
          title="Your attempts did not load."
          message={error.message}
          onRetry={reload}
        />
      ) : null}

      {data ? (
        <>
          {attempts.length > 0 ? (
            <dl className="stat-strip stat-strip--three">
              <div className="stat">
                <dt>Attempts finished</dt>
                <dd className="stat__value num">{attempts.length}</dd>
              </div>
              <div className="stat">
                <dt>Average score</dt>
                <dd className="stat__value num">{average}%</dd>
              </div>
              <div className="stat stat--accent">
                <dt>Best score</dt>
                <dd className="stat__value num">{best}%</dd>
              </div>
            </dl>
          ) : null}

          {attempts.length === 0 ? (
            <EmptyState
              title="No attempts yet."
              action={
                <Link className="button" to="/discover">
                  Find a quiz
                </Link>
              }
            >
              <p>
                Finish a quiz and it lands here, with the score and a full
                review of every answer.
              </p>
            </EmptyState>
          ) : (
            <ul className="history-list">
              {attempts.map((attempt) => {
                const score = percent(attempt.score, attempt.totalQuestions);

                return (
                  <li className="history-row" key={attempt.id}>
                    <div className="history-row__main">
                      <Link
                        className="history-row__title"
                        to={`/attempts/${attempt.id}/results`}
                      >
                        {attempt.quizTitle}
                      </Link>
                      <p className="history-row__meta">
                        <span>{formatDate(attempt.completedAt)}</span>
                        <span>{attempt.category}</span>
                        <span>{pluralise(attempt.totalQuestions, 'question')}</span>
                      </p>
                    </div>

                    <div className="history-row__score">
                      <span className="history-row__percent num">{score}%</span>
                      <span className="history-row__fraction num">
                        {attempt.score}/{attempt.totalQuestions}
                      </span>
                    </div>

                    <Link
                      className="text-link history-row__link"
                      to={`/attempts/${attempt.id}/results`}
                    >
                      Read the review
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
}
