import { LIFE_GROUPS } from "../../data/lifestyle";
import type { Lifestyle } from "../../types";
import { ChoiceGroups } from "../ChoiceGroups";
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
      progress={10}
      onBack={onBack}
      title="Seu estilo de vida"
      support="Opcional. Ajuda quem vê seu perfil a entender sua rotina."
      contentGap={30}
      ctaLabel="Continuar"
      onCta={onNext}
    >
      <ChoiceGroups
        groups={LIFE_GROUPS}
        selected={lifestyle}
        onChange={(key, value) => onChange({ ...lifestyle, [key]: value })}
      />
      <button type="button" className={styles.skipLink} onClick={onNext}>
        Preencher depois
      </button>
    </OnboardingLayout>
  );
}
