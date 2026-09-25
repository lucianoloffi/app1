import { useEffect, useState } from "react";
import {
  USUARIOS_POR_PAGINA,
  carregarUsuarios,
  type FiltroDeUsuarios,
  type ListaDeUsuarios,
  type OrdemDeUsuarios,
  type UsuarioDoPainel,
} from "../lib/api/admin";
import { mensagemDeErro } from "../lib/errors";
import { dataCurta, dataHora, diaDeUso, usouHoje } from "./datas";
import { MenuDaConta } from "./MenuDaConta";
import styles from "./UsersScreen.module.css";

/**
 * "Todos" deixa de fora os perfis de teste (`@lovi.test`), como o funil: com
 * poucas pessoas reais, eles seriam a maior parte da lista. Quem decide o que
 * cada filtro pega é o banco (`painel_usuarios`).
 */
const FILTROS: { valor: FiltroDeUsuarios; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "com_denuncia", rotulo: "Com denúncia" },
  { valor: "suspensos", rotulo: "Suspensos" },
  { valor: "banidos", rotulo: "Banidos" },
  { valor: "sem_foto", rotulo: "Sem foto aprovada" },
  { valor: "incompletos", rotulo: "Cadastro incompleto" },
  { valor: "teste", rotulo: "Perfis de teste" },
];

/** A primeira é a que a tela abre: quem usou o app por último vem no topo. */
const ORDENS: { valor: OrdemDeUsuarios; rotulo: string }[] = [
  { valor: "acesso", rotulo: "Último acesso" },
  { valor: "recentes", rotulo: "Mais recentes" },
  { valor: "denuncias", rotulo: "Mais denunciados" },
];

/** Espera depois da última tecla antes de buscar: uma consulta por palavra, não por letra. */
const ESPERA_DA_BUSCA_MS = 300;

interface Consulta {
  busca: string;
  filtro: FiltroDeUsuarios;
  ordem: OrdemDeUsuarios;
  pagina: number;
}

