import { gravarLocal, lerLocal } from "./storage";

/**
 * Mantém o app do tamanho da faixa visível enquanto o teclado está aberto, e
 * — o ponto desta versão — faz isso ANTES do teclado subir, para o cabeçalho
 * da conversa não se mexer nem um pouco.
 *
 * O caminho até aqui, porque cada erro ensinou a regra seguinte:
 *
 *  1. Medir `innerHeight - visualViewport.height` e só agir acima de 150px.
 *     No Safari do iPhone essa conta não passa de 150 e o código nunca rodava.
 *     Lição: o gatilho é o FOCO do campo, não uma medida de altura.
 *  2. Aplicar a altura da janela visual a cada quadro. Funcionou, mas a janela
 *     visual acompanha a animação do teclado, então o app era redimensionado
 *     doze vezes durante a subida e a tela pulava. Lição: usar o menor entre
 *     innerHeight e a janela visual, que já vale o valor final no primeiro
 *     quadro, e escrever só quando muda.
 *  3. Ainda sobrava movimento — o do próprio Safari. Ele reposiciona a página
 *     porque, no instante do toque, o campo de mensagem fica embaixo de onde o
 *     teclado vai aparecer, e ele rola para revelá-lo. Reagir depois é sempre
 *     tarde: quando o evento chega, o deslocamento já aconteceu.
 *
 * Daí esta versão: no `focusin`, antes de qualquer animação, o app já encolhe
 * para a altura que vai ter com o teclado aberto. O campo nasce dentro da área
 * que continuará visível, o Safari não tem o que revelar, e não rola nada. O
 * app assume o tamanho final de uma vez e o teclado sobe por cima do espaço
 * que sobrou — que é como um app nativo se comporta.
 *
 * Para isso é preciso saber a altura do teclado antes de ele aparecer, e só há
 * um jeito honesto: lembrar da última vez. Fica guardado por aparelho (o
 * teclado tem alturas diferentes em cada um, e muda com teclado de terceiros,
 * emoji ou a barra de sugestões). Na primeiríssima vez, sem nada guardado, o
 * comportamento é o da etapa 2 — e a medida daquela vez já fica guardada para
 * as próximas.
 *
 * Abstração fina de propósito, como storage.ts e geo.ts: no Capacitor quem
 * resolve isso é o @capacitor/keyboard, e a troca fica restrita a este arquivo.
 */

const ALTURA = "--altura-visivel";
const DESLOCAMENTO = "--deslocamento-visivel";

/** Onde fica a altura do teclado aprendida neste aparelho. */
const CHAVE_ALTURA_DO_TECLADO = "altura-do-teclado";

/** Quanto tempo insistir depois do foco, cobrindo a animação do teclado. */
const DURACAO_DA_ANIMACAO_MS = 900;

/**
 * Faixa aceitável para a altura aprendida. Fora dela é medida de outra coisa —
 * barra de endereço aparecendo, giro de tela, aparelho trocado — e aplicar
 * encolheria o app à toa.
 */
const TECLADO_MINIMO = 180;
const TECLADO_MAXIMO_EM_FRACAO = 0.75;

const CAMPOS_DE_TEXTO = new Set(["INPUT", "TEXTAREA"]);
const TIPOS_SEM_TECLADO = ["checkbox", "radio", "button", "submit", "file", "range", "color"];

function campoEmFoco(): boolean {
  const alvo = document.activeElement as HTMLInputElement | null;
  if (!alvo || !CAMPOS_DE_TEXTO.has(alvo.tagName)) return false;
  if (alvo.readOnly || alvo.disabled) return false;
  return alvo.tagName === "TEXTAREA" || !TIPOS_SEM_TECLADO.includes(alvo.type);
}

