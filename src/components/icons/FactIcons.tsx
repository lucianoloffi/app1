/** Ícones dos blocos "Sobre" e "Valores" no perfil de outra pessoa. */
export type FactIconName =
  | "relacionamento"
  | "altura"
  | "bebida"
  | "atividade"
  | "filhos"
  | "fumo"
  | "alimentacao"
  | "religiao"
  | "politica";

// Traço, sem preenchimento: a cor vem do `currentColor` de quem usa.
const PATHS: Record<FactIconName, string> = {
  relacionamento:
    "M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z",
  altura: "M8.5 3h7v18h-7zM8.5 7h3M8.5 11h4.5M8.5 15h3M8.5 19h4.5",
  bebida: "M7.5 3h9l-.6 5.5a3.9 3.9 0 0 1-7.8 0zM12 12.4V20M8.5 20h7",
  atividade: "M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11",
  filhos:
    "M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 20v-1a5.5 5.5 0 0 1 11 0v1M17 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM15.5 20v-.5a3.2 3.2 0 0 1 5.5-2.2",
  fumo: "M3 14h13v3.5H3zM18.5 14v3.5M21 14v3.5M17 4c0 1.8 2 1.8 2 3.6S17 9.5 17 11",
  alimentacao: "M6 3v5a2 2 0 0 0 4 0V3M8 10v11M18 21V3c-2.2 1-3.5 3.8-3.5 8H18",
  religiao:
    "M12 3.5l1.9 5 5.1 1.9-5.1 1.9-1.9 5.2-1.9-5.2L5 10.4l5.1-1.9zM18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z",
  politica: "M3.5 9L12 4l8.5 5zM5.5 9v9M10 9v9M14 9v9M18.5 9v9M3 20.5h18",
};

export function FactIcon({ name, size = 16 }: { name: FactIconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={PATHS[name]}
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
