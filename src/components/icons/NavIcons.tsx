interface NavIconProps {
  active?: boolean;
  size?: number;
}

const ACTIVE = "var(--color-accent)";
const INACTIVE = "var(--color-icon-inactive)";

export function ChatsIcon({ active, size = 24 }: NavIconProps) {
  const color = active ? ACTIVE : INACTIVE;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.6" y="4.2" width="18.8" height="13.4" rx="5.4" fill={color} />
      <path
        d="M8.4 16.4l-.6 4.2a.8.8 0 0 0 1.3.7l4.4-3.4z"
        fill={color}
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DiscoverIcon({ active, size = 24 }: NavIconProps) {
  const color = active ? ACTIVE : INACTIVE;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.6 7.5v9" stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.4} />
      <path d="M20.4 7.5v9" stroke={color} strokeWidth={2} strokeLinecap="round" opacity={0.4} />
      <rect
        x="6.2"
        y="3.4"
        width="11.6"
        height="17.2"
        rx="3.6"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M12 15.6c-2.2-1.6-3.3-2.9-3.3-4.1a1.75 1.75 0 0 1 3.3-.6 1.75 1.75 0 0 1 3.3.6c0 1.2-1.1 2.5-3.3 4.1z"
        fill={color}
      />
    </svg>
  );
}

export function ProfileIcon({ active, size = 24 }: NavIconProps) {
  const color = active ? ACTIVE : INACTIVE;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.2" r="3.9" fill={color} />
      <path
        d="M5 19.8c0-3.6 3.1-5.8 7-5.8s7 2.2 7 5.8a1.7 1.7 0 0 1-1.7 1.7H6.7A1.7 1.7 0 0 1 5 19.8Z"
        fill={color}
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  );
}
