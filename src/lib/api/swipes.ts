import { supabase } from "../supabaseClient";
import { lancaSeErro } from "../errors";

export interface ResultadoDoSwipe {
  matched: boolean;
  matchId: string | null;
}

async function registrar(paraUserId: string, acao: "like" | "dislike"): Promise<ResultadoDoSwipe> {
  const { data, error } = await supabase.rpc("registrar_swipe", {
    p_para: paraUserId,
    p_acao: acao,
  });
  lancaSeErro(error);
  const resposta = (data ?? {}) as { matched?: boolean; match_id?: string | null };
  return { matched: Boolean(resposta.matched), matchId: resposta.match_id ?? null };
}

/** O servidor é quem decide se houve match — o app nunca sabe quem curtiu antes. */
export function curtir(paraUserId: string): Promise<ResultadoDoSwipe> {
  return registrar(paraUserId, "like");
}

export function dispensar(paraUserId: string): Promise<ResultadoDoSwipe> {
  return registrar(paraUserId, "dislike");
}
