import { supabase } from "../supabaseClient";
import { ErroDeApp, lancaSeErro } from "../errors";
import { assinarFotos } from "./photos";

export interface PerfilBloqueado {
  id: string;
  nome: string;
  foto: string;
  criadoEm: string;
}

export async function bloquear(userId: string): Promise<void> {
  const { data: sessao } = await supabase.auth.getUser();
  const meuId = sessao.user?.id;
  if (!meuId) throw new ErroDeApp("Sua sessão expirou. Entre de novo.");

  const { error } = await supabase
    .from("blocks")
    .insert({ bloqueador_id: meuId, bloqueado_id: userId });
  lancaSeErro(error);
}

export async function desbloquear(userId: string): Promise<void> {
  const { data: sessao } = await supabase.auth.getUser();
  const meuId = sessao.user?.id;
  if (!meuId) throw new ErroDeApp("Sua sessão expirou. Entre de novo.");

  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("bloqueador_id", meuId)
    .eq("bloqueado_id", userId);
  lancaSeErro(error);
}

export async function listarBloqueados(): Promise<PerfilBloqueado[]> {
  const { data, error } = await supabase.rpc("bloqueados");
  lancaSeErro(error);

  const linhas = (data ?? []) as {
    id: string;
    nome: string | null;
    foto: string | null;
    criado_em: string;
  }[];
  const urls = await assinarFotos(linhas.map((linha) => linha.foto ?? "").filter(Boolean));

  return linhas.map((linha) => ({
    id: linha.id,
    nome: linha.nome ?? "",
    foto: linha.foto ? (urls.get(linha.foto) ?? "") : "",
    criadoEm: linha.criado_em,
  }));
}

/**
 * Abre a denúncia pelo RPC, e não escrevendo em `reports`: é o servidor que
 * copia a conversa para dentro da denúncia, no mesmo instante (migration
 * 0015). Antes a prova sumia — desfazer o match apaga as mensagens em cascata,
 * e quem assediou podia apagar a conversa depois de ser denunciado.
 *
 * Denunciar também bloqueia (0018), no servidor: é uma coisa só, e não duas
 * chamadas que podem falhar pela metade.
 *
 * Devolve `nova: false` quando já havia uma denúncia sua contra essa pessoa
 * esperando decisão — nesse caso nada foi aberto, e a tela avisa em vez de
 * agradecer por uma denúncia que não existe.
 */
export async function denunciar(
  userId: string,
  motivo: string,
  descricao?: string,
): Promise<{ nova: boolean }> {
  const { data, error } = await supabase.rpc("denunciar", {
    p_denunciado: userId,
    p_motivo: motivo,
    p_descricao: descricao ?? null,
  });
  lancaSeErro(error);
  return { nova: (data as { nova?: boolean } | null)?.nova !== false };
}
