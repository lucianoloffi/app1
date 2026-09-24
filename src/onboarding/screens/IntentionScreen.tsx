import { INTENTION_LABEL, TODAS_AS_INTENCOES, type Intention } from "../../types";
import { OnboardingLayout } from "../OnboardingLayout";
import fieldStyles from "../fields.module.css";
import styles from "./IntentionScreen.module.css";

/** A linha de baixo de cada cartão: diz o que o título sozinho deixa em aberto. */
const INTENTION_SUBTITLE: Record<Intention, string> = {
  serio: "Quero construir algo de longo prazo",
  conhecer: "Sem pressa, ver no que dá",
  casual: "Leve, sem compromisso",
  nao_sei: "Vou descobrir conversando",
};

interface IntentionScreenProps {
  intention: Intention | null;
  onChangeIntention: (value: Intention) => void;
  onBack: () => void;
  onNext: () => void;
}

export function IntentionScreen({
  intention,
  onChangeIntention,
  onBack,
  onNext,
}: IntentionScreenProps) {
  return (
    <OnboardingLayout
      progress={6}
      onBack={onBack}
      title="O que você busca?"
      support="É o que combina você com as pessoas certas."
      contentGap={16}
      ctaLabel="Continuar"
      ctaDisabled={!intention}
      onCta={onNext}
    >
      <div className={fieldStyles.fieldGroup} role="radiogroup" aria-label="O que você busca">
        <div className={styles.cardStack}>
          {TODAS_AS_INTENCOES.map((value) => {
            const isSelected = intention === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={
                  isSelected
                    ? `${styles.intentionCard} ${styles.intentionCardSelected}`
                    : styles.intentionCard
                }
                onClick={() => onChangeIntention(value)}
              >
                <span className={styles.intentionTitle}>{INTENTION_LABEL[value]}</span>
                <span className={styles.intentionSubtitle}>{INTENTION_SUBTITLE[value]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </OnboardingLayout>
  );
}
