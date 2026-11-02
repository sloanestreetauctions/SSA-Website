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

export function InstagramIcon({ className = "", size = 18 }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="2.5" y="2.5" width="15" height="15" rx="4.2" />
      <circle cx="10" cy="10" r="3.4" />
      <circle cx="14.4" cy="5.6" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PhoneIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
      <path d="M4.2 2.8h3l1.5 3.8-2 1.3a9.5 9.5 0 0 0 5.4 5.4l1.3-2 3.8 1.5v3c0 .8-.7 1.5-1.5 1.5A13.7 13.7 0 0 1 2.7 4.3c0-.8.7-1.5 1.5-1.5z" />
    </svg>
  );
}
