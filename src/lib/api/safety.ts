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

export async function denunciar(
  userId: string,
  motivo: string,
  descricao?: string,
): Promise<void> {
  const { data: sessao } = await supabase.auth.getUser();
  const meuId = sessao.user?.id;
  if (!meuId) throw new ErroDeApp("Sua sessão expirou. Entre de novo.");

  const { error } = await supabase.from("reports").insert({
    denunciante_id: meuId,
    denunciado_id: userId,
    motivo,
    descricao: descricao ?? null,
  });
  lancaSeErro(error);
}
