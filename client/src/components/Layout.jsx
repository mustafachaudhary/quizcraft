import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Wordmark } from './Wordmark.jsx';
import { Icon } from './Icon.jsx';

function navClass({ isActive }) {
  return isActive ? 'site-nav__link is-active' : 'site-nav__link';
}

export function SiteLayout() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    function onKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  async function handleLogout() {
    setLogoutError('');
    try {
      await logout();
      navigate('/');
    } catch {
      setLogoutError('Could not log out. Try again.');
    }
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="site-header">
        <div className="container site-header__inner">
          <Wordmark />

          <button
            type="button"
            className="menu-button"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
          </button>

          <div
            id="site-menu"
            className={`site-header__menu${menuOpen ? ' is-open' : ''}`}
          >
            <nav className="site-nav" aria-label="Main">
              <NavLink to="/discover" className={navClass}>
                Discover
              </NavLink>
              {user ? (
                <>
                  <NavLink to="/dashboard" className={navClass}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/quizzes/new" className={navClass}>
                    Create
                  </NavLink>
                </>
              ) : null}
            </nav>

            <div className="site-actions">
              {loading ? null : user ? (
                <>
                  <Link className="site-actions__user" to="/dashboard">
                    {user.username}
                  </Link>
                  <button
                    type="button"
                    className="button button--quiet button--small"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link className="site-actions__login" to="/login">
                    Log in
                  </Link>
                  <Link className="button button--small" to="/register">
                    Join QuizCraft
                  </Link>
                </>
              )}
            </div>

            {logoutError ? (
              <p className="site-header__error" role="alert">
                {logoutError}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <main id="main">
        <Outlet />
      </main>

      <SiteFooter />
    </>
  );
}

function SiteFooter() {
  const { user } = useAuth();

  return (
    <footer className="site-footer">
      <div className="container site-footer__top">
        <div className="site-footer__brand">
          <Wordmark />
          <p>
            A quiz platform for people with a question and a little time to
            spare.
          </p>
        </div>

        <nav className="site-footer__links" aria-label="Footer">
          <Link to="/discover">Discover</Link>
          <Link to={user ? '/quizzes/new' : '/register'}>
            {user ? 'Create a quiz' : 'Make an account'}
          </Link>
          <Link to={user ? '/dashboard' : '/login'}>
            {user ? 'Your desk' : 'Log in'}
          </Link>
        </nav>
      </div>

      <div className="container site-footer__bottom">
        <span>React, Express and PostgreSQL</span>
        <span>Write a question. Find an answer.</span>
      </div>
    </footer>
  );
}
