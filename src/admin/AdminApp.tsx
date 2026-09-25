import { useCallback, useEffect, useState } from "react";
import {
  carregarEsperaDasDenuncias,
  contarVerificacoesPendentes,
  souAdmin,
} from "../lib/api/admin";
import { aoMudarSessao, sair, usuarioAtual } from "../lib/api/auth";
import { mensagemDeErro } from "../lib/errors";
import { erroDeConfiguracao } from "../lib/supabaseClient";
import { AdminProfilePage } from "./AdminProfilePage";
import { AdminShell, type AbaDoPainel, type AvisosDoPainel } from "./AdminShell";
import { LoginScreen } from "./LoginScreen";
import { ModerationScreen } from "./ModerationScreen";
import { NumbersScreen } from "./NumbersScreen";
import { PhotosScreen } from "./PhotosScreen";
import { UsersScreen } from "./UsersScreen";
import { VerificationScreen } from "./VerificationScreen";
import styles from "./AdminApp.module.css";

const SEM_AVISOS: AvisosDoPainel = {
  denunciasAbertas: null,
  minutosDaDenunciaMaisAntiga: null,
  verificacoesPendentes: null,
};

/**
 * De quanto em quanto tempo a espera das denúncias é relida com o painel
 * aberto. Sem isso, quem deixasse o painel aberto de um dia para o outro veria
 * a mesma espera de quando abriu, e o destaque das 24 h nunca acenderia.
 */
const RELER_DENUNCIAS_MS = 5 * 60 * 1000;

/**
 * `?perfil=<id>` abre o perfil de uma pessoa em vez das abas: é o endereço do
 * "Ver perfil" da lista de Usuários, que abre em outra aba do navegador. Na
 * mesma página, e não numa página nova do build, para passar pelo mesmo login
 * e pela mesma checagem de admin.
 */
const PERFIL_ABERTO = new URLSearchParams(window.location.search).get("perfil");

type Etapa =
  | { tipo: "carregando" }
  | { tipo: "entrar" }
  | { tipo: "negado"; email: string }
  | { tipo: "painel"; email: string }
  | { tipo: "erro"; mensagem: string };

/**
 * Painel admin: app separado do app do usuário (outra página, outro bundle),
 * no endereço /admin/. Entra com a mesma conta do Lovi; só abre para quem
 * está marcado como admin no banco.
 */
