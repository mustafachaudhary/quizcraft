import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApi, useDocumentTitle } from '../hooks.js';
import { Wordmark } from '../components/Wordmark.jsx';
import { Icon } from '../components/Icon.jsx';
import { LoadingBlock, ErrorNotice } from '../components/PageState.jsx';

export function TakeQuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi(`/attempts/${id}/play`);
  const [index, setIndex] = useState(null);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  useDocumentTitle(data?.quiz ? `Take ${data.quiz.title}` : 'Quiz attempt');

  if (loading && !data) {
    return (
      <div className="take-shell">
        <TakeHeader />
        <main className="take-main">
          <LoadingBlock rows={6} label="Opening the quiz" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="take-shell">
        <TakeHeader />
        <main className="take-main">
          <ErrorNotice
            title={
              error.status === 404
                ? 'This attempt is not here.'
                : 'The quiz did not open.'
            }
            message={
              error.status === 404
                ? 'It may belong to another account, or the address may be wrong.'
                : error.message
            }
            onRetry={reload}
          >
            <Link className="button button--small" to="/dashboard">
              Back to your desk
            </Link>
          </ErrorNotice>
        </main>
      </div>
    );
  }

  if (!data) return null;
  if (data.completed) {
    return <Navigate to={`/attempts/${id}/results`} replace />;
  }

  const { attempt, quiz, questions } = data;
  const total = attempt.totalQuestions;
  const currentIndex = index ?? data.answers?.length ?? 0;
  const question = questions[currentIndex];

  if (!question) {
    return <Navigate to={`/attempts/${id}/results`} replace />;
  }

  const answeredCount = feedback ? feedback.answeredCount : currentIndex;
  const selectedText = selected
    ? question.options.find((option) => option.id === selected)?.text
    : null;

  async function send(optionId, { skip = false } = {}) {
    setBusy(true);
    setActionError(null);

    try {
      const result = skip
        ? await api.post(`/attempts/${id}/skip`, { questionId: question.id })
        : await api.post(`/attempts/${id}/answers`, {
            questionId: question.id,
            optionId,
          });
      setFeedback(result.feedback);
    } catch (requestError) {
      setActionError(requestError);
    } finally {
      setBusy(false);
    }
  }

  function lockAnswer() {
    if (selected === null) return;
    send(selected);
  }

  function skipQuestion() {
    send(null, { skip: true });
  }

  function moveOn() {
    if (feedback.completed) {
      navigate(`/attempts/${id}/results`);
      return;
    }

    setFeedback(null);
    setSelected(null);
    setActionError(null);
    setIndex(currentIndex + 1);
  }

  function optionState(option) {
    if (!feedback) return option.id === selected ? ' is-selected' : '';
    if (option.id === feedback.correctOptionId) return ' is-correct';
    if (!feedback.skipped && option.id === selected) return ' is-wrong';
    return ' is-muted';
  }

  return (
    <div className="take-shell">
      <TakeHeader quiz={quiz} />

      <div className="take-tally" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={
              index < answeredCount
                ? 'is-done'
                : index === currentIndex
                  ? 'is-current'
                  : ''
            }
          />
        ))}
      </div>

      <main className="take-main">
        <div className="take-meta" aria-live="polite">
          <span className="take-meta__question">
            Question {currentIndex + 1} of {total}
          </span>
          <span>
            {answeredCount} {answeredCount === 1 ? 'answer' : 'answers'} in
          </span>
        </div>

        <section className="take-sheet" aria-labelledby="question-title">
          <h1 id="question-title">{question.text}</h1>

          <div className="take-options">
            {question.options.map((option, optionIndex) => (
              <button
                type="button"
                className={`take-option${optionState(option)}`}
                key={option.id}
                onClick={() => setSelected(option.id)}
                disabled={busy || Boolean(feedback)}
                aria-pressed={selected === option.id}
              >
                <span className="take-option__letter">
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                <span className="take-option__text">{option.text}</span>
                {feedback && option.id === feedback.correctOptionId ? (
                  <span className="take-option__state">
                    <Icon name="check" size={16} />
                    Correct answer
                  </span>
                ) : null}
                {feedback &&
                !feedback.skipped &&
                option.id === selected &&
                option.id !== feedback.correctOptionId ? (
                  <span className="take-option__state">
                    <Icon name="x" size={16} />
                    Your answer
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {actionError ? (
            <p className="form-alert" role="alert">
              {actionError.message}
            </p>
          ) : null}

          <div aria-live="polite">
            {feedback ? (
              <div className="feedback">
                <p
                  className={`feedback__verdict${
                    feedback.isCorrect ? ' is-correct' : ' is-wrong'
                  }`}
                >
                  <Icon
                    name={
                      feedback.isCorrect
                        ? 'check'
                        : feedback.skipped
                          ? 'minus'
                          : 'x'
                    }
                    size={20}
                  />
                  {feedback.isCorrect
                    ? 'Correct.'
                    : feedback.skipped
                      ? 'Skipped.'
                      : 'Not quite.'}
                </p>

                <p className="feedback__answer">
                  {feedback.skipped
                    ? `You skipped this one. The answer was ${feedback.correctOptionText}.`
                    : feedback.isCorrect
                      ? `You answered ${selectedText}.`
                      : `You answered ${selectedText}. The answer was ${feedback.correctOptionText}.`}
                </p>

                {feedback.explanation ? (
                  <p className="feedback__explanation">{feedback.explanation}</p>
                ) : null}

                <p className="feedback__score">
                  Score so far: <span className="num">{feedback.score}</span> of{' '}
                  <span className="num">{feedback.totalQuestions}</span>
                </p>
              </div>
            ) : null}
          </div>

          <div className="take-actions">
            {feedback ? (
              <button className="button button--large" type="button" onClick={moveOn}>
                {feedback.completed ? 'See your score' : 'Next question'}
              </button>
            ) : (
              <>
                <button
                  className="button button--large"
                  type="button"
                  onClick={lockAnswer}
                  disabled={selected === null || busy}
                >
                  {busy ? 'Checking' : 'Lock in answer'}
                </button>
                <button
                  className="text-link take-skip"
                  type="button"
                  onClick={skipQuestion}
                  disabled={busy}
                >
                  Skip this question
                </button>
              </>
            )}
          </div>
        </section>

        <p className="take-footnote">
          One question at a time. Leaving keeps your place for later.
        </p>
      </main>
    </div>
  );
}

function TakeHeader({ quiz }) {
  return (
    <header className="take-header">
      <div className="take-header__inner">
        <Wordmark linked={false} />
        <span className="take-header__quiz">
          {quiz ? quiz.title : 'QuizCraft'}
        </span>
        <Link className="take-header__leave" to={quiz ? `/quizzes/${quiz.id}` : '/discover'}>
          Leave quiz
        </Link>
      </div>
    </header>
  );
}
