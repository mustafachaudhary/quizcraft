import { Link } from 'react-router-dom';

function Mark() {
  return (
    <svg
      className="mark"
      width="26"
      height="26"
      viewBox="0 0 26 26"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="1.5"
        y="1.5"
        width="23"
        height="23"
        rx="6"
        fill="var(--color-paper-2)"
        stroke="var(--color-ink)"
        strokeWidth="2"
      />
      <rect x="5" y="6" width="3" height="3" fill="var(--color-ink)" />
      <rect x="5" y="11.5" width="3" height="3" fill="var(--color-ink)" />
      <rect x="5" y="17" width="3" height="3" fill="var(--color-accent)" />
      <path
        d="M11 7.5h10M11 13h10M11 18.5h6"
        stroke="var(--color-ink)"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function Wordmark({ linked = true, className = '' }) {
  const content = (
    <>
      <Mark />
      <span>QuizCraft</span>
    </>
  );

  if (!linked) {
    return <span className={`wordmark ${className}`.trim()}>{content}</span>;
  }

  return (
    <Link to="/" className={`wordmark ${className}`.trim()} aria-label="QuizCraft home">
      {content}
    </Link>
  );
}
