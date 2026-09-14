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
      {offline && (
        <div className={styles.offlineBanner}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 3l18 18" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />
            <path
              d="M5 12.5a10 10 0 0 1 5-2.6M14 10a10 10 0 0 1 5 2.5M8.5 16a5.5 5.5 0 0 1 7 0"
              stroke="#fff"
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <circle cx="12" cy="19.4" r="1.4" fill="#fff" />
          </svg>
          <span>Sem conexão. Algumas ações não vão funcionar.</span>
        </div>
      )}
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
                <path d="M4 8h16M4 16h16" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" />
                <circle cx="15" cy="8" r="3" fill="none" stroke="#fff" strokeWidth={1.9} />
                <circle cx="9" cy="16" r="3" fill="none" stroke="#fff" strokeWidth={1.9} />
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
                  <svg width="16" height="10" viewBox="0 0 18 11" fill="none" aria-hidden="true" style={{ opacity: 0.95 }}>
                    <path
                      d="M2 2.5l7 6 7-6"
                      stroke="#fff"
                      strokeWidth={2.6}
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
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 3l18 18" stroke="#C8353C" strokeWidth={2.4} strokeLinecap="round" />
              <path
                d="M5 12.5a10 10 0 0 1 5-2.6M14 10a10 10 0 0 1 5 2.5M8.5 16a5.5 5.5 0 0 1 7 0"
                stroke="#C8353C"
                strokeWidth={2.2}
                strokeLinecap="round"
              />
              <circle cx="12" cy="19.4" r="1.4" fill="#C8353C" />
            </svg>
          </div>
          <p className={styles.emptyTitle}>Não deu para carregar</p>
          <p className={styles.emptySupport}>
            Verifique sua conexão e tente de novo. Nada do que você curtiu foi perdido.
          </p>
          <button type="button" className={styles.primaryButton} onClick={onRetryConnection}>
            Tentar de novo
          </button>
        </div>
      ) : emptyByFilter ? (
        <div className={styles.emptyWrap}>
          <div className={styles.emptyFilterIcon}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 6h16M7 12h10M10 18h4"
                stroke="#8B5CF6"
                strokeWidth={2.4}
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p className={styles.emptyTitle}>Poucos perfis por aqui</p>
          <p className={styles.emptySupport}>
            Seus filtros estão bem estreitos. Ampliar a distância ou a faixa de idade traz mais
            gente.
          </p>
          <button type="button" className={styles.primaryButton} onClick={onWidenFilters}>
            Ampliar filtros
          </button>
          <button type="button" className={styles.secondaryLink} onClick={onOpenFilters}>
            Ajustar manualmente
          </button>
        </div>
      ) : (
        <div className={styles.emptyWrap}>
          <div className={styles.spinner} />
          <p className={styles.emptyTitle}>Por hoje é isso</p>
          <p className={styles.emptySupport}>
            Você viu todos os perfis de Joinville que combinam com o que busca.
          </p>
          <button type="button" className={styles.primaryButton} onClick={onRestoreProfiles}>
            Rever os perfis
          </button>
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
            <HeartIcon size={55} />
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
