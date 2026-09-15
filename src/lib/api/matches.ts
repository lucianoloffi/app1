import type { Profile } from "../../types";
import { supabase } from "../supabaseClient";
import { lancaSeErro } from "../errors";
import { assinarFotos } from "./photos";
import { paraPerfis, type LinhaPerfilPublico } from "./mapeamento";

export interface ResumoDeMatch {
  matchId: string;
  outroId: string;
  nome: string;
  foto: string;
  finalizada: boolean;
  criadoEm: string;
  ultimaMensagem: string | null;
  ultimaEm: string | null;
  naoLidas: number;
  totalMensagens: number;
  euJaEnviei: boolean;
}

export async function listarMatches(): Promise<ResumoDeMatch[]> {
  const { data, error } = await supabase.rpc("meus_matches");
  lancaSeErro(error);

  const linhas = (data ?? []) as {
    match_id: string;
    outro_id: string;
    nome: string | null;
    foto: string | null;
    finalizada: boolean;
    criado_em: string;
    ultima_mensagem: string | null;
    ultima_em: string | null;
    nao_lidas: number;
    total_mensagens: number;
    eu_ja_enviei: boolean;
  }[];

  const urls = await assinarFotos(linhas.map((linha) => linha.foto ?? "").filter(Boolean));

  return linhas.map((linha) => ({
    matchId: linha.match_id,
    outroId: linha.outro_id,
    nome: linha.nome ?? "",
    foto: linha.foto ? (urls.get(linha.foto) ?? "") : "",
    finalizada: linha.finalizada,
    criadoEm: linha.criado_em,
    ultimaMensagem: linha.ultima_mensagem,
    ultimaEm: linha.ultima_em,
    naoLidas: linha.nao_lidas,
    totalMensagens: linha.total_mensagens,
    euJaEnviei: linha.eu_ja_enviei,
  }));
}

/** Perfil completo de alguém com quem já existe match (a fila não o devolve). */
export async function carregarPerfilDoMatch(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.rpc("perfil_do_match", { p_user_id: userId });
  lancaSeErro(error);
  const perfis = await paraPerfis((data ?? []) as LinhaPerfilPublico[]);
  return perfis[0] ?? null;
}

/** Desfazer match: apaga os dois swipes, então o perfil volta para a fila. */
export async function desfazerMatch(matchId: string): Promise<void> {
  const { error } = await supabase.rpc("desfazer_match", { p_match_id: matchId });
  lancaSeErro(error);
}

/** "Finalizar conversa" e reabrir — reversível pelos dois lados. */
export async function definirConversaFinalizada(
  matchId: string,
  finalizada: boolean,
): Promise<void> {
  const { error } = await supabase.rpc("definir_conversa_finalizada", {
    p_match_id: matchId,
    p_finalizada: finalizada,
  });
  lancaSeErro(error);
}
