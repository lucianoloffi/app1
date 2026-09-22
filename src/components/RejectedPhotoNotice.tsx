import type { MyPhoto } from "../types";
import styles from "./RejectedPhotoNotice.module.css";

/**
 * Marca sobre a foto reprovada, nas grades de fotos: um véu que esmaece a foto
 * (para ela não passar por uma foto que conta) e a palavra "Reprovada". Vai
 * dentro do quadro da foto, que precisa ser position: relative.
 */
export function RejectedPhotoBadge() {
  return (
    <>
      <span className={styles.veil} aria-hidden="true" />
      <span className={styles.badge}>Reprovada</span>
    </>
  );
}

interface RejectedPhotoNoticeProps {
  photos: MyPhoto[];
  /** Sem ele, o aviso cita as diretrizes sem link (não há de onde abri-las). */
  onOpenGuidelines?: () => void;
  /** Botão opcional no fim do aviso, para levar a pessoa até onde ela resolve. */
  action?: { label: string; onClick: () => void };
}

/**
 * Aviso para a dona das fotos quando a moderação reprovou alguma. Antes da
 * reprovação ela não ficava sabendo de nada: a foto continuava aparecendo para
 * ela como sempre, os outros deixavam de vê-la, e quem ficava sem nenhuma foto
 * aprovada sumia da fila sem entender por quê. Não aparece quando não há foto
 * reprovada.
 */
export function RejectedPhotoNotice({ photos, onOpenGuidelines, action }: RejectedPhotoNoticeProps) {
  const reprovadas = photos.filter((foto) => foto.status === "rejeitada").length;
  if (reprovadas === 0) return null;

  const semAprovada = !photos.some((foto) => foto.status === "aprovada");
  const uma = reprovadas === 1;

  return (
    <div className={styles.notice} role="status">
      <p className={styles.title}>
        {uma ? "1 foto reprovada pela moderação" : `${reprovadas} fotos reprovadas pela moderação`}
      </p>
      <p className={styles.text}>
        {uma
          ? "Ela está marcada como reprovada e só você a vê — ninguém mais no Lovi. "
          : "Elas estão marcadas como reprovadas e só você as vê — ninguém mais no Lovi. "}
        {uma ? "Apague-a e envie outra que siga as " : "Apague-as e envie outras que sigam as "}
        {onOpenGuidelines ? (
          <button type="button" className={styles.link} onClick={onOpenGuidelines}>
            Diretrizes de Comunidade
          </button>
        ) : (
          "Diretrizes de Comunidade"
        )}
        .
      </p>
      {semAprovada && (
        <p className={styles.strong}>
          Enquanto você não tiver nenhuma foto aprovada, seu perfil não aparece para ninguém na
          fila.
        </p>
      )}
      {action && (
        <button type="button" className={styles.action} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
