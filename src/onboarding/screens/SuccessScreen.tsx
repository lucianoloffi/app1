import { useEffect } from "react";
import styles from "./SuccessScreen.module.css";

interface SuccessScreenProps {
  name: string;
  onDone: () => void;
}

export function SuccessScreen({ name, onDone }: SuccessScreenProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 3000);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <div className={styles.screen}>
      <div className={styles.check}>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 12.5l5 5L20 6.5"
            stroke="#fff"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className={styles.title}>Conta criada!</p>
      <p className={styles.support}>
        {name ? `Bem-vindo(a), ${name.split(" ")[0]}. ` : ""}Já estamos preparando perfis
        compatíveis com você.
      </p>
      <div className={styles.dots}>
        <span className={styles.dot} style={{ animationDelay: "0ms" }} />
        <span className={styles.dot} style={{ animationDelay: "150ms" }} />
        <span className={styles.dot} style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
