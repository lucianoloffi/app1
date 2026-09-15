import { useEffect, useRef, useState } from "react";
import styles from "./VerifyProfileScreen.module.css";

type VerifyState = "idle" | "loading" | "done";

interface VerifyProfileScreenProps {
  photo?: string;
  verified: boolean;
  onClose: () => void;
  onVerified: () => void;
  onShowToast: (message: string) => void;
}

export function VerifyProfileScreen({
  photo,
  verified,
  onClose,
  onVerified,
  onShowToast,
}: VerifyProfileScreenProps) {
  const [state, setState] = useState<VerifyState>(verified ? "done" : "idle");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleCta() {
    if (state === "loading") return;
    if (state === "done") {
      onClose();
      return;
    }
    setState("loading");
    timeoutRef.current = window.setTimeout(() => {
      setState("done");
      onVerified();
      onShowToast("Perfil verificado");
    }, 1800);
  }

  const title =
    state === "done"
      ? "Perfil verificado"
      : state === "loading"
        ? "Analisando sua selfie"
        : "Tire uma selfie agora";

  const body =
    state === "done"
      ? "Seu perfil recebeu o selo de verificado. Perfis verificados aparecem com prioridade na fila."
      : state === "loading"
        ? "Comparamos a selfie com as fotos do seu perfil. Leva poucos segundos."
        : "Fique em um lugar iluminado, sem óculos escuros e sem boné. Comparamos a selfie com as fotos do seu perfil.";

  const ctaLabel = state === "done" ? "Tudo certo" : state === "loading" ? "Analisando…" : "Tirar selfie";

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={onClose} aria-label="Fechar">
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
        <span className={styles.title}>Verificar meu perfil</span>
      </div>

      <div className={styles.body}>
        <div
          className={`${styles.ring} ${state === "done" ? styles.ringDone : ""} ${
            state === "loading" ? styles.ringLoading : ""
          }`}
        >
          <img
            className={state === "loading" ? `${styles.face} ${styles.faceLoading}` : styles.face}
            src={photo ?? "https://i.pravatar.cc/300?img=15"}
            alt="Sua foto"
          />
        </div>
        <p className={styles.title2}>{title}</p>
        <p className={styles.support}>{body}</p>
        <div className={styles.privacyNote}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 2.6l7.6 3v6.1c0 4.6-3.1 8.3-7.6 9.7-4.5-1.4-7.6-5.1-7.6-9.7V5.6z"
              fill="#F1EAFE"
              stroke="#8B5CF6"
              strokeWidth={1.8}
            />
          </svg>
          <span>A selfie não vai para o seu perfil e é apagada depois da análise.</span>
        </div>
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={state === "loading" ? `${styles.ctaButton} ${styles.ctaButtonLoading}` : styles.ctaButton}
          onClick={handleCta}
        >
          {ctaLabel}
        </button>
        {state !== "done" && (
          <button type="button" className={styles.laterLink} onClick={onClose}>
            Agora não
          </button>
        )}
      </div>
    </div>
  );
}
