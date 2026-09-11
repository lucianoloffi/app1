import type { Gender } from "../types";
import styles from "./GenderButtonGroup.module.css";

const COLOR_BY_GENDER: Record<Gender, string> = {
  homem: "var(--color-gender-man)",
  mulher: "var(--color-gender-woman)",
  outros: "var(--color-gender-other)",
};

interface GenderButtonGroupProps {
  options: { value: Gender; label: string }[];
  selected: Gender | null;
  onSelect: (value: Gender) => void;
}

export function GenderButtonGroup({ options, selected, onSelect }: GenderButtonGroupProps) {
  return (
    <div className={styles.row}>
      {options.map(({ value, label }) => {
        const color = COLOR_BY_GENDER[value];
        const isSelected = selected === value;
        return (
          <button
            key={value}
            type="button"
            className={styles.button}
            style={{
              borderColor: color,
              background: isSelected ? color : "#fff",
              color: isSelected ? "#fff" : color,
            }}
            onClick={() => onSelect(value)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
