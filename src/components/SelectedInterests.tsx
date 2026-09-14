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
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 5l14 14M19 5L5 19"
                stroke="currentColor"
                strokeWidth={4}
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
