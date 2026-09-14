import type { ReactNode } from "react";
import { TOTAL_PROGRESS_SEGMENTS } from "./constants";
import styles from "./OnboardingLayout.module.css";

interface OnboardingLayoutProps {
  /** 0 esconde a barra; 1–8 preenche os segmentos correspondentes. */
  progress?: number;
  onBack?: () => void;
  title: string;
  support?: string;
  children: ReactNode;
  ctaLabel: string;
  ctaDisabled?: boolean;
  onCta: () => void;
}

export function OnboardingLayout({
  progress = 0,
  onBack,
  title,
  support,
  children,
  ctaLabel,
  ctaDisabled,
  onCta,
}: OnboardingLayoutProps) {
  return (
    <div className={styles.screen}>
      {progress > 0 && (
        <div className={styles.topBar}>
          <div className={styles.progressRow}>
            {Array.from({ length: TOTAL_PROGRESS_SEGMENTS }, (_, index) => (
              <span
                key={index}
                className={
                  index < progress ? `${styles.segment} ${styles.segmentFilled}` : styles.segment
                }
              />
            ))}
          </div>
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.heading}>
          <h1 className={styles.title}>{title}</h1>
          {support && <p className={styles.support}>{support}</p>}
        </div>
        {children}
      </div>

      <div className={styles.footer}>
        <div className={styles.footerRow}>
          {onBack && (
            <button
              type="button"
              className={styles.backButton}
              onClick={onBack}
              aria-label="Voltar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M15 4l-8 8 8 8"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <button
            type="button"
            className={styles.ctaButton}
            disabled={ctaDisabled}
            onClick={onCta}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
