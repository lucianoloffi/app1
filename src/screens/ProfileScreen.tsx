import type { Filters, MyProfile } from "../types";
import { ageFromBirthdate } from "../utils/age";
import { computeCompleteness } from "../utils/completeness";
import styles from "./ProfileScreen.module.css";

const GENDER_FILTER_LABEL: Record<Filters["interestedIn"], string> = {
  homem: "Homens",
  mulher: "Mulheres",
  todos: "Todos",
};

const INTENTION_FILTER_LABEL: Record<Filters["intention"], string> = {
  todas: "Todos",
  serio: "Relacionamento sério",
  conhecer: "Conhecer pessoas",
  amizade: "Amizade",
};

const RING_RADIUS = 41;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface ProfileScreenProps {
  myProfile: MyProfile | null;
  filters: Filters;
  verified: boolean;
  onOpenEdit: () => void;
  onOpenFilters: () => void;
  onOpenSettings: () => void;
  onVerifyProfile: () => void;
  onLogout: () => void;
}

export function ProfileScreen({
  myProfile,
  filters,
  verified,
  onOpenEdit,
  onOpenFilters,
  onOpenSettings,
  onVerifyProfile,
  onLogout,
}: ProfileScreenProps) {
  const age = myProfile ? ageFromBirthdate(myProfile.birthdate) : null;
  const photosCount = myProfile?.photos.length ?? 0;
  const { pct, hint, missing } = computeCompleteness(myProfile, photosCount);
  const dashOffset = RING_CIRCUMFERENCE * (1 - pct / 100);

  const filtersSummary = `${GENDER_FILTER_LABEL[filters.interestedIn]} · ${filters.minAge}–${filters.maxAge} anos · até ${filters.distanceKm} km · ${INTENTION_FILTER_LABEL[filters.intention]}`;

  return (
    <div className={styles.screen}>
      <button type="button" className={styles.header} onClick={onOpenEdit}>
        <div className={styles.ringWrap}>
          <svg
            className={styles.ring}
            width="88"
            height="88"
            viewBox="0 0 88 88"
          >
            <circle
              cx="44"
              cy="44"
              r={RING_RADIUS}
              fill="none"
              stroke="#EDE6FB"
              strokeWidth={4}
            />
            <circle
              cx="44"
              cy="44"
              r={RING_RADIUS}
              fill="none"
              stroke="#8B5CF6"
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 44 44)"
            />
          </svg>
          <img
            className={styles.avatar}
            src={myProfile?.photos[0] ?? "https://i.pravatar.cc/200?img=15"}
            alt={myProfile?.name ?? "Você"}
          />
          <span className={styles.pct}>{pct}%</span>
        </div>
        <div className={styles.headerMain}>
          <div className={styles.nameRow}>
            <p className={styles.name}>{myProfile?.name || "Você"}</p>
            {verified && (
              <span className={styles.verifiedBadge}>✓ verificado</span>
            )}
          </div>
          <p className={styles.meta}>
            {myProfile?.city ?? "Sua cidade"}
            {age !== null ? ` · ${age} anos` : ""}
          </p>
          <p className={styles.hint}>{hint}</p>
        </div>
        <svg
          className={styles.chevron}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 5l7 7-7 7"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div className={styles.section}>
        {/* Some quando não falta nada: o cartão existe para ser resolvido. */}
        {missing.length > 0 && (
          <button type="button" className={styles.completeCard} onClick={onOpenEdit}>
            <span className={styles.completeHeader}>
              <span className={styles.completeIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 3.4l2.3 5 5.4.6-4 3.7 1.1 5.3-4.8-2.7-4.8 2.7L8.3 12.7l-4-3.7 5.4-.6z"
                    fill="#fff"
                    stroke="#5B34C9"
                    strokeWidth={1.7}
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className={styles.completeMain}>
                <span className={styles.completeTitle}>Complete seu perfil</span>
                <span className={styles.completeSupport}>Toque para preencher o que falta</span>
              </span>
              <span className={styles.rowChevron}>›</span>
            </span>
            <span className={styles.completeChips}>
              {missing.slice(0, 3).map((item) => (
                <span key={item} className={styles.completeChip}>
                  {item}
                </span>
              ))}
            </span>
          </button>
        )}

        <button
          type="button"
          className={styles.filtersCard}
          onClick={onOpenFilters}
        >
          <span className={styles.filtersIcon}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 7h16M4 17h16"
                stroke="#5B34C9"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <circle
                cx="9"
                cy="7"
                r="2.4"
                fill="#fff"
                stroke="#5B34C9"
                strokeWidth={1.4}
              />
              <circle
                cx="15"
                cy="17"
                r="2.4"
                fill="#fff"
                stroke="#5B34C9"
                strokeWidth={1.4}
              />
            </svg>
          </span>
          <span className={styles.filtersMain}>
            <p className={styles.filtersTitle}>Filtros de busca</p>
            <p className={styles.filtersSummary}>{filtersSummary}</p>
          </span>
          <span className={styles.rowChevron}>›</span>
        </button>

        <div className={styles.accessList}>
          <button
            type="button"
            className={styles.accessRow}
            onClick={onVerifyProfile}
          >
            Verificar meu perfil
            <span
              className={verified ? styles.verifyHintDone : styles.verifyHint}
            >
              {verified ? "verificado" : "pendente"}
            </span>
          </button>
          <button
            type="button"
            className={styles.accessRow}
            onClick={onOpenSettings}
          >
            Configurações e privacidade
            <span className={styles.chevron}>›</span>
          </button>
          <button
            type="button"
            className={`${styles.accessRow} ${styles.accessRowDestructive}`}
            onClick={onLogout}
          >
            Sair da conta
            <span className={styles.rowChevronDestructive}>›</span>
          </button>
        </div>
      </div>
    </div>
  );
}
