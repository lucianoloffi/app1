import { supabase } from "../supabaseClient";
import { lancaSeErro, ErroDeApp } from "../errors";
import { comprimeImagem, validaArquivoDeImagem } from "../imagem";

const BUCKET = "fotos";
const BUCKET_VERIFICACAO = "verificacoes";
const VALIDADE_URL_SEGUNDOS = 60 * 60;

export interface FotoDoPerfil {
  id: string;
  path: string;
  url: string;
  ordem: number;
  principal: boolean;
  status: "pendente" | "aprovada" | "rejeitada";
}

/** Troca caminhos do storage por URLs assinadas, em uma só chamada. */
export async function assinarFotos(paths: string[]): Promise<Map<string, string>> {
  const unicos = [...new Set(paths.filter(Boolean))];
  const mapa = new Map<string, string>();
  if (unicos.length === 0) return mapa;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(unicos, VALIDADE_URL_SEGUNDOS);
  if (error) return mapa;

  for (const item of data ?? []) {
    if (item.signedUrl && item.path) mapa.set(item.path, item.signedUrl);
  }
  return mapa;
}

export async function minhasFotos(): Promise<FotoDoPerfil[]> {
  const { data: sessao } = await supabase.auth.getUser();
  const userId = sessao.user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from("photos")
    .select("id, storage_path, ordem, principal, status_moderacao")
    .eq("user_id", userId)
    .order("principal", { ascending: false })
    .order("ordem", { ascending: true })
    .order("criado_em", { ascending: true });
  lancaSeErro(error);

  const linhas = data ?? [];
  const urls = await assinarFotos(linhas.map((linha) => linha.storage_path));

  return linhas.map((linha) => ({
    id: linha.id,
    path: linha.storage_path,
    url: urls.get(linha.storage_path) ?? "",
    ordem: linha.ordem,
    principal: linha.principal,
    status: linha.status_moderacao,
  }));
}

export async function enviarFoto(arquivo: File): Promise<FotoDoPerfil> {
  const problema = validaArquivoDeImagem(arquivo);
  if (problema) throw new ErroDeApp(problema);

  const { data: sessao } = await supabase.auth.getUser();
  const userId = sessao.user?.id;
  if (!userId) throw new ErroDeApp("Sua sessão expirou. Entre de novo.");

  const blob = await comprimeImagem(arquivo);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;

  const { error: erroUpload } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  lancaSeErro(erroUpload);

  const atuais = await minhasFotos();
  const { data, error } = await supabase
    .from("photos")
    .insert({
      user_id: userId,
      storage_path: path,
      ordem: atuais.length,
      principal: atuais.length === 0,
    })
    .select("id, storage_path, ordem, principal, status_moderacao")
    .single();
  lancaSeErro(error);
  if (!data) throw new ErroDeApp("Não foi possível salvar a foto.");

  const urls = await assinarFotos([data.storage_path]);
  return {
    id: data.id,
    path: data.storage_path,
    url: urls.get(data.storage_path) ?? "",
    ordem: data.ordem,
    principal: data.principal,
    status: data.status_moderacao,
  };
}

export async function removerFoto(id: string, path: string): Promise<void> {
  const { error } = await supabase.from("photos").delete().eq("id", id);
  lancaSeErro(error);
  await supabase.storage.from(BUCKET).remove([path]);
}

/** Grava a nova ordem; a primeira da lista vira a foto principal. */
export async function reordenarFotos(idsNaOrdem: string[]): Promise<void> {
  for (const [indice, id] of idsNaOrdem.entries()) {
    const { error } = await supabase
      .from("photos")
      .update({ ordem: indice, principal: false })
      .eq("id", id);
    lancaSeErro(error);
  }
  if (idsNaOrdem.length > 0) await definirPrincipal(idsNaOrdem[0]);
}

export async function definirPrincipal(id: string): Promise<void> {
  const { data: sessao } = await supabase.auth.getUser();
  const userId = sessao.user?.id;
  if (!userId) throw new ErroDeApp("Sua sessão expirou. Entre de novo.");

  const { error: erroLimpa } = await supabase
    .from("photos")
    .update({ principal: false })
    .eq("user_id", userId)
    .eq("principal", true);
  lancaSeErro(erroLimpa);

  const { error } = await supabase.from("photos").update({ principal: true }).eq("id", id);
  lancaSeErro(error);
}

/** Selfie de verificação: bucket privado, ninguém além do dono acessa. */
export async function enviarSelfieDeVerificacao(arquivo: File): Promise<void> {
  const problema = validaArquivoDeImagem(arquivo);
  if (problema) throw new ErroDeApp(problema);

  const { data: sessao } = await supabase.auth.getUser();
  const userId = sessao.user?.id;
  if (!userId) throw new ErroDeApp("Sua sessão expirou. Entre de novo.");

  const blob = await comprimeImagem(arquivo);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;

  const { error: erroUpload } = await supabase.storage
    .from(BUCKET_VERIFICACAO)
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  lancaSeErro(erroUpload);

  const { error } = await supabase.from("verificacoes").insert({ user_id: userId, selfie_path: path });
  lancaSeErro(error);

  const { error: erroPerfil } = await supabase
    .from("profiles")
    .update({ verificacao_status: "pendente" })
    .eq("id", userId);
  lancaSeErro(erroPerfil);
}
