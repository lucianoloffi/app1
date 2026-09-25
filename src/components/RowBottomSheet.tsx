import { useState } from "react";
import styles from "./RowBottomSheet.module.css";

interface Option {
  value: string;
  label: string;
}

interface RowBottomSheetProps {
  label: string;
  iconPath: string;
  value: string | null;
  options: Option[];
  onChange: (value: string | null) => void;
  emptyLabel?: string;
  /**
   * Sem a linha "Prefiro não dizer" no fim da lista. Para voltar a deixar em
   * branco, toca-se de novo na opção marcada, como nos chips do cadastro.
   */
  semOpcaoVazia?: boolean;
  /**
   * A pessoa escolheu "Prefiro não dizer". Sem isso, o campo vazio aparecia
   * como "Prefiro não dizer" mesmo em pergunta nunca aberta, como se ela
   * tivesse escolhido: agora a pergunta sem resposta mostra "Escolher".
   */
  recusado?: boolean;
}

export function RowBottomSheet({
  label,
  iconPath,
  value,
  options,
  onChange,
  emptyLabel = "Prefiro não dizer",
  semOpcaoVazia,
  recusado = false,
}: RowBottomSheetProps) {
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === value);
  const textoSemValor = semOpcaoVazia || recusado ? emptyLabel : "Escolher";

  return (
    <>
      <button type="button" className={styles.row} onClick={() => setOpen(true)}>
        <span className={styles.iconBox}>
          <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
            <path d={iconPath} fill="#5B34C9" />
          </svg>
        </span>
        <span className={styles.main}>
          <span className={styles.label}>{label}</span>
          <span
            className={current || recusado ? styles.value : `${styles.value} ${styles.valueEmpty}`}
          >
            {current?.label ?? textoSemValor}
          </span>
        </span>
        <svg
          className={styles.chevron}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className={styles.overlay} role="dialog" aria-label={label}>
          <div className={styles.sheet}>
            <div className={styles.sheetHeader}>
              <h2 className={styles.sheetTitle}>{label}</h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setOpen(false)}
                aria-label="Fechar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M5 5l14 14M19 5L5 19"
                    stroke="currentColor"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className={styles.optionList}>
              {(semOpcaoVazia ? options : [...options, { value: "", label: emptyLabel }]).map((option) => {
                const isActive =
                  option.value === "" ? value === null && recusado : value === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    className={isActive ? `${styles.option} ${styles.optionActive}` : styles.option}
                    onClick={() => {
                      onChange(
                        option.value === "" || (semOpcaoVazia && isActive) ? null : option.value,
                      );
                      setOpen(false);
                    }}
                  >
                    <span
                      className={isActive ? `${styles.radio} ${styles.radioActive}` : styles.radio}
                    >
                      {isActive && <span className={styles.dot} />}
                    </span>
                    <span
                      className={
                        isActive ? styles.optionLabelActive : styles.optionLabel
                      }
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
