import { useEffect, useState } from "react";
import {
  DIAS_DE_SUSPENSAO,
  carregarPerfilParaAdmin,
  moderarConta,
  type AcaoNaConta,
  type PerfilNoPainel,
} from "../lib/api/admin";
import { mensagemDeErro } from "../lib/errors";
import { ProfileDetailScreen } from "../screens/ProfileDetailScreen";
import { AccountEmail } from "./AccountEmail";
import { dataHora } from "./datas";
import styles from "./AdminProfilePage.module.css";

/**
 * O perfil de uma pessoa numa aba própria, aberta pela lista de Usuários. É a
 * mesma `ProfileDetailScreen` do app, então o que se vê aqui é o que os outros
 * veem — só fotos aprovadas, sem distância —, e mudança no perfil do app
 * aparece aqui sozinha. O que só o painel precisa saber fica na faixa de cima,
 * fora do perfil.
 */
export function AdminProfilePage({ userId }: { userId: string }) {
  const [estado, setEstado] = useState<
    | { tipo: "carregando" }
    | { tipo: "pronto"; dados: PerfilNoPainel }
    | { tipo: "sumiu" }
    | { tipo: "erro"; mensagem: string }
  >({ tipo: "carregando" });
  const [tentativa, setTentativa] = useState(0);
  /** A ação esperando o "Confirmar". */
  const [confirmando, setConfirmando] = useState<AcaoNaConta | null>(null);
  const [aplicando, setAplicando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [erroDaAcao, setErroDaAcao] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    carregarPerfilParaAdmin(userId)
      .then((dados) => {
        if (!ativo) return;
        setEstado(dados ? { tipo: "pronto", dados } : { tipo: "sumiu" });
        // Com vários perfis abertos, o nome na aba é o que diz qual é qual.
        if (dados) document.title = `${dados.perfil.name} · lovi admin`;
      })
      .catch((problema) => {
        if (ativo) setEstado({ tipo: "erro", mensagem: mensagemDeErro(problema) });
      });
    return () => {
      ativo = false;
    };
  }, [userId, tentativa]);

  if (estado.tipo === "carregando") {
    return <p className={styles.mensagem}>Carregando…</p>;
  }
  if (estado.tipo === "sumiu") {
    return (
      <p className={styles.mensagem}>
        Essa conta não existe mais. Ela pode ter sido excluída depois que a lista foi aberta.
      </p>
    );
  }
  if (estado.tipo === "erro") {
    return (
      <div className={styles.mensagem} role="alert">
        <p>{estado.mensagem}</p>
        <button
          type="button"
          className={styles.botaoTentar}
          onClick={() => {
            setEstado({ tipo: "carregando" });
            setTentativa((t) => t + 1);
          }}
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  const { dados } = estado;
  const nome = dados.perfil.name || "a pessoa";

  async function aplicar(acao: AcaoNaConta) {
    setAplicando(true);
    setErroDaAcao(null);
    try {
      const feito = await moderarConta(userId, acao);
      // "Conta de", e não "Fulano suspenso": o nome não diz o gênero.
      setAviso(
        acao === "suspender"
          ? `Conta de ${feito.nome} suspensa até ${dataHora(feito.terminaEm)}.`
          : acao === "banir"
            ? `Conta de ${feito.nome} banida.`
            : `Acesso de ${feito.nome} devolvido.`,
      );
      setConfirmando(null);
      // Relê sem voltar ao "Carregando…": a faixa troca de selo e de botões,
      // e o perfil continua na tela.
      setTentativa((t) => t + 1);
    } catch (problema) {
      setErroDaAcao(mensagemDeErro(problema));
    } finally {
      setAplicando(false);
    }
  }

  function pedir(acao: AcaoNaConta) {
    setAviso(null);
    setErroDaAcao(null);
    setConfirmando(acao);
  }

  const sobSancao = dados.statusModeracao !== "ativo";
  const pergunta =
    confirmando === "suspender"
      ? `Suspender ${nome} por ${DIAS_DE_SUSPENSAO} dias?`
      : confirmando === "banir"
        ? `Banir ${nome}? O acesso é cortado até alguém reativar.`
        : `Devolver o acesso de ${nome}?`;
  // A decisão pela conta não fecha denúncia nenhuma (0036): quem decide
  // aqui pode não ter lido nenhuma, e uma delas pode pedir mais.
  const notaDasDenuncias =
    confirmando && confirmando !== "reativar" && dados.denunciasAbertas > 0
      ? dados.denunciasAbertas === 1
        ? "A denúncia aberta continua na fila de Moderação."
        : `As ${dados.denunciasAbertas} denúncias abertas continuam na fila de Moderação.`
      : null;
  const avisos = [
    dados.statusModeracao === "banido" ? "banido" : null,
    dados.statusModeracao === "suspenso"
      ? `suspenso até ${dataHora(dados.suspensaoTerminaEm)}`
      : null,
    dados.denunciasAbertas === 1
      ? "1 denúncia aberta"
      : dados.denunciasAbertas > 1
        ? `${dados.denunciasAbertas} denúncias abertas`
        : null,
    dados.visivel ? null : "perfil oculto pela própria pessoa",
  ].filter(Boolean);

  return (
    <div className={styles.pagina}>
      <header className={styles.faixa}>
        <div className={styles.faixaLinha}>
          <span className={styles.marca}>
            lovi <span className={styles.marcaAdmin}>admin</span>
          </span>
          <span className={styles.faixaTitulo}>Visão do painel</span>
          {avisos.map((aviso) => (
            <span key={aviso} className={styles.selo}>
              {aviso}
            </span>
          ))}
        </div>
        <AccountEmail email={dados.email} />
        {/* Sem esta linha, a foto reprovada simplesmente não estaria no
            perfil, e quem abre para conferir uma denúncia de foto acharia que
            a pessoa nunca a enviou. */}
        {dados.fotosForaDoPerfil > 0 && (
          <p className={styles.nota}>
            {dados.fotosForaDoPerfil === 1
              ? "1 foto reprovada não aparece aqui, como não aparece para os outros. Ela está na aba Fotos, em Rejeitadas."
              : `${dados.fotosForaDoPerfil} fotos reprovadas não aparecem aqui, como não aparecem para os outros. Elas estão na aba Fotos, em Rejeitadas.`}
          </p>
        )}
        <div className={styles.acoes}>
          {confirmando ? (
            <>
              <span className={styles.pergunta}>
                {pergunta}
                {notaDasDenuncias && <span className={styles.notaAcao}> {notaDasDenuncias}</span>}
              </span>
              <button
                type="button"
                className={`${styles.botao} ${styles.botaoGrave}`}
                disabled={aplicando}
                onClick={() => void aplicar(confirmando)}
              >
                {aplicando ? "Aplicando…" : "Confirmar"}
              </button>
              <button
                type="button"
                className={styles.botao}
                disabled={aplicando}
                onClick={() => setConfirmando(null)}
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              {dados.statusModeracao === "ativo" && (
                <button type="button" className={styles.botao} onClick={() => pedir("suspender")}>
                  Suspender {DIAS_DE_SUSPENSAO} dias
                </button>
              )}
              {dados.statusModeracao !== "banido" && (
                <button
                  type="button"
                  className={`${styles.botao} ${styles.botaoGrave}`}
                  onClick={() => pedir("banir")}
                >
                  Banir
                </button>
              )}
              {sobSancao && (
                <button type="button" className={styles.botao} onClick={() => pedir("reativar")}>
                  Reativar conta
                </button>
              )}
            </>
          )}
        </div>
        {aviso && (
          <p className={styles.aviso} role="status">
            {aviso}
          </p>
        )}
        {erroDaAcao && (
          <p className={styles.erroDaAcao} role="alert">
            {erroDaAcao}
          </p>
        )}
      </header>
      <div className={styles.celular}>
        <ProfileDetailScreen
          profile={dados.perfil}
          myInterests={[]}
          bottomAction="admin"
          onBack={() => {}}
          onLike={() => {}}
          onDislike={() => {}}
          onReport={() => {}}
        />
      </div>
    </div>
  );
}
