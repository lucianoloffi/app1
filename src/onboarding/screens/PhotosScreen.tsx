import { useRef } from "react";
import { PhotoCropSheet } from "../../components/PhotoCropSheet";
import { Spinner } from "../../components/Spinner";
import { useEscolhaDeFoto } from "../../hooks/useEscolhaDeFoto";
import { OnboardingLayout } from "../OnboardingLayout";
import { MAX_ONBOARDING_PHOTOS, MIN_ONBOARDING_PHOTOS } from "../constants";
import styles from "./PhotosScreen.module.css";

interface PhotosScreenProps {
  photos: (string | null)[];
  busy?: boolean;
  onPickPhoto: (index: number, image: Blob) => Promise<void>;
  onRemovePhoto: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
  onShowToast: (message: string) => void;
}

export function PhotosScreen({
  photos,
  busy,
  onPickPhoto,
  onRemovePhoto,
  onBack,
  onNext,
  onShowToast,
}: PhotosScreenProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isValid = photos.filter(Boolean).length >= MIN_ONBOARDING_PHOTOS && !busy;

  const foto = useEscolhaDeFoto({ busy, onErro: onShowToast, onEnviar: onPickPhoto });

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
          const enviando = foto.envio?.indice === index ? foto.envio.previa : null;
          return (
            <div
              key={index}
              role="button"
              tabIndex={0}
              className={
                photo || enviando ? `${styles.slot} ${styles.slotFilled}` : `${styles.slot} ${styles.slotEmpty}`
              }
              aria-busy={enviando ? true : undefined}
              onClick={() => handleTap(index)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleTap(index);
              }}
            >
              {enviando ? (
                <>
                  <img className={styles.photo} src={enviando} alt="" />
                  <span className={styles.uploading}>
                    <Spinner label="Enviando a foto" />
                    Enviando…
                  </span>
                </>
              ) : photo ? (
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
                onChange={(e) => {
                  foto.escolher(index, e.target.files?.[0] ?? null);
                  // Sem limpar, escolher a mesma foto de novo (depois de cancelar
                  // o recorte, por exemplo) não dispara onChange.
                  e.target.value = "";
                }}
              />
            </div>
          );
        })}
      </div>
      <p className={styles.note}>Toque para enviar. A primeira foto é a principal.</p>
      {foto.pendente && (
        <PhotoCropSheet
          arquivo={foto.pendente.arquivo}
          onCancel={foto.cancelar}
          onConfirm={(imagem) => void foto.confirmar(imagem)}
          onError={onShowToast}
        />
      )}
    </OnboardingLayout>
  );
}
