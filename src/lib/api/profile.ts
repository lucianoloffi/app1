import type { Filters, Intention, MyProfile, OnboardingState } from "../../types";
import { supabase } from "../supabaseClient";
import { ErroDeApp, lancaSeErro } from "../errors";
import { minhasFotos } from "./photos";

/**
 * O cadastro começa aceitando as três: filtrar logo de saída esconderia
 * perfis que a pessoa nem sabe que existem.
 */
export const TODAS_AS_INTENCOES: Intention[] = ["serio", "conhecer", "amizade"];

/**
 * Lista vazia deixaria a fila sempre sem ninguém, e o banco recusa. Uma linha
 * antiga ainda pode trazer a intenção única de antes da múltipla escolha.
 */
function intencoesOuPadrao(valor: unknown): Intention[] {
  const lista = Array.isArray(valor) ? valor : typeof valor === "string" ? [valor] : [];
  const validas = lista.filter((item): item is Intention =>
    TODAS_AS_INTENCOES.includes(item as Intention),
  );
  return validas.length > 0 ? validas : TODAS_AS_INTENCOES;
}

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
  /** false = ainda não temos nem GPS nem cidade gravados para esta pessoa. */
  temLocalizacao: boolean;
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
      intentions: intencoesOuPadrao(prefs?.intencao_filtro),
      distanceKm: prefs?.distancia_max_km ?? 25,
      minAge: prefs?.idade_min ?? 25,
      maxAge: prefs?.idade_max ?? 45,
      interestedIn: prefs?.interesse_em ?? "todos",
    },
    cadastroCompleto: Boolean(perfil.onboarding_completo),
    temLocalizacao: perfil.localizacao !== null && perfil.localizacao !== undefined,
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
      intencao_filtro: TODAS_AS_INTENCOES,
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
      intencao_filtro: intencoesOuPadrao(filtros.intentions),
      distancia_max_km: filtros.distanceKm,
      idade_min: filtros.minAge,
      idade_max: filtros.maxAge,
    })
    .eq("user_id", id);
  lancaSeErro(error);
}

export async function atualizarTelefone(telefone: string): Promise<void> {
  const id = await meuId();
  // Só o telefone: telefone_verificado não é escrevível pelo cliente. O trigger
  // profiles_telefone_reverifica zera a verificação sempre que o número muda.
  const { error } = await supabase.from("profiles").update({ telefone }).eq("id", id);
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

/** Envia a coordenada já arredondada (ver lib/geo.ts). */
export async function atualizarLocalizacao(lat: number, lng: number): Promise<void> {
  const { error } = await supabase.rpc("atualizar_localizacao", { p_lat: lat, p_lng: lng });
  lancaSeErro(error);
}

/** Fallback: passa a usar o centro do município escolhido no cadastro. */
export async function usarLocalizacaoDaCidade(cidade: string): Promise<void> {
  const { error } = await supabase.rpc("usar_localizacao_da_cidade", { p_cidade: cidade });
  lancaSeErro(error);
}
