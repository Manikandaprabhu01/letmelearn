export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="2.1" fill="currentColor" />
      <circle cx="22" cy="10" r="2.1" fill="currentColor" />
      <circle cx="16" cy="22" r="2.1" fill="currentColor" />
      <path
        d="M10 10h12M10 10l6 12M22 10l-6 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
