import { useState } from "react";
import styles from "./PermissionsScreen.module.css";

type PermissionState = "granted" | "denied" | "ask";
type PermissionKey = "local" | "notif" | "cam";

const PERMISSIONS: { key: PermissionKey; label: string; sub: string }[] = [
  {
    key: "local",
    label: "Localização",
    sub: "Usada para mostrar a distância e encontrar gente perto de você.",
  },
  { key: "notif", label: "Notificações", sub: "Avisos de match novo e mensagens recebidas." },
  {
    key: "cam",
    label: "Câmera",
    sub: "Necessária para a verificação por selfie e para tirar fotos novas.",
  },
];

const ASK_COPY: Record<PermissionKey, { title: string; body: string }> = {
  local: {
    title: "Permitir acesso à localização?",
    body: "Mostramos apenas a distância aproximada, nunca seu endereço.",
  },
  notif: {
    title: "Permitir notificações?",
    body: "Você recebe aviso de match novo e mensagens. Pode desligar depois.",
  },
  cam: {
    title: "Permitir acesso à câmera?",
    body: "Usada só quando você tirar uma selfie de verificação ou adicionar fotos.",
  },
};

interface PermissionsScreenProps {
  onBack: () => void;
}

export function PermissionsScreen({ onBack }: PermissionsScreenProps) {
  const [state, setState] = useState<Record<PermissionKey, PermissionState>>({
    local: "granted",
    notif: "ask",
    cam: "ask",
  });
  const [asking, setAsking] = useState<PermissionKey | null>(null);

  const grantedCount = Object.values(state).filter((value) => value === "granted").length;

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 4l-8 8 8 8"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className={styles.headerTitle}>Permissões do app</h1>
        <span className={styles.headerSummary}>{grantedCount} de 3</span>
      </div>

      <div className={styles.body}>
        {PERMISSIONS.map((perm) => {
          const st = state[perm.key];
          const tagLabel = st === "granted" ? "Permitido" : st === "denied" ? "Bloqueado" : "Pendente";
          const tagClass =
            st === "granted"
              ? styles.tagGranted
              : st === "denied"
                ? styles.tagDenied
                : styles.tagPending;
          const btnLabel = st === "granted" ? "Revogar" : st === "denied" ? "Tentar de novo" : "Permitir";

          return (
            <div key={perm.key} className={styles.card}>
              <div className={styles.cardMain}>
                <div className={styles.cardTop}>
                  <span className={styles.cardTitle}>{perm.label}</span>
                  <span className={`${styles.tag} ${tagClass}`}>{tagLabel}</span>
                </div>
                <p className={styles.cardSub}>{perm.sub}</p>
              </div>
              <button
                type="button"
                className={
                  st === "granted"
                    ? `${styles.actionButton} ${styles.actionButtonGranted}`
                    : `${styles.actionButton} ${styles.actionButtonAsk}`
                }
                onClick={() =>
                  st === "granted"
                    ? setState((prev) => ({ ...prev, [perm.key]: "denied" }))
                    : setAsking(perm.key)
                }
              >
                {btnLabel}
              </button>
            </div>
          );
        })}
      </div>

      {asking && (
        <div className={styles.overlay}>
          <div className={styles.dialog}>
            <h2 className={styles.dialogTitle}>{ASK_COPY[asking].title}</h2>
            <p className={styles.dialogBody}>{ASK_COPY[asking].body}</p>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.allowButton}
                onClick={() => {
                  setState((prev) => ({ ...prev, [asking]: "granted" }));
                  setAsking(null);
                }}
              >
                Permitir
              </button>
              <button
                type="button"
                className={styles.denyButton}
                onClick={() => {
                  setState((prev) => ({ ...prev, [asking]: "denied" }));
                  setAsking(null);
                }}
              >
                Não permitir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
