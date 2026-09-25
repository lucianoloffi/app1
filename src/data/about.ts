import type { AboutTexts } from "../types";

/** A pergunta de cada texto, a mesma no cadastro e em Editar perfil. */
export const ABOUT_QUESTION: Record<keyof AboutTexts, string> = {
  tempoLivre: "O que você gosta de fazer no seu tempo livre?",
  oQueValoriza: "O que você valoriza em uma pessoa?",
};

export const ABOUT_EXAMPLE: Record<keyof AboutTexts, string> = {
  tempoLivre:
    "Ex.: Pedalar cedo, conhecer lugares novos, um barzinho com música ao vivo ou maratonar uma série…",
  oQueValoriza: "Ex.: Bom humor, sinceridade, leveza e alguém que também goste de sair da rotina…",
};
