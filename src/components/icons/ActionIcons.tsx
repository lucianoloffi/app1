interface ActionIconProps {
  size?: number;
}

export function CloseIcon({ size = 24 }: ActionIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 5l14 14M19 5L5 19"
        stroke="#5C6660"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HeartIcon({ size = 32 }: ActionIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s-8-4.9-8-10.3A4.7 4.7 0 0 1 12 8a4.7 4.7 0 0 1 8 2.7C20 16.1 12 21 12 21z"
        fill="#fff"
      />
    </svg>
  );
}
