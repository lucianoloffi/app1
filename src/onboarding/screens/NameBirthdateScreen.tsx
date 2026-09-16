import { useEffect, useRef } from "react";
import { OnboardingLayout } from "../OnboardingLayout";
import { ageFromBirthdate, problemaNaDataDeNascimento } from "../../utils/age";
import { formatBirthdate, onlyDigits } from "../phoneFormat";
import fieldStyles from "../fields.module.css";

interface NameBirthdateScreenProps {
  name: string;
  birthdate: string;
  bio: string;
  onChangeName: (value: string) => void;
  onChangeBirthdate: (digits: string) => void;
  onChangeBio: (value: string) => void;
  onBack?: () => void;
  onNext: () => void;
}

export function NameBirthdateScreen({
  name,
  birthdate,
  bio,
  onChangeName,
  onChangeBirthdate,
  onChangeBio,
  onBack,
  onNext,
}: NameBirthdateScreenProps) {
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const idade = ageFromBirthdate(birthdate);
  const dataCompleta = onlyDigits(birthdate).length >= 8;
  const problemaData = problemaNaDataDeNascimento(birthdate);
  const menorDeIdade = dataCompleta && !problemaData && idade !== null && idade < 18;

  const isValid =
    name.trim().length > 1 && dataCompleta && !problemaData && !menorDeIdade && bio.trim().length > 4;

  return (
    <OnboardingLayout
      progress={3}
      onBack={onBack}
      title="Como podemos te chamar?"
      support="Esse é o nome que aparece no seu perfil."
      contentGap={16}
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
          placeholder="Como quer ser chamado"
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
        {problemaData ? (
          <p className={fieldStyles.error}>{problemaData}</p>
        ) : menorDeIdade ? (
          <p className={fieldStyles.error}>
            O Lovi é só para maiores de 18 anos. Volte quando fizer aniversário — a gente espera
            por você.
          </p>
        ) : (
          <p className={fieldStyles.note}>Mostramos só a idade, nunca a data completa.</p>
        )}
      </div>
      <div className={fieldStyles.fieldGroup}>
        <span className={fieldStyles.label}>Sobre você</span>
        <textarea
          className={fieldStyles.textarea}
          placeholder="Uma frase sobre o que você procura"
          value={bio}
          onChange={(e) => onChangeBio(e.target.value)}
        />
      </div>
    </OnboardingLayout>
  );
}
