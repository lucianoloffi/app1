import { useEffect, useState } from "react";
import {
  analisarVerificacao,
  carregarVerificacoes,
  limparSelfies,
  type AcaoDeVerificacao,
  type FilaDeVerificacao,
  type FiltroDaVerificacao,
  type VerificacaoDoPainel,
} from "../lib/api/admin";
import { mensagemDeErro } from "../lib/errors";
import { dataHora } from "./datas";
import { PersonSummary } from "./PersonSummary";
import styles from "./VerificationScreen.module.css";

const FILTROS: { valor: FiltroDaVerificacao; rotulo: string }[] = [
  { valor: "pendentes", rotulo: "Esperando" },
  { valor: "decididas", rotulo: "Decididas" },
];

interface VerificationScreenProps {
  /** Devolve quantas pessoas esperam análise, para o aviso na aba do topo. */
  onContagem: (pendentes: number) => void;
}

export function VerificationScreen({ onContagem }: VerificationScreenProps) {
  const [filtro, setFiltro] = useState<FiltroDaVerificacao>("pendentes");
  const [dados, setDados] = useState<{
    filtro: FiltroDaVerificacao;
    fila: FilaDeVerificacao;
  } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  /** Quem está esperando o "Confirmar" para perder o selo que já tem. */
  const [confirmando, setConfirmando] = useState<string | null>(null);
  /** Id de quem está com uma ação indo para o servidor. */
  const [aplicando, setAplicando] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    carregarVerificacoes(filtro)
      .then((fila) => {
        if (!ativo) return;
        setDados({ filtro, fila });
        setErro(null);
        onContagem(fila.pendentes);
      })
      .catch((problema) => {
        if (ativo) setErro(mensagemDeErro(problema));
      });
    return () => {
      ativo = false;
    };
  }, [filtro, tentativa, onContagem]);

  const carregando = !erro && dados?.filtro !== filtro;
  // Mesmo motivo da tela de Moderação: a lista do filtro antigo tem outros
  // botões, e decidir sobre ela lendo "Esperando" no topo seria decidir sobre
  // a lista errada.
  const fila = erro && dados?.filtro !== filtro ? undefined : dados?.fila;

  async function aplicar(item: VerificacaoDoPainel, acao: AcaoDeVerificacao) {
    setConfirmando(null);
    setAplicando(item.pessoa.id);
    try {
      const feito = await analisarVerificacao(item.pessoa.id, acao);
      setAviso(
        (acao === "aprovar"
          ? `${feito.nome} recebeu o selo de verificado.`
          : `${feito.nome} ficou sem o selo.`) + textoDaLimpeza(feito.selfiesNaoApagadas.length),
      );
      setTentativa((t) => t + 1);
    } catch (problema) {
      setErro(mensagemDeErro(problema));
    } finally {
      setAplicando(null);
    }
  }

  /** Segunda chance para a selfie que não saiu do bucket na hora da decisão. */
  async function apagarDeNovo(item: VerificacaoDoPainel) {
    setAplicando(item.pessoa.id);
    try {
      const sobraram = await limparSelfies(item.selfies.map((selfie) => selfie.path));
      setAviso(
        sobraram.length === 0
          ? `A selfie de ${item.pessoa.nome} saiu do servidor.`
          : `A selfie de ${item.pessoa.nome} continua no servidor. Tente de novo em instantes.`,
      );
      setTentativa((t) => t + 1);
    } catch (problema) {
      setErro(mensagemDeErro(problema));
    } finally {
      setAplicando(null);
    }
  }

  return (
    <main className={styles.conteudo} aria-busy={carregando}>
      <div className={styles.tituloLinha}>
        <div className={styles.titulo}>
          <h1 className={styles.h1}>Verificação</h1>
          {fila && (
            <span className={styles.intervalo}>
              {fila.pendentes === 0
                ? "ninguém esperando"
                : fila.pendentes === 1
                  ? "1 pessoa esperando análise"
                  : `${fila.pendentes} pessoas esperando análise`}
            </span>
          )}
          {carregando && <span className={styles.intervalo}>atualizando…</span>}
        </div>
        <div className={styles.filtros} role="group" aria-label="Filtro">
          {FILTROS.map((item) => (
            <button
              key={item.valor}
              type="button"
              aria-pressed={item.valor === filtro}
              className={
                item.valor === filtro ? `${styles.filtro} ${styles.filtroAtivo}` : styles.filtro
              }
              onClick={() => {
                setConfirmando(null);
                setAviso(null);
                setFiltro(item.valor);
              }}
            >
              {item.rotulo}
            </button>
          ))}
        </div>
      </div>

      {/* Que a selfie some depois da decisão é o que o app promete a quem a
          enviou, com essas palavras. Está escrito aqui porque muda o jeito de
          trabalhar: não dá para decidir agora e conferir a foto depois. */}
      <p className={styles.nota}>
        Compare a selfie com as fotos do perfil. A selfie é apagada do servidor assim que a decisão
        é registrada — é o que o app promete a quem a envia, então não há como revê-la depois.
      </p>

      {erro && (
        <div className={styles.erro} role="alert">
          <span>{erro}</span>
          <button
            type="button"
            className={styles.erroBotao}
            onClick={() => {
              setErro(null);
              setTentativa((t) => t + 1);
            }}
          >
            Tentar de novo
          </button>
        </div>
      )}

      {aviso && (
        <p className={styles.aviso} role="status">
          {aviso}
        </p>
      )}

      {fila && fila.itens.length === 0 && (
        <div className={styles.vazio}>
          <p className={styles.vazioTitulo}>
            {filtro === "pendentes"
              ? "Ninguém esperando análise."
              : "Nenhuma verificação decidida ainda."}
          </p>
          <p className={styles.vazioApoio}>
            {filtro === "pendentes"
              ? "Quem pedir o selo pelo app aparece aqui, com a selfie e as fotos do perfil lado a lado."
              : "O que for aprovado ou recusado fica nesta lista."}
          </p>
        </div>
      )}

      {fila && fila.itens.length > 0 && (
        <div className={carregando ? `${styles.lista} ${styles.listaCarregando}` : styles.lista}>
          {fila.itens.map((item) => (
            <CartaoDeVerificacao
              key={item.pessoa.id}
              item={item}
              confirmando={confirmando === item.pessoa.id}
              aplicando={aplicando === item.pessoa.id}
              onAplicar={(acao) => void aplicar(item, acao)}
              onPedirConfirmacao={() => setConfirmando(item.pessoa.id)}
              onCancelar={() => setConfirmando(null)}
              onApagarDeNovo={() => void apagarDeNovo(item)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function textoDaLimpeza(sobraram: number): string {
  if (sobraram === 0) return " A selfie saiu do servidor.";
  return sobraram === 1
    ? " Mas a selfie NÃO saiu do servidor — veja em Decididas e apague."
    : ` Mas ${sobraram} selfies NÃO saíram do servidor — veja em Decididas e apague.`;
}

interface CartaoProps {
  item: VerificacaoDoPainel;
  confirmando: boolean;
  aplicando: boolean;
  onAplicar: (acao: AcaoDeVerificacao) => void;
  onPedirConfirmacao: () => void;
  onCancelar: () => void;
  onApagarDeNovo: () => void;
}

function CartaoDeVerificacao({
  item,
  confirmando,
  aplicando,
  onAplicar,
  onPedirConfirmacao,
  onCancelar,
  onApagarDeNovo,
}: CartaoProps) {
  // Vale o item, e não o filtro escolhido no topo: enquanto o filtro novo
  // carrega, a lista na tela ainda é a do filtro antigo, e ler o filtro daria
  // ao cartão pendente os botões de um cartão já decidido. Sem pedido
  // esperando, a análise acabou.
  const decidida = item.pedidoEm === null;
  const temSelo = item.pessoa.verificacaoStatus === "aprovada";

  return (
    <article className={styles.cartao}>
      <PersonSummary pessoa={item.pessoa}>
        {!decidida && item.pedidoEm && (
          <span className={styles.selo}>pediu em {dataHora(item.pedidoEm)}</span>
        )}
      </PersonSummary>

      {!decidida && (
        <div className={styles.comparacao}>
          <section className={styles.coluna}>
            <h3 className={styles.colunaTitulo}>
              {item.selfies.length === 1 ? "Selfie enviada" : `${item.selfies.length} selfies enviadas`}
            </h3>
            <div className={styles.selfies}>
              {item.selfies.length === 0 ? (
                <span className={styles.semArquivo}>a selfie não está mais no servidor</span>
              ) : (
                item.selfies.map((selfie) =>
                  selfie.url ? (
                    <a
                      key={selfie.path}
                      href={selfie.url}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.selfie}
                    >
                      <img src={selfie.url} alt="" />
                    </a>
                  ) : (
                    // A assinatura pode falhar, e o quadro vazio sem explicação
                    // faria parecer que a pessoa não enviou nada.
                    <span key={selfie.path} className={styles.selfie}>
                      <span className={styles.semArquivo}>não abriu</span>
                    </span>
                  ),
                )
              )}
            </div>
          </section>

          <section className={styles.coluna}>
            <h3 className={styles.colunaTitulo}>Fotos do perfil</h3>
            <div className={styles.fotos}>
              {item.fotos.length === 0 ? (
                <span className={styles.semArquivo}>sem foto no perfil</span>
              ) : (
                item.fotos.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className={styles.foto}>
                    <img src={url} alt="" />
                  </a>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {decidida ? (
        <div className={styles.acoes}>
          <span className={styles.notaAcao}>
            {temSelo ? "Selo aprovado" : "Selo recusado"}
            {item.decididoPor ? ` por ${item.decididoPor}` : ""}
            {item.decididoEm ? ` em ${dataHora(item.decididoEm)}` : ""}
          </span>
          {/* A selfie que não saiu do bucket precisa aparecer em algum lugar:
              a promessa feita a quem a enviou foi que ela some depois da
              análise, e um apagamento que falhou em silêncio quebraria isso
              sem ninguém saber. */}
          {item.selfies.length > 0 && (
            <>
              <span className={`${styles.notaAcao} ${styles.notaGrave}`}>
                {item.selfies.length === 1
                  ? "A selfie continua no servidor."
                  : `${item.selfies.length} selfies continuam no servidor.`}
              </span>
              <button
                type="button"
                className={`${styles.botao} ${styles.botaoGrave}`}
                disabled={aplicando}
                onClick={onApagarDeNovo}
              >
                {aplicando ? "Apagando…" : "Apagar agora"}
              </button>
            </>
          )}
          {temSelo &&
            (confirmando ? (
              <>
                <span className={styles.pergunta}>
                  Tirar o selo de {item.pessoa.nome}? O app vai pedir outra selfie a ela.
                </span>
                <button
                  type="button"
                  className={`${styles.botao} ${styles.botaoGrave}`}
                  disabled={aplicando}
                  onClick={() => onAplicar("recusar")}
                >
                  {aplicando ? "Aplicando…" : "Confirmar"}
                </button>
                <button
                  type="button"
                  className={styles.botao}
                  disabled={aplicando}
                  onClick={onCancelar}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.botao}
                disabled={aplicando}
                onClick={onPedirConfirmacao}
              >
                Tirar o selo
              </button>
            ))}
        </div>
      ) : (
        <div className={styles.acoes}>
          <span className={styles.notaAcao}>
            Aprovar dá o selo de verificado; recusar faz o app pedir outra selfie, sem dizer o
            motivo.
          </span>
          <button
            type="button"
            className={styles.botao}
            disabled={aplicando}
            onClick={() => onAplicar("recusar")}
          >
            Recusar
          </button>
          <button
            type="button"
            className={`${styles.botao} ${styles.botaoPrincipal}`}
            disabled={aplicando}
            onClick={() => onAplicar("aprovar")}
          >
            {aplicando ? "Aplicando…" : "Aprovar o selo"}
          </button>
        </div>
      )}
    </article>
  );
}
