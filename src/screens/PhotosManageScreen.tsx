import { useRef } from "react";
import { PhotoCropSheet } from "../components/PhotoCropSheet";
import { ScreenHeader } from "../components/ScreenHeader";
import { Spinner } from "../components/Spinner";
import { useEscolhaDeFoto } from "../hooks/useEscolhaDeFoto";
import { MAX_PROFILE_PHOTOS } from "../onboarding/constants";
import styles from "./PhotosManageScreen.module.css";

interface PhotosManageScreenProps {
  photos: string[];
  busy?: boolean;
  onAddPhoto: (image: Blob) => Promise<void>;
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
  onShowToast,
}: PhotosManageScreenProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const slots = [...photos, ...Array(MAX_PROFILE_PHOTOS).fill(null)].slice(0, MAX_PROFILE_PHOTOS);

  // A foto nova sempre entra no fim da lista, seja qual for o espaço vazio
  // tocado: o carregando aparece onde ela vai ficar.
  const foto = useEscolhaDeFoto({
    busy,
    onErro: onShowToast,
    onEnviar: (_indice, imagem) => onAddPhoto(imagem),
  });

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
          {slots.map((photo, index) => {
            const enviando = foto.envio?.indice === index ? foto.envio.previa : null;
            return (
              <div
                key={index}
                aria-busy={enviando ? true : undefined}
                className={[
                  styles.tile,
                  photo || enviando ? "" : styles.tileEmpty,
                  photo && index === 0 ? styles.tileCover : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {enviando ? (
                  <>
                    <img className={styles.photo} src={enviando} alt="" />
                    <span className={styles.uploading}>
                      <Spinner size={24} label="Enviando a foto" />
                      Enviando…
                    </span>
                  </>
                ) : photo ? (
                  <>
                    <img className={styles.photo} src={photo} alt={`Foto ${index + 1}`} />
                    {index === 0 && <span className={styles.mainBadge}>Principal</span>}
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => handleRemove(index)}
                      aria-label="Remover foto"
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
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
                  onChange={(e) => {
                    foto.escolher(photos.length, e.target.files?.[0] ?? null);
                    // Sem limpar, escolher a mesma foto de novo (depois de cancelar
                    // o recorte, por exemplo) não dispara onChange.
                    e.target.value = "";
                  }}
                />
              </div>
            );
          })}
        </div>
        <p className={styles.hint}>{photoHint(photos.length)}</p>
      </div>
      {foto.pendente && (
        <PhotoCropSheet
          arquivo={foto.pendente.arquivo}
          onCancel={foto.cancelar}
          onConfirm={(imagem) => void foto.confirmar(imagem)}
          onError={onShowToast}
        />
      )}
    </div>
  );
}
