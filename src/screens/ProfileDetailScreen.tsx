import { useMemo } from "react";
import { CloseIcon, HeartIcon } from "../components/icons/ActionIcons";
import { CURRENT_USER_INTERESTS } from "../data/mockProfiles";
import type { Profile } from "../types";
import styles from "./ProfileDetailScreen.module.css";

interface ProfileDetailScreenProps {
  profile: Profile;
  onBack: () => void;
  onLike: () => void;
  onDislike: () => void;
}

export function ProfileDetailScreen({ profile, onBack, onLike, onDislike }: ProfileDetailScreenProps) {
  const commonInterests = useMemo(
    () => new Set(profile.interests.filter((interest) => CURRENT_USER_INTERESTS.includes(interest))),
    [profile],
  );

  const thumbnails = profile.photos.slice(1, 3);

  return (
    <div className={styles.screen}>
      <div className={styles.photoWrap}>
        <img className={styles.photo} src={profile.photos[0]} alt={`Foto de ${profile.name}`} />
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 4l-8 8 8 8"
              stroke="#16211A"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className={styles.body}>
        <div>
          <p className={styles.name}>
            {profile.name}, {profile.age}
          </p>
          <p className={styles.meta}>
            {profile.profession} · {profile.city}
          </p>
        </div>

        <p className={styles.bio}>{profile.bio}</p>

        <div className={styles.promptCard}>
          <span className={styles.promptLabel}>{profile.prompt.label}</span>
          <span className={styles.promptAnswer}>{profile.prompt.answer}</span>
        </div>

        <div>
          <span className={styles.sectionLabel}>Interesses</span>
          <div className={styles.chipsRow} style={{ marginTop: 10 }}>
            {profile.interests.map((interest) => {
              const isCommon = commonInterests.has(interest);
              return (
                <span
                  key={interest}
                  className={isCommon ? `${styles.chip} ${styles.chipCommon}` : styles.chip}
                >
                  {interest}
                  {isCommon ? " ✓" : ""}
                </span>
              );
            })}
          </div>
        </div>

        {thumbnails.length > 0 && (
          <div className={styles.thumbGrid}>
            {thumbnails.map((photo) => (
              <img key={photo} className={styles.thumb} src={photo} alt={`Foto de ${profile.name}`} />
            ))}
          </div>
        )}

        <button type="button" className={styles.reportLink}>
          Denunciar perfil
        </button>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.actionClose}`}
          onClick={onDislike}
          aria-label="Dispensar perfil"
        >
          <CloseIcon size={24} />
        </button>
        <button
          type="button"
          className={`${styles.actionButton} ${styles.actionLike}`}
          onClick={onLike}
          aria-label="Curtir perfil"
        >
          <HeartIcon size={34} />
        </button>
      </div>
    </div>
  );
}
