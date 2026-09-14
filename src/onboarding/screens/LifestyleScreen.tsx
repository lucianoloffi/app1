import { PillChipRow } from "../../components/PillChip";
import { LIFE_GROUPS } from "../../data/lifestyle";
import type { Lifestyle } from "../../types";
import { OnboardingLayout } from "../OnboardingLayout";
import styles from "./LifestyleScreen.module.css";

interface LifestyleScreenProps {
  lifestyle: Lifestyle;
  onChange: (lifestyle: Lifestyle) => void;
  onBack: () => void;
  onNext: () => void;
}

export function LifestyleScreen({ lifestyle, onChange, onBack, onNext }: LifestyleScreenProps) {
  return (
    <OnboardingLayout
      progress={7}
      onBack={onBack}
      title="Seu estilo de vida"
      support="Opcional. Ajuda quem vê seu perfil a entender sua rotina."
      ctaLabel="Continuar"
      onCta={onNext}
      secondary={
        <button type="button" className={styles.skipLink} onClick={onNext}>
          Preencher depois
        </button>
      }
    >
      <div className={styles.groups}>
        {LIFE_GROUPS.map((group) => (
          <div key={group.key} className={styles.group}>
            <div className={styles.groupHeader}>
              <span className={styles.iconBox}>
                <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
                  <path d={group.icon} fill="#5B34C9" />
                </svg>
              </span>
              <span className={styles.groupTitle}>{group.title}</span>
            </div>
            <PillChipRow
              options={group.options}
              selected={lifestyle[group.key]}
              onSelect={(value) => onChange({ ...lifestyle, [group.key]: value })}
              size="sm"
            />
          </div>
        ))}
      </div>
    </OnboardingLayout>
  );
}
