import type { AcaoDeFoto, FotoDoPainel } from "../lib/api/admin";
import styles from "./PhotoGrid.module.css";

interface PhotoGridProps {
  fotos: FotoDoPainel[];
  /** Enquanto uma ação está indo para o servidor, os botões ficam travados. */
  ocupado: boolean;
  onModerar: (ids: string[], acao: AcaoDeFoto) => void;
  /**
   * Marca as fotos que ninguém olhou ainda. Vale na aba Fotos, onde é isso que
   * diz o que falta fazer; na denúncia não, porque ali o assunto é a denúncia.
   */
  destacarNovas?: boolean;
}

/**
 * As fotos de uma pessoa, com a ação de cada uma. Mesmo componente na aba
 * Fotos e dentro da denúncia: "fotos falsas ou de outra pessoa" é motivo de
 * denúncia, e obrigar a procurar a pessoa noutra tela para derrubar a foto era
 * o mesmo que não ter a ação.
 */
export function PhotoGrid({ fotos, ocupado, onModerar, destacarNovas }: PhotoGridProps) {
  if (fotos.length === 0) {
    return <span className={styles.semFoto}>sem foto</span>;
  }

  return (
    <ul className={styles.grade}>
      {fotos.map((foto) => {
        const rejeitada = foto.status === "rejeitada";
        const nova = destacarNovas && foto.moderadaEm === null && !rejeitada;
        return (
          <li
            key={foto.id}
            className={[styles.item, rejeitada ? styles.itemRejeitada : "", nova ? styles.itemNova : ""]
              .filter(Boolean)
              .join(" ")}
          >
            {/* Sem URL a imagem não carrega e o quadro fica vazio sem explicação:
                a assinatura pode falhar, e o admin precisa saber que o problema
                é abrir o arquivo, não a foto não existir. */}
            {foto.url ? (
              <a href={foto.url} target="_blank" rel="noreferrer" className={styles.moldura}>
                <img src={foto.url} alt="" />
              </a>
            ) : (
              <span className={styles.moldura}>
                <span className={styles.semUrl}>não abriu</span>
              </span>
            )}

            <div className={styles.rodape}>
              <span className={styles.marcas}>
                {foto.principal && <span className={styles.marca}>capa</span>}
                {rejeitada && <span className={`${styles.marca} ${styles.marcaGrave}`}>fora do ar</span>}
                {nova && <span className={`${styles.marca} ${styles.marcaNova}`}>nova</span>}
              </span>
              <button
                type="button"
                className={rejeitada ? styles.acao : `${styles.acao} ${styles.acaoGrave}`}
                disabled={ocupado}
                onClick={() => onModerar([foto.id], rejeitada ? "aprovar" : "rejeitar")}
              >
                {rejeitada ? "Devolver" : "Rejeitar"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
