import { VALUE_GROUPS } from "../../data/lifestyle";
import type { Values } from "../../types";
import { ChoiceGroups } from "../ChoiceGroups";
import { OnboardingLayout } from "../OnboardingLayout";
import styles from "./LifestyleScreen.module.css";

interface ValuesScreenProps {
  values: Values;
  onChange: (values: Values) => void;
  onBack: () => void;
  onNext: () => void;
}

/**
 * Alimentação, religião e política. Religião e opinião política são dado
 * sensível (LGPD): tudo opcional, sem "prefiro não responder" — não responder
 * é só não marcar — e nada disso conta na porcentagem do perfil, para não
 * virar pressão para responder.
 *
 * Espaços medidos para as três perguntas caberem em 390×844 sem rolar.
 */
export function ValuesScreen({ values, onChange, onBack, onNext }: ValuesScreenProps) {
  return (
    <OnboardingLayout
      progress={7}
      onBack={onBack}
      title="Seus valores"
      support="Opcional. Ajuda a achar quem pensa parecido com você."
      contentGap={14}
      ctaLabel="Continuar"
      onCta={onNext}
    >
      <ChoiceGroups
        groups={VALUE_GROUPS}
        selected={values}
        onChange={(key, value) => onChange({ ...values, [key]: value })}
      />
      <button type="button" className={styles.skipLink} onClick={onNext}>
        Preencher depois
      </button>
    </OnboardingLayout>
  );
}
