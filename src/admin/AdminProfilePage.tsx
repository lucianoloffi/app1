import { useEffect, useState } from "react";
import { carregarPerfilParaAdmin, type PerfilNoPainel } from "../lib/api/admin";
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
          className={styles.botao}
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
