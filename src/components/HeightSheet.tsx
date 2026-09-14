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
    <div className={styles.overlay} role="dialog" aria-label="Sua altura">
      <div className={styles.sheet}>
        <div className={styles.header}>
          <h2 className={styles.title}>Sua altura</h2>
          <span className={styles.value}>{heightLabel(height)}</span>
        </div>
        <RangeSlider
          min={100}
          max={220}
          values={[Math.round(height * 100)]}
          ariaLabels={["Altura"]}
          onChange={([cm]) => onChange(cm / 100)}
        />
        <div className={styles.range}>
          <span>1,00 m</span>
          <span>2,20 m</span>
        </div>
        <button type="button" className={styles.doneButton} onClick={onClose}>
          Concluído
        </button>
      </div>
    </div>
  );
}
