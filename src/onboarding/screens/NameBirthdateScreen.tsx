import { useEffect, useRef } from "react";
import { OnboardingLayout } from "../OnboardingLayout";
import { formatBirthdate, onlyDigits } from "../phoneFormat";
import fieldStyles from "../fields.module.css";

interface NameBirthdateScreenProps {
  name: string;
  birthdate: string;
  onChangeName: (value: string) => void;
  onChangeBirthdate: (digits: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function NameBirthdateScreen({
  name,
  birthdate,
  onChangeName,
  onChangeBirthdate,
  onBack,
  onNext,
}: NameBirthdateScreenProps) {
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const isValid = name.trim().length > 1 && onlyDigits(birthdate).length >= 8;

  return (
    <OnboardingLayout
      progress={3}
      onBack={onBack}
      title="Como você se chama?"
      ctaLabel="Continuar"
      ctaDisabled={!isValid}
      onCta={onNext}
    >
      <div className={fieldStyles.fieldGroup}>
        <span className={fieldStyles.label}>Nome</span>
        <input
          ref={nameRef}
          className={fieldStyles.input}
          type="text"
          placeholder="Seu nome"
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
        />
      </div>
      <div className={fieldStyles.fieldGroup}>
        <span className={fieldStyles.label}>Data de nascimento</span>
        <input
          className={fieldStyles.input}
          type="text"
          inputMode="numeric"
          placeholder="dd/mm/aaaa"
          maxLength={10}
          value={formatBirthdate(birthdate)}
          onChange={(e) => onChangeBirthdate(onlyDigits(e.target.value))}
        />
        <p className={fieldStyles.note}>Mostramos só a idade, nunca a data completa.</p>
      </div>
    </OnboardingLayout>
  );
}
