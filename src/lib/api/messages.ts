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

/**
 * Escuta mensagens novas de uma conversa. Devolve a função que encerra a
 * escuta — quem chama é responsável por encerrá-la ao sair da tela.
 */
export function ouvirMensagens(
  matchId: string,
  aoChegar: (mensagem: ChatMessage) => void,
): () => void {
  let meuId: string | undefined;
  void supabase.auth.getUser().then(({ data }) => {
    meuId = data.user?.id;
  });

  const canal = supabase
    .channel(`mensagens:${matchId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
      (payload) => {
        const linha = payload.new as LinhaDeMensagem;
        aoChegar({
          id: linha.id,
          mine: linha.sender_id === meuId,
          text: linha.conteudo,
          createdAt: linha.criado_em,
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
