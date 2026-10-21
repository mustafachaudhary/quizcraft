import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApi, useDocumentTitle } from '../hooks.js';
import { LoadingBlock, ErrorNotice } from '../components/PageState.jsx';
import { QuestionForm } from '../components/QuestionForm.jsx';
import { Tag } from '../components/Tag.jsx';
import {
  CATEGORIES,
  DIFFICULTIES,
  MAX_QUESTIONS,
  MIN_PUBLISH_QUESTIONS,
  difficultyLabel,
  formatDate,
} from '../constants.js';

function detailsFrom(quiz) {
  return {
    title: quiz.title,
    description: quiz.description || '',
    category: quiz.category,
    difficulty: quiz.difficulty,
    isPublic: quiz.isPublic,
  };
}

export function EditQuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi(`/quizzes/${id}/manage`);

  const quiz = data?.quiz;
  const questions = quiz?.questions ?? [];

  useDocumentTitle(quiz ? `Edit ${quiz.title}` : 'Edit quiz');

  const [details, setDetails] = useState(null);
  const [detailsError, setDetailsError] = useState(null);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [editor, setEditor] = useState(null);
  const [questionError, setQuestionError] = useState(null);
  const [questionSaving, setQuestionSaving] = useState(false);
  const [confirmQuestion, setConfirmQuestion] = useState(null);
  const [listError, setListError] = useState('');
  const [listBusy, setListBusy] = useState(false);
  const [confirmQuiz, setConfirmQuiz] = useState(false);
  const [quizDeleting, setQuizDeleting] = useState(false);
  const [quizDeleteError, setQuizDeleteError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (quiz) {
      setDetails(detailsFrom(quiz));
      setEditor(null);
      setConfirmQuestion(null);
      setConfirmQuiz(false);
      setNotice('');
      setDetailsError(null);
      setListError('');
      setQuizDeleteError('');
    }
  }, [quiz?.id]);

  function update(field, value) {
    setDetails((current) => ({ ...current, [field]: value }));
    setDetailsError(null);
    setNotice('');
  }

  async function saveDetails(event) {
    event.preventDefault();
    setDetailsSaving(true);
    setDetailsError(null);
    setNotice('');

    try {
      await api.patch(`/quizzes/${id}`, {
        ...details,
        title: details.title.trim(),
        description: details.description.trim(),
      });
      setNotice('Quiz details saved.');
      reload();
    } catch (requestError) {
      setDetailsError(requestError);
    } finally {
      setDetailsSaving(false);
    }
  }

  async function saveQuestion(payload) {
    setQuestionSaving(true);
    setQuestionError(null);

    try {
      if (editor?.question) {
        await api.patch(
          `/quizzes/${id}/questions/${editor.question.id}`,
          payload,
        );
        setNotice('Question updated.');
      } else {
        await api.post(`/quizzes/${id}/questions`, payload);
        setNotice('Question added.');
      }
      setEditor(null);
      reload();
    } catch (requestError) {
      setQuestionError(requestError);
    } finally {
      setQuestionSaving(false);
    }
  }

  async function deleteQuestion(questionId) {
    setListBusy(true);
    setListError('');

    try {
      await api.delete(`/quizzes/${id}/questions/${questionId}`);
      setConfirmQuestion(null);
      setNotice('Question removed.');
      reload();
    } catch (requestError) {
      setListError(requestError.message);
    } finally {
      setListBusy(false);
    }
  }

  async function deleteQuiz() {
    setQuizDeleting(true);
    setQuizDeleteError('');

    try {
      await api.delete(`/quizzes/${id}`);
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setQuizDeleteError(requestError.message);
      setQuizDeleting(false);
    }
  }

  const fields = detailsError?.fields || {};
  const publishBlocked =
    !details?.isPublic && questions.length < MIN_PUBLISH_QUESTIONS;
  const questionsNeeded = Math.max(
    0,
    MIN_PUBLISH_QUESTIONS - questions.length,
  );
  const deleteBlocked =
    quiz?.isPublic && questions.length <= MIN_PUBLISH_QUESTIONS;

  return (
    <div className="container page">
      <header className="page-head">
        <div>
          <h1>{quiz ? quiz.title : 'Edit quiz'}</h1>
          <p className="page-head__lede">
            {quiz
              ? `Written by you / ${quiz.isPublic ? 'on the public shelf' : 'private draft'} / last updated ${formatDate(quiz.updatedAt)}`
              : 'Loading the quiz and its questions.'}
          </p>
        </div>
        <div className="page-head__actions">
          <Link className="link-bar" to={`/quizzes/${id}`}>
            View the quiz
          </Link>
          <Link className="link-bar" to="/dashboard">
            Back to your desk
          </Link>
        </div>
      </header>

      {loading && !data ? <LoadingBlock rows={6} label="Loading the editor" /> : null}

      {error ? (
        <ErrorNotice
          title={
            error.status === 403
              ? 'This quiz belongs to someone else.'
              : error.status === 404
                ? 'That quiz is not here.'
                : 'The editor did not load.'
          }
          message={error.message}
          onRetry={reload}
        >
          <Link className="button button--small" to="/dashboard">
            Back to your desk
          </Link>
        </ErrorNotice>
      ) : null}

      {notice ? (
        <p className="save-note" role="status">
          {notice}
        </p>
      ) : null}

      {quiz && details ? (
        <>
          <div className="editor-grid">
            <section className="form-panel" aria-labelledby="details-title">
              <h2 className="form-panel__title" id="details-title">
                Quiz details
              </h2>

              <form className="stack-form" onSubmit={saveDetails} noValidate>
                {detailsError && !detailsError.fields ? (
                  <p className="form-alert" role="alert">
                    {detailsError.message}
                  </p>
                ) : null}

                <label className="field">
                  <span className="field__label">Title</span>
                  <input
                    className="field__input"
                    value={details.title}
                    onChange={(event) => update('title', event.target.value)}
                    aria-invalid={Boolean(fields.title)}
                  />
                  {fields.title ? (
                    <span className="field__error">{fields.title}</span>
                  ) : null}
                </label>

                <label className="field">
                  <span className="field__label">Description</span>
                  <textarea
                    className="field__input"
                    rows="4"
                    value={details.description}
                    onChange={(event) =>
                      update('description', event.target.value)
                    }
                    aria-invalid={Boolean(fields.description)}
                  />
                  {fields.description ? (
                    <span className="field__error">{fields.description}</span>
                  ) : null}
                </label>

                <div className="form-row">
                  <label className="field">
                    <span className="field__label">Category</span>
                    <select
                      className="field__input"
                      value={details.category}
                      onChange={(event) =>
                        update('category', event.target.value)
                      }
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    {fields.category ? (
                      <span className="field__error">{fields.category}</span>
                    ) : null}
                  </label>

                  <fieldset className="field">
                    <legend className="field__label">Difficulty</legend>
                    <div className="choice-group">
                      {DIFFICULTIES.map((level) => (
                        <label className="choice" key={level}>
                          <input
                            type="radio"
                            name="difficulty"
                            value={level}
                            checked={details.difficulty === level}
                            onChange={() => update('difficulty', level)}
                          />
                          <span>{difficultyLabel(level)}</span>
                        </label>
                      ))}
                    </div>
                    {fields.difficulty ? (
                      <span className="field__error">{fields.difficulty}</span>
                    ) : null}
                  </fieldset>
                </div>

                <div className="publish-field">
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={details.isPublic}
                      disabled={publishBlocked}
                      onChange={(event) =>
                        update('isPublic', event.target.checked)
                      }
                    />
                    <span>
                      <strong>Public</strong>
                      <span>
                        Anyone can find this quiz on the shelf and take it.
                      </span>
                    </span>
                  </label>
                  {publishBlocked ? (
                    <p className="field__help">
                      Add {questionsNeeded} more{' '}
                      {questionsNeeded === 1 ? 'question' : 'questions'} before
                      making the quiz public. A public quiz needs at least{' '}
                      {MIN_PUBLISH_QUESTIONS}.
                    </p>
                  ) : null}
                  {fields.isPublic ? (
                    <p className="field__error">{fields.isPublic}</p>
                  ) : null}
                </div>

                <div className="form-actions">
                  <button
                    className="button"
                    type="submit"
                    disabled={detailsSaving}
                  >
                    {detailsSaving ? 'Saving' : 'Save details'}
                  </button>
                  <Link className="text-link" to={`/quizzes/${id}`}>
                    See the public page
                  </Link>
                </div>
              </form>
            </section>

            <aside className="editor-aside" aria-labelledby="status-title">
              <h2 id="status-title">At a glance</h2>

              <dl className="glance-list">
                <div>
                  <dt>Status</dt>
                  <dd>
                    <Tag tone={quiz.isPublic ? 'ink' : 'outline'}>
                      {quiz.isPublic ? 'Public' : 'Draft'}
                    </Tag>
                  </dd>
                </div>
                <div>
                  <dt>Questions</dt>
                  <dd className="num">{questions.length} of {MAX_QUESTIONS}</dd>
                </div>
                <div>
                  <dt>Finished attempts</dt>
                  <dd className="num">{quiz.attemptCount}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDate(quiz.createdAt)}</dd>
                </div>
              </dl>

              <p className="editor-aside__note">
                Attempts keep a copy of each question, the answer chosen and
                the explanation. Editing a question does not rewrite an old
                result.
              </p>

              <div className="danger-zone">
                <h3>Delete this quiz</h3>
                <p>Its questions and every attempt will go with it.</p>

                {quizDeleteError ? (
                  <p className="field__error" role="alert">
                    {quizDeleteError}
                  </p>
                ) : null}

                {confirmQuiz ? (
                  <div className="confirm-inline">
                    <span>Are you sure?</span>
                    <button
                      className="text-link text-link--danger"
                      type="button"
                      onClick={deleteQuiz}
                      disabled={quizDeleting}
                    >
                      {quizDeleting ? 'Deleting' : 'Yes, delete it'}
                    </button>
                    <button
                      className="text-link"
                      type="button"
                      onClick={() => setConfirmQuiz(false)}
                      disabled={quizDeleting}
                    >
                      Keep it
                    </button>
                  </div>
                ) : (
                  <button
                    className="button button--quiet button--small button--danger"
                    type="button"
                    onClick={() => setConfirmQuiz(true)}
                  >
                    Delete quiz
                  </button>
                )}
              </div>
            </aside>
          </div>

          <section className="questions-section" aria-labelledby="questions-title">
            <div className="section-head section-head--tight">
              <div>
                <h2 id="questions-title">Questions</h2>
                <p>
                  {questions.length === 0
                    ? `No questions yet. A public quiz needs at least ${MIN_PUBLISH_QUESTIONS}; drafts can stay shorter.`
                    : `${questions.length} ${questions.length === 1 ? 'question' : 'questions'}, read in this order.`}
                </p>
              </div>
              <button
                className="button"
                type="button"
                onClick={() => {
                  setEditor({ question: null });
                  setQuestionError(null);
                }}
                disabled={Boolean(editor) || questions.length >= MAX_QUESTIONS}
              >
                Add a question
              </button>
            </div>

            {questions.length >= MAX_QUESTIONS ? (
              <p className="field__help">
                This quiz has reached the {MAX_QUESTIONS} question limit.
              </p>
            ) : null}

            {deleteBlocked ? (
              <p className="field__help">
                This public quiz holds the minimum {MIN_PUBLISH_QUESTIONS}{' '}
                questions. Unpublish it before removing one.
              </p>
            ) : null}

            {listError ? (
              <p className="form-alert" role="alert">
                {listError}
              </p>
            ) : null}

            {editor ? (
              <QuestionForm
                key={editor.question?.id || 'new'}
                initialQuestion={editor.question}
                onSave={saveQuestion}
                onCancel={() => {
                  setEditor(null);
                  setQuestionError(null);
                }}
                saving={questionSaving}
                error={questionError}
              />
            ) : null}

            {questions.length === 0 && !editor ? (
              <div className="empty-state empty-state--compact">
                <h2>Nothing to ask yet.</h2>
                <p>
                  Add the first question: four answers, exactly one of them
                  correct.
                </p>
              </div>
            ) : null}

            {questions.length > 0 ? (
              <ol className="question-list">
                {questions.map((question, index) => (
                  <li className="question-item" key={question.id}>
                    <span className="question-item__number num">
                      {String(index + 1)}
                    </span>

                    <div className="question-item__body">
                      <h3>{question.text}</h3>

                      <ul className="answer-key">
                        {question.options.map((option, optionIndex) => (
                          <li
                            className={option.isCorrect ? 'is-correct' : ''}
                            key={option.id}
                          >
                            <span className="answer-key__letter">
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                            <span>{option.text}</span>
                            {option.isCorrect ? (
                              <span className="answer-key__mark">Answer</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>

                      {question.explanation ? (
                        <p className="question-item__note">
                          <span>Why</span> {question.explanation}
                        </p>
                      ) : null}
                    </div>

                    <div className="question-item__actions">
                      {confirmQuestion === question.id ? (
                        <div className="confirm-inline">
                          <span>Delete it?</span>
                          <button
                            className="text-link text-link--danger"
                            type="button"
                            onClick={() => deleteQuestion(question.id)}
                            disabled={listBusy}
                          >
                            Yes
                          </button>
                          <button
                            className="text-link"
                            type="button"
                            onClick={() => setConfirmQuestion(null)}
                            disabled={listBusy}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            className="text-link text-link--small"
                            type="button"
                            onClick={() => {
                              setEditor({ question });
                              setQuestionError(null);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={Boolean(editor)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-link text-link--small text-link--danger"
                            type="button"
                            onClick={() => setConfirmQuestion(question.id)}
                            disabled={Boolean(editor) || deleteBlocked}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
