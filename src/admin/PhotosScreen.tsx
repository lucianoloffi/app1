import { useEffect, useState } from "react";
import {
  carregarFotos,
  moderarFotos,
  type AcaoDeFoto,
  type FilaDeFotos,
  type FiltroDasFotos,
  type PessoaComFotos,
} from "../lib/api/admin";
import { mensagemDeErro } from "../lib/errors";
import { PersonSummary } from "./PersonSummary";
import { PhotoGrid } from "./PhotoGrid";
import styles from "./PhotosScreen.module.css";

const FILTROS: { valor: FiltroDasFotos; rotulo: string }[] = [
  { valor: "novas", rotulo: "Novas" },
  { valor: "rejeitadas", rotulo: "Rejeitadas" },
];

interface PhotosScreenProps {
  /** Devolve quantas pessoas têm foto por olhar, para o aviso na aba do topo. */
  onContagem: (novas: number) => void;
}

export function PhotosScreen({ onContagem }: PhotosScreenProps) {
  const [filtro, setFiltro] = useState<FiltroDasFotos>("novas");
  // Mesmo desenho das outras telas do painel: o filtro viaja junto com os
  // dados, então "está carregando" é saber que o que está na tela é do filtro
  // antigo — e o filtro antigo tem outros botões.
  const [dados, setDados] = useState<{ filtro: FiltroDasFotos; fila: FilaDeFotos } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  /** Id de quem está com uma ação indo para o servidor. */
  const [aplicando, setAplicando] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    carregarFotos(filtro)
      .then((fila) => {
        if (!ativo) return;
        setDados({ filtro, fila });
        setErro(null);
        onContagem(fila.novas);
      })
      .catch((problema) => {
        if (ativo) setErro(mensagemDeErro(problema));
      });
    return () => {
      ativo = false;
    };
  }, [filtro, tentativa, onContagem]);

  const carregando = !erro && dados?.filtro !== filtro;
  const fila = erro && dados?.filtro !== filtro ? undefined : dados?.fila;

  async function aplicar(item: PessoaComFotos, ids: string[], acao: AcaoDeFoto) {
    setAplicando(item.pessoa.id);
    try {
      const feito = await moderarFotos(ids, acao);
      const quantas = feito.fotos === 1 ? "Foto" : `${feito.fotos} fotos`;
      setAviso(
        acao === "rejeitar"
          ? `${quantas} de ${feito.nome} fora do ar.` +
              // Derrubar a última foto aprovada tira a pessoa da fila dos
              // outros. Não é motivo para impedir — a foto pode ser o problema
              // —, mas é a hora de pensar em suspender em vez de só derrubar.
              (feito.semFotoAprovada
                ? " Não sobrou nenhuma foto aprovada, e o perfil sumiu da fila dos outros."
                : "")
          : `${quantas} de ${feito.nome} no ar, e já revisadas.`,
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
          <h1 className={styles.h1}>Fotos</h1>
          {fila && (
            <span className={styles.intervalo}>
              {fila.novas === 0
                ? "nada por olhar"
                : fila.novas === 1
                  ? "1 pessoa com foto por olhar"
                  : `${fila.novas} pessoas com foto por olhar`}
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
                setAviso(null);
                setFiltro(item.valor);
              }}
            >
              {item.rotulo}
            </button>
          ))}
        </div>
      </div>

      {/* A foto entra no ar na hora e esta fila é a revisão depois do fato.
          Está escrito porque a diferença muda o que o admin faz: aqui não há
          ninguém esperando liberação, e deixar a fila para amanhã não deixa
          perfil nenhum sem foto. */}
      <p className={styles.nota}>
        A foto aparece assim que é enviada — esta lista é a revisão depois do fato. Rejeitar tira a
        foto do perfil que os outros veem, sem apagá-la: dá para devolver, e uma denúncia sobre
        aquela foto continua com a foto.
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
            {filtro === "novas"
              ? "Todas as fotos já foram olhadas."
              : "Nenhuma foto foi rejeitada até agora."}
          </p>
          <p className={styles.vazioApoio}>
            {filtro === "novas"
              ? "Foto nova aparece aqui assim que alguém enviar."
              : "O que for derrubado fica nesta lista, com o caminho de volta."}
          </p>
        </div>
      )}

      {fila && fila.itens.length > 0 && (
        <div className={carregando ? `${styles.lista} ${styles.listaCarregando}` : styles.lista}>
          {fila.itens.map((item) => (
            <CartaoDeFotos
              key={item.pessoa.id}
              item={item}
              aplicando={aplicando === item.pessoa.id}
              onModerar={(ids, acao) => void aplicar(item, ids, acao)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

interface CartaoProps {
  item: PessoaComFotos;
  aplicando: boolean;
  onModerar: (ids: string[], acao: AcaoDeFoto) => void;
}

function CartaoDeFotos({ item, aplicando, onModerar }: CartaoProps) {
  // "Já olhei estas e não têm nada de errado" é a resposta mais comum da fila,
  // e sem um botão para ela a pessoa continuaria aparecendo todo dia.
  //
  // A foto já rejeitada fica de fora: ela não está esperando decisão, e como o
  // botão aprova em lote, incluí-la devolveria ao ar o que alguém derrubou de
  // propósito. Acontece com as rejeitadas à mão, anteriores à 0021, que ficaram
  // sem moderada_em.
  const porOlhar = item.fotos.filter(
    (foto) => foto.moderadaEm === null && foto.status !== "rejeitada",
  );

  return (
    <article className={styles.cartao}>
      <PersonSummary pessoa={item.pessoa} />
      <PhotoGrid fotos={item.fotos} ocupado={aplicando} onModerar={onModerar} destacarNovas />
      {porOlhar.length > 0 && (
        <div className={styles.acoes}>
          <span className={styles.notaAcao}>
            {porOlhar.length === 1
              ? "1 foto ainda não foi olhada."
              : `${porOlhar.length} fotos ainda não foram olhadas.`}
          </span>
          <button
            type="button"
            className={styles.botao}
            disabled={aplicando}
            onClick={() => onModerar(porOlhar.map((foto) => foto.id), "aprovar")}
          >
            {porOlhar.length === 1 ? "Marcar como vista" : "Marcar todas como vistas"}
          </button>
        </div>
      )}
    </article>
  );
}
