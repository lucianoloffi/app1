import { AppIcon } from "../../components/AppIcon";
import styles from "./WelcomeScreen.module.css";

interface WelcomeScreenProps {
  onCreateAccount: () => void;
  onHaveAccount: () => void;
}

export function WelcomeScreen({ onCreateAccount, onHaveAccount }: WelcomeScreenProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.center}>
        <AppIcon size={144} />
        <h1 className={styles.title}>Para quem procura algo sério, perto de você</h1>
        <p className={styles.support}>
          Combinamos pessoas pela intenção e pelos interesses em comum, não só pela foto.
        </p>
      </div>
      <div className={styles.footer}>
        <button type="button" className={styles.primaryButton} onClick={onCreateAccount}>
          Criar conta
        </button>
        <button type="button" className={styles.secondaryLink} onClick={onHaveAccount}>
          Já tenho conta
        </button>
      </div>
    </div>
  );
}
