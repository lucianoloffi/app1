import type { MyProfile } from "../types";

export interface Completeness {
  pct: number;
  /** O que falta, em uma linha, embaixo do nome no topo do perfil. */
  hint: string;
}

const TOTAL_ITEMS = 16; // 10 campos + 6 slots de foto

export function computeCompleteness(profile: MyProfile | null, photosCount: number): Completeness {
  if (!profile) return { pct: 0, hint: "Faltam suas informações" };

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
    profile.interests.length >= 3,
    lifestyleComplete,
  ];

  const doneFields = fields.filter(Boolean).length;
  const pct = Math.round(((doneFields + photosCount) / TOTAL_ITEMS) * 100);

  const missing: string[] = [];
  if (photosCount < 6) missing.push(`${6 - photosCount} ${6 - photosCount === 1 ? "foto" : "fotos"}`);
  if (!profile.bio.trim()) missing.push("sua bio");
  if (profile.interests.length < 3) missing.push("3 interesses");
  if (!lifestyleComplete) missing.push("estilo de vida");
  if (!profile.profession) missing.push("profissão");
  if (!profile.relationshipStatus) missing.push("estado civil");
  // Altura conta na porcentagem mas não estava nesta lista: quem não tinha
  // preenchido via "Faltam" e mais nada.
  if (!profile.height) missing.push("sua altura");

  if (pct >= 100 || missing.length === 0) return { pct, hint: "Perfil completo" };

  // "Falta 1 foto", "Faltam 2 fotos", "Faltam sua bio e altura": plural quando
  // são dois itens ou quando o primeiro já é plural (começa por número > 1).
  const itens = missing.slice(0, 2);
  const plural = itens.length > 1 || /^([2-9]|\d{2,}) /.test(itens[0]);
  return { pct, hint: `${plural ? "Faltam" : "Falta"} ${itens.join(" e ")}` };
}
