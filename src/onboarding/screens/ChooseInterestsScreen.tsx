import { PillChip } from "../../components/PillChip";
import { INTEREST_OPTIONS, MAX_INTERESTS } from "../constants";
import { OnboardingLayout } from "../OnboardingLayout";
import styles from "./ChooseInterestsScreen.module.css";

interface ChooseInterestsScreenProps {
  interests: string[];
  onToggleInterest: (value: string) => void;
  onOverMax: () => void;
  onBack: () => void;
  onNext: () => void;
}

/**
 * As opções ficam à vista, e não numa folha atrás de "Adicionar": dividindo a
 * tela com a intenção, só aparecia o botão, e ele parecia mais um passo a
 * cumprir do que um convite. Aqui é só tocar.
 */
export function ChooseInterestsScreen({
  interests,
  onToggleInterest,
  onOverMax,
  onBack,
  onNext,
}: ChooseInterestsScreenProps) {
  return (
    <OnboardingLayout
      progress={7}
      onBack={onBack}
      title="Do que você gosta?"
      support={`Escolha até ${MAX_INTERESTS}. É opcional e dá para mudar depois.`}
      contentGap={12}
      ctaLabel="Continuar"
      onCta={onNext}
    >
      <p className={styles.counter} aria-live="polite">
        {interests.length} de {MAX_INTERESTS}
      </p>
      <div className={styles.chips}>
        {INTEREST_OPTIONS.map((interest) => {
          const isSelected = interests.includes(interest);
          return (
            <PillChip
              key={interest}
              active={isSelected}
              onClick={() => {
                if (!isSelected && interests.length >= MAX_INTERESTS) {
                  onOverMax();
                  return;
                }
                onToggleInterest(interest);
              }}
            >
              {interest}
            </PillChip>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}
