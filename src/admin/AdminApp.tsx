import { useCallback, useEffect, useState } from "react";
import { contarDenunciasAbertas, souAdmin } from "../lib/api/admin";
import { aoMudarSessao, sair, usuarioAtual } from "../lib/api/auth";
import { mensagemDeErro } from "../lib/errors";
import { erroDeConfiguracao } from "../lib/supabaseClient";
import { AdminShell, type AbaDoPainel } from "./AdminShell";
import { LoginScreen } from "./LoginScreen";
import { ModerationScreen } from "./ModerationScreen";
import { NumbersScreen } from "./NumbersScreen";
import styles from "./AdminApp.module.css";

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
  const [denunciasAbertas, setDenunciasAbertas] = useState<number | null>(null);

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

  // O aviso de denúncias esperando decisão precisa estar certo já na tela de
  // Números — quem abre o painel tem de ver que há trabalho sem ir procurar.
  useEffect(() => {
    if (etapa.tipo !== "painel") return;
    void contarDenunciasAbertas()
      .then(setDenunciasAbertas)
      .catch(() => {
        /* o número é um aviso; a tela de Moderação mostra o erro de verdade */
      });
  }, [etapa.tipo]);

  async function aoSair() {
    try {
      await sair();
    } catch {
      /* saindo de qualquer forma */
    }
    setDenunciasAbertas(null);
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
  return (
    <AdminShell
      aba={aba}
      onTrocarAba={setAba}
      email={etapa.email}
      denunciasAbertas={denunciasAbertas}
      onSair={() => void aoSair()}
    >
      {aba === "numeros" ? (
        <NumbersScreen />
      ) : (
        <ModerationScreen onContagem={setDenunciasAbertas} />
      )}
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
