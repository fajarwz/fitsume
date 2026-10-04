/**
 * Elements, not background images, so they take the theme via currentColor.
 */
type IconProps = { className?: string }

export function Chevron({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M6 8l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CloseIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function MenuIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M3 5h14M3 10h14M3 15h14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function CheckIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M4 10.5l4 4L16 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function GitHubIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M10 1.7a8.3 8.3 0 0 0-2.62 16.18c.42.07.57-.18.57-.4v-1.4c-2.33.5-2.82-.99-2.82-.99-.38-.97-.93-1.23-.93-1.23-.76-.52.06-.51.06-.51.84.06 1.28.86 1.28.86.74 1.28 1.95.91 2.43.7.07-.54.29-.91.53-1.12-1.86-.21-3.82-.93-3.82-4.14 0-.91.32-1.66.86-2.24-.08-.21-.37-1.06.08-2.21 0 0 .7-.22 2.3.86a8 8 0 0 1 4.18 0c1.6-1.08 2.3-.86 2.3-.86.45 1.15.16 2 .08 2.21.53.58.86 1.33.86 2.24 0 3.21-1.96 3.92-3.83 4.13.3.26.57.77.57 1.55v2.3c0 .22.15.48.58.4A8.3 8.3 0 0 0 10 1.7Z" />
    </svg>
  )
}

export function MoreIcon({ className = '' }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <circle cx="5" cy="10" r="1.5" fill="currentColor" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
      <circle cx="15" cy="10" r="1.5" fill="currentColor" />
    </svg>
  )
}
