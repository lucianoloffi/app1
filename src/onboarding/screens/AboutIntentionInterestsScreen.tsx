import { INTEREST_OPTIONS, MAX_INTERESTS } from "../constants";
import { OnboardingLayout } from "../OnboardingLayout";
import type { Intention } from "../../types";
import fieldStyles from "../fields.module.css";
import styles from "./AboutIntentionInterestsScreen.module.css";

const INTENTION_OPTIONS: { value: Intention; title: string; subtitle: string }[] = [
  { value: "serio", title: "Relacionamento sério", subtitle: "Quero construir algo de longo prazo" },
  { value: "conhecer", title: "Conhecer pessoas", subtitle: "Sem pressa, ver no que dá" },
  { value: "amizade", title: "Amizade", subtitle: "Companhia para rolês e conversas" },
];

interface AboutIntentionInterestsScreenProps {
  bio: string;
  intention: Intention | null;
  interests: string[];
  onChangeBio: (value: string) => void;
  onChangeIntention: (value: Intention) => void;
  onToggleInterest: (value: string) => void;
  onBack: () => void;
  onFinish: () => void;
}

export function AboutIntentionInterestsScreen({
  bio,
  intention,
  interests,
  onChangeBio,
  onChangeIntention,
  onToggleInterest,
  onBack,
  onFinish,
}: AboutIntentionInterestsScreenProps) {
  const isValid = Boolean(intention) && interests.length >= 3 && bio.trim().length > 4;

  return (
    <OnboardingLayout
      progress={6}
      onBack={onBack}
      title="Sobre você, intenção e interesses"
      ctaLabel="Concluir cadastro"
      ctaDisabled={!isValid}
      onCta={onFinish}
    >
      <div className={fieldStyles.fieldGroup}>
        <span className={fieldStyles.label}>Sobre você</span>
        <textarea
          className={fieldStyles.textarea}
          placeholder="Escreva em uma frase o que você procura por aqui."
          value={bio}
          onChange={(e) => onChangeBio(e.target.value)}
        />
      </div>

      <div className={fieldStyles.fieldGroup}>
        <span className={fieldStyles.label}>O que você busca?</span>
        <div className={styles.cardStack}>
          {INTENTION_OPTIONS.map((option) => {
            const isSelected = intention === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={
                  isSelected
                    ? `${styles.intentionCard} ${styles.intentionCardSelected}`
                    : styles.intentionCard
                }
                onClick={() => onChangeIntention(option.value)}
              >
                <span className={styles.intentionTitle}>{option.title}</span>
                <span className={styles.intentionSubtitle}>{option.subtitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={fieldStyles.fieldGroup}>
        <span className={fieldStyles.label}>
          Interesses · {interests.length}/{MAX_INTERESTS} selecionados
        </span>
        <div className={styles.chipsRow}>
          {INTEREST_OPTIONS.map((interest) => {
            const isSelected = interests.includes(interest);
            const isDisabled = !isSelected && interests.length >= MAX_INTERESTS;
            return (
              <button
                key={interest}
                type="button"
                className={
                  isSelected
                    ? `${styles.chip} ${styles.chipSelected}`
                    : isDisabled
                      ? `${styles.chip} ${styles.chipDisabled}`
                      : styles.chip
                }
                disabled={isDisabled}
                onClick={() => onToggleInterest(interest)}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </div>
    </OnboardingLayout>
  );
}
