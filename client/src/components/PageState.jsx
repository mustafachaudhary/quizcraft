import { Icon } from './Icon.jsx';

export function LoadingBlock({ rows = 4, label = 'Loading' }) {
  return (
    <div className="loading-block" role="status" aria-label={label}>
      <span className="visually-hidden">{label}</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          className={`skeleton skeleton--row skeleton--${(index % 3) + 1}`}
          key={index}
        />
      ))}
    </div>
  );
}

export function ErrorNotice({
  title = 'Something went wrong.',
  message,
  onRetry,
  children,
}) {
  return (
    <div className="notice notice--error" role="alert">
      <div className="notice__mark" aria-hidden="true">
        <Icon name="x" size={20} />
      </div>
      <div>
        <h2 className="notice__title">{title}</h2>
        {message ? <p>{message}</p> : null}
        {children}
        {onRetry ? (
          <button type="button" className="button button--quiet button--small" onClick={onRetry}>
            Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <div className="empty-state__body">{children}</div>
      {action}
    </div>
  );
}
