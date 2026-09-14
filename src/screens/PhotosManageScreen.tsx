import { useRef } from "react";
import { MAX_PROFILE_PHOTOS } from "../onboarding/constants";
import styles from "./PhotosManageScreen.module.css";

interface PhotosManageScreenProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  onBack: () => void;
}

function photoHint(count: number): string {
  if (count < 3) return "Perfis com pelo menos 3 fotos recebem mais matches.";
  if (count < 6)
    return `Quanto mais fotos, mais atrativo fica seu perfil. Você ainda pode adicionar ${6 - count} ${
      6 - count === 1 ? "foto" : "fotos"
    }.`;
  return "Perfil completo de fotos. Você pode reordenar tornando outra a capa.";
}

export function PhotosManageScreen({ photos, onChange, onBack }: PhotosManageScreenProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const slots = [...photos, ...Array(MAX_PROFILE_PHOTOS).fill(null)].slice(0, MAX_PROFILE_PHOTOS);

  function handleFile(index: number, file: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const next = [...photos];
    next[index] = url;
    onChange(next.filter(Boolean));
  }

  function handleRemove(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  function handleMakeCover(index: number) {
    const next = [...photos];
    const [chosen] = next.splice(index, 1);
    next.unshift(chosen);
    onChange(next);
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 4l-8 8 8 8"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className={styles.headerTitle}>Gerenciar fotos</h1>
      </div>

      <div className={styles.body}>
        <div className={styles.grid}>
          {slots.map((photo, index) => (
            <div
              key={index}
              className={photo ? `${styles.tile} ${styles.tileFilled}` : `${styles.tile} ${styles.tileEmpty}`}
            >
              {photo ? (
                <>
                  <img className={styles.photo} src={photo} alt={`Foto ${index + 1}`} />
                  {index === 0 && <span className={styles.coverBadge}>Capa</span>}
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => handleRemove(index)}
                    aria-label="Remover foto"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M5 5l14 14M19 5L5 19"
                        stroke="#fff"
                        strokeWidth={3}
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  {index > 0 && (
                    <button
                      type="button"
                      className={styles.makeCoverButton}
                      onClick={() => handleMakeCover(index)}
                    >
                      Tornar capa
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  className={styles.tileEmpty}
                  style={{ position: "absolute", inset: 0, border: 0 }}
                  onClick={() => inputRefs.current[index]?.click()}
                  aria-label="Adicionar foto"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z"
                      stroke="#5B34C9"
                      strokeWidth={1.6}
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="13" r="3.2" stroke="#5B34C9" strokeWidth={1.6} />
                  </svg>
                </button>
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
          ))}
        </div>
        <p className={styles.hint}>{photoHint(photos.length)}</p>
      </div>
    </div>
  );
}
