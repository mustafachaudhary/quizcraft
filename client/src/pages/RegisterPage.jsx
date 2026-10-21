import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useDocumentTitle } from '../hooks.js';

export function RegisterPage() {
  useDocumentTitle('Make an account');
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const from = location.state?.from;
  const destination = from?.pathname
    ? `${from.pathname}${from.search || ''}${from.hash || ''}`
    : '/dashboard';

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setLocalError('');

    if (password !== confirm) {
      setLocalError('The two passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await register(username.trim(), password);
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError);
    } finally {
      setBusy(false);
    }
  }

  const fields = error?.fields || {};

  return (
    <div className="container auth">
      <section className="auth__form" aria-labelledby="register-title">
        <h1 id="register-title">Make an account.</h1>
        <p className="auth__lede">
          One place for the quizzes you write and the attempts you take.
        </p>

        <form className="stack-form" onSubmit={handleSubmit} noValidate>
          {localError ? (
            <p className="form-alert" role="alert">
              {localError}
            </p>
          ) : null}

          {error && !error.fields ? (
            <p className="form-alert" role="alert">
              {error.message}
            </p>
          ) : null}

          <label className="field">
            <span className="field__label">Username</span>
            <input
              className="field__input"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              aria-invalid={Boolean(fields.username)}
              aria-describedby="username-help"
              autoFocus
            />
            <span className="field__help" id="username-help">
              3 to 24 characters. Lowercase letters, numbers and underscores.
            </span>
            {fields.username ? (
              <span className="field__error">{fields.username}</span>
            ) : null}
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <input
              className="field__input"
              type="password"
              name="new-password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(fields.password)}
              aria-describedby="password-help"
            />
            <span className="field__help" id="password-help">
              At least 8 characters.
            </span>
            {fields.password ? (
              <span className="field__error">{fields.password}</span>
            ) : null}
          </label>

          <label className="field">
            <span className="field__label">Password again</span>
            <input
              className="field__input"
              type="password"
              name="confirm-password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </label>

          <button className="button button--wide" type="submit" disabled={busy}>
            {busy ? 'Making the account' : 'Make an account'}
          </button>
        </form>

        <p className="auth__switch">
          Already have one?{' '}
          <Link className="text-link" to="/login" state={location.state}>
            Log in
          </Link>
        </p>
      </section>

      <aside className="auth__side" aria-labelledby="register-aside-title">
        <h2 id="register-aside-title">Start with one good question.</h2>
        <p>
          The first quiz is a private draft. Nothing goes public until you have
          written the questions and said so.
        </p>
        <ul className="ruled-list">
          <li>Four answers to a question, exactly one correct.</li>
          <li>An explanation can follow every answer.</li>
          <li>Publish when it is ready, then share the page.</li>
        </ul>
      </aside>
    </div>
  );
}
