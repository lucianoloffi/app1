import { useState } from "react";
import styles from "./DeleteAccountSheet.module.css";

interface DeleteAccountSheetProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteAccountSheet({ onCancel, onConfirm }: DeleteAccountSheetProps) {
  const [word, setWord] = useState("");
  const isValid = word.trim() === "EXCLUIR";

  return (
    <div className={styles.overlay} role="dialog" aria-label="Excluir minha conta">
      <div className={styles.sheet}>
        <h2 className={styles.title}>Excluir minha conta</h2>
        <p className={styles.body}>
          Isso apaga seu perfil, suas fotos, seus matches e todas as conversas. A ação é
          definitiva e não dá para recuperar depois.
        </p>
        <div className={styles.fieldGroup}>
          <span className={styles.label}>Digite EXCLUIR para confirmar</span>
          <input
            className={styles.input}
            type="text"
            placeholder="EXCLUIR"
            value={word}
            onChange={(e) => setWord(e.target.value.toUpperCase())}
          />
        </div>
        <button
          type="button"
          className={isValid ? styles.confirmButton : `${styles.confirmButton} ${styles.confirmButtonDisabled}`}
          disabled={!isValid}
          onClick={onConfirm}
        >
          Excluir definitivamente
        </button>
        <button type="button" className={styles.cancelLink} onClick={onCancel}>
          Manter minha conta
        </button>
      </div>
    </div>
  );
}
