import type { ReactNode } from "react";
import styles from "./PillChip.module.css";

interface PillChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  size?: "sm" | "md";
  disabled?: boolean;
}

export function PillChip({ active, onClick, children, size = "sm", disabled }: PillChipProps) {
  const className = [
    styles.chip,
    size === "md" ? styles.sizeMd : "",
    active ? styles.chipActive : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

interface PillChipRowProps<T extends string> {
  options: { value: T; label: string }[];
  selected: T | null;
  onSelect: (value: T) => void;
  size?: "sm" | "md";
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
