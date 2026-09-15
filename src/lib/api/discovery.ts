import type { Profile } from "../../types";
import { supabase } from "../supabaseClient";
import { lancaSeErro } from "../errors";
import { paraPerfis, type LinhaPerfilPublico } from "./mapeamento";

export const TAMANHO_DA_PAGINA = 20;

/**
 * Fila do Descobrir. Os filtros (interesse, intenção, distância e faixa
 * etária) são aplicados no servidor, a partir das preferências salvas.
 */
export async function buscarFila(pagina = 0): Promise<Profile[]> {
  const { data, error } = await supabase.rpc("fila_descobrir", {
    p_limit: TAMANHO_DA_PAGINA,
    p_offset: pagina * TAMANHO_DA_PAGINA,
  });
  lancaSeErro(error);
  return paraPerfis((data ?? []) as LinhaPerfilPublico[]);
}

/** Cidades aceitas no cadastro (lista fechada, também usada no fallback). */
export async function listarCidades(): Promise<string[]> {
  const { data, error } = await supabase.from("cities").select("nome").order("nome");
  lancaSeErro(error);
  return (data ?? []).map((linha) => linha.nome);
}
