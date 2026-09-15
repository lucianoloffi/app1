import { useState } from "react";
import styles from "./DeleteAccountSheet.module.css";

interface DeleteAccountSheetProps {
  /** Textos trocáveis: a mesma folha confirma a revogação de consentimento. */
  title?: string;
  body?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteAccountSheet({
  title = "Excluir minha conta",
  body = "Isso apaga seu perfil, suas fotos, seus matches e todas as conversas. A ação é definitiva e não dá para recuperar depois.",
  confirmLabel = "Excluir definitivamente",
  onCancel,
  onConfirm,
}: DeleteAccountSheetProps) {
  const [word, setWord] = useState("");
  const isValid = word.trim() === "EXCLUIR";

  return (
    <div className={styles.overlay} role="dialog" aria-label={title}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Fechar"
        onClick={onCancel}
      />
      <div className={styles.sheet}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.body}>{body}</p>
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
          {confirmLabel}
        </button>
        <button type="button" className={styles.cancelLink} onClick={onCancel}>
          Manter minha conta
        </button>
      </div>
    </div>
  );
}
