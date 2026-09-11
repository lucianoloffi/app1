import { useEffect, useRef } from "react";
import { OnboardingLayout } from "../OnboardingLayout";
import { formatPhone, onlyDigits } from "../phoneFormat";
import fieldStyles from "../fields.module.css";
import styles from "./PhoneScreen.module.css";

interface PhoneScreenProps {
  phone: string;
  onChangePhone: (digits: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function PhoneScreen({ phone, onChangePhone, onBack, onNext }: PhoneScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isValid = onlyDigits(phone).length >= 10;

  return (
    <OnboardingLayout
      progress={1}
      onBack={onBack}
      title="Qual é o seu número?"
      support="Vamos te enviar um código por SMS para confirmar."
      ctaLabel="Enviar código"
      ctaDisabled={!isValid}
      onCta={onNext}
    >
      <div className={fieldStyles.fieldGroup}>
        <span className={fieldStyles.label}>Telefone</span>
        <div className={styles.phoneRow}>
          <span className={styles.ddiBox}>+55</span>
          <input
            ref={inputRef}
            className={`${fieldStyles.input} ${styles.phoneInput}`}
            type="tel"
            inputMode="numeric"
            placeholder="(47) 99988-7766"
            value={formatPhone(phone)}
            onChange={(e) => onChangePhone(onlyDigits(e.target.value))}
          />
        </div>
      </div>
    </OnboardingLayout>
  );
}