export function AdminApp() {
  const [etapa, setEtapa] = useState<Etapa>({ tipo: "carregando" });
  const [aba, setAba] = useState<AbaDoPainel>("numeros");
  /** null = o número ainda não chegou; o aviso na aba só aparece com número. */
  const [avisos, setAvisos] = useState<AvisosDoPainel>(SEM_AVISOS);

  /** Número e espera da mais antiga juntos, da mesma consulta. */
  const lerEsperaDasDenuncias = useCallback(() => {
    void carregarEsperaDasDenuncias()
      .then((espera) =>
        setAvisos((atual) => ({
          ...atual,
          denunciasAbertas: espera.abertas,
          minutosDaDenunciaMaisAntiga: espera.minutosDaMaisAntiga,
        })),
      )
      .catch(() => {
        /* o número é um aviso; a tela de Moderação mostra o erro de verdade */
      });
  }, []);

  // A tela de Moderação devolve o total a cada carga da fila — inclusive
  // depois de uma decisão. O número vale na hora; a espera da mais antiga
  // pode ter mudado com a decisão (se foi ela a resolvida), então é relida.
  const anotarDenuncias = useCallback(
    (valor: number) => {
      setAvisos((atual) => ({ ...atual, denunciasAbertas: valor }));
      lerEsperaDasDenuncias();
    },
    [lerEsperaDasDenuncias],
  );
  const anotarVerificacoes = useCallback(
    (valor: number) => setAvisos((atual) => ({ ...atual, verificacoesPendentes: valor })),
    [],
  );
  /** Fotos não tem aviso na aba, mas a tela pede um callback. */
  const ignorarContagem = useCallback(() => {}, []);

  const verificar = useCallback(async () => {
    try {
      const usuario = await usuarioAtual();
      if (!usuario) {
        setEtapa({ tipo: "entrar" });
        return;
      }
      const admin = await souAdmin();
      setEtapa(
        admin ? { tipo: "painel", email: usuario.email } : { tipo: "negado", email: usuario.email },
      );
    } catch (problema) {
      setEtapa({ tipo: "erro", mensagem: mensagemDeErro(problema) });
    }
  }, []);

  // O aviso de sessão chega logo ao abrir a página (evento INITIAL_SESSION do
  // Supabase) e de novo ao entrar, sair ou a sessão expirar, inclusive em outra
  // aba: é ele que dispara a checagem, sem uma chamada a mais ao montar.
  useEffect(() => aoMudarSessao(() => void verificar()), [verificar]);

  // Os avisos precisam estar certos já na tela de Números — quem abre o painel
  // tem de ver que há trabalho sem ir procurar aba por aba. São duas consultas
  // de uma contagem só, lado a lado; a fila de verdade fica para quando a aba
  // for aberta.
  useEffect(() => {
    if (etapa.tipo !== "painel" || PERFIL_ABERTO) return;
    lerEsperaDasDenuncias();
    void contarVerificacoesPendentes()
      .then(anotarVerificacoes)
      .catch(() => {
        /* idem: quem mostra o erro é a tela de Verificação */
      });
    const relogio = window.setInterval(lerEsperaDasDenuncias, RELER_DENUNCIAS_MS);
    return () => window.clearInterval(relogio);
  }, [etapa.tipo, lerEsperaDasDenuncias, anotarVerificacoes]);

  async function aoSair() {
    try {
      await sair();
    } catch {
      /* saindo de qualquer forma */
    }
    setAvisos(SEM_AVISOS);
    setAba("numeros");
    setEtapa({ tipo: "entrar" });
  }

  if (erroDeConfiguracao) {
    return <Aviso titulo="Configuração incompleta" texto={erroDeConfiguracao} />;
  }
  if (etapa.tipo === "carregando") {
    return <p className={styles.carregando}>Carregando…</p>;
  }
  if (etapa.tipo === "entrar") {
    return <LoginScreen onEntrou={() => void verificar()} />;
  }
  if (etapa.tipo === "negado") {
    return (
      <Aviso
        titulo="Sem acesso ao painel"
        texto={`A conta ${etapa.email} não está marcada como administradora.`}
        acao={{ rotulo: "Entrar com outra conta", onClick: () => void aoSair() }}
      />
    );
  }
  if (etapa.tipo === "erro") {
    return (
      <Aviso
        titulo="Não foi possível abrir o painel"
        texto={etapa.mensagem}
        acao={{ rotulo: "Tentar de novo", onClick: () => void verificar() }}
      />
    );
  }
  if (PERFIL_ABERTO) {
    return <AdminProfilePage userId={PERFIL_ABERTO} />;
  }
  return (
    <AdminShell
      aba={aba}
      onTrocarAba={setAba}
      email={etapa.email}
      avisos={avisos}
      onSair={() => void aoSair()}
    >
      {/* Os callbacks são estáveis de propósito: cada tela põe o onContagem na
          lista de dependências do efeito que carrega a fila, e uma função nova
          a cada render faria a fila recarregar sem parar. */}
      {aba === "numeros" && <NumbersScreen />}
      {aba === "moderacao" && <ModerationScreen onContagem={anotarDenuncias} />}
      {aba === "verificacao" && <VerificationScreen onContagem={anotarVerificacoes} />}
      {aba === "fotos" && <PhotosScreen onContagem={ignorarContagem} />}
      {aba === "usuarios" && <UsersScreen />}
    </AdminShell>
  );
}

function Aviso({
  titulo,
  texto,
  acao,
}: {
  titulo: string;
  texto: string;
  acao?: { rotulo: string; onClick: () => void };
}) {
  return (
    <main className={styles.avisoTela}>
      <div className={styles.aviso}>
        <span className={styles.marca}>lovi admin</span>
        <h1 className={styles.avisoTitulo}>{titulo}</h1>
        <p className={styles.avisoTexto}>{texto}</p>
        {acao && (
          <button type="button" className={styles.avisoBotao} onClick={acao.onClick}>
            {acao.rotulo}
          </button>
        )}
      </div>
    </main>
  );
}
