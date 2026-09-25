import { useEffect, useState } from "react";
import { carregarFunil, type FunilDoPainel, type PeriodoDoPainel } from "../lib/api/admin";
import { mensagemDeErro } from "../lib/errors";
import styles from "./Funnel.module.css";

const ETAPAS: { chave: keyof FunilDoPainel; rotulo: string; passagem: string }[] = [
  { chave: "contas", rotulo: "Criaram a conta", passagem: "" },
  { chave: "cadastro", rotulo: "Concluíram o cadastro", passagem: "criar a conta e concluir o cadastro" },
  { chave: "curtida", rotulo: "Curtiram alguém", passagem: "concluir o cadastro e curtir alguém" },
  { chave: "match", rotulo: "Deram match", passagem: "curtir e dar match" },
  { chave: "conversa", rotulo: "Conversaram", passagem: "dar match e conversar" },
  { chave: "resposta", rotulo: "Tiveram resposta", passagem: "conversar e ter resposta" },
];

const porcentagem = (parte: number, todo: number) =>
  todo > 0 ? `${Math.round((parte / todo) * 100)}%` : "—";

/**
 * Onde as pessoas param entre criar a conta e conversar. Cada número é de
 * pessoas (não de matches), e todas criaram a conta no período escolhido:
 * misturar quem entrou há um mês com quem entrou ontem esconderia o buraco.
 */
export function Funnel({ periodo }: { periodo: PeriodoDoPainel }) {
  const [dados, setDados] = useState<{ periodo: PeriodoDoPainel; funil: FunilDoPainel } | null>(
    null,
  );
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    carregarFunil(periodo)
      .then((funil) => {
        if (!ativo) return;
        setDados({ periodo, funil });
        setErro(null);
      })
      .catch((problema) => {
        if (ativo) setErro(mensagemDeErro(problema));
      });
    return () => {
      ativo = false;
    };
  }, [periodo, tentativa]);

  const carregando = !erro && dados?.periodo !== periodo;
  const f = dados?.funil;

  const linhas = f
    ? ETAPAS.map((etapa, i) => {
        const valor = f[etapa.chave] as number;
        const anterior = i === 0 ? null : (f[ETAPAS[i - 1].chave] as number);
        return { ...etapa, valor, anterior };
      })
    : [];

  // A passagem com menos gente seguindo em frente, que é por onde começar.
  // Só entre etapas com alguém antes: 0 de 0 não é perda.
  const maiorPerda = linhas
    .filter((linha) => linha.anterior !== null && linha.anterior > 0)
    .reduce<(typeof linhas)[number] | null>(
      (pior, linha) =>
        pior === null || linha.valor / linha.anterior! < pior.valor / pior.anterior! ? linha : pior,
      null,
    );

  return (
    <section
      className={carregando ? `${styles.bloco} ${styles.carregando}` : styles.bloco}
      aria-busy={carregando}
    >
      <div className={styles.titulo}>
        <h2 className={styles.h2}>Funil</h2>
        <span className={styles.apoio}>
          Contas criadas no período, acompanhadas até hoje. Sem os perfis de teste e as contas
          de admin{f && f.foraDaConta > 0 ? ` (${f.foraDaConta} no período)` : ""}.
        </span>
      </div>

      {erro && (
        <div className={styles.erro} role="alert">
          <span>{erro}</span>
          <button type="button" className={styles.erroBotao} onClick={() => setTentativa((t) => t + 1)}>
            Tentar de novo
          </button>
        </div>
      )}

      {f && f.contas === 0 && <p className={styles.vazio}>Nenhuma conta criada no período.</p>}

      {f && f.contas > 0 && (
        <>
          <ol className={styles.etapas}>
            {linhas.map((linha) => (
              <li key={linha.chave} className={styles.etapa}>
                <span className={styles.rotulo}>{linha.rotulo}</span>
                <span className={styles.trilho} aria-hidden="true">
                  <span
                    className={styles.barra}
                    style={{ width: `${(linha.valor / f.contas) * 100}%` }}
                  />
                </span>
                <span className={styles.valor}>{linha.valor.toLocaleString("pt-BR")}</span>
                <span className={styles.seguiram}>
                  {linha.anterior === null
                    ? "todas"
                    : `${porcentagem(linha.valor, linha.anterior)} da etapa anterior`}
                </span>
              </li>
            ))}
          </ol>
          {maiorPerda && maiorPerda.valor < maiorPerda.anterior! && (
            <p className={styles.destaque}>
              Maior perda: entre {maiorPerda.passagem}. De {maiorPerda.anterior} pessoas,{" "}
              {maiorPerda.valor} seguiram ({porcentagem(maiorPerda.valor, maiorPerda.anterior!)}).
            </p>
          )}
          <p className={styles.nota}>
            “Conversaram” é ter um match em que alguém escreveu; “Tiveram resposta”, um em que os
            dois escreveram. Conta excluída sai do funil.
          </p>
        </>
      )}
    </section>
  );
}
