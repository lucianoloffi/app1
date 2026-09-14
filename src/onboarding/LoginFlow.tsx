import { useEffect, useRef, useState } from "react";
import { Logo } from "../components/Logo";
import { formatPhone, onlyDigits } from "./phoneFormat";
import fieldStyles from "./fields.module.css";
import phoneStyles from "./screens/PhoneScreen.module.css";
import codeStyles from "./screens/CodeScreen.module.css";
import styles from "./LoginFlow.module.css";

type LoginStep = "start" | "phone" | "code";

interface LoginFlowProps {
  onGoSignup: () => void;
  onLoginSuccess: () => void;
  onShowToast: (message: string) => void;
}

function AppleIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M16.3 12.7c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.1-2.9.9-3.7.9-.8 0-2-.9-3.2-.8-1.7 0-3.2 1-4.1 2.5-1.7 3-.4 7.5 1.3 9.9.8 1.2 1.8 2.5 3.1 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.6-.9.9-1.4 1.3-2.4-2.4-.9-2.7-4.4-2.7-4.5zM14 4.9c.7-.8 1.1-2 1-3.2-1.1.1-2.3.7-3 1.5-.6.7-1.1 1.9-1 3 1.2.1 2.4-.6 3-1.3z"
        fill="#fff"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.4c-.2 1.3-1 2.3-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.9-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6C4.8 19.9 8.1 22 12 22z"
        fill="#34A853"
      />
      <path
        d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1A9.9 9.9 0 0 0 2 12c0 1.6.4 3.2 1.1 4.6L6.4 14z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.9 14.7 2 12 2 8.1 2 4.8 4.1 3.1 7.4L6.4 10c.8-2.4 3-4.1 5.6-4.1z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginFlow({ onGoSignup, onLoginSuccess, onShowToast }: LoginFlowProps) {
  const [step, setStep] = useState<LoginStep>("start");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  const phoneValid = onlyDigits(phone).length >= 10;

  function handleBack() {
    if (step === "code") {
      setStep("phone");
      setCodeError(false);
      return;
    }
    setStep("start");
  }

  function handleConfirm() {
    if (code.length < 4) return;
    if (code !== "1234") {
      setCodeError(true);
      return;
    }
    onLoginSuccess();
    onShowToast("Bem-vindo de volta");
  }

  return (
    <div className={styles.screen}>
      {step !== "start" && (
        <div className={styles.header}>
          <button type="button" className={styles.backButton} onClick={handleBack} aria-label="Voltar">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 4l-8 8 8 8"
                stroke="#16211A"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {step === "start" && (
        <>
          <div className={styles.startBody}>
            <Logo heartSize={40} textSize={40} />
            <h1 className={styles.title}>Bom te ver de volta</h1>
            <p className={styles.support}>Entre com a mesma conta que você usou no cadastro.</p>
          </div>
          <div className={styles.startFooter}>
            <button
              type="button"
              className={styles.appleButton}
              onClick={() => {
                onLoginSuccess();
                onShowToast("Entrou com Apple");
              }}
            >
              <AppleIcon />
              Entrar com Apple
            </button>
            <button
              type="button"
              className={styles.googleButton}
              onClick={() => {
                onLoginSuccess();
                onShowToast("Entrou com Google");
              }}
            >
              <GoogleIcon />
              Entrar com Google
            </button>
            <button type="button" className={styles.phoneButton} onClick={() => setStep("phone")}>
              Entrar com telefone
            </button>
            <button
              type="button"
              className={styles.forgotLink}
              onClick={() => onShowToast("Enviaríamos um link de recuperação por SMS")}
            >
              Não consigo acessar minha conta
            </button>
            <button type="button" className={styles.signupLink} onClick={onGoSignup}>
              Criar uma conta nova
            </button>
          </div>
        </>
      )}

      {step === "phone" && (
        <>
          <div className={styles.body}>
            <div>
              <h1 className={styles.title}>Qual é o seu número?</h1>
              <p className={styles.support}>
                Enviamos um código de 4 dígitos por SMS para confirmar que é você.
              </p>
            </div>
            <div className={phoneStyles.phoneRow}>
              <span className={phoneStyles.ddiBox}>+55</span>
              <input
                ref={inputRef}
                className={`${fieldStyles.input} ${phoneStyles.phoneInput}`}
                type="tel"
                inputMode="numeric"
                placeholder="(47) 90000-0000"
                value={formatPhone(phone)}
                onChange={(e) => setPhone(onlyDigits(e.target.value))}
              />
            </div>
          </div>
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.ctaButton}
              disabled={!phoneValid}
              onClick={() => setStep("code")}
            >
              Enviar código
            </button>
            <p className={styles.legal}>
              Ao continuar você concorda com os Termos de uso e a Política de privacidade do Lovi.
            </p>
          </div>
        </>
      )}

      {step === "code" && (
        <>
          <div className={styles.body}>
            <div>
              <h1 className={styles.title}>Digite o código</h1>
              <p className={styles.support}>
                Enviamos um SMS de 4 dígitos para {formatPhone(phone)}.
              </p>
            </div>
            <input
              ref={inputRef}
              className={codeStyles.codeInput}
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="0000"
              value={code}
              onChange={(e) => {
                setCode(onlyDigits(e.target.value).slice(0, 4));
                setCodeError(false);
              }}
            />
            {codeError && (
              <p className={styles.errorText}>Código incorreto. Confira o SMS e tente de novo.</p>
            )}
            <button
              type="button"
              className={codeStyles.testLink}
              onClick={() => {
                setCode("1234");
                setCodeError(false);
              }}
            >
              Preencher código de teste (1234)
            </button>
          </div>
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.ctaButton}
              disabled={code.length < 4}
              onClick={handleConfirm}
            >
              Entrar
            </button>
            <button
              type="button"
              className={styles.changeNumberLink}
              onClick={() => {
                setStep("phone");
                setCode("");
                setCodeError(false);
              }}
            >
              Usar outro número
            </button>
          </div>
        </>
      )}
    </div>
  );
}
