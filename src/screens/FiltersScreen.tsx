import { useState } from "react";
import { ScreenHeader } from "../components/ScreenHeader";
import { PillChipRow } from "../components/PillChip";
import { RangeSlider } from "../components/RangeSlider";
import type { Filters, FilterGender, Intention } from "../types";
import styles from "./FiltersScreen.module.css";

const GENDER_OPTIONS: { value: FilterGender; label: string }[] = [
  { value: "homem", label: "Homens" },
  { value: "mulher", label: "Mulheres" },
  { value: "todos", label: "Todos" },
];

const INTENTION_OPTIONS: { value: Filters["intention"]; label: string }[] = [
  { value: "serio", label: "Relacionamento sério" },
  { value: "conhecer", label: "Conhecer pessoas" },
  { value: "amizade", label: "Amizade" },
  { value: "todas", label: "Todos" },
];

const AGE_MIN = 18;
const AGE_MAX = 70;
const DISTANCE_MIN = 5;
const DISTANCE_MAX = 60;
const DISTANCE_STEP = 5;

interface FiltersScreenProps {
  filters: Filters;
  onApply: (filters: Filters) => void;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

function isEqual(a: Filters, b: Filters) {
  return (
    a.intention === b.intention &&
    a.interestedIn === b.interestedIn &&
    a.minAge === b.minAge &&
    a.maxAge === b.maxAge &&
    a.distanceKm === b.distanceKm
  );
}

export function FiltersScreen({
  filters,
  onApply,
  onClose,
  onShowToast,
}: FiltersScreenProps) {
  const [draft, setDraft] = useState<Filters>(filters);
  const isDirty = !isEqual(draft, filters);

  return (
    <div className={styles.screen}>
      <ScreenHeader title="Filtros de busca" onBack={onClose} size="lg" />

      <div className={styles.body}>
        <p className={styles.note}>As mudanças valem para a próxima fila de perfis.</p>

        <div className={styles.card}>
          <div className={styles.fieldGroup}>
            <span className={styles.label}>Gênero que me interessa</span>
            <PillChipRow
              options={GENDER_OPTIONS}
              selected={draft.interestedIn}
              onSelect={(interestedIn) => setDraft((prev) => ({ ...prev, interestedIn }))}
            />
          </div>

          <div className={styles.fieldGroup} style={{ marginTop: 26 }}>
            <div className={styles.sliderHeader}>
              <span className={styles.label}>Faixa de idade</span>
              <span className={styles.sliderValue}>
                {draft.minAge} – {draft.maxAge} anos
              </span>
            </div>
            <RangeSlider
              min={AGE_MIN}
              max={AGE_MAX}
              values={[draft.minAge, draft.maxAge]}
              minGap={1}
              ariaLabels={["Idade mínima", "Idade máxima"]}
              onChange={([minAge, maxAge]) => setDraft((prev) => ({ ...prev, minAge, maxAge }))}
              onCommit={([minAge, maxAge]) =>
                onShowToast(`Faixa de idade: ${minAge} – ${maxAge} anos`)
              }
            />
          </div>

          <div className={styles.fieldGroup} style={{ marginTop: 26 }}>
            <div className={styles.sliderHeader}>
              <span className={styles.label}>Distância</span>
              <span className={styles.sliderValue}>até {draft.distanceKm} km</span>
            </div>
            <RangeSlider
              min={DISTANCE_MIN}
              max={DISTANCE_MAX}
              step={DISTANCE_STEP}
              values={[draft.distanceKm]}
              ariaLabels={["Distância máxima"]}
              onChange={([distanceKm]) => setDraft((prev) => ({ ...prev, distanceKm }))}
              onCommit={([distanceKm]) => onShowToast(`Distância: até ${distanceKm} km`)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <span className={styles.label}>Intenção</span>
            <PillChipRow
              options={INTENTION_OPTIONS}
              selected={draft.intention}
              onSelect={(intention: Intention | "todas") =>
                setDraft((prev) => ({ ...prev, intention }))
              }
            />
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={
            isDirty ? styles.revertButton : `${styles.revertButton} ${styles.revertButtonDisabled}`
          }
          onClick={() => {
            if (!isDirty) return;
            setDraft(filters);
            onShowToast("Filtros revertidos");
          }}
        >
          Reverter
        </button>
        <button type="button" className={styles.applyButton} onClick={() => onApply(draft)}>
          Ver perfis
        </button>
      </div>
    </div>
  );
}
