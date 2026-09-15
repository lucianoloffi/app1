import type { Filters, MyProfile, OnboardingState } from "../../types";
import { supabase } from "../supabaseClient";
import { ErroDeApp, lancaSeErro } from "../errors";
import { minhasFotos } from "./photos";

/** dd/mm/aaaa (como as telas guardam) → aaaa-mm-dd (como o banco guarda). */
export function paraDataISO(digitos: string): string | null {
  const limpo = digitos.replace(/\D/g, "");
  if (limpo.length < 8) return null;
  return `${limpo.slice(4, 8)}-${limpo.slice(2, 4)}-${limpo.slice(0, 2)}`;
}

export function paraDataDaTela(iso: string | null): string {
  if (!iso) return "";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}${mes}${ano}`;
}

async function meuId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new ErroDeApp("Sua sessão expirou. Entre de novo.");
  return id;
}

export interface MeuPerfilCompleto {
  perfil: MyProfile;
  filtros: Filters;
  cadastroCompleto: boolean;
}

export async function carregarMeuPerfil(): Promise<MeuPerfilCompleto | null> {
  const { data: sessao } = await supabase.auth.getUser();
  const usuario = sessao.user;
  if (!usuario) return null;

  const [{ data: perfil, error }, { data: prefs }, { data: interesses }, fotos] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", usuario.id).maybeSingle(),
    supabase.from("profile_preferences").select("*").eq("user_id", usuario.id).maybeSingle(),
    supabase.from("profile_interests").select("interesse").eq("user_id", usuario.id),
    minhasFotos(),
  ]);
  lancaSeErro(error);
  if (!perfil) return null;

  return {
    perfil: {
      name: perfil.nome ?? "",
      city: perfil.cidade ?? "",
      birthdate: paraDataDaTela(perfil.data_nascimento),
      gender: perfil.genero ?? "outros",
      bio: perfil.bio ?? "",
      photos: fotos.map((foto) => foto.url).filter(Boolean),
      intention: perfil.intencao ?? "conhecer",
      interestedIn: prefs?.interesse_em ?? "todos",
      interests: (interesses ?? []).map((linha) => linha.interesse),
      lifestyle: {
        bebida: perfil.bebida ?? null,
        atividade: perfil.atividade ?? null,
        filhos: perfil.filhos ?? null,
      },
      profession: perfil.profissao ?? "",
      height: perfil.altura_m === null ? 1.7 : Number(perfil.altura_m),
      relationshipStatus: perfil.status_relacionamento ?? null,
      email: usuario.email ?? "",
      phone: perfil.telefone ?? "",
      visible: perfil.visivel,
      showDistance: perfil.mostrar_distancia,
      verificationStatus: perfil.verificacao_status,
      approximateLocation: perfil.localizacao_aproximada,
    },
    filtros: {
      intention: prefs?.intencao_filtro ?? "todas",
      distanceKm: prefs?.distancia_max_km ?? 25,
      minAge: prefs?.idade_min ?? 25,
      maxAge: prefs?.idade_max ?? 45,
      interestedIn: prefs?.interesse_em ?? "todos",
    },
    cadastroCompleto: Boolean(perfil.onboarding_completo),
  };
}

/** Salva os campos editáveis do perfil (tela Editar perfil). */
export async function salvarPerfil(perfil: MyProfile): Promise<void> {
  const id = await meuId();

  const { error } = await supabase
    .from("profiles")
    .update({
      nome: perfil.name.trim(),
      cidade: perfil.city,
      bio: perfil.bio,
      genero: perfil.gender,
      intencao: perfil.intention,
      profissao: perfil.profession,
      altura_m: perfil.height,
      status_relacionamento: perfil.relationshipStatus,
      bebida: perfil.lifestyle.bebida,
      atividade: perfil.lifestyle.atividade,
      filhos: perfil.lifestyle.filhos,
    })
    .eq("id", id);
  lancaSeErro(error);

  await salvarInteresses(perfil.interests);
}

export async function salvarInteresses(interesses: string[]): Promise<void> {
  const id = await meuId();

  const { error: erroApaga } = await supabase.from("profile_interests").delete().eq("user_id", id);
  lancaSeErro(erroApaga);

  if (interesses.length === 0) return;
  const { error } = await supabase
    .from("profile_interests")
    .insert(interesses.map((interesse) => ({ user_id: id, interesse })));
  lancaSeErro(error);
}

/** Grava tudo que o cadastro coletou e libera o perfil para a fila. */
export async function concluirCadastro(estado: OnboardingState): Promise<void> {
  const id = await meuId();
  const nascimento = paraDataISO(estado.birthdate);
  if (!nascimento) throw new ErroDeApp("Informe uma data de nascimento válida.");

  const { error } = await supabase
    .from("profiles")
    .update({
      nome: estado.name.trim(),
      telefone: estado.phone,
      data_nascimento: nascimento,
      bio: estado.bio,
      genero: estado.gender,
      cidade: estado.city,
      profissao: estado.profession,
      altura_m: estado.height,
      status_relacionamento: estado.relationshipStatus,
      intencao: estado.intention,
      bebida: estado.lifestyle.bebida,
      atividade: estado.lifestyle.atividade,
      filhos: estado.lifestyle.filhos,
    })
    .eq("id", id);
  lancaSeErro(error);

  await salvarInteresses(estado.interests);

  const { error: erroPrefs } = await supabase
    .from("profile_preferences")
    .update({
      interesse_em: estado.interestedIn,
      intencao_filtro: estado.intention ?? "todas",
    })
    .eq("user_id", id);
  lancaSeErro(erroPrefs);

  const { error: erroCompleto } = await supabase
    .from("profiles")
    .update({ onboarding_completo: true })
    .eq("id", id);
  lancaSeErro(erroCompleto);
}

export async function salvarFiltros(filtros: Filters): Promise<void> {
  const id = await meuId();
  const { error } = await supabase
    .from("profile_preferences")
    .update({
      interesse_em: filtros.interestedIn,
      intencao_filtro: filtros.intention,
      distancia_max_km: filtros.distanceKm,
      idade_min: filtros.minAge,
      idade_max: filtros.maxAge,
    })
    .eq("user_id", id);
  lancaSeErro(error);
}

export async function atualizarTelefone(telefone: string): Promise<void> {
  const id = await meuId();
  const { error } = await supabase
    .from("profiles")
    .update({ telefone, telefone_verificado: false })
    .eq("id", id);
  lancaSeErro(error);
}

export async function definirVisibilidade(visivel: boolean): Promise<void> {
  const id = await meuId();
  const { error } = await supabase.from("profiles").update({ visivel }).eq("id", id);
  lancaSeErro(error);
}

export async function definirMostrarDistancia(mostrar: boolean): Promise<void> {
  const id = await meuId();
  const { error } = await supabase
    .from("profiles")
    .update({ mostrar_distancia: mostrar })
    .eq("id", id);
  lancaSeErro(error);
}

export async function statusDeVerificacao(): Promise<MyProfile["verificationStatus"]> {
  const id = await meuId();
  const { data, error } = await supabase
    .from("profiles")
    .select("verificacao_status")
    .eq("id", id)
    .maybeSingle();
  lancaSeErro(error);
  return data?.verificacao_status ?? "nao_solicitada";
}
