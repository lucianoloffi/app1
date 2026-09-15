import { useEffect, useRef, useState } from "react";
import { Logo } from "../components/Logo";
import { entrar, recuperarSenha } from "../lib/api/auth";
import { mensagemDeErro } from "../lib/errors";
import fieldStyles from "./fields.module.css";
import styles from "./LoginFlow.module.css";

type LoginStep = "start" | "forgot";

interface LoginFlowProps {
  onGoSignup: () => void;
  onLoginSuccess: () => void;
  onShowToast: (message: string) => void;
}

export function LoginFlow({ onGoSignup, onLoginSuccess, onShowToast }: LoginFlowProps) {
  const [step, setStep] = useState<LoginStep>("start");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const podeEntrar = emailValido && senha.length >= 6 && !enviando;

  async function handleEntrar() {
    if (!podeEntrar) return;
    setEnviando(true);
    setErro(null);
    try {
      await entrar(email, senha);
      onLoginSuccess();
      onShowToast("Bem-vindo de volta");
    } catch (problema) {
      setErro(mensagemDeErro(problema));
    } finally {
      setEnviando(false);
    }
  }

  async function handleRecuperar() {
    if (!emailValido || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      await recuperarSenha(email);
      onShowToast("Enviamos um link de recuperação para seu e-mail");
      setStep("start");
    } catch (problema) {
      setErro(mensagemDeErro(problema));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={styles.screen}>
      {step !== "start" && (
        <div className={styles.header}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => {
              setStep("start");
              setErro(null);
            }}
            aria-label="Voltar"
          >
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
            <p className={styles.support}>Entre com o e-mail e a senha do seu cadastro.</p>
          </div>
          <div className={styles.startFooter}>
            <div className={fieldStyles.fieldGroup}>
              <input
                ref={inputRef}
                className={fieldStyles.input}
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErro(null);
                }}
              />
            </div>
            <div className={fieldStyles.fieldGroup}>
              <input
                className={fieldStyles.input}
                type="password"
                autoComplete="current-password"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  setErro(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleEntrar();
                }}
              />
            </div>
            {erro && <p className={styles.errorText}>{erro}</p>}
            <button
              type="button"
              className={styles.ctaButton}
              disabled={!podeEntrar}
              onClick={() => void handleEntrar()}
            >
              {enviando ? "Entrando…" : "Entrar"}
            </button>
            <button type="button" className={styles.forgotLink} onClick={() => setStep("forgot")}>
              Esqueci minha senha
            </button>
            <button type="button" className={styles.signupLink} onClick={onGoSignup}>
              Criar uma conta nova
            </button>
          </div>
        </>
      )}

      {step === "forgot" && (
        <>
          <div className={styles.body}>
            <div>
              <h1 className={styles.title}>Recuperar acesso</h1>
              <p className={styles.support}>
                Enviamos um link para você criar uma senha nova. Ele vale por uma hora.
              </p>
            </div>
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErro(null);
                }}
              />
            </div>
            {erro && <p className={styles.errorText}>{erro}</p>}
          </div>
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.ctaButton}
              disabled={!emailValido || enviando}
              onClick={() => void handleRecuperar()}
            >
              {enviando ? "Enviando…" : "Enviar link"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
