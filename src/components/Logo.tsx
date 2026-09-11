import { LoviMark } from "./icons/LoviMark";

interface LogoProps {
  heartSize?: number;
  textSize?: number;
  variant?: "color" | "white" | "mono";
  className?: string;
}

/** Assinatura horizontal: coração + "lovi". Espaço entre eles = metade da altura do coração. */
export function Logo({ heartSize = 26, textSize = 28, variant = "color", className }: LogoProps) {
  const textColor =
    variant === "white" ? "#FFFFFF" : variant === "mono" ? "#16211A" : "#5B34C9";

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: heartSize / 2,
      }}
    >
      <LoviMark size={heartSize} variant={variant === "color" ? "color" : variant} />
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 900,
          fontSize: textSize,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: textColor,
        }}
      >
        lovi
      </span>
    </div>
  );
}
