import { useEffect, useRef, useState } from "react";
import type { DiaDoPainel } from "../lib/api/admin";
import styles from "./DailyChart.module.css";

/** Largura até a primeira medida do bloco; é a do painel no computador. */
const LARGURA_INICIAL = 860;
const ALTURA_MAXIMA = 300;
const ALTURA_MINIMA = 200;
/** Distância mínima, em px, entre dois rótulos de dia ("dd/mm" tem uns 35). */
const ESPACO_ENTRE_ROTULOS = 48;
const MARGEM = { esquerda: 44, direita: 12, topo: 16, base: 34 };

/**
 * Passo redondo entre as linhas de grade (1, 2 ou 5 × 10ⁿ), com 4 faixas que
 * cobrem o maior valor com folga. Dividir um teto qualquer em 4 dava marcas
 * quebradas (13, 25, 38).
 */
function passoDoEixo(maior: number): number {
  const alvo = Math.max(1, (maior * 1.1) / 4);
  const base = 10 ** Math.floor(Math.log10(alvo));
  return [1, 2, 5, 10].map((f) => f * base).find((v) => v >= alvo) ?? alvo;
}

function diaCurto(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

interface DailyChartProps {
  dias: DiaDoPainel[];
}

/** Novos usuários e usuários ativos por dia, em linhas, nos dias recebidos. */
export function DailyChart({ dias }: DailyChartProps) {
  // O desenho é feito na largura real do bloco, e não numa largura fixa
  // esticada pelo viewBox: no celular o gráfico de 860 encolhia para um terço
  // e os rótulos dos eixos, junto, para uns 4 px — ilegíveis.
  const ref = useRef<SVGSVGElement>(null);
  const [largura, setLargura] = useState(LARGURA_INICIAL);
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const observador = new ResizeObserver(([entrada]) => {
      const medida = Math.round(entrada.contentRect.width);
      if (medida > 0) setLargura(medida);
    });
    observador.observe(svg);
    return () => observador.disconnect();
  }, []);
  const altura = Math.min(ALTURA_MAXIMA, Math.max(ALTURA_MINIMA, Math.round(largura * 0.35)));

  const larguraUtil = largura - MARGEM.esquerda - MARGEM.direita;
  const alturaUtil = altura - MARGEM.topo - MARGEM.base;
  const passo = passoDoEixo(Math.max(0, ...dias.flatMap((d) => [d.novos, d.ativos])));
  const teto = passo * 4;
  const ultimo = Math.max(1, dias.length - 1);

  const x = (i: number) => MARGEM.esquerda + (larguraUtil * i) / ultimo;
  const y = (v: number) => MARGEM.topo + alturaUtil * (1 - v / teto);
  const linha = (valor: (d: DiaDoPainel) => number) =>
    dias.map((d, i) => `${x(i).toFixed(1)},${y(valor(d)).toFixed(1)}`).join(" ");
  const marcas = [0, 1, 2, 3, 4].map((i) => i * passo);
  // O último dia sempre tem rótulo; o de cinco em cinco que cair perto demais
  // dele sai, senão os dois se sobrepõem no gráfico estreito do celular.
  const rotulos = dias
    .map((d, i) => ({ i, texto: diaCurto(d.dia) }))
    .filter(
      ({ i }) =>
        i === dias.length - 1 || (i % 5 === 0 && x(dias.length - 1) - x(i) >= ESPACO_ENTRE_ROTULOS),
    );

  const descricao = dias.length
    ? `De ${diaCurto(dias[0].dia)} a ${diaCurto(dias[dias.length - 1].dia)}: ` +
      `${dias.reduce((s, d) => s + d.novos, 0)} novos usuários; ` +
      `hoje, ${dias[dias.length - 1].ativos} usuários ativos.`
    : "Sem dados.";

  return (
    <svg
      ref={ref}
      className={styles.grafico}
      viewBox={`0 0 ${largura} ${altura}`}
      role="img"
      aria-label={descricao}
    >
      {marcas.map((v) => (
        <g key={v}>
          <line
            x1={MARGEM.esquerda}
            x2={largura - MARGEM.direita}
            y1={y(v)}
            y2={y(v)}
            className={styles.grade}
          />
          <text x={MARGEM.esquerda - 10} y={y(v) + 4} textAnchor="end" className={styles.rotulo}>
            {v}
          </text>
        </g>
      ))}
      {rotulos.map(({ i, texto }) => (
        <text
          key={i}
          x={x(i)}
          y={altura - 10}
          textAnchor={i === dias.length - 1 ? "end" : "middle"}
          className={styles.rotulo}
        >
          {texto}
        </text>
      ))}
      <polyline points={linha((d) => d.ativos)} className={styles.linhaAtivos} />
      <polyline points={linha((d) => d.novos)} className={styles.linhaNovos} />
    </svg>
  );
}
