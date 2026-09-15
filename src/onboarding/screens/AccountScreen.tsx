import { useEffect, useRef } from "react";
import { OnboardingLayout } from "../OnboardingLayout";
import { formatPhone, onlyDigits } from "../phoneFormat";
import { SENHA_MINIMA } from "../../lib/api/auth";
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
  error: string | null;
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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const senhaValida = password.length >= SENHA_MINIMA;
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
          className={fieldStyles.input}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => onChangeEmail(e.target.value)}
        />
      </div>

      <div className={fieldStyles.fieldGroup}>
        <span className={fieldStyles.label}>Senha</span>
        <input
          className={fieldStyles.input}
          type="password"
          autoComplete="new-password"
          placeholder={`Pelo menos ${SENHA_MINIMA} caracteres`}
          value={password}
          onChange={(e) => onChangePassword(e.target.value)}
        />
      </div>

      <div className={fieldStyles.fieldGroup}>
        <span className={fieldStyles.label}>Telefone</span>
        <div className={styles.phoneRow}>
          <span className={styles.ddiBox}>+55</span>
          <input
            className={`${fieldStyles.input} ${styles.phoneInput}`}
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="(47) 90000-0000"
            value={formatPhone(phone)}
            onChange={(e) => onChangePhone(onlyDigits(e.target.value))}
          />
        </div>
        <p className={fieldStyles.note}>Seu número nunca aparece no perfil.</p>
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
              São eles: sua preferência de interesse (que indica orientação sexual), sua cidade e
              suas fotos. Sem eles o Lovi não funciona. Você pode revogar quando quiser, o que
              encerra a conta.
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

      {error && <p className={styles.errorText}>{error}</p>}
    </OnboardingLayout>
  );
}
