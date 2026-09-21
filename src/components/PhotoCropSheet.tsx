import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { recortaImagem } from "../lib/imagem";
import { Spinner } from "./Spinner";
import styles from "./PhotoCropSheet.module.css";

/**
 * Formato de toda foto de perfil: retrato 4:5, o mesmo da lista de fotos do
 * perfil completo. Recortar sempre no mesmo formato evita que cada tela corte
 * o rosto de um jeito diferente.
 */
export const PROPORCAO_DA_FOTO = 4 / 5;
const ZOOM_MAXIMO = 3;

interface PhotoCropSheetProps {
  /** Já validado (validaFotoEscolhida) por quem abre a janela. */
  arquivo: File;
  onCancel: () => void;
  onConfirm: (imagem: Blob) => void;
  onError: (mensagem: string) => void;
}

export function PhotoCropSheet({ arquivo, onCancel, onConfirm, onError }: PhotoCropSheetProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [preparando, setPreparando] = useState(false);

  // Lê a foto como data URL. Com URL.createObjectURL seria preciso revogar o
  // endereço ao fechar, e no StrictMode o React desmonta e remonta o efeito em
  // desenvolvimento: o endereço era revogado com a janela ainda aberta.
  useEffect(() => {
    let ativo = true;
    const leitor = new FileReader();
    leitor.onload = () => {
      if (ativo && typeof leitor.result === "string") setUrl(leitor.result);
    };
    leitor.onerror = () => {
      if (!ativo) return;
      onError("Não foi possível ler a imagem.");
      onCancel();
    };
    leitor.readAsDataURL(arquivo);
    return () => {
      ativo = false;
      leitor.abort();
    };
    // onError e onCancel ficam fora de propósito: quem abre passa uma função nova a cada
    // render, e reler a foto a cada render seria desperdício.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arquivo]);

  async function usarFoto() {
    if (!area || preparando) return;
    setPreparando(true);
    try {
      onConfirm(await recortaImagem(arquivo, area));
    } catch (problema) {
      setPreparando(false);
      onError(
        problema instanceof Error ? problema.message : "Não foi possível processar a imagem.",
      );
    }
  }

  // Portal no body: a janela cobre a tela toda mesmo quando quem a abre está
  // dentro de uma área com rolagem, que cortaria um overlay "absolute".
  return createPortal(
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Ajustar foto">
      <div className={styles.panel}>
        <div className={styles.header}>
          <p className={styles.title}>Ajuste sua foto</p>
          <p className={styles.support}>
            Arraste para posicionar. Use o controle ou dois dedos para aproximar.
          </p>
        </div>

        <div className={styles.cropArea}>
          {url ? (
            <Cropper
              image={url}
              crop={crop}
              zoom={zoom}
              maxZoom={ZOOM_MAXIMO}
              aspect={PROPORCAO_DA_FOTO}
              // "cover": a foto preenche a área e o quadro de recorte ocupa a
              // largura toda. No padrão ("contain"), foto deitada deixava o
              // quadro pequeno, no meio de muito espaço vazio.
              objectFit="cover"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setArea(pixels)}
              // Arquivo com extensão de imagem, mas corrompido: o leitor lê,
              // o navegador não consegue desenhar. Sem isto, a janela ficava
              // aberta sem foto e sem saída além do Cancelar.
              mediaProps={{
                onError: () => {
                  onError("Não foi possível abrir esta imagem. Escolha outra.");
                  onCancel();
                },
              }}
            />
          ) : (
            <div className={styles.loading}>
              <Spinner label="Abrindo a foto" />
            </div>
          )}
        </div>

        <div className={styles.controls}>
          <label className={styles.zoomRow}>
            <span className={styles.zoomIcon} aria-hidden="true">
              −
            </span>
            <input
              className={styles.zoom}
              type="range"
              min={1}
              max={ZOOM_MAXIMO}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Aproximar"
            />
            <span className={styles.zoomIcon} aria-hidden="true">
              +
            </span>
          </label>

          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.cancel}
              onClick={onCancel}
              disabled={preparando}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.confirm}
              onClick={() => void usarFoto()}
              disabled={!area || preparando}
            >
              {preparando ? "Preparando…" : "Usar foto"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
