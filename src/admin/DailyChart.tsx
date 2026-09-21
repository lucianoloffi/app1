import type { DiaDoPainel } from "../lib/api/admin";
import styles from "./DailyChart.module.css";

const LARGURA = 860;
const ALTURA = 300;
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
  const larguraUtil = LARGURA - MARGEM.esquerda - MARGEM.direita;
  const alturaUtil = ALTURA - MARGEM.topo - MARGEM.base;
  const passo = passoDoEixo(Math.max(0, ...dias.flatMap((d) => [d.novos, d.ativos])));
  const teto = passo * 4;
  const ultimo = Math.max(1, dias.length - 1);

  const x = (i: number) => MARGEM.esquerda + (larguraUtil * i) / ultimo;
  const y = (v: number) => MARGEM.topo + alturaUtil * (1 - v / teto);
  const linha = (valor: (d: DiaDoPainel) => number) =>
    dias.map((d, i) => `${x(i).toFixed(1)},${y(valor(d)).toFixed(1)}`).join(" ");
  const marcas = [0, 1, 2, 3, 4].map((i) => i * passo);
  const rotulos = dias
    .map((d, i) => ({ i, texto: diaCurto(d.dia) }))
    .filter(({ i }) => i % 5 === 0 || i === dias.length - 1);

  const descricao = dias.length
    ? `De ${diaCurto(dias[0].dia)} a ${diaCurto(dias[dias.length - 1].dia)}: ` +
      `${dias.reduce((s, d) => s + d.novos, 0)} novos usuários; ` +
      `hoje, ${dias[dias.length - 1].ativos} usuários ativos.`
    : "Sem dados.";

  return (
    <svg
      className={styles.grafico}
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      role="img"
      aria-label={descricao}
    >
      {marcas.map((v) => (
        <g key={v}>
          <line
            x1={MARGEM.esquerda}
            x2={LARGURA - MARGEM.direita}
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
          y={ALTURA - 10}
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
