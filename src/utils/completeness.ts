import type { MyProfile } from "../types";

export interface Completeness {
  pct: number;
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

  const hint = pct >= 100 ? "Perfil completo" : `Faltam ${missing.slice(0, 2).join(" e ")}`;
  return { pct, hint };
}
