import type { CampoQuePodeRecusar, MyProfile } from "../types";

export interface Completeness {
  pct: number;
  /**
   * O que falta em Editar perfil, embaixo do nome no topo — só o que se
   * resolve tocando ali. Vazio quando o que falta está em outro lugar.
   */
  hint: string;
  /** O que falta na tela Interesses, dentro do cartão dela. Vazio se nada. */
  interestsHint: string;
}

const MIN_INTERESSES = 3;
/** Com quatro fotos o perfil já está completo: seis era pressão demais. */
const FOTOS_DO_PERFIL_COMPLETO = 4;

/**
 * Pesos em pontos, somando 100. Antes cada campo valia o mesmo, e o anel
 * parecia não responder: estilo de vida só contava com as quatro perguntas
 * respondidas, um ou dois interesses não davam nada, e os dois textos de
 * "Conte mais sobre você" não entravam. Agora o que mais ajuda num match
 * (fotos e bio) pesa mais, e tudo que se preenche mexe no número.
 * Religião e política continuam fora, com peso zero e não menor: qualquer
 * ponto deixaria o anel abaixo de 100% para quem não quer responder dado
 * sensível. Alimentação fica fora junto, por ser da mesma tela.
 */
const PESO = {
  /** Nome, cidade, nascimento, gênero e a 1ª foto: todos vêm do cadastro. */
  cadastro: 4,
  segundaFoto: 10,
  terceiraFoto: 10,
  quartaFoto: 5,
  bio: 15,
  /** Proporcional até MIN_INTERESSES: 1 = 3, 2 = 6, 3 = 10. */
  interesses: 10,
  profissao: 5,
  altura: 5,
  /** Por pergunta (bebida, atividade, filhos, fumo), não mais tudo ou nada. */
  estiloDeVida: 2,
  estadoCivil: 4,
  /** Cada um dos dois textos de "Conte mais sobre você". */
  texto: 4,
};

/**
 * "Falta 1 foto", "Faltam 2 fotos", "Faltam sua bio e altura": plural quando
 * são dois itens ou quando o primeiro já é plural (começa por número > 1).
 */
function frasesDoQueFalta(missing: string[]): string {
  if (missing.length === 0) return "";
  const itens = missing.slice(0, 2);
  const plural = itens.length > 1 || /^([2-9]|\d{2,}) /.test(itens[0]);
  return `${plural ? "Faltam" : "Falta"} ${itens.join(" e ")}`;
}

export function computeCompleteness(profile: MyProfile | null, photosCount: number): Completeness {
  if (!profile) return { pct: 0, hint: "Faltam suas informações", interestsHint: "" };

  // "Prefiro não dizer" é resposta (migration 0031): conta como as outras.
  const recusou = (campo: CampoQuePodeRecusar) => profile.prefereNaoDizer.includes(campo);
  const respondeuEstadoCivil = Boolean(profile.relationshipStatus) || recusou("relacionamento");
  const respostasDeEstilo = (["bebida", "atividade", "filhos", "fumo"] as const).filter(
    (campo) => profile.lifestyle[campo] || recusou(campo),
  ).length;
  const interesses = Math.min(profile.interests.length, MIN_INTERESSES);
  const textos = [profile.about.tempoLivre, profile.about.oQueValoriza].filter((texto) =>
    texto.trim(),
  ).length;

  const pontos = [
    profile.name ? PESO.cadastro : 0,
    profile.city ? PESO.cadastro : 0,
    profile.birthdate ? PESO.cadastro : 0,
    profile.gender ? PESO.cadastro : 0,
    photosCount >= 1 ? PESO.cadastro : 0,
    photosCount >= 2 ? PESO.segundaFoto : 0,
    photosCount >= 3 ? PESO.terceiraFoto : 0,
    photosCount >= 4 ? PESO.quartaFoto : 0,
    profile.bio.trim() ? PESO.bio : 0,
    interesses === MIN_INTERESSES ? PESO.interesses : interesses * 3,
    profile.profession.trim() ? PESO.profissao : 0,
    profile.height ? PESO.altura : 0,
    respostasDeEstilo * PESO.estiloDeVida,
    respondeuEstadoCivil ? PESO.estadoCivil : 0,
    textos * PESO.texto,
  ];
  const pct = Math.min(
    100,
    pontos.reduce((soma, valor) => soma + valor, 0),
  );

  // Separado por tela: o topo abre Editar perfil, e ele dizia "Faltam 3
  // interesses" depois que interesses saíram de lá — quem tocava não achava
  // o que faltava.
  const faltaNoPerfil: string[] = [];
  const fotosFaltando = FOTOS_DO_PERFIL_COMPLETO - photosCount;
  if (fotosFaltando > 0)
    faltaNoPerfil.push(`${fotosFaltando} ${fotosFaltando === 1 ? "foto" : "fotos"}`);
  if (!profile.bio.trim()) faltaNoPerfil.push("sua bio");
  if (!profile.profession) faltaNoPerfil.push("profissão");
  // Altura conta na porcentagem mas não estava nesta lista: quem não tinha
  // preenchido via "Faltam" e mais nada.
  if (!profile.height) faltaNoPerfil.push("sua altura");
  if (textos < 2) faltaNoPerfil.push(textos === 0 ? "seus textos" : "um texto");

  const faltaNosInteresses: string[] = [];
  if (profile.interests.length < MIN_INTERESSES)
    faltaNosInteresses.push(
      `${MIN_INTERESSES - profile.interests.length} ${MIN_INTERESSES - profile.interests.length === 1 ? "interesse" : "interesses"}`,
    );
  if (respostasDeEstilo < 4) faltaNosInteresses.push("estilo de vida");
  if (!respondeuEstadoCivil) faltaNosInteresses.push("estado civil");

  if (pct >= 100) return { pct, hint: "Perfil completo", interestsHint: "" };

  return {
    pct,
    hint: frasesDoQueFalta(faltaNoPerfil),
    interestsHint: frasesDoQueFalta(faltaNosInteresses),
  };
}
