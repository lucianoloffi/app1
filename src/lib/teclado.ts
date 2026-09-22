/**
 * Mantém o app colado na faixa que está REALMENTE visível quando o teclado sobe.
 *
 * Sem isso, o topo da conversa sumia ao tocar no campo de mensagem: quem
 * estava escrevendo perdia de vista com quem falava, e perdia junto o caminho
 * de volta e o menu de denunciar, que moram no cabeçalho.
 *
 * São DUAS coisas, e tratar só a primeira não resolve:
 *
 *  1. O teclado cobre parte da tela. A janela visual (visualViewport) encolhe,
 *     mas o layout continua do tamanho de antes — daí `--altura-visivel`.
 *
 *  2. O navegador desliza a janela visual para cima, para revelar o campo. É
 *     isso que leva o cabeçalho para fora, e é medido por
 *     `visualViewport.offsetTop`.
 *
 * A primeira versão só tratava (1) e tentava desfazer (2) com
 * `window.scrollTo(0, 0)`. Não funcionava: `html, body` são `overflow: hidden`
 * (index.css), então não existe rolagem de documento para desfazer — o que
 * desliza é a janela visual sobre uma página parada, e scrollTo não a alcança.
 * Por isso o app encolhia certo e mesmo assim o cabeçalho ficava acima do que
 * dava para ver.
 *
 * Com `#root` em position: fixed e `top` igual ao offsetTop, o app acompanha a
 * faixa visível em vez de ficar preso ao layout. Em navegador que encolhe o
 * layout sozinho (interactive-widget=resizes-content) o offsetTop fica em 0 e
 * as duas contas não fazem diferença nenhuma — é a mesma tela.
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

const ALTURA = "--altura-visivel";
const DESLOCAMENTO = "--deslocamento-visivel";

export function acompanharTeclado(): () => void {
  const janela = window.visualViewport;
  // Navegador sem visualViewport fica como estava: 100dvh e o comportamento
  // antigo. É pior, não é quebrado.
  if (!janela) return () => {};

  const raiz = document.documentElement;

  function limpar() {
    raiz.style.removeProperty(ALTURA);
    raiz.style.removeProperty(DESLOCAMENTO);
  }

  function ajustar() {
    if (!janela) return;

    // A altura da janela visual é a única medida que desconta o teclado.
    // innerHeight não serve sozinho: onde o navegador encolhe o layout, ele
    // encolhe junto e a conta daria zero.
    const coberto = window.innerHeight - janela.height;

    if (coberto <= ALTURA_MINIMA_DE_TECLADO) {
      limpar();
      return;
    }

    raiz.style.setProperty(ALTURA, `${janela.height}px`);
    // O quanto o navegador já deslizou a janela para revelar o campo. Sem
    // devolver isso ao `top`, o app fica onde estava e o cabeçalho some.
    raiz.style.setProperty(DESLOCAMENTO, `${janela.offsetTop}px`);
  }

  janela.addEventListener("resize", ajustar);
  janela.addEventListener("scroll", ajustar);
  ajustar();

  return () => {
    janela.removeEventListener("resize", ajustar);
    janela.removeEventListener("scroll", ajustar);
    limpar();
  };
}
