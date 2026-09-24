import { useEffect, useRef, useState } from "react";
import {
  carregarModeracao,
  moderar,
  moderarFotos,
  DIAS_DE_SUSPENSAO,
  type AcaoDeFoto,
  type AcaoDeModeracao,
  type DenunciaDoPainel,
  type FilaDeModeracao,
  type FiltroDaModeracao,
} from "../lib/api/admin";
import { mensagemDeErro } from "../lib/errors";
import { dataCurta, dataHora, horaCurta } from "./datas";
import { PhotoGrid } from "./PhotoGrid";
import { AccountEmail } from "./AccountEmail";
import styles from "./ModerationScreen.module.css";

const FILTROS: { valor: FiltroDaModeracao; rotulo: string }[] = [
  { valor: "abertas", rotulo: "Abertas" },
  { valor: "resolvidas", rotulo: "Resolvidas" },
];

const RESOLUCAO_LABEL: Record<NonNullable<DenunciaDoPainel["resolucao"]>, string> = {
  arquivada: "Arquivada",
  suspenso: "Conta suspensa",
  banido: "Conta banida",
};

type AcaoComAjuda = "arquivar" | "suspender" | "banir";

/**
 * O que cada botão faz, no balão do (i) ao lado dele. A diferença entre os três
 * não estava em lugar nenhum da tela, e quem decide uma denúncia precisa saber,
 * antes de clicar, se a pessoa volta sozinha. Escondida atrás do (i) para a
 * tela não repetir a mesma explicação em cada denúncia da fila.
 */
const AJUDA: Record<AcaoComAjuda, { titulo: string; texto: string }> = {
  arquivar: {
    titulo: "Arquivar",
    texto:
      "fecha só esta denúncia. A conta da pessoa continua como está, e o bloqueio entre quem denunciou e quem foi denunciado também.",
  },
  suspender: {
    titulo: `Suspender ${DIAS_DE_SUSPENSAO} dias`,
    texto: `tira a pessoa da fila e das conversas, sem poder curtir nem escrever. Volta sozinha em ${DIAS_DE_SUSPENSAO} dias.`,
  },
  banir: {
    titulo: "Banir",
    texto:
      "o mesmo que suspender, mas sem prazo: só volta se alguém clicar em Reativar conta. Nada é apagado.",
  },
};

const idDaAjuda = (denunciaId: string) => `ajuda-${denunciaId}`;

/** Mesma largura máxima do .balao no CSS: a conta da posição depende dela. */
const LARGURA_DO_BALAO = 320;

/** Ações que mexem na conta de alguém pedem confirmação; arquivar não. */
const PEDE_CONFIRMACAO: AcaoDeModeracao[] = ["suspender", "banir", "reativar"];

interface ModerationScreenProps {
  /** Devolve o total de denúncias abertas, para o aviso na aba do topo. */
  onContagem: (abertas: number) => void;
}

