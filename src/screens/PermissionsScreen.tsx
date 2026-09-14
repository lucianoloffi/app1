import { useState } from "react";
import { ScreenHeader } from "../components/ScreenHeader";
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

function PermissionIcon({ permission }: { permission: PermissionKey }) {
  if (permission === "local") {
    return (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"
          stroke="#8B5CF6"
          strokeWidth={2}
        />
        <circle cx="12" cy="10" r="2.6" fill="#8B5CF6" />
      </svg>
    );
  }
  if (permission === "notif") {
    return (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 10a6 6 0 0 1 12 0v4l1.6 2.6H4.4L6 14z"
          stroke="#8B5CF6"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <path d="M10 19.5a2 2 0 0 0 4 0" stroke="#8B5CF6" strokeWidth={2} strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2.5" stroke="#8B5CF6" strokeWidth={2} />
      <circle cx="12" cy="13.5" r="3.5" stroke="#8B5CF6" strokeWidth={2} />
      <path d="M8.5 7l1.2-2h4.6l1.2 2" stroke="#8B5CF6" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

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
      <ScreenHeader
        title="Permissões do app"
        onBack={onBack}
        trailing={<span className={styles.headerSummary}>{grantedCount} de 3</span>}
      />

      <div className={styles.body}>
        <p className={styles.intro}>
          O Lovi funciona melhor com as três liberadas. Você pode mudar quando quiser.
        </p>
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
              <div className={styles.cardTop}>
                <span className={styles.cardTitle}>{perm.label}</span>
                <span className={`${styles.tag} ${tagClass}`}>{tagLabel}</span>
              </div>
              <p className={styles.cardSub}>{perm.sub}</p>
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
            <span className={styles.dialogIcon}>
              <PermissionIcon permission={asking} />
            </span>
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
