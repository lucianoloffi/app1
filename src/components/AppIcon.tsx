import { LoviMark } from "./icons/LoviMark";

interface AppIconProps {
  size?: number;
  className?: string;
}

/** Ícone do app: quadrado arredondado com coração sobre a palavra "lovi". */
export function AppIcon({ size = 144, className }: AppIconProps) {
  const showWordmark = size >= 48;
  const heartSize = showWordmark ? size * 0.465 : size * 0.56;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.25,
        background: "linear-gradient(150deg, #8B5CF6 0%, #6B2FD6 45%, #4B1FA8 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 20px 42px -20px rgba(75,31,168,.8)",
      }}
    >
      <LoviMark size={heartSize} style={showWordmark ? { marginBottom: heartSize * -0.18 } : undefined} />
      {showWordmark && (
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: size * 0.396,
            lineHeight: 1,
            letterSpacing: "-.035em",
            color: "#F6F0FF",
          }}
        >
          lovi
        </span>
      )}
    </div>
  );
}
