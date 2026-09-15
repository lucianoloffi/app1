import { supabase } from "../supabaseClient";
import { ErroDeApp, lancaSeErro } from "../errors";
import { LEGAL_VERSIONS } from "../../legal/versions";

export type TipoDeConsentimento = "termos" | "privacidade" | "diretrizes" | "dados_sensiveis";

const VERSAO_POR_TIPO: Record<TipoDeConsentimento, string> = {
  termos: LEGAL_VERSIONS.termos,
  privacidade: LEGAL_VERSIONS.privacidade,
  diretrizes: LEGAL_VERSIONS.diretrizes,
  dados_sensiveis: LEGAL_VERSIONS.dados_sensiveis,
};

/** Registra o aceite com tipo, versão e data — exigência do art. 8º da LGPD. */
export async function registrarConsentimentos(tipos: TipoDeConsentimento[]): Promise<void> {
  const { data: sessao } = await supabase.auth.getUser();
  const meuId = sessao.user?.id;
  if (!meuId) throw new ErroDeApp("Sua sessão expirou. Entre de novo.");

  const { error } = await supabase
    .from("consents")
    .insert(tipos.map((tipo) => ({ user_id: meuId, tipo, versao: VERSAO_POR_TIPO[tipo] })));
  lancaSeErro(error);
}

export async function meusConsentimentos(): Promise<
  { tipo: TipoDeConsentimento; versao: string; aceitoEm: string }[]
> {
  const { data, error } = await supabase
    .from("consents")
    .select("tipo, versao, aceito_em")
    .order("aceito_em", { ascending: false });
  lancaSeErro(error);
  return (data ?? []).map((linha) => ({
    tipo: linha.tipo,
    versao: linha.versao,
    aceitoEm: linha.aceito_em,
  }));
}

/** Portabilidade (art. 18, V): devolve tudo o que guardamos sobre a pessoa. */
export async function exportarMeusDados(): Promise<unknown> {
  const { data, error } = await supabase.rpc("exportar_meus_dados");
  lancaSeErro(error);
  return data;
}

/**
 * Exclusão definitiva. Chama a Edge Function delete-account, que roda com
 * service role: a chave anon não apaga usuário do auth nem arquivos.
 */
export async function excluirConta(): Promise<void> {
  const { data: sessao } = await supabase.auth.getSession();
  const token = sessao.session?.access_token;
  if (!token) throw new ErroDeApp("Sua sessão expirou. Entre de novo.");

  const { error } = await supabase.functions.invoke("delete-account", {
    body: {},
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) throw new ErroDeApp("Não foi possível excluir a conta agora. Tente de novo.");

  await supabase.auth.signOut();
}
