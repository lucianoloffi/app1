import { LoviMark } from "../components/icons/LoviMark";
import type { Profile } from "../types";
import styles from "./MatchOverlay.module.css";

interface MatchOverlayProps {
  profile: Profile;
  onOpenChat: () => void;
  onContinue: () => void;
}

export function MatchOverlay({ profile, onOpenChat, onContinue }: MatchOverlayProps) {
  return (
    <div className={styles.overlay} role="dialog" aria-label="Deu match">
      <div className={styles.heartWrap}>
        <span className={styles.halo} />
        <LoviMark size={256} className={styles.heart} />
        <p className={styles.title}>deu match!</p>
      </div>

      <div className={styles.avatars}>
        <span className={styles.avatar}>
          <LoviMark size={32} variant="purple" />
        </span>
        <img
          className={`${styles.avatar} ${styles.avatarOverlap}`}
          src={profile.photos[0]}
          alt={profile.name}
        />
      </div>

      <p className={styles.copy}>
        Você e <strong>{profile.name}</strong> se curtiram.
      </p>

      <div className={styles.footer}>
        <button type="button" className={styles.primaryButton} onClick={onOpenChat}>
          Abrir conversa
        </button>
        <button type="button" className={styles.secondaryLink} onClick={onContinue}>
          Continuar vendo perfis
        </button>
      </div>
    </div>
  );
}
