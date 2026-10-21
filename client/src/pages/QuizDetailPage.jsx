import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi, useDocumentTitle } from '../hooks.js';
import { LoadingBlock, ErrorNotice } from '../components/PageState.jsx';
import { Tag } from '../components/Tag.jsx';
import { api } from '../api.js';
import {
  difficultyLabel,
  formatDate,
  pluralise,
} from '../constants.js';

export function QuizDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi(`/quizzes/${id}`);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(null);

  const quiz = data?.quiz;
  useDocumentTitle(quiz ? quiz.title : 'Quiz');

  async function startAttempt() {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    setStarting(true);
    setStartError(null);

    try {
      const result = await api.post(`/quizzes/${id}/attempts`);
      navigate(`/attempts/${result.attempt.id}`);
    } catch (requestError) {
      setStartError(requestError);
      setStarting(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="container page">
        <LoadingBlock rows={6} label="Loading quiz" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container page">
        <ErrorNotice
          title={
            error.status === 404 ? 'That quiz is not here.' : 'The quiz did not load.'
          }
          message={
            error.status === 404
              ? 'It may have been unpublished, or the address may be wrong.'
              : error.message
          }
        >
          <Link className="button button--small" to="/discover">
            Back to the shelf
          </Link>
        </ErrorNotice>
      </div>
    );
  }

  if (!quiz) return null;

  const minutes = Math.max(1, Math.ceil(quiz.questionCount * 0.5));
  const canTake = quiz.questionCount > 0;

  return (
    <div className="container">
      <div className="quiz-hero">
        <div className="quiz-hero__main">
          <div className="quiz-hero__tags">
            <Tag>{quiz.category}</Tag>
            <Tag tone="outline">{difficultyLabel(quiz.difficulty)}</Tag>
            {!quiz.isPublic ? <Tag tone="ink">Private draft</Tag> : null}
          </div>

          <h1>{quiz.title}</h1>

          <p className="quiz-hero__byline">
            Written by {quiz.creatorUsername}
            {quiz.createdAt ? ` / ${formatDate(quiz.createdAt)}` : ''}
          </p>

          <p className="quiz-hero__description">
            {quiz.description ||
              'No description. The questions will have to speak for themselves.'}
          </p>

          {!quiz.isPublic ? (
            <div className="draft-note">
              <p>
                This quiz is private. Only you can see and take it until you
                publish it.
              </p>
              <Link className="link-bar" to={`/quizzes/${quiz.id}/edit`}>
                Edit and publish
              </Link>
            </div>
          ) : null}
        </div>

        <aside className="take-slip" aria-labelledby="take-title">
          <h2 className="visually-hidden" id="take-title">
            Take this quiz
          </h2>

          <p className="take-slip__count">
            <span className="num">{String(quiz.questionCount)}</span>
            <span className="take-slip__count-label">
              {quiz.questionCount === 1 ? 'question' : 'questions'}
            </span>
          </p>

          <dl className="take-facts">
            <div>
              <dt>Time</dt>
              <dd>About {pluralise(minutes, 'minute')}</dd>
            </div>
            <div>
              <dt>Attempts</dt>
              <dd>
                {quiz.attemptCount === 0
                  ? 'None yet'
                  : pluralise(quiz.attemptCount, 'finished attempt')}
              </dd>
            </div>
            <div>
              <dt>Answers</dt>
              <dd>Four per question, one correct</dd>
            </div>
          </dl>

          {startError ? (
            <p className="form-alert" role="alert">
              {startError.message}
            </p>
          ) : null}

          {canTake ? (
            <button
              className="button button--wide"
              type="button"
              onClick={startAttempt}
              disabled={starting}
            >
              {starting
                ? 'Opening the quiz'
                : user
                  ? quiz.isOwner
                    ? 'Take your quiz'
                    : 'Start the quiz'
                  : 'Log in to take it'}
            </button>
          ) : (
            <p className="take-slip__empty">
              This quiz has no questions yet, so there is nothing to take.
            </p>
          )}

          {quiz.isOwner ? (
            <Link
              className="link-bar take-slip__edit"
              to={`/quizzes/${quiz.id}/edit`}
            >
              Edit this quiz
            </Link>
          ) : null}
        </aside>
      </div>

      <section className="quiz-notes" aria-labelledby="notes-title">
        <h2 id="notes-title">How the attempt works</h2>
        <ol className="notes-list">
          <li>
            <h3>One question at a time</h3>
            <p>
              Choose one of four answers, lock it in, then read the explanation
              before moving on.
            </p>
          </li>
          <li>
            <h3>Skip if you do not know</h3>
            <p>
              A skipped question scores nothing and shows up in the review with
              the correct answer.
            </p>
          </li>
          <li>
            <h3>Every attempt is kept</h3>
            <p>
              Finished attempts are scored on the server and listed in your
              history with the full review.
            </p>
          </li>
        </ol>
      </section>
    </div>
  );
}
