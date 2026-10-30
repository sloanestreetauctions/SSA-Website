/** Minimal line icons, drawn to match the 1.2px weight of the typography. */
type IconProps = { className?: string; size?: number };

export function SearchIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" width={size} height={size} className={className}>
      <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M13 13l5 5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function MenuIcon({ className = "", size = 22 }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 22 22" width={size} height={size} className={className}>
      <path d="M2 7h18M2 15h18" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function CloseIcon({ className = "", size = 22 }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 22 22" width={size} height={size} className={className}>
      <path d="M4 4l14 14M18 4L4 18" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function ChevronIcon({ className = "", size = 12 }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" width={size} height={size} className={className}>
      <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
