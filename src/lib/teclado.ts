/**
 * Mantém o app colado na faixa visível enquanto o teclado está aberto.
 *
 * Sem isso, o topo da conversa sumia ao tocar no campo de mensagem: quem
 * escrevia perdia de vista com quem falava, e perdia junto o caminho de volta
 * e o menu de denunciar, que moram no cabeçalho.
 *
 * O GATILHO É O FOCO, não uma medida de altura. As duas versões anteriores
 * mediram `window.innerHeight - visualViewport.height` e só agiam acima de
 * 150px. Medido no Safari do iPhone, essa conta NÃO passa de 150 com o teclado
 * aberto — as variáveis abaixo nunca chegavam a ser escritas e nenhuma das
 * duas correções executava uma linha sequer. O sinal confiável de que o
 * teclado vai subir é o campo de texto receber foco; a altura serve para saber
 * o tamanho, não para decidir se age.
 *
 * Com o campo em foco, três coisas são aplicadas juntas, porque cada navegador
 * empurra a tela de um jeito e não dá para saber qual é pelo user agent:
 *
 *  1. `--altura-visivel` = altura da janela visual, para o app caber acima do
 *     teclado em vez de continuar do tamanho da tela inteira.
 *  2. `--deslocamento-visivel` = visualViewport.offsetTop, para quando o
 *     navegador desliza a janela visual sobre a página.
 *  3. `window.scrollTo(0, 0)`, para quando ele rola o documento. No Safari do
 *     iPhone é este o caso: com o teclado aberto, elemento em position: fixed
 *     passa a se comportar como absolute e sobe junto com a página — foi o que
 *     o diagnóstico mostrou, com o cabeçalho em -288.
 *
 * É aplicado repetidamente por um tempo, porque o teclado sobe animado e uma
 * medida só pega o estado do meio da animação. Mas o VALOR aplicado é o menor
 * entre innerHeight e a altura da janela visual, e só é escrito quando muda —
 * senão o app é redimensionado a cada quadro da subida do teclado e a tela dá
 * um pulo visível antes de assentar, que foi o que apareceu no iPhone.
 *
 * O menor dos dois porque eles medem coisas diferentes durante a animação: a
 * janela visual acompanha o teclado quadro a quadro, enquanto o innerHeight já
 * vale o tamanho final desde o primeiro quadro (o Safari encolhe o layout de
 * uma vez, por causa do interactive-widget=resizes-content). Com o menor, o
 * app assenta no tamanho certo de primeira, num passo só. Em navegador que não
 * encolhe o layout, innerHeight não muda e o menor é a janela visual — mesmo
 * comportamento de antes.
 *
 * Abstração fina de propósito, como storage.ts e geo.ts: no Capacitor quem
 * resolve isso é o @capacitor/keyboard, e a troca fica restrita a este arquivo.
 */

const ALTURA = "--altura-visivel";
const DESLOCAMENTO = "--deslocamento-visivel";

/** Quanto tempo insistir depois do foco, cobrindo a animação do teclado. */
const DURACAO_DA_ANIMACAO_MS = 900;

const CAMPOS_DE_TEXTO = new Set(["INPUT", "TEXTAREA"]);

function campoEmFoco(): boolean {
  const alvo = document.activeElement as HTMLInputElement | null;
  if (!alvo || !CAMPOS_DE_TEXTO.has(alvo.tagName)) return false;
  // Campo só de leitura e caixa de marcar não abrem teclado.
  if (alvo.readOnly || alvo.disabled) return false;
  return alvo.tagName === "TEXTAREA" || !["checkbox", "radio", "button", "submit", "file", "range"].includes(alvo.type);
}

export function acompanharTeclado(): () => void {
  const janela = window.visualViewport;
  // Navegador sem visualViewport fica como estava. É pior, não é quebrado.
  if (!janela) return () => {};

  const raiz = document.documentElement;
  let insistirAte = 0;
  /** O que já está escrito, para não reescrever o mesmo valor a cada quadro. */
  let alturaEscrita = -1;
  let deslocamentoEscrito = -1;

  function limpar() {
    raiz.style.removeProperty(ALTURA);
    raiz.style.removeProperty(DESLOCAMENTO);
    alturaEscrita = -1;
    deslocamentoEscrito = -1;
  }

  function ajustar() {
    if (!janela) return;
    if (!campoEmFoco()) {
      limpar();
      return;
    }

    const altura = Math.min(window.innerHeight, janela.height);
    if (altura !== alturaEscrita) {
      raiz.style.setProperty(ALTURA, `${altura}px`);
      alturaEscrita = altura;
    }

    const deslocamento = Math.round(janela.offsetTop);
    if (deslocamento !== deslocamentoEscrito) {
      // Zero não precisa ser escrito: o padrão da variável já é 0, e escrever
      // deixaria um `top` inline sem serventia.
      if (deslocamento > 0) raiz.style.setProperty(DESLOCAMENTO, `${deslocamento}px`);
      else raiz.style.removeProperty(DESLOCAMENTO);
      deslocamentoEscrito = deslocamento;
    }

    // Só quando há o que desfazer: chamar à toa brigaria com uma rolagem que a
    // própria pessoa tenha feito.
    if (window.scrollY !== 0) window.scrollTo(0, 0);
  }

  function insistir() {
    ajustar();
    if (performance.now() < insistirAte) requestAnimationFrame(insistir);
  }

  function aoFocar() {
    insistirAte = performance.now() + DURACAO_DA_ANIMACAO_MS;
    insistir();
  }

  function aoDesfocar() {
    insistirAte = 0;
    // O foco passa por um instante de "ninguém" ao pular de um campo para
    // outro; limpar na hora faria a tela saltar entre os dois.
    setTimeout(() => {
      if (!campoEmFoco()) limpar();
    }, 100);
  }

  document.addEventListener("focusin", aoFocar);
  document.addEventListener("focusout", aoDesfocar);
  janela.addEventListener("resize", ajustar);
  janela.addEventListener("scroll", ajustar);
  ajustar();

  return () => {
    document.removeEventListener("focusin", aoFocar);
    document.removeEventListener("focusout", aoDesfocar);
    janela.removeEventListener("resize", ajustar);
    janela.removeEventListener("scroll", ajustar);
    insistirAte = 0;
    limpar();
  };
}