export function acompanharTeclado(): () => void {
  const janela = window.visualViewport;
  // Navegador sem visualViewport fica como estava. É pior, não é quebrado.
  if (!janela) return () => {};

  const raiz = document.documentElement;
  let insistirAte = 0;
  let alturaEscrita = -1;
  let deslocamentoEscrito = -1;
  let alturaDoTeclado = lerLocal<number>(CHAVE_ALTURA_DO_TECLADO, 0);
  /**
   * A altura da tela ANTES de o teclado subir, guardada no instante do foco.
   *
   * É a régua de tudo aqui, e não dá para usar o innerHeight do momento: neste
   * Safari ele encolhe junto com a janela visual, então `innerHeight -
   * vv.height` termina em zero e a altura do teclado nunca seria aprendida —
   * medido, era o que acontecia. A conta certa é contra a altura de antes.
   */
  let alturaCheia = window.innerHeight;

  function tecladoPlausivel(altura: number): boolean {
    return altura >= TECLADO_MINIMO && altura <= alturaCheia * TECLADO_MAXIMO_EM_FRACAO;
  }

  function limpar() {
    raiz.style.removeProperty(ALTURA);
    raiz.style.removeProperty(DESLOCAMENTO);
    alturaEscrita = -1;
    deslocamentoEscrito = -1;
  }

  function escreverAltura(altura: number) {
    if (altura === alturaEscrita) return;
    raiz.style.setProperty(ALTURA, `${altura}px`);
    alturaEscrita = altura;
  }

  function ajustar() {
    if (!janela) return;
    if (!campoEmFoco()) {
      limpar();
      return;
    }

    // O menor dos dois: a janela visual acompanha a animação do teclado,
    // enquanto o innerHeight já vale o tamanho final no primeiro quadro.
    const medida = Math.min(window.innerHeight, janela.height);
    const coberto = Math.round(alturaCheia - medida);

    // Aprende com o teclado que está aberto agora, para o próximo foco já
    // nascer no tamanho certo.
    if (tecladoPlausivel(coberto) && coberto !== alturaDoTeclado) {
      alturaDoTeclado = coberto;
      gravarLocal(CHAVE_ALTURA_DO_TECLADO, coberto);
    }

    // A previsão vale enquanto o teclado ainda não cobriu nada: encolher agora
    // é o que tira do Safari o motivo para reposicionar a página.
    const previsto = alturaDoTeclado > 0 ? alturaCheia - alturaDoTeclado : medida;
    escreverAltura(Math.min(medida, previsto));

    const deslocamento = Math.round(janela.offsetTop);
    if (deslocamento !== deslocamentoEscrito) {
      // Zero não precisa ser escrito: o padrão da variável já é 0.
      if (deslocamento > 0) raiz.style.setProperty(DESLOCAMENTO, `${deslocamento}px`);
      else raiz.style.removeProperty(DESLOCAMENTO);
      deslocamentoEscrito = deslocamento;
    }

    if (window.scrollY !== 0) window.scrollTo(0, 0);
  }

  function insistir() {
    ajustar();
    if (performance.now() < insistirAte) requestAnimationFrame(insistir);
  }

  function aoFocar() {
    // A tela ainda está inteira neste instante: é agora que dá para saber a
    // altura cheia, e é contra ela que tudo é medido daqui para a frente.
    if (alturaEscrita === -1) alturaCheia = window.innerHeight;

    // Síncrono, no próprio evento: é a única janela de tempo antes de o Safari
    // decidir rolar a página. Um setTimeout aqui, mesmo de 0ms, já chega tarde.
    if (alturaDoTeclado > 0 && tecladoPlausivel(alturaDoTeclado) && campoEmFoco()) {
      escreverAltura(alturaCheia - alturaDoTeclado);
    }
    insistirAte = performance.now() + DURACAO_DA_ANIMACAO_MS;
    insistir();
  }

  function aoDesfocar() {
    insistirAte = 0;
    // O foco passa por um instante de "ninguém" ao pular de um campo para
    // outro; limpar na hora faria a tela saltar entre os dois.
    setTimeout(() => {
      if (!campoEmFoco()) {
        limpar();
        // Sem teclado, a tela volta ao tamanho cheio: é a régua para o próximo
        // foco, e ela muda quando a barra de endereço aparece ou some.
        alturaCheia = window.innerHeight;
      }
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
