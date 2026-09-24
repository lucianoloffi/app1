import type { MyProfile } from "../types";

export interface Completeness {
  pct: number;
  /**
   * O que falta em Editar perfil, embaixo do nome no topo — só o que se
   * resolve tocando ali. Vazio quando o que falta está em outro lugar.
   */
  hint: string;
  /** O que falta na tela Interesses, dentro do cartão dela. Vazio se nada. */
  interestsHint: string;
}

const TOTAL_ITEMS = 16; // 10 campos + 6 slots de foto
const MIN_INTERESSES = 3;

/**
 * "Falta 1 foto", "Faltam 2 fotos", "Faltam sua bio e altura": plural quando
 * são dois itens ou quando o primeiro já é plural (começa por número > 1).
 */
function frasesDoQueFalta(missing: string[]): string {
  if (missing.length === 0) return "";
  const itens = missing.slice(0, 2);
  const plural = itens.length > 1 || /^([2-9]|\d{2,}) /.test(itens[0]);
  return `${plural ? "Faltam" : "Falta"} ${itens.join(" e ")}`;
}

export function computeCompleteness(profile: MyProfile | null, photosCount: number): Completeness {
  if (!profile) return { pct: 0, hint: "Faltam suas informações", interestsHint: "" };

  const lifestyleComplete = Boolean(
    profile.lifestyle.bebida && profile.lifestyle.atividade && profile.lifestyle.filhos,
  );

  const fields = [
    Boolean(profile.name),
    Boolean(profile.city),
    Boolean(profile.birthdate),
    Boolean(profile.gender),
    Boolean(profile.profession),
    Boolean(profile.relationshipStatus),
    Boolean(profile.height),
    Boolean(profile.bio.trim()),
    profile.interests.length >= MIN_INTERESSES,
    lifestyleComplete,
  ];

  const doneFields = fields.filter(Boolean).length;
  const pct = Math.round(((doneFields + photosCount) / TOTAL_ITEMS) * 100);

  // Separado por tela: o topo abre Editar perfil, e ele dizia "Faltam 3
  // interesses" depois que interesses saíram de lá — quem tocava não achava
  // o que faltava.
  const faltaNoPerfil: string[] = [];
  if (photosCount < 6)
    faltaNoPerfil.push(`${6 - photosCount} ${6 - photosCount === 1 ? "foto" : "fotos"}`);
  if (!profile.bio.trim()) faltaNoPerfil.push("sua bio");
  if (!profile.profession) faltaNoPerfil.push("profissão");
  // Altura conta na porcentagem mas não estava nesta lista: quem não tinha
  // preenchido via "Faltam" e mais nada.
  if (!profile.height) faltaNoPerfil.push("sua altura");

  const faltaNosInteresses: string[] = [];
  if (profile.interests.length < MIN_INTERESSES)
    faltaNosInteresses.push(`${MIN_INTERESSES} interesses`);
  if (!lifestyleComplete) faltaNosInteresses.push("estilo de vida");
  if (!profile.relationshipStatus) faltaNosInteresses.push("estado civil");

  if (pct >= 100) return { pct, hint: "Perfil completo", interestsHint: "" };

  return {
    pct,
    hint: frasesDoQueFalta(faltaNoPerfil),
    interestsHint: frasesDoQueFalta(faltaNosInteresses),
  };
}
