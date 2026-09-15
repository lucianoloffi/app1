import { useMemo } from "react";
import { ScreenHeader } from "../components/ScreenHeader";
import { analisaMarkdown, pedacosComNegrito } from "../legal/markdown";
import diretrizes from "../legal/diretrizes-comunidade.md?raw";
import privacidade from "../legal/politica-privacidade.md?raw";
import termos from "../legal/termos-de-uso.md?raw";
import styles from "./LegalScreen.module.css";

export type DocumentoLegal = "termos" | "privacidade" | "diretrizes";

const DOCUMENTOS: Record<DocumentoLegal, { titulo: string; fonte: string }> = {
  termos: { titulo: "Termos de Uso", fonte: termos },
  privacidade: { titulo: "Política de Privacidade", fonte: privacidade },
  diretrizes: { titulo: "Diretrizes de Comunidade", fonte: diretrizes },
};

function Texto({ texto }: { texto: string }) {
  return (
    <>
      {pedacosComNegrito(texto).map((pedaco, indice) =>
        pedaco.forte ? (
          <strong key={indice} className={styles.strong}>
            {pedaco.texto}
          </strong>
        ) : (
          <span key={indice}>{pedaco.texto}</span>
        ),
      )}
    </>
  );
}

interface LegalScreenProps {
  documento: DocumentoLegal;
  onBack: () => void;
}

export function LegalScreen({ documento, onBack }: LegalScreenProps) {
  const { titulo, fonte } = DOCUMENTOS[documento];
  const blocos = useMemo(() => analisaMarkdown(fonte), [fonte]);

  return (
    <div className={styles.screen}>
      <ScreenHeader title={titulo} onBack={onBack} />
      <div className={styles.body}>
        {blocos.map((bloco, indice) => {
          if (bloco.tipo === "titulo") {
            return bloco.nivel === 1 ? (
              <h1 key={indice} className={styles.h1}>
                {bloco.texto}
              </h1>
            ) : (
              <h2 key={indice} className={styles.h2}>
                {bloco.texto}
              </h2>
            );
          }

          if (bloco.tipo === "separador") return <hr key={indice} className={styles.separator} />;

          if (bloco.tipo === "lista") {
            return (
              <ul key={indice} className={styles.list}>
                {bloco.itens.map((item, i) => (
                  <li key={i} className={styles.listItem}>
                    <Texto texto={item} />
                  </li>
                ))}
              </ul>
            );
          }

          if (bloco.tipo === "tabela") {
            return (
              <div key={indice} className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {bloco.cabecalho.map((celula, i) => (
                        <th key={i}>{celula}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bloco.linhas.map((linha, i) => (
                      <tr key={i}>
                        {linha.map((celula, j) => (
                          <td key={j}>
                            <Texto texto={celula} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          return (
            <p key={indice} className={styles.paragraph}>
              <Texto texto={bloco.texto} />
            </p>
          );
        })}
      </div>
    </div>
  );
}
