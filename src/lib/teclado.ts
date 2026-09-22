/**
 * Mantém o app do tamanho do que está REALMENTE visível quando o teclado sobe.
 *
 * Sem isso, o topo da conversa sumia ao tocar no campo de mensagem: o teclado
 * cobre parte da tela mas não encolhe o layout, então o navegador rola a
 * página inteira para revelar o campo — e o cabeçalho com a foto de quem está
 * do outro lado ia junto, para cima e para fora.
 *
 * Quem sabe a altura de verdade é a visualViewport. Enquanto o teclado está
 * aberto, o `--altura-visivel` passa a mandar no tamanho do app (ver
 * index.css), a coluna de flex se ajusta sozinha e o cabeçalho volta a ficar
 * onde deveria. Fechado o teclado, a variável sai e tudo volta ao 100dvh.
 *
 * Abstração fina de propósito, como storage.ts e geo.ts: no Capacitor quem
 * resolve isso é o @capacitor/keyboard, e a troca fica restrita a este arquivo.
 */

/**
 * Abaixo disto não é teclado. A barra de endereço do navegador aparece e some
 * sozinha ao rolar, mexendo na altura em algumas dezenas de pixels — reagir a
 * ela faria o app piscar de tamanho durante a rolagem.
 */
const ALTURA_MINIMA_DE_TECLADO = 150;

export function acompanharTeclado(): () => void {
  const janela = window.visualViewport;
  // Navegador sem visualViewport fica como estava: 100dvh e o comportamento
  // antigo. É pior, não é quebrado.
  if (!janela) return () => {};

  function ajustar() {
    if (!janela) return;
    const coberto = window.innerHeight - janela.height;

    if (coberto > ALTURA_MINIMA_DE_TECLADO) {
      document.documentElement.style.setProperty("--altura-visivel", `${janela.height}px`);
      // O navegador já rolou a página para mostrar o campo. Como o app agora
      // cabe na área visível, essa rolagem só esconde o topo — desfazer é o
      // que traz o cabeçalho de volta.
      window.scrollTo(0, 0);
    } else {
      document.documentElement.style.removeProperty("--altura-visivel");
    }
  }

  janela.addEventListener("resize", ajustar);
  janela.addEventListener("scroll", ajustar);
  ajustar();

  return () => {
    janela.removeEventListener("resize", ajustar);
    janela.removeEventListener("scroll", ajustar);
    document.documentElement.style.removeProperty("--altura-visivel");
  };
}
