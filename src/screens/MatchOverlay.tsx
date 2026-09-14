import { LoviMark } from "../components/icons/LoviMark";
import type { Profile } from "../types";
import styles from "./MatchOverlay.module.css";

const SPARK_ANGLES = [15, 60, 105, 150, 195, 240, 285, 330];
const SPARK_DELAYS = [0.3, 0.52, 0.74, 0.96];

interface MatchOverlayProps {
  profile: Profile;
  myPhoto?: string;
  onOpenChat: () => void;
  onContinue: () => void;
}

export function MatchOverlay({ profile, myPhoto, onOpenChat, onContinue }: MatchOverlayProps) {
  return (
    <div className={styles.overlay} role="dialog" aria-label="Deu match">
      <div className={styles.heartWrap}>
        <span className={styles.halo} />
        {SPARK_ANGLES.map((angle, index) => (
          <span
            key={angle}
            className={styles.sparkAxis}
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <span
              className={styles.spark}
              style={{ animationDelay: `${SPARK_DELAYS[index % SPARK_DELAYS.length]}s` }}
            />
          </span>
        ))}
        <LoviMark size={256} className={styles.heart} />
        <p className={styles.title}>deu match!</p>
      </div>

      <div className={styles.avatars}>
        {myPhoto ? (
          <img className={styles.avatar} src={myPhoto} alt="Você" />
        ) : (
          <span className={styles.avatar}>
            <LoviMark size={32} variant="purple" />
          </span>
        )}
        <img
          className={`${styles.avatar} ${styles.avatarOverlap}`}
          src={profile.photos[0]}
          alt={profile.name}
        />
      </div>

      <p className={styles.copy}>Você e {profile.name.split(" ")[0]} se curtiram.</p>

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