export function ModerationScreen({ onContagem }: ModerationScreenProps) {
  const [filtro, setFiltro] = useState<FiltroDaModeracao>("abertas");
  // Mesmo desenho da tela de Números: o filtro viaja junto com os dados, então
  // "está carregando" é saber que o que está na tela ainda é do filtro antigo.
  const [dados, setDados] = useState<{ filtro: FiltroDaModeracao; fila: FilaDeModeracao } | null>(
    null,
  );
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  /** Denúncia e ação esperando o "Confirmar". */
  const [confirmando, setConfirmando] = useState<{ id: string; acao: AcaoDeModeracao } | null>(null);
  /** Id da denúncia cuja ação está indo para o servidor. */
  const [aplicando, setAplicando] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    carregarModeracao(filtro)
      .then((fila) => {
        if (!ativo) return;
        setDados({ filtro, fila });
        setErro(null);
        onContagem(fila.abertas);
      })
      .catch((problema) => {
        if (ativo) setErro(mensagemDeErro(problema));
      });
    return () => {
      ativo = false;
    };
  }, [filtro, tentativa, onContagem]);

  const carregando = !erro && dados?.filtro !== filtro;
  // Se o filtro novo falhou, a lista do filtro antigo sai da tela em vez de
  // ficar por baixo do erro: ela tem outros botões (uma denúncia resolvida não
  // mostra Arquivar/Suspender/Banir), e quem lesse "Abertas" no topo decidiria
  // sobre a lista errada. Erro em uma AÇÃO é outro caso — aí a lista é a certa
  // e continua onde está.
  const fila = erro && dados?.filtro !== filtro ? undefined : dados?.fila;

  async function aplicar(denuncia: DenunciaDoPainel, acao: AcaoDeModeracao) {
    setConfirmando(null);
    setAplicando(denuncia.id);
    try {
      await moderar(denuncia.id, acao);
      const nome = denuncia.denunciado.nome;
      setAviso(
        acao === "arquivar"
          ? `Denúncia sobre ${nome} arquivada.`
          : acao === "suspender"
            ? `${nome} está suspenso por ${DIAS_DE_SUSPENSAO} dias.`
            : acao === "banir"
              ? `${nome} foi banido.`
              : `${nome} voltou a usar o app.`,
      );
      setTentativa((t) => t + 1);
    } catch (problema) {
      setErro(mensagemDeErro(problema));
    } finally {
      setAplicando(null);
    }
  }

  // Derrubar a foto não resolve a denúncia: o cartão continua onde está, com
  // os mesmos botões. São duas decisões diferentes — a foto pode ser falsa sem
  // que a conta mereça suspensão, e pode haver o contrário.
  async function aplicarNaFoto(denuncia: DenunciaDoPainel, ids: string[], acao: AcaoDeFoto) {
    setAplicando(denuncia.id);
    try {
      const feito = await moderarFotos(ids, acao);
      setAviso(
        acao === "rejeitar"
          ? `${feito.fotos === 1 ? "Foto" : `${feito.fotos} fotos`} de ${feito.nome} fora do ar.` +
            (feito.semFotoAprovada
              ? " Não sobrou nenhuma foto aprovada, e o perfil sumiu da fila dos outros."
              : "")
          : `${feito.fotos === 1 ? "Foto" : `${feito.fotos} fotos`} de ${feito.nome} de volta ao ar.`,
      );
      setTentativa((t) => t + 1);
    } catch (problema) {
      setErro(mensagemDeErro(problema));
    } finally {
      setAplicando(null);
    }
  }

  function pedir(denuncia: DenunciaDoPainel, acao: AcaoDeModeracao) {
    if (PEDE_CONFIRMACAO.includes(acao)) {
      setConfirmando({ id: denuncia.id, acao });
      return;
    }
    void aplicar(denuncia, acao);
  }

  return (
    <main className={styles.conteudo} aria-busy={carregando}>
      <div className={styles.tituloLinha}>
        <div className={styles.titulo}>
          <h1 className={styles.h1}>Moderação</h1>
          {fila && (
            <span className={styles.intervalo}>
              {fila.abertas === 0
                ? "nada esperando decisão"
                : fila.abertas === 1
                  ? "1 denúncia esperando decisão"
                  : `${fila.abertas} denúncias esperando decisão`}
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
            {filtro === "abertas"
              ? "Nenhuma denúncia esperando decisão."
              : "Nenhuma denúncia resolvida ainda."}
          </p>
          <p className={styles.vazioApoio}>
            {filtro === "abertas"
              ? "Toda denúncia feita no app cai aqui, com a cópia da conversa junto."
              : "O que for arquivado, suspenso ou banido aparece nesta lista."}
          </p>
        </div>
      )}

      {fila && fila.itens.length > 0 && (
        <div className={carregando ? `${styles.lista} ${styles.listaCarregando}` : styles.lista}>
          {fila.itens.map((denuncia) => (
            <CartaoDeDenuncia
              key={denuncia.id}
              denuncia={denuncia}
              confirmando={confirmando?.id === denuncia.id ? confirmando.acao : null}
              aplicando={aplicando === denuncia.id}
              onPedir={(acao) => pedir(denuncia, acao)}
              onConfirmar={(acao) => void aplicar(denuncia, acao)}
              onCancelar={() => setConfirmando(null)}
              onModerarFotos={(ids, acao) => void aplicarNaFoto(denuncia, ids, acao)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

interface CartaoProps {
  denuncia: DenunciaDoPainel;
  confirmando: AcaoDeModeracao | null;
  aplicando: boolean;
  onPedir: (acao: AcaoDeModeracao) => void;
  onConfirmar: (acao: AcaoDeModeracao) => void;
  onCancelar: () => void;
  onModerarFotos: (ids: string[], acao: AcaoDeFoto) => void;
}

function CartaoDeDenuncia({
  denuncia,
  confirmando,
  aplicando,
  onPedir,
  onConfirmar,
  onCancelar,
  onModerarFotos,
}: CartaoProps) {
  const pessoa = denuncia.denunciado;
  const [ajuda, setAjuda] = useState<AcaoComAjuda | null>(null);
  const [posicaoDaAjuda, setPosicaoDaAjuda] = useState({ top: 0, left: 0, seta: 0 });
  const areaDasAcoes = useRef<HTMLDivElement>(null);

  /**
   * Abre o balão embaixo do (i) tocado, sem passar da borda da área. Medido
   * no toque, e não por CSS: quando a linha quebra no celular, o Banir vai
   * para a esquerda, e o balão tem de ir junto.
   */
  function alternarAjuda(acao: AcaoComAjuda, botao: HTMLButtonElement) {
    if (ajuda === acao) {
      setAjuda(null);
      return;
    }
    const larguraDaArea = areaDasAcoes.current?.clientWidth ?? 0;
    const larguraDoBalao = Math.min(LARGURA_DO_BALAO, larguraDaArea);
    const centroDoBotao = botao.offsetLeft + botao.offsetWidth / 2;
    const left = Math.max(0, Math.min(centroDoBotao - 24, larguraDaArea - larguraDoBalao));
    setPosicaoDaAjuda({
      top: botao.offsetTop + botao.offsetHeight + 10,
      left,
      seta: centroDoBotao - left,
    });
    setAjuda(acao);
  }

  // O balão fecha com um toque fora dos botões ou com Esc, como qualquer dica.
  useEffect(() => {
    if (!ajuda) return;
    function aoTocar(evento: PointerEvent) {
      if (!areaDasAcoes.current?.contains(evento.target as Node)) setAjuda(null);
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAjuda(null);
    }
    document.addEventListener("pointerdown", aoTocar);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("pointerdown", aoTocar);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [ajuda]);

  // Vale o status, e não a resolução: uma denúncia fechada à mão pelo SQL
  // Editor fica sem resolução, e ainda assim não é caso para decidir de novo.
  const resolvida = denuncia.status === "resolvida";
  const sobSancao = pessoa.statusModeracao === "suspenso" || pessoa.statusModeracao === "banido";
  const ficha = [
    pessoa.idade ? `${pessoa.idade} anos` : null,
    pessoa.cidade,
    pessoa.profissao,
    pessoa.entrouEm ? `no Lovi desde ${dataCurta(pessoa.entrouEm)}` : null,
  ].filter(Boolean);

  return (
    <article className={styles.cartao}>
      <div className={styles.pessoa}>
        <div className={styles.dados}>
          <div className={styles.nomeLinha}>
            <h2 className={styles.nome}>{pessoa.nome}</h2>
            {pessoa.contaExcluida && <span className={styles.selo}>conta excluída</span>}
            {pessoa.statusModeracao === "suspenso" && (
              <span className={`${styles.selo} ${styles.seloAlerta}`}>
                suspenso até {dataHora(pessoa.suspensaoTerminaEm)}
              </span>
            )}
            {pessoa.statusModeracao === "banido" && (
              <span className={`${styles.selo} ${styles.seloGrave}`}>banido</span>
            )}
            {pessoa.denunciasAbertas > 1 && (
              <span className={`${styles.selo} ${styles.seloAlerta}`}>
                {pessoa.denunciasAbertas} denúncias abertas
              </span>
            )}
            {pessoa.denunciasTotal > 1 && (
              <span className={styles.selo}>{pessoa.denunciasTotal} denúncias no total</span>
            )}
            {pessoa.verificado && <span className={styles.selo}>perfil verificado</span>}
            {pessoa.visivel === false && <span className={styles.selo}>perfil oculto</span>}
          </div>
          <AccountEmail email={pessoa.email} />
          {ficha.length > 0 && <p className={styles.ficha}>{ficha.join(" · ")}</p>}
          {pessoa.bio && <p className={styles.bio}>{pessoa.bio}</p>}
        </div>

        <PhotoGrid fotos={pessoa.fotos} ocupado={aplicando} onModerar={onModerarFotos} />
      </div>

      <div className={styles.denunciaBloco}>
        <div className={styles.denunciaTopo}>
          <span className={styles.motivo}>{denuncia.motivo}</span>
          <span className={styles.quando}>{dataHora(denuncia.criadoEm)}</span>
        </div>
        {denuncia.descricao && <p className={styles.descricao}>{denuncia.descricao}</p>}
      </div>

      <Conversa denuncia={denuncia} />

      {resolvida ? (
        <div className={styles.acoes}>
          <span className={styles.resolvida}>
            {denuncia.resolucao ? RESOLUCAO_LABEL[denuncia.resolucao] : "Denúncia resolvida"}
            {denuncia.analisadoPor ? ` por ${denuncia.analisadoPor}` : ""}
            {denuncia.analisadoEm ? ` em ${dataHora(denuncia.analisadoEm)}` : ""}
          </span>
          {sobSancao &&
            !pessoa.contaExcluida &&
            (confirmando === "reativar" ? (
              <Confirmacao
                pergunta={`Devolver o acesso de ${pessoa.nome}?`}
                ocupado={aplicando}
                onConfirmar={() => onConfirmar("reativar")}
                onCancelar={onCancelar}
              />
            ) : (
              <button
                type="button"
                className={styles.botao}
                disabled={aplicando}
                onClick={() => onPedir("reativar")}
              >
                Reativar conta
              </button>
            ))}
        </div>
      ) : confirmando ? (
        <div className={styles.acoes}>
          <Confirmacao
            pergunta={
              confirmando === "suspender"
                ? `Suspender ${pessoa.nome} por ${DIAS_DE_SUSPENSAO} dias?`
                : `Banir ${pessoa.nome}? O acesso é cortado até alguém reativar.`
            }
            ocupado={aplicando}
            onConfirmar={() => onConfirmar(confirmando)}
            onCancelar={onCancelar}
          />
        </div>
      ) : (
        <div className={styles.acoes} ref={areaDasAcoes}>
          {pessoa.contaExcluida && (
            <span className={`${styles.notaAcao} ${styles.notaLinha}`}>
              A conta não existe mais: só dá para arquivar.
            </span>
          )}
          {pessoa.denunciasAbertas > 1 && !pessoa.contaExcluida && (
            <span className={`${styles.notaAcao} ${styles.notaLinha}`}>
              Suspender ou banir resolve as {pessoa.denunciasAbertas} denúncias abertas contra{" "}
              {pessoa.nome}.
            </span>
          )}
          <button
            type="button"
            className={styles.botao}
            disabled={aplicando}
            onClick={() => onPedir("arquivar")}
          >
            Arquivar
          </button>
          <BotaoDeAjuda acao="arquivar" aberta={ajuda} idDoBalao={idDaAjuda(denuncia.id)} onAlternar={alternarAjuda} />
          <button
            type="button"
            className={`${styles.botao} ${styles.botaoAlerta}`}
            disabled={aplicando || pessoa.contaExcluida}
            onClick={() => onPedir("suspender")}
          >
            Suspender {DIAS_DE_SUSPENSAO} dias
          </button>
          <BotaoDeAjuda acao="suspender" aberta={ajuda} idDoBalao={idDaAjuda(denuncia.id)} onAlternar={alternarAjuda} />
          <button
            type="button"
            className={`${styles.botao} ${styles.botaoGrave}`}
            disabled={aplicando || pessoa.contaExcluida}
            onClick={() => onPedir("banir")}
          >
            Banir
          </button>
          <BotaoDeAjuda acao="banir" aberta={ajuda} idDoBalao={idDaAjuda(denuncia.id)} onAlternar={alternarAjuda} />
          {ajuda && (
            <p
              id={idDaAjuda(denuncia.id)}
              className={styles.balao}
              role="status"
              style={{
                top: posicaoDaAjuda.top,
                left: posicaoDaAjuda.left,
                ["--seta" as string]: `${posicaoDaAjuda.seta}px`,
              }}
            >
              <strong>{AJUDA[ajuda].titulo}:</strong> {AJUDA[ajuda].texto}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

function BotaoDeAjuda({
  acao,
  aberta,
  idDoBalao,
  onAlternar,
}: {
  acao: AcaoComAjuda;
  aberta: AcaoComAjuda | null;
  idDoBalao: string;
  onAlternar: (acao: AcaoComAjuda, botao: HTMLButtonElement) => void;
}) {
  const estaAberta = aberta === acao;
  return (
    <button
      type="button"
      className={estaAberta ? `${styles.ajuda} ${styles.ajudaAberta}` : styles.ajuda}
      aria-label={`O que faz ${AJUDA[acao].titulo}`}
      aria-expanded={estaAberta}
      aria-controls={estaAberta ? idDoBalao : undefined}
      onClick={(evento) => onAlternar(acao, evento.currentTarget)}
    >
      i
    </button>
  );
}

function Confirmacao({
  pergunta,
  ocupado,
  onConfirmar,
  onCancelar,
}: {
  pergunta: string;
  ocupado: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <>
      <span className={styles.pergunta}>{pergunta}</span>
      <button
        type="button"
        className={`${styles.botao} ${styles.botaoGrave}`}
        disabled={ocupado}
        onClick={onConfirmar}
      >
        {ocupado ? "Aplicando…" : "Confirmar"}
      </button>
      <button type="button" className={styles.botao} disabled={ocupado} onClick={onCancelar}>
        Cancelar
      </button>
    </>
  );
}

function Conversa({ denuncia }: { denuncia: DenunciaDoPainel }) {
  const total = denuncia.conversa.length;

  if (!denuncia.conversaCopiada) {
    return (
      <p className={styles.semConversa}>
        Denúncia anterior à cópia de conversas — não há registro do que foi dito.
      </p>
    );
  }
  if (total === 0) {
    return <p className={styles.semConversa}>Não houve conversa entre os dois.</p>;
  }

  return (
    <details className={styles.conversa}>
      <summary className={styles.conversaResumo}>
        Ver a conversa ({total} {total === 1 ? "mensagem" : "mensagens"})
      </summary>
      <p className={styles.conversaNota}>
        Cópia feita no momento da denúncia. Não muda se a conversa for apagada depois.
      </p>
      <ol className={styles.mensagens}>
        {denuncia.conversa.map((mensagem, indice) => (
          <li
            key={`${mensagem.enviadaEm}-${indice}`}
            className={
              mensagem.autor === "denunciado"
                ? `${styles.mensagem} ${styles.mensagemDenunciado}`
                : styles.mensagem
            }
          >
            <span className={styles.mensagemAutor}>
              {mensagem.autor === "denunciado" ? denuncia.denunciado.nome : "Quem denunciou"}
              <span className={styles.mensagemHora}>{horaCurta(mensagem.enviadaEm)}</span>
            </span>
            <span className={styles.mensagemTexto}>{mensagem.conteudo}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}