function mesmaConsulta(a: Consulta, b: Consulta) {
  return a.busca === b.busca && a.filtro === b.filtro && a.ordem === b.ordem && a.pagina === b.pagina;
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

/**
 * Todas as contas, uma por linha, para achar alguém e abrir o perfil. As filas
 * (Moderação, Verificação, Fotos) mostram só quem espera decisão; aqui entra
 * também quem ninguém denunciou, que é onde aparece o perfil impróprio que
 * ainda não chegou a ser denunciado.
 */
export function UsersScreen() {
  const [texto, setTexto] = useState("");
  const [consulta, setConsulta] = useState<Consulta>({
    busca: "",
    filtro: "todos",
    ordem: ORDENS[0].valor,
    pagina: 0,
  });
  // A consulta viaja com os dados, como nas outras telas: é assim que se sabe
  // que a lista na tela é de outro filtro e está sendo trocada.
  const [dados, setDados] = useState<{ consulta: Consulta; lista: ListaDeUsuarios } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  /**
   * O aviso de uma decisão tomada pelos três pontinhos. Guarda a consulta em
   * que foi dado e só aparece nela: trocar de filtro ou de página o apaga, sem
   * precisar limpar em cada botão.
   */
  const [aviso, setAviso] = useState<{ consulta: Consulta; texto: string } | null>(null);

  useEffect(() => {
    const relogio = window.setTimeout(() => {
      setConsulta((atual) =>
        atual.busca === texto.trim() ? atual : { ...atual, busca: texto.trim(), pagina: 0 },
      );
    }, ESPERA_DA_BUSCA_MS);
    return () => window.clearTimeout(relogio);
  }, [texto]);

  // Suspender e banir acontecem na aba do perfil, em outra aba do navegador.
  // Ao voltar para a lista, ela relê, senão o selo da pessoa continuaria o
  // de antes. Mesma consulta, então a lista na tela não some enquanto isso.
  useEffect(() => {
    function aoVoltar() {
      if (document.visibilityState === "visible") setTentativa((t) => t + 1);
    }
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, []);

  useEffect(() => {
    let ativo = true;
    carregarUsuarios(consulta)
      .then((lista) => {
        if (!ativo) return;
        setDados({ consulta, lista });
        setErro(null);
      })
      .catch((problema) => {
        if (ativo) setErro(mensagemDeErro(problema));
      });
    return () => {
      ativo = false;
    };
  }, [consulta, tentativa]);

  const atual = dados && mesmaConsulta(dados.consulta, consulta);
  const carregando = !erro && !atual;
  // Com erro, a lista de outro filtro não fica na tela como se fosse deste.
  const lista = erro && !atual ? undefined : dados?.lista;

  const inicio = consulta.pagina * USUARIOS_POR_PAGINA;
  const temProxima = lista ? inicio + lista.itens.length < lista.total : false;

  return (
    <main className={styles.conteudo} aria-busy={carregando}>
      <div className={styles.tituloLinha}>
        <h1 className={styles.h1}>Usuários</h1>
        {carregando && <span className={styles.intervalo}>atualizando…</span>}
      </div>

      <div className={styles.busca}>
        <input
          type="search"
          className={styles.campo}
          placeholder="Buscar por nome, e-mail ou cidade"
          aria-label="Buscar por nome, e-mail ou cidade"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
        />
        <select
          className={styles.ordem}
          aria-label="Ordem"
          value={consulta.ordem}
          onChange={(evento) =>
            setConsulta({
              ...consulta,
              ordem: evento.target.value as OrdemDeUsuarios,
              pagina: 0,
            })
          }
        >
          {ORDENS.map((item) => (
            <option key={item.valor} value={item.valor}>
              {item.rotulo}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filtros} role="group" aria-label="Filtro">
        {FILTROS.map((item) => {
          const ativo = item.valor === consulta.filtro;
          const numero = lista?.contagens[item.valor];
          return (
            <button
              key={item.valor}
              type="button"
              aria-pressed={ativo}
              className={ativo ? `${styles.filtro} ${styles.filtroAtivo}` : styles.filtro}
              onClick={() => setConsulta({ ...consulta, filtro: item.valor, pagina: 0 })}
            >
              {item.rotulo}
              {numero !== undefined && <span className={styles.filtroNumero}>{numero}</span>}
            </button>
          );
        })}
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

      {aviso && mesmaConsulta(aviso.consulta, consulta) && (
        <p className={styles.aviso} role="status">
          {aviso.texto}
        </p>
      )}

      {lista && lista.itens.length === 0 && (
        <div className={styles.vazio}>
          <p className={styles.vazioTitulo}>
            {consulta.busca ? `Ninguém encontrado para “${consulta.busca}”` : "Ninguém neste filtro"}
          </p>
          {consulta.busca && consulta.filtro !== "todos" && (
            <p className={styles.vazioApoio}>A busca vale só dentro do filtro escolhido.</p>
          )}
        </div>
      )}

      {lista && lista.itens.length > 0 && (
        <>
          <div
            className={carregando ? `${styles.tabela} ${styles.tabelaCarregando}` : styles.tabela}
            role="table"
            aria-label="Usuários"
          >
            <div className={`${styles.linha} ${styles.cabecalho}`} role="row">
              <span role="columnheader">
                <span className={styles.somenteLeitor}>Foto</span>
              </span>
              <span role="columnheader">Pessoa</span>
              <span role="columnheader">Cidade</span>
              <span role="columnheader">Entrou</span>
              <span role="columnheader">Último acesso</span>
              <span role="columnheader">Fotos</span>
              <span role="columnheader" title="Quanto do perfil está preenchido, como no anel do app">
                % Perfil
              </span>
              <span role="columnheader" title="Curtidas que deu / curtidas que recebeu">
                Curtiu / <span className={styles.recebeu}>recebeu</span>
              </span>
              <span role="columnheader">Matches</span>
              <span role="columnheader">Conversas</span>
              <span role="columnheader">Situação</span>
              <span role="columnheader">
                <span className={styles.somenteLeitor}>Perfil</span>
              </span>
              <span role="columnheader">
                <span className={styles.somenteLeitor}>Ações</span>
              </span>
            </div>
            {lista.itens.map((usuario) => (
              <LinhaDoUsuario
                key={usuario.id}
                usuario={usuario}
                onFeito={(texto) => {
                  setAviso({ consulta, texto });
                  // Mesma consulta: a lista relê sem sumir, e o selo troca.
                  setTentativa((t) => t + 1);
                }}
              />
            ))}
          </div>

          <div className={styles.paginas}>
            <span>
              {inicio + 1}–{inicio + lista.itens.length} de {lista.total}
            </span>
            <button
              type="button"
              className={styles.pagina}
              onClick={() => setConsulta({ ...consulta, pagina: consulta.pagina - 1 })}
              disabled={consulta.pagina === 0}
            >
              Anterior
            </button>
            <button
              type="button"
              className={styles.pagina}
              onClick={() => setConsulta({ ...consulta, pagina: consulta.pagina + 1 })}
              disabled={!temProxima}
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </main>
  );
}

function LinhaDoUsuario({
  usuario,
  onFeito,
}: {
  usuario: UsuarioDoPainel;
  onFeito: (aviso: string) => void;
}) {
  const nome = usuario.nome || "Sem nome";
  return (
    <div className={styles.linha} role="row">
      <span role="cell" className={styles.celulaFoto}>
        {/* A capa reprovada aparece mesmo assim, com anel vermelho: para achar
            a pessoa, a foto de verdade ajuda mais que um buraco, e o anel já
            diz que ali há problema. */}
        {usuario.capa ? (
          <img
            className={usuario.capaReprovada ? `${styles.avatar} ${styles.avatarReprovado}` : styles.avatar}
            src={usuario.capa}
            alt=""
            loading="lazy"
          />
        ) : (
          <span className={`${styles.avatar} ${styles.avatarVazio}`} aria-hidden="true">
            {iniciais(nome)}
          </span>
        )}
      </span>
      <span role="cell" className={styles.pessoa}>
        <span className={styles.nome}>
          {nome}
          {usuario.idade ? `, ${usuario.idade}` : ""}
        </span>
        <span className={styles.email}>{usuario.email ?? "sem e-mail"}</span>
      </span>
      <span role="cell" className={`${styles.texto} ${styles.cidade}`} data-rotulo="Cidade">
        {usuario.cidade?.replace(", ", "/") || "—"}
      </span>
      <span role="cell" className={styles.texto} data-rotulo="Entrou">
        {dataCurta(usuario.entrouEm).replace(/(\d{2})(\d{2})$/, "$2")}
      </span>
      <span role="cell" className={styles.texto} data-rotulo="Acesso">
        {/* "hoje" em azul: quem está ativo salta aos olhos na lista. */}
        <span className={usouHoje(usuario.ultimoAcesso) ? styles.hoje : undefined}>
          {diaDeUso(usuario.ultimoAcesso)}
        </span>
      </span>
      <span
        role="cell"
        className={styles.texto}
        data-rotulo="Fotos"
        title={
          usuario.fotosReprovadas === 0
            ? undefined
            : usuario.fotosReprovadas === 1
              ? "1 reprovada"
              : `${usuario.fotosReprovadas} reprovadas`
        }
      >
        {usuario.fotos}
        {usuario.fotosReprovadas > 0 && (
          <span className={styles.reprovadas}>
            ·{usuario.fotosReprovadas}
            <span className={styles.somenteLeitor}> reprovadas</span>
          </span>
        )}
      </span>
      <span role="cell" className={styles.texto} data-rotulo="Perfil">
        {usuario.completude === null ? "—" : `${usuario.completude}%`}
      </span>
      <span role="cell" className={styles.texto} data-rotulo="Curtidas">
        {usuario.curtidasDadas} /{" "}
        <span className={styles.recebeu}>{usuario.curtidasRecebidas}</span>
      </span>
      <span role="cell" className={styles.texto} data-rotulo="Matches">
        {usuario.matches}
      </span>
      <span role="cell" className={styles.texto} data-rotulo="Conversas">
        {usuario.conversas}
      </span>
      <span role="cell" className={styles.selos}>
        <Selos usuario={usuario} />
      </span>
      <span role="cell" className={styles.celulaLink}>
        {/* Aba nova: a lista fica como está, com a busca e o filtro, e dá para
            abrir vários perfis lado a lado. */}
        <a
          className={styles.link}
          href={`?perfil=${encodeURIComponent(usuario.id)}`}
          target="_blank"
          rel="noopener"
          aria-label={`Ver perfil de ${nome} (abre em outra aba)`}
        >
          Perfil <span aria-hidden="true">↗</span>
        </a>
      </span>
      <span role="cell" className={styles.celulaMenu}>
        <MenuDaConta usuario={usuario} onFeito={onFeito} />
      </span>
    </div>
  );
}

function Selos({ usuario }: { usuario: UsuarioDoPainel }) {
  const selos: { texto: string; tom?: "alerta" | "grave" | "lilas"; titulo?: string }[] = [];
  if (usuario.statusModeracao === "banido") selos.push({ texto: "banido", tom: "grave" });
  if (usuario.statusModeracao === "suspenso") {
    selos.push({
      texto: `suspenso até ${dataCurta(usuario.suspensaoTerminaEm).slice(0, 5)}`,
      tom: "alerta",
      titulo: dataHora(usuario.suspensaoTerminaEm),
    });
  }
  if (usuario.denunciasAbertas > 0) {
    selos.push({
      texto:
        usuario.denunciasAbertas === 1 ? "1 denúncia" : `${usuario.denunciasAbertas} denúncias`,
      tom: "alerta",
    });
  }
  if (usuario.verificacaoStatus === "aprovada") selos.push({ texto: "verificado", tom: "lilas" });
  if (!usuario.cadastroCompleto) selos.push({ texto: "cadastro incompleto" });
  if (!usuario.visivel) selos.push({ texto: "oculto" });
  if (usuario.teste) selos.push({ texto: "teste" });
  if (selos.length === 0) return <span className={styles.semSelo}>—</span>;
  return (
    <>
      {selos.map((selo) => (
        <span
          key={selo.texto}
          title={selo.titulo}
          className={selo.tom ? `${styles.selo} ${styles[selo.tom]}` : styles.selo}
        >
          {selo.texto}
        </span>
      ))}
    </>
  );
}
