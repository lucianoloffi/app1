import { INTEREST_OPTIONS, MAX_INTERESTS, MIN_INTERESTS } from "../onboarding/constants";
import { PillChip } from "./PillChip";
import styles from "./InterestBottomSheet.module.css";

interface InterestBottomSheetProps {
  interests: string[];
  onToggle: (interest: string) => void;
  onOverMax: () => void;
  onClose: () => void;
}

export function InterestBottomSheet({
  interests,
  onToggle,
  onOverMax,
  onClose,
}: InterestBottomSheetProps) {
  const missing = MIN_INTERESTS - interests.length;

  return (
    <div className={styles.overlay} role="dialog" aria-label="Seus interesses">
      <div className={styles.sheet}>
        <div className={styles.header}>
          <h2 className={styles.title}>Seus interesses</h2>
          <span className={styles.counter}>
            {missing > 0 ? `Escolha ${missing} para o mínimo` : ""}
          </span>
        </div>
        <div className={styles.body}>
          {INTEREST_OPTIONS.map((interest) => {
            const isSelected = interests.includes(interest);
            return (
              <PillChip
                key={interest}
                active={isSelected}
                onClick={() => {
                  if (!isSelected && interests.length >= MAX_INTERESTS) {
                    onOverMax();
                    return;
                  }
                  onToggle(interest);
                }}
              >
                {interest}
              </PillChip>
            );
          })}
        </div>
        <div className={styles.footer}>
          <button type="button" className={styles.doneButton} onClick={onClose}>
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
