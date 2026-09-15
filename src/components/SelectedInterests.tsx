import styles from "./SelectedInterests.module.css";

interface SelectedInterestsProps {
  interests: string[];
  onRemove: (interest: string) => void;
  onAdd: () => void;
}

export function SelectedInterests({ interests, onRemove, onAdd }: SelectedInterestsProps) {
  return (
    <div className={styles.row}>
      {interests.map((interest) => (
        <span key={interest} className={styles.chip}>
          {interest}
          <button
            type="button"
            className={styles.removeButton}
            onClick={() => onRemove(interest)}
            aria-label={`Remover ${interest}`}
          >
            <svg width="7" height="7" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path
                d="M1 1l8 8M9 1L1 9"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
          </button>
        </span>
      ))}
      <button type="button" className={styles.addChip} onClick={onAdd}>
        Adicionar
      </button>
    </div>
  );
}
