import { useState, type Ref } from "react";
import fieldStyles from "../onboarding/fields.module.css";
import styles from "./LimitedTextField.module.css";

interface LimitedTextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** A constante de src/onboarding/constants.ts — a mesma que o banco usa. */
  maxLength: number;
  multiline?: boolean;
  placeholder?: string;
  /** Texto antes do limite na nota permanente (ex.: "Opcional."). */
  note?: string;
  /** Erro vindo do servidor para este campo: tem precedência sobre a checagem local. */
  serverError?: string | null;
  /**
   * "sempre" para textos longos (bio), em que a pessoa escreve e quer saber
   * quanto falta. "perto" para campos curtos: o contador só aparece quando
   * faltam poucos caracteres, e antes disso seria ruído.
   */
  counter?: "sempre" | "perto";
  /** Classe do campo, para telas com visual próprio (Editar perfil). */
  inputClassName?: string;
  labelClassName?: string;
  groupClassName?: string;
  inputRef?: Ref<HTMLInputElement>;
}

/** A partir de quantos caracteres restantes o contador "perto" aparece. */
const PERTO_DO_LIMITE = 10;

/**
 * Campo de texto do perfil com limite de tamanho, no padrão de validação do
 * AccountScreen: nota permanente com o limite, que vira erro vermelho quando
 * a validação falha; erro do servidor antes da checagem local; checagem local
 * só depois do blur; campo vazio nunca reclama.
 *
 * O maxLength já impede passar do limite digitando ou colando. A checagem
 * local existe para o texto que JÁ chegou maior (gravado antes do limite
 * existir), que o maxLength não corta sozinho: sem ela, a pessoa só
 * descobriria ao salvar.
 */
export function LimitedTextField({
  id,
  label,
  value,
  onChange,
  maxLength,
  multiline,
  placeholder,
  note,
  serverError,
  counter = "perto",
  inputClassName,
  labelClassName,
  groupClassName,
  inputRef,
}: LimitedTextFieldProps) {
  const [tocado, setTocado] = useState(false);
  // value.length (UTF-16), a mesma conta do maxLength do navegador. Um emoji
  // vale 2 aqui e 1 no char_length do banco, então o app corta antes do banco,
  // nunca depois — e o contador bate com o ponto em que o campo para de aceitar.
  const tamanho = value.length;

  const erro =
    serverError ??
    (tocado && tamanho > maxLength
      ? `Passou do limite de ${maxLength} caracteres. Apague ${tamanho - maxLength} para salvar.`
      : null);

  const mostraContador = counter === "sempre" || maxLength - tamanho <= PERTO_DO_LIMITE;
  const idNota = `${id}-nota`;
  const idErro = `${id}-erro`;
  const textoDaNota = [note, `Até ${maxLength} caracteres.`].filter(Boolean).join(" ");

  const classeDoCampo = [
    inputClassName ?? (multiline ? fieldStyles.textarea : fieldStyles.input),
    erro ? styles.invalid : "",
  ]
    .filter(Boolean)
    .join(" ");

  const comuns = {
    id,
    className: classeDoCampo,
    placeholder,
    value,
    // Sem maxLength enquanto o texto já está acima do limite: com ele, o
    // navegador não deixaria nem apagar um caractere de cada vez sem
    // reclamar, e a pessoa ficaria presa.
    maxLength: tamanho > maxLength ? undefined : maxLength,
    "aria-invalid": Boolean(erro),
    "aria-describedby": erro ? idErro : idNota,
    onBlur: () => setTocado(true),
  };

  return (
    <div className={groupClassName ?? fieldStyles.fieldGroup}>
      <label htmlFor={id} className={labelClassName ?? fieldStyles.label}>
        {label}
      </label>
      {multiline ? (
        <textarea {...comuns} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          {...comuns}
          ref={inputRef}
          type="text"
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      <div className={styles.footer}>
        {erro ? (
          <p id={idErro} className={fieldStyles.error} role="alert">
            {erro}
          </p>
        ) : (
          <p id={idNota} className={fieldStyles.note}>
            {textoDaNota}
          </p>
        )}
        {mostraContador && (
          <span className={erro ? styles.counterOver : styles.counter} aria-hidden="true">
            {tamanho}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
