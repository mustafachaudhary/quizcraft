import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApi, useDocumentTitle } from '../hooks.js';
import { LoadingBlock, ErrorNotice } from '../components/PageState.jsx';
import { Icon } from '../components/Icon.jsx';
import { Tag } from '../components/Tag.jsx';
import { formatDate, formatDateTime } from '../constants.js';

function verdictFor(percentage) {
  if (percentage === 100) return 'Every answer, correct.';
  if (percentage >= 80) return 'A strong result.';
  if (percentage >= 60) return 'A fair result, with room to read.';
  if (percentage >= 30) return 'Half the shape of it. Read the review.';
  return 'Worth another run through the questions.';
}

function durationFor(start, end) {
  if (!start || !end) return '';
  const seconds = Math.max(
    0,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000),
  );
  if (seconds < 60) {
    return `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
  }
  const minutes = Math.round(seconds / 60);
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}

export function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi(`/attempts/${id}/results`);
  const [retaking, setRetaking] = useState(false);
  const [retakeError, setRetakeError] = useState(null);

  const attempt = data?.attempt;
  useDocumentTitle(attempt ? `Result: ${attempt.quizTitle}` : 'Attempt result');

  async function retake() {
    setRetakeError(null);
    setRetaking(true);

    try {
      const result = await api.post(`/quizzes/${attempt.quizId}/attempts`);
      navigate(`/attempts/${result.attempt.id}`);
    } catch (requestError) {
      setRetakeError(requestError);
      setRetaking(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="container page">
        <LoadingBlock rows={7} label="Loading the result" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container page">
        <ErrorNotice
          title={
            error.status === 404
              ? 'That result is not here.'
              : error.status === 409
                ? 'This attempt is not finished.'
                : 'The result did not load.'
          }
          message={error.message}
          onRetry={reload}
        >
          <Link className="button button--small" to="/history">
            All your attempts
          </Link>
        </ErrorNotice>
      </div>
    );
  }

  if (!attempt) return null;

  const duration = durationFor(attempt.startedAt, attempt.completedAt);

  return (
    <div className="container page">
      <header className="page-head page-head--plain">
        <div>
          <h1>{attempt.quizTitle}</h1>
          <p className="page-head__lede">
            Finished {formatDateTime(attempt.completedAt)}
            {duration ? ` / took ${duration}` : ''}
          </p>
        </div>
        <Link className="link-bar" to={`/quizzes/${attempt.quizId}`}>
          See the quiz
        </Link>
      </header>

      <section className="score-board" aria-labelledby="score-title">
        <div className="score-poster">
          <span className="score-poster__number num">
            {attempt.percentage}
            <span className="score-poster__unit">%</span>
          </span>
          <span className="score-poster__caption">
            {attempt.score} of {attempt.totalQuestions} correct
          </span>
        </div>

        <div className="score-summary">
          <h2 id="score-title">{verdictFor(attempt.percentage)}</h2>

          <dl className="score-facts">
            <div>
              <dt>Correct</dt>
              <dd className="num">{attempt.correctCount}</dd>
            </div>
            <div>
              <dt>Incorrect</dt>
              <dd className="num">{attempt.incorrectCount}</dd>
            </div>
            <div>
              <dt>Skipped</dt>
              <dd className="num">{attempt.skippedCount}</dd>
            </div>
          </dl>

          {retakeError ? (
            <p className="form-alert" role="alert">
              {retakeError.message}
            </p>
          ) : null}

          <div className="score-actions">
            <button
              className="button"
              type="button"
              onClick={retake}
              disabled={retaking}
            >
              {retaking ? 'Starting again' : 'Take it again'}
            </button>
            <Link className="link-bar" to="/discover">
              Find another quiz
            </Link>
          </div>
        </div>
      </section>

      <section className="review-section" aria-labelledby="review-title">
        <div className="section-head section-head--tight">
          <div>
            <h2 id="review-title">Review</h2>
            <p>Every question, the answer you gave and the one that was right.</p>
          </div>
        </div>

        <ol className="review-list">
          {attempt.review.map((answer, index) => {
            const state = answer.isCorrect
              ? 'correct'
              : answer.selectedText
                ? 'incorrect'
                : 'skipped';

            return (
              <li className={`review-item review-item--${state}`} key={`${answer.questionId}-${index}`}>
                <span className="review-item__number num">
                  {String(index + 1)}
                </span>

                <div className="review-item__body">
                  <div className="review-item__top">
                    <h3>{answer.questionText}</h3>
                    <Tag tone={state === 'correct' ? 'ink' : state === 'skipped' ? 'outline' : 'accent'}>
                      {state === 'correct'
                        ? 'Correct'
                        : state === 'skipped'
                          ? 'Skipped'
                          : 'Incorrect'}
                    </Tag>
                  </div>

                  <div className="review-answers">
                    <p>
                      <span className="review-answers__label">Your answer</span>
                      {answer.selectedText || 'No answer, skipped'}
                    </p>
                    {!answer.isCorrect ? (
                      <p>
                        <span className="review-answers__label">
                          Correct answer
                        </span>
                        {answer.correctText}
                      </p>
                    ) : null}
                  </div>

                  {answer.explanation ? (
                    <p className="review-item__note">
                      <span>Why</span> {answer.explanation}
                    </p>
                  ) : null}
                </div>

                <span className="review-item__mark" aria-hidden="true">
                  <Icon
                    name={
                      state === 'correct'
                        ? 'check'
                        : state === 'skipped'
                          ? 'minus'
                          : 'x'
                    }
                    size={18}
                  />
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="result-footer">
        <p>
          Attempt from {formatDate(attempt.completedAt)}. This review keeps the
          questions and answers as they were when you took it.
        </p>
        <Link className="link-bar" to="/history">
          All your attempts
        </Link>
      </div>
    </div>
  );
}
