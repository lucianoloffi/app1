import { INTEREST_OPTIONS, MAX_INTERESTS } from "../onboarding/constants";
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
  return (
    <div className={styles.overlay} role="dialog" aria-label="Seus interesses">
      <div className={styles.sheet}>
        <div className={styles.header}>
          <h2 className={styles.title}>Seus interesses</h2>
          <span className={styles.counter}>Escolha até {MAX_INTERESTS}</span>
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
