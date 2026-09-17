import type { ReactNode } from "react";
import styles from "./PillChip.module.css";

interface PillChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  size?: "xs" | "sm" | "md";
  disabled?: boolean;
  /** Mostra a marca de seleção: é o que diz que dá para marcar mais de um. */
  check?: boolean;
}

function Check({ on }: { on: boolean }) {
  return (
    <span className={on ? styles.checkOn : styles.check} aria-hidden="true">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 12.5l5 5L20 6.5"
          stroke="currentColor"
          strokeWidth={3.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function PillChip({
  active,
  onClick,
  children,
  size = "sm",
  disabled,
  check,
}: PillChipProps) {
  const className = [
    styles.chip,
    size === "md" ? styles.sizeMd : "",
    size === "xs" ? styles.sizeXs : "",
    active ? styles.chipActive : "",
    active && size === "xs" ? styles.chipActiveStrong : "",
    check ? styles.chipComCheck : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={check ? active : undefined}
    >
      {check && <Check on={active} />}
      {children}
    </button>
  );
}

interface PillChipRowProps<T extends string> {
  options: { value: T; label: string }[];
  selected: T | null;
  onSelect: (value: T) => void;
  size?: "xs" | "sm" | "md";
}

interface PillChipCheckRowProps<T extends string> {
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (value: T) => void;
  size?: "xs" | "sm" | "md";
}

/**
 * Linha de múltipla escolha. O círculo de marcação existe para a pessoa
 * perceber que pode marcar mais de um — sem ele, chip marcado parece
 * escolha única.
 */
export function PillChipCheckRow<T extends string>({
  options,
  selected,
  onToggle,
  size = "md",
}: PillChipCheckRowProps<T>) {
  return (
    <div className={styles.row}>
      {options.map((option) => (
        <PillChip
          key={option.value}
          check
          active={selected.includes(option.value)}
          onClick={() => onToggle(option.value)}
          size={size}
        >
          {option.label}
        </PillChip>
      ))}
    </div>
  );
}

export function PillChipRow<T extends string>({
  options,
  selected,
  onSelect,
  size = "md",
}: PillChipRowProps<T>) {
  return (
    <div className={styles.row}>
      {options.map((option) => (
        <PillChip
          key={option.value}
          active={selected === option.value}
          onClick={() => onSelect(option.value)}
          size={size}
        >
          {option.label}
        </PillChip>
      ))}
    </div>
  );
}
