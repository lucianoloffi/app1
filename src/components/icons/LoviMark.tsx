import { useId, type CSSProperties } from "react";

type LoviMarkVariant = "color" | "purple" | "white" | "mono";

interface LoviMarkProps {
  size?: number;
  variant?: LoviMarkVariant;
  className?: string;
  style?: CSSProperties;
}

const LEFT_HALF = "M32 57C12 43 5 34 5 23.5A15 15 0 0 1 32 19Z";
const RIGHT_HALF = "M32 57c20-14 27-23 27-33.5A15 15 0 0 0 32 19Z";

/** Marca lovi: coração em duas metades, sempre clara à esquerda / escura à direita. */
export function LoviMark({ size = 32, variant = "color", className, style }: LoviMarkProps) {
  const idBase = `lovi-mark-${useId()}`;

  if (variant === "white") {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" className={className} style={style} aria-hidden="true">
        <path d={LEFT_HALF} fill="#FFFFFF" />
        <path d={RIGHT_HALF} fill="#D9C2FA" />
      </svg>
    );
  }

  if (variant === "mono") {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" className={className} style={style} aria-hidden="true">
        <path d={LEFT_HALF} fill="#16211A" />
        <path d={RIGHT_HALF} fill="#16211A" opacity={0.72} />
      </svg>
    );
  }

  if (variant === "purple") {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" className={className} style={style} aria-hidden="true">
        <path d={LEFT_HALF} fill="#EBD3FF" />
        <path d={RIGHT_HALF} fill="#B98BF0" />
      </svg>
    );
  }

  const lightId = `${idBase}-light`;
  const darkId = `${idBase}-dark`;

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id={lightId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFD9FB" />
          <stop offset="1" stopColor="#F0A6FF" />
        </linearGradient>
        <linearGradient id={darkId} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#C07BFF" />
          <stop offset="1" stopColor="#6D3BF5" />
        </linearGradient>
      </defs>
      <path d={LEFT_HALF} fill={`url(#${lightId})`} />
      <path d={RIGHT_HALF} fill={`url(#${darkId})`} />
    </svg>
  );
}
