import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useDocumentTitle } from '../hooks.js';
import { CATEGORIES, DIFFICULTIES, difficultyLabel } from '../constants.js';

const EMPTY = {
  title: '',
  description: '',
  category: 'General',
  difficulty: 'medium',
};

export function CreateQuizPage() {
  useDocumentTitle('New quiz');
  const navigate = useNavigate();
  const [details, setDetails] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setDetails((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const result = await api.post('/quizzes', {
        ...details,
        title: details.title.trim(),
        description: details.description.trim(),
      });
      navigate(`/quizzes/${result.quiz.id}/edit`, { replace: true });
    } catch (requestError) {
      setError(requestError);
      setBusy(false);
    }
  }

  const fields = error?.fields || {};

  return (
    <div className="container page">
      <header className="page-head page-head--plain">
        <div>
          <h1>New quiz</h1>
          <p className="page-head__lede">
            Name it, add questions. Publish only when ready.
          </p>
        </div>
        <Link className="link-bar" to="/dashboard">
          Back to your desk
        </Link>
      </header>

      <div className="editor-grid">
        <section className="form-panel" aria-labelledby="details-title">
          <h2 className="form-panel__title" id="details-title">
            The cover
          </h2>

          <form className="stack-form" onSubmit={handleSubmit} noValidate>
            {error && !error.fields ? (
              <p className="form-alert" role="alert">
                {error.message}
              </p>
            ) : null}

            <label className="field">
              <span className="field__label">Title</span>
              <input
                className="field__input"
                value={details.title}
                onChange={(event) => update('title', event.target.value)}
                aria-invalid={Boolean(fields.title)}
                autoFocus
              />
              <span className="field__help">
                A question or a promise. Three characters at least, 120 at
                most.
              </span>
              {fields.title ? (
                <span className="field__error">{fields.title}</span>
              ) : null}
            </label>

            <label className="field">
              <span className="field__label">
                Description <span className="field__optional">optional</span>
              </span>
              <textarea
                className="field__input"
                rows="4"
                value={details.description}
                onChange={(event) => update('description', event.target.value)}
                aria-invalid={Boolean(fields.description)}
              />
              <span className="field__help">
                Tell someone what they are about to take. Up to 800
                characters.
              </span>
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
                  onChange={(event) => update('category', event.target.value)}
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

            <div className="form-actions">
              <button className="button" type="submit" disabled={busy}>
                {busy ? 'Making the draft' : 'Make the draft'}
              </button>
              <Link className="text-link" to="/dashboard">
                Cancel
              </Link>
            </div>
          </form>
        </section>

        <aside className="editor-aside" aria-labelledby="create-notes-title">
          <h2 id="create-notes-title">Before it goes out</h2>
          <ul className="ruled-list">
            <li>A quiz needs at least ten questions before it can be public.</li>
            <li>Every question holds exactly four answers.</li>
            <li>Exactly one answer is correct.</li>
            <li>An explanation is optional, and worth writing.</li>
            <li>A quiz can hold up to 50 questions.</li>
          </ul>
          <p className="editor-aside__note">
            The draft is saved the moment you make it. You can leave the editor
            and come back with nothing lost.
          </p>
        </aside>
      </div>
    </div>
  );
}
