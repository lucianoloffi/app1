import { useEffect, useState } from "react";
import { carregarNumeros, type NumerosDoPainel, type PeriodoDoPainel } from "../lib/api/admin";
import { mensagemDeErro } from "../lib/errors";
import { DailyChart } from "./DailyChart";
import { Funnel } from "./Funnel";
import styles from "./NumbersScreen.module.css";

const PERIODOS: { valor: PeriodoDoPainel; rotulo: string }[] = [
  { valor: "hoje", rotulo: "Hoje" },
  { valor: "7d", rotulo: "7 dias" },
  { valor: "30d", rotulo: "30 dias" },
  { valor: "90d", rotulo: "90 dias" },
];

/**
 * Dia em que o app começou a registrar os dias de uso (migration 0013). Antes
 * dele, "usuário ativo" só conta quem curtiu ou mandou mensagem naquele dia,
 * que é o que dava para recuperar: os números antigos ficam abaixo do real.
 */
const INICIO_DOS_REGISTROS = "21/09/2026";

const numero = (n: number) => n.toLocaleString("pt-BR");
const dataCurta = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");
const porcentagem = (parte: number, todo: number) =>
  todo > 0 ? `${Math.round((parte / todo) * 100)}%` : "—";

export function NumbersScreen() {
  const [periodo, setPeriodo] = useState<PeriodoDoPainel>("30d");
  // Guarda o período junto com os números: enquanto não chegam os do período
  // escolhido, a tela sabe que está carregando sem um estado a mais.
  const [dados, setDados] = useState<{ periodo: PeriodoDoPainel; numeros: NumerosDoPainel } | null>(
    null,
  );
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    carregarNumeros(periodo)
      .then((numeros) => {
        if (!ativo) return;
        setDados({ periodo, numeros });
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
  const n = dados?.numeros;

  return (
    <main className={styles.conteudo} aria-busy={carregando}>
      <div className={styles.tituloLinha}>
        <div className={styles.titulo}>
          <h1 className={styles.h1}>Números</h1>
          {n && (
            <span className={styles.intervalo}>
              {n.inicio === n.fim
                ? `hoje, ${dataCurta(n.fim)}`
                : `${dataCurta(n.inicio)} a ${dataCurta(n.fim)}`}
            </span>
          )}
          {carregando && <span className={styles.intervalo}>atualizando…</span>}
        </div>
        <div className={styles.periodos} role="group" aria-label="Período">
          {PERIODOS.map((p) => (
            <button
              key={p.valor}
              type="button"
              aria-pressed={p.valor === periodo}
              className={
                p.valor === periodo ? `${styles.periodo} ${styles.periodoAtivo}` : styles.periodo
              }
              onClick={() => setPeriodo(p.valor)}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
      </div>

      {erro && (
        <div className={styles.erro} role="alert">
          <span>{erro}</span>
          <button
            type="button"
            className={styles.erroBotao}
            onClick={() => setTentativa((t) => t + 1)}
          >
            Tentar de novo
          </button>
        </div>
      )}

      {n && (
        <div className={carregando ? `${styles.corpo} ${styles.corpoCarregando}` : styles.corpo}>
          <div className={styles.cartoes}>
            <div className={`${styles.cartao} ${styles.cartaoDestaque}`}>
              <span className={styles.cartaoTitulo}>Ativos com match</span>
              <span className={styles.cartaoValor}>
                {porcentagem(n.ativosComMatch, n.ativos)}
              </span>
              <span className={styles.cartaoApoio}>
                {n.ativos > 0
                  ? `dos usuários ativos tiveram pelo menos 1 match (${numero(n.ativosComMatch)} de ${numero(n.ativos)}).`
                  : "Ainda sem usuários ativos no período."}
              </span>
            </div>
            <div className={styles.cartao}>
              <span className={styles.cartaoTitulo}>Novos usuários</span>
              <span className={styles.cartaoValor}>{numero(n.novosUsuarios)}</span>
              <span className={styles.cartaoApoio}>contas criadas no período.</span>
            </div>
            <div className={styles.cartao}>
              <span className={styles.cartaoTitulo}>Usuários ativos</span>
              <span className={styles.cartaoValor}>{numero(n.ativos)}</span>
              <span className={styles.cartaoApoio}>
                {periodo === "hoje"
                  ? "usaram o app hoje."
                  : `usaram o app no período · ${numero(n.ativosHoje)} hoje.`}
              </span>
            </div>
            <div className={styles.cartao}>
              <span className={styles.cartaoTitulo}>Conversas iniciadas</span>
              <span className={styles.cartaoValor}>
                {porcentagem(n.matchesComConversa, n.matches)}
              </span>
              <span className={styles.cartaoApoio}>
                {n.matches > 0
                  ? `dos matches tiveram pelo menos 1 mensagem (${numero(n.matchesComConversa)} de ${numero(n.matches)}).`
                  : "Nenhum match no período."}
              </span>
            </div>
          </div>

          <section className={styles.bloco}>
            <div className={styles.blocoTopo}>
              <h2 className={styles.h2}>Últimos 30 dias</h2>
              <span className={styles.legenda}>
                <span className={styles.legendaAtivos} aria-hidden="true" />
                Usuários ativos
              </span>
              <span className={styles.legenda}>
                <span className={styles.legendaNovos} aria-hidden="true" />
                Novos usuários
              </span>
            </div>
            <DailyChart dias={n.porDia} />
            <p className={styles.nota}>
              Os dias de uso passaram a ser registrados em {INICIO_DOS_REGISTROS}. Antes disso,
              só conta como ativo quem curtiu ou mandou mensagem no dia.
            </p>
          </section>

          {/* O funil ao lado das cidades, e o gráfico dos 30 dias em cima, na
              largura toda (pedido do Lu em 25/09): com o funil sozinho numa
              linha, as faixas ficavam compridas e sobrava espaço dos lados. */}
          <div className={styles.linhaDeBaixo}>
            <Funnel periodo={periodo} />

            <section className={styles.bloco}>
              <div className={styles.blocoTitulo}>
                <h2 className={styles.h2}>Cidades com mais usuários</h2>
                <span className={styles.apoioBloco}>Pessoas que usaram o app no período.</span>
              </div>
              {n.cidades.length === 0 ? (
                <p className={styles.vazio}>Ainda sem usuários ativos no período.</p>
              ) : (
                <ol className={styles.cidades}>
                  {n.cidades.map((c, i) => (
                    <li key={c.cidade} className={styles.cidade}>
                      <div className={styles.cidadeLinha}>
                        <span className={styles.cidadePosicao}>{i + 1}.</span>
                        <span className={styles.cidadeNome}>{c.cidade}</span>
                        <span className={styles.cidadeTotal}>
                          {numero(c.usuarios)} {c.usuarios === 1 ? "usuário" : "usuários"}
                        </span>
                      </div>
                      <span className={styles.cidadeDivisao}>
                        Homens {porcentagem(c.homens, c.usuarios)} · Mulheres{" "}
                        {porcentagem(c.mulheres, c.usuarios)} · Outros{" "}
                        {porcentagem(c.outros, c.usuarios)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
