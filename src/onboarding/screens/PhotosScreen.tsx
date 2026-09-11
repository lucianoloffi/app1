import { useRef } from "react";
import { OnboardingLayout } from "../OnboardingLayout";
import { MAX_PHOTOS } from "../constants";
import styles from "./PhotosScreen.module.css";

interface PhotosScreenProps {
  photos: (string | null)[];
  onChangePhotos: (photos: (string | null)[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export function PhotosScreen({ photos, onChangePhotos, onBack, onNext }: PhotosScreenProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleFile(index: number, file: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const next = [...photos];
    const previous = next[index];
    next[index] = url;
    onChangePhotos(next);
    if (previous) URL.revokeObjectURL(previous);
  }

  function handleRemove(index: number, e: React.MouseEvent) {
    e.stopPropagation();
    const next = [...photos];
    const previous = next[index];
    next[index] = null;
    onChangePhotos(next);
    if (previous) URL.revokeObjectURL(previous);
  }

  return (
    <OnboardingLayout
      progress={5}
      onBack={onBack}
      title="Suas fotos"
      support="A primeira é a principal. Você pode adicionar mais depois."
      ctaLabel="Continuar"
      onCta={onNext}
      secondary={
        <button type="button" className={styles.skipLink} onClick={onNext}>
          Pular
        </button>
      }
    >
      <div className={styles.grid}>
        {Array.from({ length: MAX_PHOTOS }, (_, index) => {
          const photo = photos[index];
          return (
            <div
              key={index}
              role="button"
              tabIndex={0}
              className={photo ? `${styles.slot} ${styles.slotFilled}` : `${styles.slot} ${styles.slotEmpty}`}
              onClick={() => inputRefs.current[index]?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRefs.current[index]?.click();
              }}
            >
              {photo ? (
                <>
                  <img className={styles.photo} src={photo} alt={`Foto ${index + 1}`} />
                  {index === 0 && <span className={styles.badge}>Principal</span>}
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={(e) => handleRemove(index, e)}
                    aria-label="Remover foto"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M5 5l14 14M19 5L5 19"
                        stroke="#fff"
                        strokeWidth={3}
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z"
                      stroke="#5B34C9"
                      strokeWidth={1.6}
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="13" r="3.2" stroke="#5B34C9" strokeWidth={1.6} />
                  </svg>
                  <span className={styles.slotLabel}>
                    {index === 0 ? "Foto principal" : "Adicionar foto"}
                  </span>
                </>
              )}
              <input
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                className={styles.hiddenInput}
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(index, e.target.files?.[0] ?? null)}
              />
            </div>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}
