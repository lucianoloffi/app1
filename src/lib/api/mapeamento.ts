import type { Activity, Drink, Kids, Profile } from "../../types";
import { assinarFotos } from "./photos";

/** Linha devolvida pelas funções fila_descobrir e perfil_do_match. */
export interface LinhaPerfilPublico {
  id: string;
  name: string | null;
  age: number | null;
  gender: Profile["gender"] | null;
  profession: string | null;
  city: string | null;
  distance_km: number | null;
  intention: Profile["intention"] | null;
  interests: string[] | null;
  bio: string | null;
  photos: string[] | null;
  bebida: string | null;
  atividade: string | null;
  filhos: string | null;
  relationship_status: Profile["relationshipStatus"] | null;
  height: number | string | null;
}

/** Converte as linhas do servidor no type Profile que as telas já usam. */
export async function paraPerfis(linhas: LinhaPerfilPublico[]): Promise<Profile[]> {
  const urls = await assinarFotos(linhas.flatMap((linha) => linha.photos ?? []));

  return linhas.map((linha) => ({
    id: linha.id,
    name: linha.name ?? "",
    age: linha.age ?? 0,
    gender: linha.gender ?? "outros",
    profession: linha.profession ?? "",
    city: linha.city ?? "",
    distanceKm: linha.distance_km,
    intention: linha.intention ?? "conhecer",
    interests: linha.interests ?? [],
    bio: linha.bio ?? "",
    photos: (linha.photos ?? []).map((path) => urls.get(path) ?? "").filter(Boolean),
    lifestyle: {
      bebida: (linha.bebida as Drink | null) ?? null,
      atividade: (linha.atividade as Activity | null) ?? null,
      filhos: (linha.filhos as Kids | null) ?? null,
    },
    relationshipStatus: linha.relationship_status ?? undefined,
    height: linha.height === null ? undefined : Number(linha.height),
  }));
}
