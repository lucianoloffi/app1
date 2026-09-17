import { useEffect, useRef, useState } from "react";
import { OnboardingLayout } from "../OnboardingLayout";
import { formatPhone, onlyDigits } from "../phoneFormat";
import { SENHA_MINIMA } from "../../lib/api/auth";
import type { ErroNoFormulario } from "../../lib/errors";
import fieldStyles from "../fields.module.css";
import styles from "./AccountScreen.module.css";

export type DocumentoLegal = "termos" | "privacidade" | "diretrizes";

interface AccountScreenProps {
  email: string;
  password: string;
  phone: string;
  acceptedTerms: boolean;
  acceptedSensitiveData: boolean;
  loading: boolean;
  error: ErroNoFormulario | null;
  onChangeEmail: (value: string) => void;
  onChangePassword: (value: string) => void;
  onChangePhone: (digits: string) => void;
  onToggleTerms: () => void;
  onToggleSensitiveData: () => void;
  onOpenLegal: (documento: DocumentoLegal) => void;
  onBack: () => void;
  onNext: () => void;
}

function Check({ on }: { on: boolean }) {
  return (
    <span className={on ? styles.checkboxOn : styles.checkbox} aria-hidden="true">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 12.5l5 5L20 6.5"
          stroke="currentColor"
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function AccountScreen({
  email,
  password,
  phone,
  acceptedTerms,
  acceptedSensitiveData,
  loading,
  error,
  onChangeEmail,
  onChangePassword,
  onChangePhone,
  onToggleTerms,
  onToggleSensitiveData,
  onOpenLegal,
  onBack,
  onNext,
}: AccountScreenProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // A senha só reclama depois que a pessoa saiu do campo: enquanto digita, o
  // aviso embaixo do campo já diz o tamanho mínimo.
  const [senhaTocada, setSenhaTocada] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // O erro fica embaixo do campo que o causou; sem campo conhecido, vai para o fim da tela.
  const erroDoCampo = (campo: NonNullable<ErroNoFormulario["campo"]>) =>
    error?.campo === campo ? error.texto : null;
  const erroGeral = error && !error.campo ? error.texto : null;

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const senhaValida = password.length >= SENHA_MINIMA;
  // Erro do servidor primeiro; se não houver, a checagem local de tamanho.
  const erroDaSenha =
    erroDoCampo("senha") ??
    (senhaTocada && password.length > 0 && !senhaValida
      ? `A senha precisa de pelo menos ${SENHA_MINIMA} caracteres.`
      : null);
  const telefoneValido = onlyDigits(phone).length >= 10;
  const isValid =
    emailValido && senhaValida && telefoneValido && acceptedTerms && acceptedSensitiveData;

  return (
    <OnboardingLayout
      progress={1}
      onBack={onBack}
      title="Criar sua conta"
      support="Você entra com e-mail e senha. O telefone fica só no seu cadastro."
      contentGap={16}
      ctaLabel={loading ? "Criando conta…" : "Criar conta"}
      ctaDisabled={!isValid || loading}
      onCta={onNext}
    >
      <div className={fieldStyles.fieldGroup}>
        <span className={fieldStyles.label}>E-mail</span>
        <input
          ref={inputRef}
          className={erroDoCampo("email") ? fieldStyles.inputInvalid : fieldStyles.input}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="voce@email.com"
          value={email}
          aria-invalid={Boolean(erroDoCampo("email"))}
          aria-describedby={erroDoCampo("email") ? "erro-email" : undefined}
          onChange={(e) => onChangeEmail(e.target.value)}
        />
        {erroDoCampo("email") && (
          <p id="erro-email" className={fieldStyles.error} role="alert">
            {erroDoCampo("email")}
          </p>
        )}
      </div>

      <div className={fieldStyles.fieldGroup}>
        <span className={fieldStyles.label}>Crie uma senha</span>
        <input
          className={erroDaSenha ? fieldStyles.inputInvalid : fieldStyles.input}
          type="password"
          autoComplete="new-password"
          placeholder={`Pelo menos ${SENHA_MINIMA} caracteres`}
          value={password}
          aria-invalid={Boolean(erroDaSenha)}
          aria-describedby={erroDaSenha ? "erro-senha" : "dica-senha"}
          onChange={(e) => onChangePassword(e.target.value)}
          onBlur={() => setSenhaTocada(true)}
        />
        {erroDaSenha ? (
          <p id="erro-senha" className={fieldStyles.error} role="alert">
            {erroDaSenha}
          </p>
        ) : (
          <p id="dica-senha" className={fieldStyles.note}>
            Pelo menos {SENHA_MINIMA} caracteres.
          </p>
        )}
      </div>

      <div className={fieldStyles.fieldGroup}>
        <span className={fieldStyles.label}>Telefone</span>
        <div className={styles.phoneRow}>
          <span className={styles.ddiBox}>+55</span>
          <input
            className={`${erroDoCampo("telefone") ? fieldStyles.inputInvalid : fieldStyles.input} ${styles.phoneInput}`}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="(47) 90000-0000"
            value={formatPhone(phone)}
            aria-invalid={Boolean(erroDoCampo("telefone"))}
            aria-describedby={erroDoCampo("telefone") ? "erro-telefone" : undefined}
            onChange={(e) => onChangePhone(onlyDigits(e.target.value))}
          />
        </div>
        {erroDoCampo("telefone") ? (
          <p id="erro-telefone" className={fieldStyles.error} role="alert">
            {erroDoCampo("telefone")}
          </p>
        ) : (
          <p className={fieldStyles.note}>Seu número nunca aparece no perfil.</p>
        )}
      </div>

      <div className={styles.consentGroup}>
        <button type="button" className={styles.consentRow} onClick={onToggleTerms}>
          <Check on={acceptedTerms} />
          <span className={styles.consentMain}>
            <p className={styles.consentTitle}>Li e aceito os Termos de Uso e as Diretrizes de Comunidade.</p>
            <span className={styles.legalLinks}>
              <span
                role="link"
                tabIndex={0}
                className={styles.legalLink}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLegal("termos");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onOpenLegal("termos");
                  }
                }}
              >
                Termos de Uso
              </span>
              <span
                role="link"
                tabIndex={0}
                className={styles.legalLink}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLegal("diretrizes");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onOpenLegal("diretrizes");
                  }
                }}
              >
                Diretrizes de Comunidade
              </span>
            </span>
          </span>
        </button>

        <button
          type="button"
          className={styles.consentRowHighlight}
          onClick={onToggleSensitiveData}
        >
          <Check on={acceptedSensitiveData} />
          <span className={styles.consentMain}>
            <p className={styles.consentTitle}>Autorizo o tratamento dos meus dados sensíveis.</p>
            <p className={styles.consentText}>
              Interesse (indica orientação sexual), cidade e fotos. Sem eles o Lovi não funciona.
              Revogar, quando quiser, encerra a conta.
            </p>
            <span className={styles.legalLinks}>
              <span
                role="link"
                tabIndex={0}
                className={styles.legalLink}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLegal("privacidade");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onOpenLegal("privacidade");
                  }
                }}
              >
                Política de Privacidade
              </span>
            </span>
          </span>
        </button>
      </div>

      {erroGeral && (
        <p className={styles.errorText} role="alert">
          {erroGeral}
        </p>
      )}
    </OnboardingLayout>
  );
}
