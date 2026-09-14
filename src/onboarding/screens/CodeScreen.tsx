import { useEffect, useRef } from "react";
import { OnboardingLayout } from "../OnboardingLayout";
import { onlyDigits } from "../phoneFormat";
import styles from "./CodeScreen.module.css";

interface CodeScreenProps {
  code: string;
  onChangeCode: (digits: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function CodeScreen({ code, onChangeCode, onBack, onNext }: CodeScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isValid = code.length === 4;

  return (
    <OnboardingLayout
      progress={2}
      onBack={onBack}
      title="Digite o código"
      support="Enviamos um SMS de 4 dígitos para o número informado."
      ctaLabel="Confirmar"
      ctaDisabled={!isValid}
      onCta={onNext}
    >
      <input
        ref={inputRef}
        className={styles.codeInput}
        type="text"
        inputMode="numeric"
        maxLength={4}
        placeholder="0000"
        value={code}
        onChange={(e) => onChangeCode(onlyDigits(e.target.value).slice(0, 4))}
      />
      <button type="button" className={styles.testLink} onClick={() => onChangeCode("1234")}>
        Preencher código de teste (1234)
      </button>
    </OnboardingLayout>
  );
}
