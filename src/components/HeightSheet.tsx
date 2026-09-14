import { RangeSlider } from "./RangeSlider";
import { heightLabel } from "../types";
import styles from "./HeightSheet.module.css";

interface HeightSheetProps {
  height: number;
  onChange: (height: number) => void;
  onClose: () => void;
}

export function HeightSheet({ height, onChange, onClose }: HeightSheetProps) {
  return (
    <div className={styles.overlay} role="dialog" aria-label="Altura">
      <div className={styles.sheet}>
        <div className={styles.header}>
          <h2 className={styles.title}>Altura</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fechar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 5l14 14M19 5L5 19"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <p className={styles.value}>{heightLabel(height)}</p>
        <RangeSlider
          min={100}
          max={220}
          values={[Math.round(height * 100)]}
          ariaLabels={["Altura"]}
          onChange={([cm]) => onChange(cm / 100)}
        />
        <button type="button" className={styles.doneButton} onClick={onClose}>
          Concluído
        </button>
      </div>
    </div>
  );
}
