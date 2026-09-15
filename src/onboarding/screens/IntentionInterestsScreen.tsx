import { useState } from "react";
import { InterestBottomSheet } from "../../components/InterestBottomSheet";
import { SelectedInterests } from "../../components/SelectedInterests";
import type { Intention } from "../../types";
import { MIN_INTERESTS, selectedInterestsLabel } from "../constants";
import { OnboardingLayout } from "../OnboardingLayout";
import fieldStyles from "../fields.module.css";
import styles from "./IntentionInterestsScreen.module.css";

const INTENTION_OPTIONS: { value: Intention; title: string; subtitle: string }[] = [
  { value: "serio", title: "Relacionamento sério", subtitle: "Quero construir algo de longo prazo" },
  { value: "conhecer", title: "Conhecer pessoas", subtitle: "Sem pressa, ver no que dá" },
  { value: "amizade", title: "Amizade", subtitle: "Companhia para rolês e conversas" },
];

interface IntentionInterestsScreenProps {
  intention: Intention | null;
  interests: string[];
  onChangeIntention: (value: Intention) => void;
  onToggleInterest: (value: string) => void;
  onOverMax: () => void;
  onBack: () => void;
  onFinish: () => void;
}

export function IntentionInterestsScreen({
  intention,
  interests,
  onChangeIntention,
  onToggleInterest,
  onOverMax,
  onBack,
  onFinish,
}: IntentionInterestsScreenProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const isValid = Boolean(intention) && interests.length >= MIN_INTERESTS;

  return (
    <OnboardingLayout
      progress={6}
      onBack={onBack}
      title="Intenção e interesses"
      support="É o que combina você com as pessoas certas."
      contentGap={16}
      ctaLabel="Continuar"
      ctaDisabled={!isValid}
      onCta={onFinish}
    >
      <div className={fieldStyles.fieldGroup}>
        <span className={fieldStyles.label}>O que você busca</span>
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

      <div className={fieldStyles.fieldGroup} style={{ marginTop: 16 }}>
        <span className={fieldStyles.label}>{selectedInterestsLabel(interests.length)}</span>
        <SelectedInterests
          interests={interests}
          onRemove={onToggleInterest}
          onAdd={() => setSheetOpen(true)}
        />
      </div>

      {sheetOpen && (
        <InterestBottomSheet
          interests={interests}
          onToggle={onToggleInterest}
          onOverMax={onOverMax}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </OnboardingLayout>
  );
}
