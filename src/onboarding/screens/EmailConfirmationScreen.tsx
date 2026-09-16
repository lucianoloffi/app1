import styles from "./EmailConfirmationScreen.module.css";

interface EmailConfirmationScreenProps {
  email: string;
  onBack: () => void;
}

/**
 * Aparece quando o projeto exige confirmar o e-mail: a conta já existe, mas a
 * sessão só nasce depois do clique no link. O app retoma sozinho — App.tsx
 * escuta a mudança de sessão, inclusive quando o link abre em outra aba.
 */
export function EmailConfirmationScreen({ email, onBack }: EmailConfirmationScreenProps) {
  return (
    <div className={styles.screen}>
      <span className={styles.icon}>
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect
            x="2.6"
            y="5"
            width="18.8"
            height="14"
            rx="3.4"
            fill="#fff"
            stroke="#8B5CF6"
            strokeWidth={1.8}
          />
          <path d="M3.6 7.4l8.4 6 8.4-6" stroke="#8B5CF6" strokeWidth={1.8} strokeLinecap="round" />
        </svg>
      </span>

      <h1 className={styles.title}>Confirme seu e-mail</h1>
      <p className={styles.support}>
        Enviamos um link para <span className={styles.email}>{email}</span>. Abra o e-mail e toque
        no link para continuar o cadastro.
      </p>
      <p className={styles.note}>
        Pode deixar esta tela aberta: assim que você confirmar, o cadastro continua de onde parou.
        Se o link não chegar em alguns minutos, olhe o spam.
      </p>

      <button type="button" className={styles.backLink} onClick={onBack}>
        Usar outro e-mail
      </button>
    </div>
  );
}
