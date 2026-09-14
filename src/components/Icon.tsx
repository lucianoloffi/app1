type Props = { size?: number; className?: string; color?: string }

const base = (size: number) => ({ width: size, height: size })

export function HeartIcon({ size = 24, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill={color} className={className}>
      <path d="M12 21s-7.2-4.6-10-9.3C.4 8.6 1.7 5 5.2 4.1c2.1-.5 4 .4 5.1 2.1a1 1 0 0 0 1.4 0c1.1-1.7 3-2.6 5.1-2.1 3.5.9 4.8 4.5 3.2 7.6C19.2 16.4 12 21 12 21Z" />
    </svg>
  )
}

export function XIcon({ size = 24, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function ChevronLeftIcon({ size = 24, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}

export function ChevronRightIcon({ size = 24, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function ChevronDownIcon({ size = 24, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 9l7 7 7-7" />
    </svg>
  )
}

export function DotsIcon({ size = 24, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill={color} className={className}>
      <circle cx="5" cy="12" r="1.9" />
      <circle cx="12" cy="12" r="1.9" />
      <circle cx="19" cy="12" r="1.9" />
    </svg>
  )
}

export function SlidersIcon({ size = 24, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" className={className}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <circle cx="9" cy="7" r="2.3" fill="#0000" />
      <line x1="4" y1="17" x2="20" y2="17" />
      <circle cx="16" cy="17" r="2.3" fill="#0000" />
    </svg>
  )
}

export function CameraIcon({ size = 24, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.4" />
    </svg>
  )
}

export function CheckIcon({ size = 24, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  )
}

export function WifiOffIcon({ size = 24, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 2l20 20" />
      <path d="M8.5 8.8a10 10 0 0 1 10.8 2" />
      <path d="M5 5.6A14.9 14.9 0 0 1 12 4c1.6 0 3.1.3 4.5.8" />
      <path d="M8.8 12.3a5.7 5.7 0 0 1 5-1.4" />
      <circle cx="12" cy="18" r="1.2" fill={color} stroke="none" />
    </svg>
  )
}

export function FilterCircleIcon({ size = 24, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 5h16M7 12h10M10 19h4" />
    </svg>
  )
}

export function SpinnerIcon({ size = 24, className }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="#EDEFEA" strokeWidth={2.6} />
    </svg>
  )
}

export function DrinkIcon({ size = 17, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill={color} className={className}>
      <path d="M4 3h16l-1.6 3.2L13 15v4h4v2H7v-2h4v-4L4.6 6.2 4 5V3Zm3.1 4.6h9.8L18.2 5H5.8l1.3 2.6Z" />
    </svg>
  )
}

export function ActivityIcon({ size = 17, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill={color} className={className}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  )
}

export function KidsIcon({ size = 17, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill={color} className={className}>
      <circle cx="8.5" cy="7" r="3" />
      <circle cx="16" cy="8.5" r="2.3" />
      <path d="M2 20c0-3.6 2.9-6.2 6.5-6.2S15 16.4 15 20v1H2v-1Z" />
      <path d="M15.5 13.4c2.6.4 4.5 2.5 4.5 5.4v1.2h-3.6" />
    </svg>
  )
}

export function StatusHeartIcon({ size = 17, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill={color} className={className}>
      <path d="M12 20.5s-6.7-4.3-9.3-8.6C1.2 9.4 2.3 6.4 5.2 5.6c1.9-.5 3.7.3 4.8 1.9a1 1 0 0 0 1.6 0c1.1-1.6 2.9-2.4 4.8-1.9 2.9.8 4 3.8 2.5 6.3-2.6 4.3-9.3 8.6-9.3 8.6a1 1 0 0 1 2.6 0Z" />
    </svg>
  )
}

export function BriefcaseIcon({ size = 17, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill={color} className={className}>
      <path d="M9 4h6a1 1 0 0 1 1 1v2h4a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4V5a1 1 0 0 1 1-1Zm1 3h4V6h-4v1Z" />
    </svg>
  )
}

export function RulerIcon({ size = 17, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="9" width="18" height="6" rx="1.5" transform="rotate(-30 12 12)" />
      <path d="M8.5 9.7 10 12M11.5 8 13 10.3M14.5 6.3 16 8.6" transform="rotate(-30 12 12)" />
    </svg>
  )
}

export function BellIcon({ size = 20, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill={color} className={className}>
      <path d="M12 22a2.3 2.3 0 0 0 2.3-2.1h-4.6A2.3 2.3 0 0 0 12 22Zm7-5.3-1.5-1.5V10a5.5 5.5 0 0 0-4.4-5.4V3.6a1.1 1.1 0 1 0-2.2 0v1a5.5 5.5 0 0 0-4.4 5.4v5.2L5 16.7a1 1 0 0 0 .7 1.7h12.6a1 1 0 0 0 .7-1.7Z" />
    </svg>
  )
}

export function ShieldIcon({ size = 20, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill={color} className={className}>
      <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z" />
    </svg>
  )
}

export function LockIcon({ size = 20, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill={color} className={className}>
      <path d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1Zm2 0h6V7a3 3 0 0 0-6 0v3Z" />
    </svg>
  )
}

export function PhoneIcon({ size = 20, className, color = 'currentColor' }: Props) {
  return (
    <svg {...base(size)} viewBox="0 0 24 24" fill={color} className={className}>
      <path d="M6.6 2h4l1.6 4.4-2.3 2a12.4 12.4 0 0 0 5.7 5.7l2-2.3L22 13.4v4a1.6 1.6 0 0 1-1.7 1.6C11 18.3 5.7 13 5 4.7A1.6 1.6 0 0 1 6.6 2Z" />
    </svg>
  )
}
