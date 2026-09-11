import { useMemo } from "react";
import { Logo } from "../components/Logo";
import { CloseIcon, HeartIcon } from "../components/icons/ActionIcons";
import { CURRENT_USER_INTERESTS } from "../data/mockProfiles";
import { INTENTION_LABEL, type Profile, type SwipeDirection } from "../types";
import styles from "./DiscoverScreen.module.css";

interface DiscoverScreenProps {
  current: Profile | null;
  photoIndex: number;
  swipeDirection: SwipeDirection;
  onNextPhoto: () => void;
  onLike: () => void;
  onDislike: () => void;
  onOpenProfile: (profile: Profile) => void;
  onIncreaseDistance: () => void;
  onReviewFilters: () => void;
}

export function DiscoverScreen({
  current,
  photoIndex,
  swipeDirection,
  onNextPhoto,
  onLike,
  onDislike,
  onOpenProfile,
  onIncreaseDistance,
  onReviewFilters,
}: DiscoverScreenProps) {
  const commonInterests = useMemo(() => {
    if (!current) return [];
    return current.interests.filter((interest) => CURRENT_USER_INTERESTS.includes(interest));
  }, [current]);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <Logo heartSize={26} textSize={28} />
      </header>

      {current ? (
        <div className={styles.cardArea}>
          <div
            className={
              swipeDirection === "left"
                ? `${styles.card} ${styles.cardExitLeft}`
                : swipeDirection === "right"
                  ? `${styles.card} ${styles.cardExitRight}`
                  : styles.card
            }
          >
            <button
              type="button"
              className={styles.photoButton}
              onClick={onNextPhoto}
              aria-label="Ver próxima foto"
            >
              <img
                className={styles.photo}
                src={current.photos[photoIndex]}
                alt={`Foto de ${current.name}`}
              />
            </button>

            <div className={styles.segmentBar}>
              {current.photos.map((photo, index) => (
                <span
                  key={photo}
                  className={
                    index === photoIndex
                      ? `${styles.segment} ${styles.segmentActive}`
                      : styles.segment
                  }
                />
              ))}
            </div>

            <span className={styles.intentionBadge}>{INTENTION_LABEL[current.intention]}</span>

            <div className={styles.gradientOverlay}>
              <div>
                <p className={styles.name}>
                  {current.name}, {current.age}
                </p>
                <p className={styles.profession}>{current.profession}</p>
                <p className={styles.cityDistance}>
                  {current.city} · a {current.distanceKm} km daqui
                </p>
              </div>

              {commonInterests.length > 0 && (
                <div className={styles.chipsRow}>
                  <span className={styles.chipCommon}>
                    {commonInterests.length}{" "}
                    {commonInterests.length === 1 ? "interesse em comum" : "interesses em comum"}
                  </span>
                  {commonInterests.slice(0, 3).map((interest) => (
                    <span key={interest} className={styles.chipInterest}>
                      {interest}
                    </span>
                  ))}
                </div>
              )}

              <button
                type="button"
                className={styles.viewProfileLink}
                onClick={() => onOpenProfile(current)}
              >
                Ver perfil completo
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.emptyWrap}>
          <div className={styles.spinner} />
          <p className={styles.emptyTitle}>Por hoje é isso</p>
          <p className={styles.emptySupport}>
            Você viu todos os perfis compatíveis na sua região. Volte mais tarde ou amplie sua
            busca.
          </p>
          <div className={styles.emptyActions}>
            <button type="button" className={styles.primaryButton} onClick={onIncreaseDistance}>
              Aumentar a distância para 50 km
            </button>
            <button type="button" className={styles.secondaryLink} onClick={onReviewFilters}>
              Rever filtros
            </button>
          </div>
        </div>
      )}

      {current && (
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
      )}
    </div>
  );
}
