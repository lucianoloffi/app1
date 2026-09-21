import styles from "./Spinner.module.css";

interface SpinnerProps {
  /** Diâmetro em px. */
  size?: number;
  label?: string;
}

/** Círculo girando, para "está carregando". Branco: vai sobre foto escurecida. */
export function Spinner({ size = 28, label = "Carregando" }: SpinnerProps) {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size }}
      role="status"
      aria-label={label}
    />
  );
}
