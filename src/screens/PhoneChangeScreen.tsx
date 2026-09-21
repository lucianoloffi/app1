import { useState } from "react";
import { ScreenHeader } from "../components/ScreenHeader";
import { exibeTelefone, formatPhone, onlyDigits } from "../onboarding/phoneFormat";
import styles from "./PhoneChangeScreen.module.css";

interface PhoneChangeScreenProps {
  currentPhone: string;
  onBack: () => void;
  onConfirm: (phone: string) => void;
}

/**
 * Edição do telefone do perfil. Nesta fase o número não autentica nem é
 * verificado por SMS — por isso não há código de confirmação.
 */
export function PhoneChangeScreen({
  currentPhone,
  onBack,
  onConfirm,
}: PhoneChangeScreenProps) {
  const [dial, setDial] = useState("+55");
  const [phone, setPhone] = useState("");

  const phoneValid = onlyDigits(phone).length >= 10;

  return (
    <div className={styles.screen}>
      <ScreenHeader title="Trocar número" onBack={onBack} />

      <div className={styles.body}>
        <div className={styles.currentCard}>
          <span className={styles.currentLabel}>Número atual</span>
          <span className={styles.currentValue}>{exibeTelefone(currentPhone) || "Nenhum número salvo"}</span>
        </div>

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
              phoneValid
                ? styles.actionButton
                : `${styles.actionButton} ${styles.actionButtonDisabled}`
            }
            disabled={!phoneValid}
            onClick={() => {
              // O "Número atualizado" é mostrado por quem salva, depois de
              // salvar: avisar aqui dizia "atualizado" mesmo quando falhava.
              onConfirm(`${dial} ${formatPhone(phone)}`);
            }}
          >
            Salvar número
          </button>
        </div>
      </div>
    </div>
  );
}
