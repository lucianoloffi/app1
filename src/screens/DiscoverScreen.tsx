import { useMemo, useState } from "react";
import { Logo } from "../components/Logo";
import { CloseIcon, HeartIcon } from "../components/icons/ActionIcons";
import { ReportSheet } from "../components/ReportSheet";
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
  onShowToast: (message: string) => void;
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
  onShowToast,
}: DiscoverScreenProps) {
  const [cardMenuOpen, setCardMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const commonInterests = useMemo(() => {
    if (!current) return [];
    return current.interests.filter((interest) => CURRENT_USER_INTERESTS.includes(interest));
  }, [current]);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <Logo heartSize={34} textSize={36} />
      </header>

      {current ? (
        <div className={styles.cardArea}>
          <div
            key={current.id}
            className={swipeDirection ? `${styles.card} ${styles.cardExit}` : styles.card}
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

            <div className={styles.cardMenuWrap}>
              <button
                type="button"
                className={styles.cardMenuButton}
                aria-label="Mais opções do perfil"
                onClick={() => setCardMenuOpen((prev) => !prev)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="5" r="2" fill="#fff" />
                  <circle cx="12" cy="12" r="2" fill="#fff" />
                  <circle cx="12" cy="19" r="2" fill="#fff" />
                </svg>
              </button>
              {cardMenuOpen && (
                <>
                  <button
                    type="button"
                    className={styles.cardMenuBackdrop}
                    aria-label="Fechar menu"
                    onClick={() => setCardMenuOpen(false)}
                  />
                  <div className={styles.cardMenuCard}>
                    <button
                      type="button"
                      className={styles.cardMenuItem}
                      onClick={() => {
                        setCardMenuOpen(false);
                        onDislike();
                      }}
                    >
                      Pular este perfil
                    </button>
                    <button
                      type="button"
                      className={styles.cardMenuItem}
                      onClick={() => {
                        setCardMenuOpen(false);
                        setReportOpen(true);
                      }}
                    >
                      Denunciar perfil
                    </button>
                    <button
                      type="button"
                      className={`${styles.cardMenuItem} ${styles.cardMenuItemDestructive}`}
                      onClick={() => {
                        setCardMenuOpen(false);
                        onDislike();
                        onShowToast("Perfil bloqueado.");
                      }}
                    >
                      Bloquear perfil
                    </button>
                  </div>
                </>
              )}
            </div>

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
                Saber mais ›
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

      {reportOpen && current && (
        <ReportSheet
          name={current.name}
          onCancel={() => setReportOpen(false)}
          onSelectReason={() => {
            setReportOpen(false);
            onShowToast("Denúncia enviada. Obrigado por avisar.");
          }}
        />
      )}
    </div>
  );
}
