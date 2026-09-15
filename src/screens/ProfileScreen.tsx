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

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

const RING_RADIUS = 41;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface ProfileScreenProps {
  myProfile: MyProfile | null;
  matchesCount: number;
  conversationsCount: number;
  seenCount: number;
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
  matchesCount,
  conversationsCount,
  seenCount,
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
  const { pct, hint } = computeCompleteness(myProfile, photosCount);
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
        <div className={styles.metrics}>
          <div className={styles.metricCard}>
            <div className={styles.metricValue}>{matchesCount}</div>
            <div className={styles.metricLabel}>matches</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricValue}>{conversationsCount}</div>
            <div className={styles.metricLabel}>conversas</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricValue}>{seenCount}</div>
            <div className={styles.metricLabel}>
              {pluralize(seenCount, "perfil visto", "perfis vistos")}
            </div>
          </div>
        </div>

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
