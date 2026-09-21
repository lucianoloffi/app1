/**
 * Limites dos filtros de busca, num lugar só.
 *
 * Estavam espalhados: o banco aceita distância de 1 a 500 km (migration 0001),
 * o script de popular perfis grava 100, e a tela de Filtros ia de 5 a 60. Quem
 * tinha 100 gravado abria os Filtros e via a barra de distância cheia e sem a
 * bolinha — ela era desenhada a 173% da largura, fora do cartão. O valor no
 * texto estava certo; quem mentia era a barra.
 *
 * O máximo da tela é 100 para bater com o que o app já grava. Mexer aqui muda
 * o alcance da busca para todo mundo: é decisão de produto, não de código.
 */
export const DISTANCIA_MIN_KM = 5;
export const DISTANCIA_MAX_KM = 100;
export const DISTANCIA_PASSO_KM = 5;

export const IDADE_MIN = 18;
export const IDADE_MAX = 70;

export function dentroDaFaixa(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, valor));
}
