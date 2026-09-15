import { useState } from "react";
import { ScreenHeader } from "../components/ScreenHeader";
import { onlyDigits, formatPhone } from "../onboarding/phoneFormat";
import styles from "./PhoneChangeScreen.module.css";

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
  const [dial, setDial] = useState("+55");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const phoneValid = onlyDigits(phone).length >= 10;

  return (
    <div className={styles.screen}>
      <ScreenHeader title="Trocar número" onBack={onBack} />

      <div className={styles.body}>
        <div className={styles.currentCard}>
          <span className={styles.currentLabel}>Número atual</span>
          <span className={styles.currentValue}>{currentPhone}</span>
        </div>

        {step === 1 ? (
          <div className={styles.step}>
            <div className={styles.fieldGroup}>
              <span className={styles.label}>Novo número</span>
              <div className={styles.phoneRow}>
                <input
                  className={styles.ddiInput}
                  type="tel"
                  inputMode="tel"
                  maxLength={4}
                  value={dial}
                  onChange={(e) => setDial(e.target.value.replace(/[^\d+]/g, ""))}
                />
                <input
                  className={styles.input}
                  type="tel"
                  inputMode="numeric"
                  placeholder="(47) 90000-0000"
                  value={formatPhone(phone)}
                  onChange={(e) => setPhone(onlyDigits(e.target.value))}
                />
              </div>
            </div>
            <p className={styles.note}>
              Seus matches e conversas continuam os mesmos. O número não aparece no perfil.
            </p>
            <button
              type="button"
              className={
                phoneValid ? styles.actionButton : `${styles.actionButton} ${styles.actionButtonDisabled}`
              }
              disabled={!phoneValid}
              onClick={() => {
                setStep(2);
                onShowToast("Código enviado por SMS");
              }}
            >
              Enviar código
            </button>
          </div>
        ) : (
          <div className={styles.step}>
            <div className={styles.fieldGroup}>
              <span className={styles.label}>
                Código enviado para {dial} {formatPhone(phone)}
              </span>
              <input
                className={error ? `${styles.codeInput} ${styles.codeInputError}` : styles.codeInput}
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
              {error && <p className={styles.errorText}>Código incorreto. Use 1234 no protótipo.</p>}
            </div>
            <button
              type="button"
              className={
                code.length === 4
                  ? styles.actionButton
                  : `${styles.actionButton} ${styles.actionButtonDisabled}`
              }
              disabled={code.length !== 4}
              onClick={() => {
                if (code !== "1234") {
                  setError(true);
                  return;
                }
                onConfirm(`${dial} ${formatPhone(phone)}`);
                onShowToast("Número atualizado");
              }}
            >
              Confirmar troca
            </button>
            <button
              type="button"
              className={styles.backLink}
              onClick={() => {
                setStep(1);
                setCode("");
                setError(false);
              }}
            >
              Corrigir número
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
