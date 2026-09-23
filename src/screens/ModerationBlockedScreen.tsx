import { useState } from "react";
import { momentoPorExtenso, type SituacaoDeModeracao } from "../lib/moderacao";
import styles from "./ModerationBlockedScreen.module.css";

const EMAIL_DE_CONTATO = "contato@lovidates.com";

interface ModerationBlockedScreenProps {
  /** Nunca null aqui: a tela só aparece quando há sanção. */
  situacao: NonNullable<SituacaoDeModeracao>;
  onOpenGuidelines: () => void;
  /** Recarrega o perfil — é assim que a suspensão vencida some da frente. */
  onRecheck: () => Promise<void>;
  onLogout: () => void;
}

/**
 * Aviso para quem foi suspenso ou banido. É só aviso: quem decide é o banco,
 * que já recusa curtir, dar match e mandar mensagem, e tira o perfil da fila
 * dos outros (migration 0015). Esta tela existe para a pessoa entender por que
 * o app parou de responder, em vez de achar que quebrou.
 *
 * A App Store exige um caminho de contestação em app de namoro; por isso o
 * e-mail fica visível nos dois casos, e não só no banimento.
 */
export function ModerationBlockedScreen({
  situacao,
  onOpenGuidelines,
  onRecheck,
  onLogout,
}: ModerationBlockedScreenProps) {
  const [verificando, setVerificando] = useState(false);
  const banido = situacao.tipo === "banido";
  const ate = situacao.tipo === "suspenso" && situacao.ate ? momentoPorExtenso(situacao.ate) : null;

  async function verificarDeNovo() {
    setVerificando(true);
    await onRecheck();
    setVerificando(false);
  }

  return (
    <div className={styles.screen}>
      <div className={styles.body}>
        <span className={styles.icon} aria-hidden="true">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#C0392B" strokeWidth={1.8} />
            <path d="M12 7.5v5.2" stroke="#C0392B" strokeWidth={2} strokeLinecap="round" />
            <circle cx="12" cy="16.4" r="1.15" fill="#C0392B" />
          </svg>
        </span>

        <h1 className={styles.title}>
          {banido ? "Sua conta foi encerrada" : "Sua conta está suspensa"}
        </h1>

        <p className={styles.support}>
          {banido
            ? "Encerramos sua conta por descumprir as Diretrizes de Comunidade do Lovi."
            : ate
              ? `Você volta a usar o Lovi em ${ate}.`
              : "Seu acesso está pausado enquanto analisamos uma denúncia."}
        </p>

        <div className={styles.card}>
          <p className={styles.cardTitle}>O que isso significa</p>
          <ul className={styles.list}>
            <li>Seu perfil não aparece mais para outras pessoas.</li>
            <li>Você não consegue curtir perfis nem enviar mensagens.</li>
            <li>
              {banido
                ? "Suas conversas continuam guardadas, mas ninguém pode responder a você."
                : "Suas conversas continuam guardadas e voltam quando a suspensão terminar."}
            </li>
          </ul>
        </div>

        <p className={styles.note}>
          Acha que houve engano? Escreva para{" "}
          <a className={styles.link} href={`mailto:${EMAIL_DE_CONTATO}`}>
            {EMAIL_DE_CONTATO}
          </a>{" "}
          contando o que aconteceu.
        </p>
      </div>

      <div className={styles.footer}>
        {!banido && (
          <button
            type="button"
            className={styles.ctaButton}
            disabled={verificando}
            onClick={() => void verificarDeNovo()}
          >
            {verificando ? "Verificando…" : "Já passou o prazo? Verificar"}
          </button>
        )}
        <button type="button" className={styles.secondaryButton} onClick={onOpenGuidelines}>
          Ler as Diretrizes de Comunidade
        </button>
        <button type="button" className={styles.linkButton} onClick={onLogout}>
          Sair da conta
        </button>
      </div>
    </div>
  );
}
