import { useMemo, useState } from "react";
import { PillChipRow } from "../../components/PillChip";
import type { FilterGender, Gender } from "../../types";
import { CITY_OPTIONS } from "../constants";
import { OnboardingLayout } from "../OnboardingLayout";
import fieldStyles from "../fields.module.css";
import styles from "./GenderInterestCityScreen.module.css";

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "homem", label: "Homem" },
  { value: "mulher", label: "Mulher" },
  { value: "outros", label: "Outros" },
];

const INTERESTED_IN_OPTIONS: { value: FilterGender; label: string }[] = [
  { value: "homem", label: "Homens" },
  { value: "mulher", label: "Mulheres" },
  { value: "todos", label: "Todos" },
];

interface GenderInterestCityScreenProps {
  gender: Gender | null;
  interestedIn: FilterGender | null;
  city: string;
  onChangeGender: (value: Gender) => void;
  onChangeInterestedIn: (value: FilterGender) => void;
  onChangeCity: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function GenderInterestCityScreen({
  gender,
  interestedIn,
  city,
  onChangeGender,
  onChangeInterestedIn,
  onChangeCity,
  onBack,
  onNext,
}: GenderInterestCityScreenProps) {
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const suggestions = useMemo(() => {
    if (city.trim().length < 3) return [];
    const query = city.trim().toLowerCase();
    return CITY_OPTIONS.filter((option) => option.toLowerCase().includes(query)).slice(0, 4);
  }, [city]);

  const isValid = Boolean(gender) && Boolean(interestedIn) && city.trim().length > 2;

  return (
    <OnboardingLayout
      progress={4}
      onBack={onBack}
      title="Sobre você e quem procura"
      support="Isso define quais perfis entram na sua fila."
      ctaLabel="Continuar"
      ctaDisabled={!isValid}
      onCta={onNext}
    >
      <div className={fieldStyles.fieldGroup}>
        <span className={styles.sectionLabel}>Sou</span>
        <PillChipRow options={GENDER_OPTIONS} selected={gender} onSelect={onChangeGender} />
      </div>

      <div className={fieldStyles.fieldGroup}>
        <span className={styles.sectionLabel}>Me interesso em</span>
        <PillChipRow
          options={INTERESTED_IN_OPTIONS}
          selected={interestedIn}
          onSelect={onChangeInterestedIn}
        />
      </div>

      <div className={`${fieldStyles.fieldGroup} ${styles.cityWrap}`}>
        <span className={styles.sectionLabel}>Cidade</span>
        <input
          className={fieldStyles.input}
          type="text"
          placeholder="Sua cidade"
          value={city}
          onChange={(e) => {
            onChangeCity(e.target.value);
            setSuggestionsOpen(true);
          }}
          onFocus={() => setSuggestionsOpen(true)}
          onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)}
        />
        {suggestionsOpen && suggestions.length > 0 && (
          <div className={styles.suggestions}>
            {suggestions.map((option) => (
              <button
                key={option}
                type="button"
                className={styles.suggestionItem}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChangeCity(option);
                  setSuggestionsOpen(false);
                }}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
}
