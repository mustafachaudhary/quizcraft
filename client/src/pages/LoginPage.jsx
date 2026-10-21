import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useDocumentTitle } from '../hooks.js';

export function LoginPage() {
  useDocumentTitle('Log in');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const from = location.state?.from;
  const destination = from?.pathname
    ? `${from.pathname}${from.search || ''}${from.hash || ''}`
    : '/dashboard';

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      await login(username.trim(), password);
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError);
    } finally {
      setBusy(false);
    }
  }

  function useDemoAccount() {
    setUsername('northstar');
    setPassword('quizcraft123');
    setError(null);
  }

  const fields = error?.fields || {};

  return (
    <div className="container auth">
      <section className="auth__form" aria-labelledby="login-title">
        <h1 id="login-title">Log in.</h1>
        <p className="auth__lede">
          Your desk, your drafts, and every attempt where you left it.
        </p>

        <form className="stack-form" onSubmit={handleSubmit} noValidate>
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
              autoFocus
            />
            {fields.username ? (
              <span className="field__error">{fields.username}</span>
            ) : null}
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <input
              className="field__input"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(fields.password)}
            />
            {fields.password ? (
              <span className="field__error">{fields.password}</span>
            ) : null}
          </label>

          <button className="button button--wide" type="submit" disabled={busy}>
            {busy ? 'Logging in' : 'Log in'}
          </button>
        </form>

        <p className="auth__switch">
          No account yet?{' '}
          <Link className="text-link" to="/register" state={location.state}>
            Make one
          </Link>
        </p>

        <div className="demo-note">
          <p>
            Looking around? The demo account is <strong>northstar</strong> with
            the password <strong>quizcraft123</strong>.
          </p>
          <button type="button" className="text-link" onClick={useDemoAccount}>
            Fill in the demo details
          </button>
        </div>
      </section>

      <aside className="auth__side" aria-labelledby="login-aside-title">
        <h2 id="login-aside-title">Your place is kept.</h2>
        <p>
          An unfinished attempt waits for you. Come back and the next question
          is exactly where you stopped.
        </p>
        <ul className="ruled-list">
          <li>Every answer is checked on the server.</li>
          <li>Each attempt ends with a full review.</li>
          <li>Your quizzes can stay private for as long as you like.</li>
        </ul>
      </aside>
    </div>
  );
}
