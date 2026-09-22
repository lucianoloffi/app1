import { useRef, useState } from "react";
import { LoviMark } from "../components/icons/LoviMark";
import { enviarSelfieDeVerificacao } from "../lib/api/photos";
import { mensagemDeErro } from "../lib/errors";
import type { VerificationStatus } from "../types";
import styles from "./VerifyProfileScreen.module.css";

interface VerifyProfileScreenProps {
  photo?: string;
  status: VerificationStatus;
  onClose: () => void;
  onSent: () => void;
  onShowToast: (message: string) => void;
}

export function VerifyProfileScreen({
  photo,
  status,
  onClose,
  onSent,
  onShowToast,
}: VerifyProfileScreenProps) {
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const emAnalise = status === "pendente";
  const aprovada = status === "aprovada";
  const recusada = status === "rejeitada";

  async function enviarSelfie(arquivo: File) {
    setEnviando(true);
    try {
      await enviarSelfieDeVerificacao(arquivo);
      onSent();
      onShowToast("Selfie enviada. Avisamos quando a análise terminar.");
    } catch (problema) {
      onShowToast(mensagemDeErro(problema));
    } finally {
      setEnviando(false);
    }
  }

  function handleCta() {
    if (enviando) return;
    if (aprovada || emAnalise) {
      onClose();
      return;
    }
    inputRef.current?.click();
  }

  const title = aprovada
    ? "Perfil verificado"
    : emAnalise
      ? "Selfie em análise"
      : enviando
        ? "Enviando sua selfie"
        : recusada
          ? "Precisamos de outra selfie"
          : "Tire uma selfie agora";

  // Aqui dizia que "perfis verificados aparecem com prioridade na fila", o que
  // nunca existiu: a fila_descobrir não olha a verificação. Decisão do Lu foi
  // tirar a promessa, não criar a prioridade. Só dizer o que o selo faz.
  const body = aprovada
    ? "Seu perfil recebeu o selo de verificado. Quem abrir o seu perfil vai ver o selo ao lado do seu nome."
    : emAnalise
      ? "Uma pessoa da nossa equipe compara a selfie com as fotos do seu perfil. A análise não é automática e pode levar até 24 horas — avisamos por aqui quando terminar."
      : enviando
        ? "Só um instante, estamos enviando sua foto com segurança."
        : recusada
          ? "A selfie anterior não deu para comparar com as fotos do seu perfil. Tente de novo em um lugar iluminado, sem óculos escuros e sem boné."
          : "Fique em um lugar iluminado, sem óculos escuros e sem boné. Comparamos a selfie com as fotos do seu perfil — a análise é feita por uma pessoa e leva até 24 horas.";

  const ctaLabel = aprovada
    ? "Tudo certo"
    : emAnalise
      ? "Voltar"
      : enviando
        ? "Enviando…"
        : recusada
          ? "Enviar outra selfie"
          : "Tirar selfie";

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
          className={`${styles.ring} ${aprovada ? styles.ringDone : ""} ${
            enviando ? styles.ringLoading : ""
          }`}
        >
          {/* Mesmo motivo da tela de Perfil: sem foto do perfil, a marca — e
              não o rosto de um estranho vindo de um serviço de fora. Na tela de
              verificação era pior: o rosto aparecia justamente ao lado do texto
              que fala em comparar a selfie com as suas fotos. */}
          {photo ? (
            <img
              className={enviando ? `${styles.face} ${styles.faceLoading}` : styles.face}
              src={photo}
              alt="Sua foto"
            />
          ) : (
            <span className={`${styles.face} ${styles.faceVazia}`}>
              <LoviMark size={56} variant="purple" />
            </span>
          )}
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

      <input
        ref={inputRef}
        className={styles.hiddenInput}
        type="file"
        accept="image/*"
        capture="user"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          e.target.value = "";
          if (arquivo) void enviarSelfie(arquivo);
        }}
      />

      <div className={styles.footer}>
        <button
          type="button"
          className={enviando ? `${styles.ctaButton} ${styles.ctaButtonLoading}` : styles.ctaButton}
          onClick={handleCta}
        >
          {ctaLabel}
        </button>
        <button type="button" className={styles.laterLink} onClick={onClose}>
          Agora não
        </button>
      </div>
    </div>
  );
}
