import styles from "./ToggleRow.module.css";

interface ToggleRowProps {
  label: string;
  sub: string;
  on: boolean;
  onToggle: () => void;
}

export function ToggleRow({ label, sub, on, onToggle }: ToggleRowProps) {
  return (
    <button type="button" className={styles.row} onClick={onToggle}>
      <span className={styles.main}>
        <span className={styles.label}>{label}</span>
        <span className={styles.sub}>{sub}</span>
      </span>
      <span className={on ? `${styles.track} ${styles.trackOn}` : styles.track}>
        <span className={on ? `${styles.knob} ${styles.knobOn}` : styles.knob} />
      </span>
    </button>
  );
}
