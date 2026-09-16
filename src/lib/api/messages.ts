import type { ChatMessage } from "../../types";
import { supabase } from "../supabaseClient";
import { ErroDeApp, lancaSeErro } from "../errors";

interface LinhaDeMensagem {
  id: string;
  match_id: string;
  sender_id: string;
  conteudo: string;
  criado_em: string;
}

export async function listarMensagens(matchId: string): Promise<ChatMessage[]> {
  const { data: sessao } = await supabase.auth.getUser();
  const meuId = sessao.user?.id;

  const { data, error } = await supabase
    .from("messages")
    .select("id, match_id, sender_id, conteudo, criado_em")
    .eq("match_id", matchId)
    .order("criado_em", { ascending: true });
  lancaSeErro(error);

  return ((data ?? []) as LinhaDeMensagem[]).map((linha) => ({
    id: linha.id,
    mine: linha.sender_id === meuId,
    text: linha.conteudo,
    createdAt: linha.criado_em,
  }));
}

export async function enviarMensagem(matchId: string, texto: string): Promise<ChatMessage> {
  const { data: sessao } = await supabase.auth.getUser();
  const meuId = sessao.user?.id;
  if (!meuId) throw new ErroDeApp("Sua sessão expirou. Entre de novo.");

  const { data, error } = await supabase
    .from("messages")
    .insert({ match_id: matchId, sender_id: meuId, conteudo: texto })
    .select("id, match_id, sender_id, conteudo, criado_em")
    .single();
  lancaSeErro(error);
  if (!data) throw new ErroDeApp("A mensagem não foi enviada.");

  return { id: data.id, mine: true, text: data.conteudo, createdAt: data.criado_em };
}

export async function marcarMensagensLidas(matchId: string): Promise<void> {
  const { error } = await supabase.rpc("marcar_mensagens_lidas", { p_match_id: matchId });
  lancaSeErro(error);
}

export interface MensagemRecebida {
  matchId: string;
  mensagem: ChatMessage;
}

/**
 * Escuta as mensagens de todas as minhas conversas de uma vez — é o que
 * permite a conversa aberta atualizar na hora e, estando em outra aba, o
 * contador de não lidas subir. O RLS decide o que chega: só mensagens de
 * matches meus passam.
 *
 * Devolve a função que encerra a escuta.
 */
export function ouvirMinhasMensagens(
  meuId: string,
  aoChegar: (recebida: MensagemRecebida) => void,
): () => void {
  const canal = supabase
    .channel("minhas-mensagens")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      (payload) => {
        const linha = payload.new as LinhaDeMensagem;
        aoChegar({
          matchId: linha.match_id,
          mensagem: {
            id: linha.id,
            mine: linha.sender_id === meuId,
            text: linha.conteudo,
            createdAt: linha.criado_em,
          },
        });
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(canal);
  };
}

/** Avisa quando qualquer match meu muda (match novo, desfeito, finalizado). */
export function ouvirMatches(aoMudar: () => void): () => void {
  const canal = supabase
    .channel("meus-matches")
    .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => aoMudar())
    .subscribe();

  return () => {
    void supabase.removeChannel(canal);
  };
}
