import { useRef } from "react";
import { ScreenHeader } from "../components/ScreenHeader";
import { MAX_PROFILE_PHOTOS } from "../onboarding/constants";
import styles from "./PhotosManageScreen.module.css";

interface PhotosManageScreenProps {
  photos: string[];
  busy?: boolean;
  onAddPhoto: (file: File) => void;
  onRemovePhoto: (index: number) => void;
  onMakeMain: (index: number) => void;
  onBack: () => void;
  onShowToast: (message: string) => void;
}

function photoHint(count: number): string {
  if (count < 3) return "Perfis com pelo menos 3 fotos recebem mais matches.";
  if (count < 6)
    return `Quanto mais fotos, mais atrativo fica seu perfil. Você ainda pode adicionar ${6 - count} ${
      6 - count === 1 ? "foto" : "fotos"
    }.`;
  return "Perfil completo de fotos. Você pode reordenar tornando outra a capa.";
}

export function PhotosManageScreen({
  photos,
  busy,
  onAddPhoto,
  onRemovePhoto,
  onMakeMain,
  onBack,
}: PhotosManageScreenProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const slots = [...photos, ...Array(MAX_PROFILE_PHOTOS).fill(null)].slice(0, MAX_PROFILE_PHOTOS);

  function handleFile(_index: number, file: File | null) {
    if (!file || busy) return;
    onAddPhoto(file);
  }

  function handleRemove(index: number) {
    if (busy) return;
    onRemovePhoto(index);
  }

  function handleMakeMain(index: number) {
    if (busy) return;
    onMakeMain(index);
  }

  return (
    <div className={styles.screen}>
      <ScreenHeader title="Fotos" onBack={onBack} />

      <div className={styles.body}>
        <p className={styles.intro}>
          A primeira foto é a principal e aparece no card de descoberta. Use os botões sobre cada
          foto para reordenar ou remover.
        </p>
        <div className={styles.grid}>
          {slots.map((photo, index) => (
            <div
              key={index}
              className={[
                styles.tile,
                photo ? "" : styles.tileEmpty,
                photo && index === 0 ? styles.tileCover : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {photo ? (
                <>
                  <img className={styles.photo} src={photo} alt={`Foto ${index + 1}`} />
                  {index === 0 && <span className={styles.mainBadge}>Principal</span>}
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => handleRemove(index)}
                    aria-label="Remover foto"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M5 5l14 14M19 5L5 19"
                        stroke="#fff"
                        strokeWidth={3.8}
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  {index > 0 && (
                    <button
                      type="button"
                      className={styles.makeMainButton}
                      onClick={() => handleMakeMain(index)}
                    >
                      Tornar principal
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  className={styles.tile}
                  style={{ position: "absolute", inset: 0, border: 0 }}
                  onClick={() => inputRefs.current[index]?.click()}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 5v14M5 12h14"
                      stroke="#8B5CF6"
                      strokeWidth={2.8}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className={styles.addLabel}>Adicionar</span>
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
