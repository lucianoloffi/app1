import type { ReactNode } from "react";
import styles from "./ScreenHeader.module.css";

interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
  /** "lg" = Filtros/Configurações (20px, letter-spacing); "sm" = demais sub-telas (18px). */
  size?: "lg" | "sm";
  trailing?: ReactNode;
}

export function ScreenHeader({ title, onBack, size = "sm", trailing }: ScreenHeaderProps) {
  return (
    <div className={size === "lg" ? `${styles.header} ${styles.headerLg}` : `${styles.header} ${styles.headerSm}`}>
      <button type="button" className={styles.backButton} onClick={onBack} aria-label="Voltar">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M15 4l-8 8 8 8"
            stroke="#16211A"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <span className={size === "lg" ? styles.titleLg : styles.titleSm}>{title}</span>
      {trailing}
    </div>
  );
}
