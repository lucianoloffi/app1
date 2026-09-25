import { useEffect, useRef, useState } from "react";
import type { Granularidade, PontoDaSerie, SerieDoPainel } from "../lib/api/admin";
import styles from "./DailyChart.module.css";

/** Largura até a primeira medida do bloco; é a do painel no computador. */
const LARGURA_INICIAL = 860;
const ALTURA_MAXIMA = 300;
const ALTURA_MINIMA = 200;
const MARGEM = { esquerda: 44, direita: 16, topo: 16 };
/** Espaço embaixo para os rótulos: nos dias, uma linha a mais para o mês. */
const BASE: Record<Granularidade, number> = { hora: 34, dia: 50, semana: 34 };
/** Largura aproximada de um rótulo, em px, para decidir quantos cabem. */
const LARGURA_DO_ROTULO: Record<Granularidade, number> = { hora: 30, dia: 22, semana: 44 };
/** Hoje tem sempre as 24 horas no eixo, mesmo com dados só até a hora atual. */
const HORAS_DO_DIA = 24;

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

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
  const [, mes, dia] = iso.slice(0, 10).split("-");
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

const horaDe = (inicio: string) => Number(inicio.slice(11, 13));

/** O título do balão, conforme o ponto seja uma hora, um dia ou uma semana. */
function tituloDoPonto(ponto: PontoDaSerie, granularidade: Granularidade): string {
  if (granularidade === "hora") {
    const h = horaDe(ponto.inicio);
    return `Hoje, das ${h}h às ${h + 1}h`;
  }
  if (granularidade === "semana") return `Semana de ${diaCurto(ponto.inicio)}`;
  return diaDoBalao(ponto.inicio);
}

interface DailyChartProps {
  serie: SerieDoPainel;
}

/**
 * Novos usuários e usuários ativos em linhas, no formato do período: por hora
 * (hoje), por dia (7 e 30 dias) ou por semana (90 dias). Antes eram sempre os
 * últimos 30 dias, com um dia a cada cinco escrito na base.
 */
export function DailyChart({ serie }: DailyChartProps) {
  const { granularidade, pontos } = serie;
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
  // Ponto sob o ponteiro, para o balão com os números. No mouse ele some ao
  // sair do gráfico; no toque fica até o próximo toque, senão sumiria ao tirar
  // o dedo.
  const [destaque, setDestaque] = useState<number | null>(null);
  const altura = Math.min(ALTURA_MAXIMA, Math.max(ALTURA_MINIMA, Math.round(largura * 0.35)));
  const base = BASE[granularidade];

  // Posições no eixo: hoje são sempre as 24 horas, e a linha para na hora
  // atual; nos outros, uma posição por ponto.
  const posicoes = granularidade === "hora" ? HORAS_DO_DIA : pontos.length;
  const larguraUtil = largura - MARGEM.esquerda - MARGEM.direita;
  const alturaUtil = altura - MARGEM.topo - base;
  const passo = passoDoEixo(Math.max(0, ...pontos.flatMap((p) => [p.novos, p.ativos])));
  const teto = passo * 4;
  const ultimo = Math.max(1, posicoes - 1);

  const x = (i: number) => MARGEM.esquerda + (larguraUtil * i) / ultimo;
  const y = (v: number) => MARGEM.topo + alturaUtil * (1 - v / teto);
  const linha = (valor: (p: PontoDaSerie) => number) =>
    pontos.map((p, i) => `${x(i).toFixed(1)},${y(valor(p)).toFixed(1)}`).join(" ");
  const marcas = [0, 1, 2, 3, 4].map((i) => i * passo);

  // Todos os rótulos quando cabem; quando não (celular), um a cada tantos,
  // sempre começando do primeiro.
  const salto = Math.max(1, Math.ceil(LARGURA_DO_ROTULO[granularidade] / (larguraUtil / ultimo)));
  const rotulos = Array.from({ length: posicoes }, (_, i) => i)
    .filter((i) => i % salto === 0)
    .map((i) => {
      if (granularidade === "hora") return { i, texto: `${i}h` };
      const inicio = pontos[i].inicio;
      return { i, texto: granularidade === "dia" ? String(Number(inicio.slice(8, 10))) : diaCurto(inicio) };
    });
  // Nos dias, o número do dia sozinho cabe em todos; o mês vai numa segunda
  // linha, só no primeiro dia e na virada ("ago" sob o 27, "set" sob o 1).
  const meses =
    granularidade === "dia"
      ? pontos
          .map((p, i) => ({ i, mes: Number(p.inicio.slice(5, 7)) }))
          .filter(({ i, mes }) => i === 0 || mes !== Number(pontos[i - 1].inicio.slice(5, 7)))
          .map(({ i, mes }) => ({ i, texto: MESES[mes - 1] }))
      : [];

  function apontar(evento: React.PointerEvent<SVGSVGElement>) {
    if (!pontos.length) return;
    const caixa = evento.currentTarget.getBoundingClientRect();
    const px = ((evento.clientX - caixa.left) * largura) / caixa.width;
    const i = Math.round(((px - MARGEM.esquerda) / larguraUtil) * ultimo);
    setDestaque(Math.min(pontos.length - 1, Math.max(0, i)));
  }

  const ponto = destaque !== null ? pontos[destaque] : undefined;
  // O balão fica ao lado da linha-guia, para não cobrir os pontos; na metade
  // direita ele passa para a esquerda, senão sairia do gráfico.
  const balaoAEsquerda = ponto !== undefined && x(destaque!) > largura / 2;

  const descricao = pontos.length
    ? `De ${tituloDoPonto(pontos[0], granularidade)} a ${tituloDoPonto(pontos[pontos.length - 1], granularidade)}: ` +
      `${pontos.reduce((s, p) => s + p.novos, 0)} novos usuários.`
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
            y={altura - base + 20}
            textAnchor="middle"
            className={styles.rotulo}
          >
            {texto}
          </text>
        ))}
        {meses.map(({ i, texto }) => (
          <text key={`m${i}`} x={x(i)} y={altura - 8} textAnchor="middle" className={styles.mes}>
            {texto}
          </text>
        ))}
        {ponto && (
          <line
            x1={x(destaque!)}
            x2={x(destaque!)}
            y1={MARGEM.topo}
            y2={altura - base}
            className={styles.guia}
          />
        )}
        <polyline points={linha((p) => p.ativos)} className={styles.linhaAtivos} />
        <polyline points={linha((p) => p.novos)} className={styles.linhaNovos} />
        {ponto && (
          <>
            <circle cx={x(destaque!)} cy={y(ponto.ativos)} r={5} className={styles.pontoAtivos} />
            <circle cx={x(destaque!)} cy={y(ponto.novos)} r={5} className={styles.pontoNovos} />
          </>
        )}
      </svg>
      {ponto && (
        <div
          className={styles.balao}
          style={{
            left: x(destaque!),
            top: MARGEM.topo,
            transform: balaoAEsquerda ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
          }}
          aria-hidden="true"
        >
          <div className={styles.balaoDia}>{tituloDoPonto(ponto, granularidade)}</div>
          <div className={styles.balaoLinha}>
            <span className={styles.marcaAtivos} />
            Usuários ativos <strong>{ponto.ativos}</strong>
          </div>
          <div className={styles.balaoLinha}>
            <span className={styles.marcaNovos} />
            Novos usuários <strong>{ponto.novos}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
