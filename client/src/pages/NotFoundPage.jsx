import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks.js';

export function NotFoundPage() {
  useDocumentTitle('Page not found');

  return (
    <div className="container not-found">
      <p className="not-found__figure num">404</p>
      <div>
        <h1>This page is not on the shelf.</h1>
        <p>
          The address may be wrong, or whatever was here has been taken down.
        </p>
        <div className="not-found__actions">
          <Link className="button" to="/discover">
            Find a quiz
          </Link>
          <Link className="link-bar" to="/">
            Back to the front
          </Link>
        </div>
      </div>
    </div>
  );
}
