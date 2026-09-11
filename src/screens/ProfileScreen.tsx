import type { Filters, Intention, MyProfile } from "../types";
import { ageFromBirthdate } from "../utils/age";
import styles from "./ProfileScreen.module.css";

const INTENTION_FILTER_OPTIONS: { value: Filters["intention"]; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "serio", label: "Relacionamento sério" },
  { value: "conhecer", label: "Conhecer pessoas" },
  { value: "amizade", label: "Amizade" },
];

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

interface ProfileScreenProps {
  myProfile: MyProfile | null;
  matchesCount: number;
  conversationsCount: number;
  seenCount: number;
  filters: Filters;
  onChangeFilters: (filters: Filters) => void;
  onEditProfile: () => void;
  onViewOnboardingAgain: () => void;
  onRestartSimulation: () => void;
  onShowToast: (message: string) => void;
}

export function ProfileScreen({
  myProfile,
  matchesCount,
  conversationsCount,
  seenCount,
  filters,
  onChangeFilters,
  onEditProfile,
  onViewOnboardingAgain,
  onRestartSimulation,
  onShowToast,
}: ProfileScreenProps) {
  const age = myProfile ? ageFromBirthdate(myProfile.birthdate) : null;

  function updateFilters(next: Partial<Filters>) {
    onChangeFilters({ ...filters, ...next });
    onShowToast("Filtros atualizados");
  }

  return (
    <div className={styles.screen}>
      <div className={styles.scroll}>
        <div className={styles.header}>
          <img
            className={styles.avatar}
            src={myProfile?.photos[0] ?? "https://i.pravatar.cc/200?img=15"}
            alt={myProfile?.name ?? "Você"}
          />
          <div>
            <p className={styles.name}>{myProfile?.name || "Você"}</p>
            <p className={styles.meta}>
              {myProfile?.city ?? "Sua cidade"}
              {age !== null ? ` · ${age} anos` : ""}
            </p>
            <button type="button" className={styles.editLink} onClick={onEditProfile}>
              Editar perfil ›
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.metrics}>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>{matchesCount}</div>
              <div className={styles.metricLabel}>
                {pluralize(matchesCount, "match", "matches")}
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>{conversationsCount}</div>
              <div className={styles.metricLabel}>
                {pluralize(conversationsCount, "conversa ativa", "conversas ativas")}
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>{seenCount}</div>
              <div className={styles.metricLabel}>
                {pluralize(seenCount, "perfil visto", "perfis vistos")}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Filtros de busca</h2>

            <div>
              <span className={styles.label}>Intenção</span>
              <div className={styles.chipsRow}>
                {INTENTION_FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={
                      filters.intention === option.value
                        ? `${styles.chip} ${styles.chipActive}`
                        : styles.chip
                    }
                    onClick={() => updateFilters({ intention: option.value as Intention | "todas" })}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className={styles.sliderHeader}>
                <span className={styles.label}>Distância</span>
                <span className={styles.sliderValue}>até {filters.distanceKm} km</span>
              </div>
              <input
                className={styles.slider}
                type="range"
                min={5}
                max={60}
                step={5}
                value={filters.distanceKm}
                onChange={(e) => updateFilters({ distanceKm: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className={styles.accessList}>
            <button type="button" className={styles.accessRow} onClick={onViewOnboardingAgain}>
              Ver onboarding novamente
              <span className={styles.chevron}>›</span>
            </button>
            <button type="button" className={styles.accessRow} onClick={onRestartSimulation}>
              Reiniciar simulação
              <span className={styles.chevron}>›</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
