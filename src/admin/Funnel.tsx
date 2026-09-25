import { Fragment, useEffect, useState, type CSSProperties } from "react";
import {
  carregarFunil,
  type EtapasDoFunil,
  type FunilDoPainel,
  type PeriodoDoPainel,
} from "../lib/api/admin";
import { mensagemDeErro } from "../lib/errors";
import styles from "./Funnel.module.css";

const ETAPAS: { chave: keyof EtapasDoFunil; rotulo: string; passagem: string }[] = [
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
 * Largura da faixa em % do bloco. Com um mínimo, para o número caber dentro
 * mesmo quando a etapa tem uma pessoa só.
 */
const largura = (valor: number, contas: number) =>
  contas > 0 ? Math.max(12, (valor / contas) * 100) : 0;

function diaCurto(iso: string) {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

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

  return (
    <FunnelView
      funil={dados?.funil ?? null}
      carregando={!erro && dados?.periodo !== periodo}
      erro={erro}
      onTentarDeNovo={() => setTentativa((t) => t + 1)}
    />
  );
}

interface FunnelViewProps {
  funil: FunilDoPainel | null;
  carregando?: boolean;
  erro?: string | null;
  onTentarDeNovo?: () => void;
}

/**
 * Uma informação por lugar (decisão do Lu em 25/09): o número de pessoas
 * dentro da faixa, e entre as faixas só quanto seguiu. A primeira versão, com
 * contorno do período anterior, variação em pontos e tabela colorida por
 * semana, ficou confusa de ler.
 */
export function FunnelView({ funil: f, carregando, erro, onTentarDeNovo }: FunnelViewProps) {
  const linhas = f
    ? ETAPAS.map((etapa, i) => ({
        ...etapa,
        valor: f[etapa.chave],
        antes: i === 0 ? null : f[ETAPAS[i - 1].chave],
      }))
    : [];

  // A passagem com menos gente seguindo em frente, que é por onde começar.
  // Só entre etapas com alguém antes: 0 de 0 não é perda.
  const maiorPerda = linhas
    .filter((linha) => linha.antes !== null && linha.antes > 0)
    .reduce<(typeof linhas)[number] | null>(
      (pior, linha) =>
        pior === null || linha.valor / linha.antes! < pior.valor / pior.antes! ? linha : pior,
      null,
    );

  const semanas = f?.semanas?.filter((semana) => semana.contas > 0) ?? [];

  return (
    <section
      className={carregando ? `${styles.bloco} ${styles.carregando}` : styles.bloco}
      aria-busy={carregando}
    >
      <div className={styles.titulo}>
        <h2 className={styles.h2}>Funil</h2>
        <span className={styles.apoio}>
          Das contas criadas no período, quantas chegaram a cada etapa até hoje. Sem os perfis de
          teste e as contas de admin.
        </span>
      </div>

      {erro && (
        <div className={styles.erro} role="alert">
          <span>{erro}</span>
          <button type="button" className={styles.erroBotao} onClick={onTentarDeNovo}>
            Tentar de novo
          </button>
        </div>
      )}

      {f && f.contas === 0 && <p className={styles.vazio}>Nenhuma conta criada no período.</p>}

      {f && f.contas > 0 && (
        <>
          <ol className={styles.funil}>
            {linhas.map((linha, i) => {
              const proxima = linhas[i + 1];
              const topo = largura(linha.valor, f.contas);
              const base = proxima ? largura(proxima.valor, f.contas) : 0;
              return (
                <Fragment key={linha.chave}>
                  <li className={styles.etapa}>
                    <span className={styles.rotulo}>{linha.rotulo}</span>
                    <span className={styles.pista}>
                      <span className={styles.faixa} style={{ width: `${topo}%` }}>
                        {linha.valor.toLocaleString("pt-BR")}
                      </span>
                    </span>
                  </li>
                  {proxima && (
                    // A área entre as faixas é quem ficou pelo caminho; o
                    // texto nela, quanto seguiu em frente.
                    <li className={styles.passagem}>
                      <span
                        className={styles.ligacao}
                        style={{ "--topo": `${topo}%`, "--base": `${base}%` } as CSSProperties}
                        aria-hidden="true"
                      />
                      <span className={styles.seguiram}>
                        ↓ {porcentagem(proxima.valor, linha.valor)} seguiram
                      </span>
                    </li>
                  )}
                </Fragment>
              );
            })}
          </ol>

          {maiorPerda && maiorPerda.valor < maiorPerda.antes! && (
            <p className={styles.destaque}>
              Maior perda: entre {maiorPerda.passagem}. De {maiorPerda.antes} pessoas,{" "}
              {maiorPerda.valor} seguiram.
            </p>
          )}

          {/* Evolução com uma pergunta só, a que mais importa num app de
              namoro: de quem entrou naquela semana, quantos deram match. */}
          {semanas.length > 1 && (
            <div className={styles.semanas}>
              <h3 className={styles.h3}>Semana a semana</h3>
              <span className={styles.apoio}>
                De quem criou a conta em cada semana, quantos já deram match. A semana mais nova
                ainda teve pouco tempo.
              </span>
              <ul className={styles.listaSemanas}>
                {semanas.map((semana) => (
                  <li key={semana.semana} className={styles.semana}>
                    <span className={styles.semanaData}>Semana de {diaCurto(semana.semana)}</span>
                    <span className={styles.semanaTrilho} aria-hidden="true">
                      <span
                        className={styles.semanaBarra}
                        style={{ width: `${(semana.match / semana.contas) * 100}%` }}
                      />
                    </span>
                    <span className={styles.semanaTexto}>
                      <strong>{porcentagem(semana.match, semana.contas)}</strong> · {semana.match}{" "}
                      de {semana.contas} deram match
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
