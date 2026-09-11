import { useMemo, useRef, useState } from "react";
import { Logo } from "../components/Logo";
import { CloseIcon, HeartIcon } from "../components/icons/ActionIcons";
import { CURRENT_USER_INTERESTS, mockProfiles } from "../data/mockProfiles";
import { INTENTION_LABEL, type Profile, type SwipeDirection } from "../types";
import styles from "./DiscoverScreen.module.css";

const SWIPE_ANIMATION_MS = 240;

interface DiscoverScreenProps {
  onOpenProfile?: (profile: Profile) => void;
}

export function DiscoverScreen({ onOpenProfile }: DiscoverScreenProps) {
  const [queue, setQueue] = useState<Profile[]>(mockProfiles);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null);
  const isAnimating = useRef(false);

  const current = queue[0];

  const commonInterests = useMemo(() => {
    if (!current) return [];
    return current.interests.filter((interest) => CURRENT_USER_INTERESTS.includes(interest));
  }, [current]);

  function handlePhotoTap() {
    if (!current) return;
    setPhotoIndex((prev) => (prev + 1) % current.photos.length);
  }

  function handleSwipe(direction: "left" | "right") {
    if (isAnimating.current || !current) return;
    isAnimating.current = true;
    setSwipeDirection(direction);
    window.setTimeout(() => {
      setQueue((prev) => prev.slice(1));
      setPhotoIndex(0);
      setSwipeDirection(null);
      isAnimating.current = false;
    }, SWIPE_ANIMATION_MS);
  }

  function resetQueue() {
    setQueue(mockProfiles);
    setPhotoIndex(0);
  }

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
              onClick={handlePhotoTap}
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
                onClick={() => onOpenProfile?.(current)}
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
            <button type="button" className={styles.primaryButton} onClick={resetQueue}>
              Aumentar a distância para 50 km
            </button>
            <button type="button" className={styles.secondaryLink} onClick={resetQueue}>
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
            onClick={() => handleSwipe("left")}
            aria-label="Dispensar perfil"
          >
            <CloseIcon size={24} />
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionLike}`}
            onClick={() => handleSwipe("right")}
            aria-label="Curtir perfil"
          >
            <HeartIcon size={34} />
          </button>
        </div>
      )}
    </div>
  );
}
