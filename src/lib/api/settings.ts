import { supabase } from "../supabaseClient";
import { ErroDeApp, lancaSeErro } from "../errors";

export interface AjustesDeNotificacao {
  notifMatch: boolean;
  notifMensagem: boolean;
  notifNovidades: boolean;
}

const PADRAO: AjustesDeNotificacao = {
  notifMatch: true,
  notifMensagem: true,
  notifNovidades: true,
};

export async function carregarAjustes(): Promise<AjustesDeNotificacao> {
  const { data: sessao } = await supabase.auth.getUser();
  const meuId = sessao.user?.id;
  if (!meuId) return PADRAO;

  const { data, error } = await supabase
    .from("settings")
    .select("notif_match, notif_mensagem, notif_novidades")
    .eq("user_id", meuId)
    .maybeSingle();
  lancaSeErro(error);
  if (!data) return PADRAO;

  return {
    notifMatch: data.notif_match,
    notifMensagem: data.notif_mensagem,
    notifNovidades: data.notif_novidades,
  };
}

export async function salvarAjustes(ajustes: Partial<AjustesDeNotificacao>): Promise<void> {
  const { data: sessao } = await supabase.auth.getUser();
  const meuId = sessao.user?.id;
  if (!meuId) throw new ErroDeApp("Sua sessão expirou. Entre de novo.");

  const patch: Record<string, boolean> = {};
  if (ajustes.notifMatch !== undefined) patch.notif_match = ajustes.notifMatch;
  if (ajustes.notifMensagem !== undefined) patch.notif_mensagem = ajustes.notifMensagem;
  if (ajustes.notifNovidades !== undefined) patch.notif_novidades = ajustes.notifNovidades;
  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase.from("settings").update(patch).eq("user_id", meuId);
  lancaSeErro(error);
}
