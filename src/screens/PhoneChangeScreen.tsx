import { useState } from "react";
import { onlyDigits, formatPhone } from "../onboarding/phoneFormat";
import styles from "../screens/FiltersScreen.module.css";
import fieldStyles from "../onboarding/fields.module.css";

interface PhoneChangeScreenProps {
  currentPhone: string;
  onBack: () => void;
  onConfirm: (phone: string) => void;
  onShowToast: (message: string) => void;
}

export function PhoneChangeScreen({
  currentPhone,
  onBack,
  onConfirm,
  onShowToast,
}: PhoneChangeScreenProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const phoneValid = onlyDigits(phone).length >= 10;

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 4l-8 8 8 8"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className={styles.headerTitle}>Trocar número</h1>
      </div>

      <div className={styles.body}>
        <div className={fieldStyles.fieldGroup}>
          <span className={fieldStyles.label}>Número atual</span>
          <div className={fieldStyles.input} style={{ background: "#F4F6F3" }}>
            {currentPhone}
          </div>
        </div>

        {step === 1 ? (
          <div className={fieldStyles.fieldGroup}>
            <span className={fieldStyles.label}>Novo número</span>
            <input
              className={fieldStyles.input}
              type="tel"
              inputMode="numeric"
              placeholder="+55 (47) 99988-7766"
              value={formatPhone(phone)}
              onChange={(e) => setPhone(onlyDigits(e.target.value))}
            />
          </div>
        ) : (
          <div className={fieldStyles.fieldGroup}>
            <span className={fieldStyles.label}>Código enviado por SMS</span>
            <input
              className={fieldStyles.input}
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="0000"
              value={code}
              onChange={(e) => {
                setCode(onlyDigits(e.target.value).slice(0, 4));
                setError(false);
              }}
            />
            {error && (
              <p className={fieldStyles.note} style={{ color: "#C8353C" }}>
                Código incorreto. Tente novamente.
              </p>
            )}
          </div>
        )}
      </div>

      <div className={styles.footer} style={{ justifyContent: "flex-end" }}>
        <button
          type="button"
          className={styles.applyButton}
          disabled={step === 1 ? !phoneValid : code.length < 4}
          onClick={() => {
            if (step === 1) {
              setStep(2);
              onShowToast("Código enviado por SMS");
              return;
            }
            if (code !== "1234") {
              setError(true);
              return;
            }
            onConfirm(`+55 ${formatPhone(phone)}`);
            onShowToast("Número atualizado");
          }}
        >
          {step === 1 ? "Enviar código" : "Confirmar"}
        </button>
      </div>
    </div>
  );
}
