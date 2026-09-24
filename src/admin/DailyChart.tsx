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

const DIAS_DA_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** "Qua, 24/09" — no balão, onde o dia da semana explica os vales do fim de semana. */
function diaDoBalao(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  // Em UTC para o fuso de quem olha não empurrar o dia para trás.
  const semana = DIAS_DA_SEMANA[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()];
  return `${semana}, ${diaCurto(iso)}`;
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
  // Dia sob o ponteiro, para o balão com os números. No mouse ele some ao sair
  // do gráfico; no toque fica até o próximo toque, senão sumiria ao tirar o dedo.
  const [destaque, setDestaque] = useState<number | null>(null);
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

  function apontar(evento: React.PointerEvent<SVGSVGElement>) {
    if (!dias.length) return;
    const caixa = evento.currentTarget.getBoundingClientRect();
    const px = ((evento.clientX - caixa.left) * largura) / caixa.width;
    const i = Math.round(((px - MARGEM.esquerda) / larguraUtil) * ultimo);
    setDestaque(Math.min(dias.length - 1, Math.max(0, i)));
  }

  const dia = destaque !== null ? dias[destaque] : undefined;
  // O balão fica ao lado da linha-guia, para não cobrir os pontos do dia; na
  // metade direita ele passa para a esquerda, senão sairia do gráfico.
  const balaoAEsquerda = dia !== undefined && x(destaque!) > largura / 2;

  const descricao = dias.length
    ? `De ${diaCurto(dias[0].dia)} a ${diaCurto(dias[dias.length - 1].dia)}: ` +
      `${dias.reduce((s, d) => s + d.novos, 0)} novos usuários; ` +
      `hoje, ${dias[dias.length - 1].ativos} usuários ativos.`
    : "Sem dados.";

  return (
    <div className={styles.area}>
      <svg
        ref={ref}
        className={styles.grafico}
        viewBox={`0 0 ${largura} ${altura}`}
        role="img"
        aria-label={descricao}
        onPointerMove={apontar}
        onPointerDown={apontar}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") setDestaque(null);
        }}
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
        {dia && (
          <line
            x1={x(destaque!)}
            x2={x(destaque!)}
            y1={MARGEM.topo}
            y2={altura - MARGEM.base}
            className={styles.guia}
          />
        )}
        <polyline points={linha((d) => d.ativos)} className={styles.linhaAtivos} />
        <polyline points={linha((d) => d.novos)} className={styles.linhaNovos} />
        {dia && (
          <>
            <circle cx={x(destaque!)} cy={y(dia.ativos)} r={5} className={styles.pontoAtivos} />
            <circle cx={x(destaque!)} cy={y(dia.novos)} r={5} className={styles.pontoNovos} />
          </>
        )}
      </svg>
      {dia && (
        <div
          className={styles.balao}
          style={{
            left: x(destaque!),
            top: MARGEM.topo,
            transform: balaoAEsquerda ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
          }}
          aria-hidden="true"
        >
          <div className={styles.balaoDia}>{diaDoBalao(dia.dia)}</div>
          <div className={styles.balaoLinha}>
            <span className={styles.marcaAtivos} />
            Usuários ativos <strong>{dia.ativos}</strong>
          </div>
          <div className={styles.balaoLinha}>
            <span className={styles.marcaNovos} />
            Novos usuários <strong>{dia.novos}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
