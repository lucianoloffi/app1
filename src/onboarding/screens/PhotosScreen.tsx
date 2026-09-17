import { useRef } from "react";
import { OnboardingLayout } from "../OnboardingLayout";
import { MAX_ONBOARDING_PHOTOS, MIN_ONBOARDING_PHOTOS } from "../constants";
import styles from "./PhotosScreen.module.css";

interface PhotosScreenProps {
  photos: (string | null)[];
  busy?: boolean;
  onPickPhoto: (index: number, file: File) => void;
  onRemovePhoto: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
}

export function PhotosScreen({
  photos,
  busy,
  onPickPhoto,
  onRemovePhoto,
  onBack,
  onNext,
}: PhotosScreenProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isValid = photos.filter(Boolean).length >= MIN_ONBOARDING_PHOTOS && !busy;

  function handleFile(index: number, file: File | null) {
    if (file) onPickPhoto(index, file);
  }

  function handleTap(index: number) {
    if (busy) return;
    if (photos[index]) {
      onRemovePhoto(index);
      return;
    }
    inputRefs.current[index]?.click();
  }

  return (
    <OnboardingLayout
      progress={5}
      onBack={onBack}
      title="Suas fotos"
      support="Escolha pelo menos 1. Perfis com 3 fotos recebem mais matches."
      contentGap={14}
      ctaLabel={busy ? "Enviando…" : "Continuar"}
      ctaDisabled={!isValid}
      onCta={onNext}
    >
      <div className={styles.grid}>
        {Array.from({ length: MAX_ONBOARDING_PHOTOS }, (_, index) => {
          const photo = photos[index];
          return (
            <div
              key={index}
              role="button"
              tabIndex={0}
              className={photo ? `${styles.slot} ${styles.slotFilled}` : `${styles.slot} ${styles.slotEmpty}`}
              onClick={() => handleTap(index)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleTap(index);
              }}
            >
              {photo ? (
                <img className={styles.photo} src={photo} alt={`Foto ${index + 1}`} />
              ) : (
                <>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="2.5" y="6" width="19" height="14" rx="4" fill="#8B5CF6" opacity={0.18} />
                    <circle cx="12" cy="13" r="4" fill="#8B5CF6" />
                    <rect x="8.5" y="3.5" width="7" height="3.5" rx="1.6" fill="#8B5CF6" opacity={0.55} />
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
      <p className={styles.note}>Toque para enviar. A primeira foto é a principal.</p>
    </OnboardingLayout>
  );
}
