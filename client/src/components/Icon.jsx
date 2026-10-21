const paths = {
  menu: (
    <>
      <path d="M3 5h14M3 10h14M3 15h14" />
    </>
  ),
  close: <path d="M4 4l12 12M16 4L4 16" />,
  search: (
    <>
      <circle cx="8.5" cy="8.5" r="5" />
      <path d="M12.2 12.2L17 17" />
    </>
  ),
  check: <path d="M3.5 9l3.2 3.2L16 4.5" />,
  x: <path d="M4 4l12 12M16 4L4 16" />,
  minus: <path d="M4 10h12" />,
  plus: <path d="M10 3v14M3 10h14" />,
};

export function Icon({ name, size = 18, className = '' }) {
  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
