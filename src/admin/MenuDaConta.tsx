import { useEffect, useRef, useState } from "react";
import { moderarConta, type AcaoNaConta, type UsuarioDoPainel } from "../lib/api/admin";
import { mensagemDeErro } from "../lib/errors";
import {
  ROTULO_DA_ACAO,
  acoesPossiveis,
  avisoDaAcao,
  nomeDeVerdade,
  notaDasDenuncias,
  perguntaDaAcao,
} from "./acoesNaConta";
import styles from "./MenuDaConta.module.css";

interface MenuDaContaProps {
  usuario: UsuarioDoPainel;
  /** Depois da decisão: o aviso para a tela mostrar, e a lista relê. */
  onFeito: (aviso: string) => void;
}

/**
 * Os três pontinhos no fim de cada linha da aba Usuários: suspender, banir e
 * reativar sem abrir o perfil. As mesmas ações e os mesmos textos da faixa do
 * perfil (`acoesNaConta.ts`). Tocar numa ação troca o menu pela confirmação,
 * no mesmo lugar, como na aba Moderação: nada muda na conta com um toque só.
 */
export function MenuDaConta({ usuario, onFeito }: MenuDaContaProps) {
  const [aberto, setAberto] = useState(false);
  const [confirmando, setConfirmando] = useState<AcaoNaConta | null>(null);
  const [aplicando, setAplicando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const area = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLDivElement>(null);

  const nome = nomeDeVerdade(usuario.nome);
  const rotuloDaPessoa = nome ?? usuario.email ?? "esta conta";

  function fechar() {
    setAberto(false);
    setConfirmando(null);
    setErro(null);
  }

  // Fecha com toque fora ou Esc. Com a ação indo para o servidor, fica aberto:
  // fechar ali esconderia o erro, se ele viesse.
  useEffect(() => {
    if (!aberto || aplicando) return;
    function aoTocarFora(evento: PointerEvent) {
      if (!area.current?.contains(evento.target as Node)) {
        setAberto(false);
        setConfirmando(null);
        setErro(null);
      }
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key !== "Escape") return;
      setAberto(false);
      setConfirmando(null);
      setErro(null);
      botao.current?.focus();
    }
    document.addEventListener("pointerdown", aoTocarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("pointerdown", aoTocarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto, aplicando]);

  // Quem abriu pelo teclado cai na primeira opção; na confirmação, no
  // Cancelar, que é o lado seguro de um Enter apertado sem querer.
  useEffect(() => {
    if (aberto) painel.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [aberto, confirmando]);

  async function aplicar(acao: AcaoNaConta) {
    setAplicando(true);
    setErro(null);
    try {
      const feito = await moderarConta(usuario.id, acao);
      fechar();
      onFeito(avisoDaAcao(acao, feito));
    } catch (problema) {
      setErro(mensagemDeErro(problema));
    } finally {
      setAplicando(false);
    }
  }

  const nota = confirmando ? notaDasDenuncias(confirmando, usuario.denunciasAbertas) : null;

  return (
    <div className={styles.area} ref={area}>
      <button
        ref={botao}
        type="button"
        className={aberto ? `${styles.botao} ${styles.botaoAberto}` : styles.botao}
        aria-label={`Ações para ${rotuloDaPessoa}`}
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => (aberto ? fechar() : setAberto(true))}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="5" r="2" fill="currentColor" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="19" r="2" fill="currentColor" />
        </svg>
      </button>

      {aberto && !confirmando && (
        <div className={styles.painel} role="menu" ref={painel}>
          {acoesPossiveis(usuario.statusModeracao).map((acao) => (
            <button
              key={acao}
              type="button"
              role="menuitem"
              className={acao === "banir" ? `${styles.item} ${styles.itemGrave}` : styles.item}
              onClick={() => setConfirmando(acao)}
            >
              {ROTULO_DA_ACAO[acao]}
            </button>
          ))}
        </div>
      )}

      {aberto && confirmando && (
        <div
          className={`${styles.painel} ${styles.confirmacao}`}
          role="dialog"
          aria-label={ROTULO_DA_ACAO[confirmando]}
          ref={painel}
        >
          <p className={styles.pergunta}>{perguntaDaAcao(confirmando, nome)}</p>
          {nota && <p className={styles.nota}>{nota}</p>}
          {erro && (
            <p className={styles.erro} role="alert">
              {erro}
            </p>
          )}
          <div className={styles.botoes}>
            <button type="button" className={styles.acao} disabled={aplicando} onClick={fechar}>
              Cancelar
            </button>
            <button
              type="button"
              className={`${styles.acao} ${styles.acaoGrave}`}
              disabled={aplicando}
              onClick={() => void aplicar(confirmando)}
            >
              {aplicando ? "Aplicando…" : "Confirmar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
