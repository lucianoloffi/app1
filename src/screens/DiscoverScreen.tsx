import { useMemo, useState } from "react";
import { Logo } from "../components/Logo";
import { CloseIcon, HeartIcon } from "../components/icons/ActionIcons";
import { ReportSheet } from "../components/ReportSheet";
import { CURRENT_USER_INTERESTS } from "../data/mockProfiles";
import { INTENTION_LABEL, type Profile, type SwipeDirection } from "../types";
import styles from "./DiscoverScreen.module.css";

interface DiscoverScreenProps {
  current: Profile | null;
  hasAnyMatch: boolean;
  offline: boolean;
  photoIndex: number;
  swipeDirection: SwipeDirection;
  onNextPhoto: () => void;
  onLike: () => void;
  onDislike: () => void;
  onOpenProfile: (profile: Profile) => void;
  onOpenFilters: () => void;
  onWidenFilters: () => void;
  onRestoreProfiles: () => void;
  onRetryConnection: () => void;
  onBlock: (profile: Profile) => void;
  onShowToast: (message: string) => void;
}

export function DiscoverScreen({
  current,
  hasAnyMatch,
  offline,
  photoIndex,
  swipeDirection,
  onNextPhoto,
  onLike,
  onDislike,
  onOpenProfile,
  onOpenFilters,
  onWidenFilters,
  onRestoreProfiles,
  onRetryConnection,
  onBlock,
  onShowToast,
}: DiscoverScreenProps) {
  const [cardMenuOpen, setCardMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const commonInterests = useMemo(() => {
    if (!current) return [];
    return current.interests.filter((interest) => CURRENT_USER_INTERESTS.includes(interest));
  }, [current]);

  const otherInterests = useMemo(() => {
    if (!current) return [];
    return current.interests.filter((interest) => !commonInterests.includes(interest));
  }, [current, commonInterests]);

  const emptyByFilter = !current && !hasAnyMatch;

  return (
    <div className={styles.screen}>
      {offline && <div className={styles.offlineBanner}>Sem conexão</div>}
      <header className={styles.header}>
        <Logo heartSize={34} textSize={36} />
      </header>

      {current && !offline ? (
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
                        onBlock(current);
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

            <span className={styles.intentionBadge}>{INTENTION_LABEL[current.intention]}</span>

            <button
              type="button"
              className={styles.filterButton}
              aria-label="Filtros de busca"
              onClick={onOpenFilters}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 17h16" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                <circle cx="9" cy="7" r="2.4" fill="#16211A" stroke="#fff" strokeWidth={1.4} />
                <circle cx="15" cy="17" r="2.4" fill="#16211A" stroke="#fff" strokeWidth={1.4} />
              </svg>
            </button>

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

              <div className={styles.chipsRow}>
                {commonInterests.slice(0, 3).map((interest) => (
                  <span key={interest} className={styles.chipCommon}>
                    {interest}
                  </span>
                ))}
                {otherInterests.slice(0, 3).map((interest) => (
                  <span key={interest} className={styles.chipInterest}>
                    {interest}
                  </span>
                ))}
                <button
                  type="button"
                  className={styles.viewProfileLink}
                  onClick={() => onOpenProfile(current)}
                  style={{ marginLeft: "auto" }}
                  aria-label="Ver perfil completo"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="#fff"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : offline ? (
        <div className={styles.offlineWrap}>
          <div className={styles.offlineIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M3 3l18 18M8.5 8.8a10 10 0 0 1 11 1.7M5.3 12a10 10 0 0 1 2.4-1.8M12 18.5h.01"
                stroke="#C8353C"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className={styles.emptyTitle}>Não deu para carregar</p>
          <p className={styles.emptySupport}>
            Verifique sua conexão com a internet e tente novamente.
          </p>
          <button type="button" className={styles.primaryButton} onClick={onRetryConnection}>
            Tentar de novo
          </button>
        </div>
      ) : emptyByFilter ? (
        <div className={styles.emptyWrap}>
          <div className={styles.emptyFilterIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 5h16l-6 8v5l-4 2v-7L4 5z"
                stroke="#8B5CF6"
                strokeWidth={2}
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className={styles.emptyTitle}>Poucos perfis por aqui</p>
          <p className={styles.emptySupport}>
            Nenhum perfil combina com os filtros atuais. Tente ampliar a busca.
          </p>
          <div className={styles.emptyActions}>
            <button type="button" className={styles.primaryButton} onClick={onWidenFilters}>
              Ampliar filtros
            </button>
            <button type="button" className={styles.secondaryLink} onClick={onOpenFilters}>
              Ajustar manualmente
            </button>
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
            <button type="button" className={styles.primaryButton} onClick={onWidenFilters}>
              Ampliar filtros
            </button>
            <button type="button" className={styles.secondaryLink} onClick={onRestoreProfiles}>
              Rever os perfis
            </button>
          </div>
        </div>
      )}

      {current && !offline && (
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
