import { supabase } from "../supabaseClient";
import { lancaSeErro } from "../errors";
import { apagarSelfies, assinarFotos, assinarSelfies } from "./photos";
import type { VerificationStatus } from "../../types";

/** Os períodos do painel; todos terminam hoje (dia de São Paulo). */
export type PeriodoDoPainel = "hoje" | "7d" | "30d" | "90d";

export interface CidadeDoPainel {
  cidade: string;
  usuarios: number;
  homens: number;
  mulheres: number;
  outros: number;
}

export interface DiaDoPainel {
  /** aaaa-mm-dd */
  dia: string;
  novos: number;
  ativos: number;
}

export interface NumerosDoPainel {
  /** aaaa-mm-dd, primeiro e último dia do período */
  inicio: string;
  fim: string;
  novosUsuarios: number;
  ativos: number;
  ativosHoje: number;
  ativosComMatch: number;
  matches: number;
  matchesComConversa: number;
  /** Sempre os últimos 30 dias, seja qual for o período. */
  porDia: DiaDoPainel[];
  /** As 5 cidades com mais usuários ativos no período. */
  cidades: CidadeDoPainel[];
}

/**
 * Se a conta logada pode abrir o painel. Quem decide é o banco (is_admin,
 * migration 0014), e o painel só serve de aviso: as consultas recusam quem
 * não é admin mesmo que a tela seja aberta.
 */
export async function souAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  lancaSeErro(error);
  return data === true;
}

interface LinhaDoPainel {
  inicio: string;
  fim: string;
  novos_usuarios: number;
  ativos: number;
  ativos_hoje: number;
  ativos_com_match: number;
  matches: number;
  matches_com_conversa: number;
  por_dia: DiaDoPainel[] | null;
  cidades: CidadeDoPainel[] | null;
}

export async function carregarNumeros(periodo: PeriodoDoPainel): Promise<NumerosDoPainel> {
  const { data, error } = await supabase.rpc("painel_numeros", { p_periodo: periodo });
  lancaSeErro(error);
  const linha = data as LinhaDoPainel;
  return {
    inicio: linha.inicio,
    fim: linha.fim,
    novosUsuarios: linha.novos_usuarios,
    ativos: linha.ativos,
    ativosHoje: linha.ativos_hoje,
    ativosComMatch: linha.ativos_com_match,
    matches: linha.matches,
    matchesComConversa: linha.matches_com_conversa,
    porDia: linha.por_dia ?? [],
    cidades: linha.cidades ?? [],
  };
}

// ───────────────────────── funil ─────────────────────────

/**
 * Contas criadas no período e até onde cada uma chegou (migration 0032). Sem
 * os perfis de teste (@lovi.test) e sem as contas de admin.
 */
/** Quantas pessoas chegaram a cada etapa. */
export interface EtapasDoFunil {
  contas: number;
  cadastro: number;
  curtida: number;
  match: number;
  conversa: number;
  resposta: number;
}

/** Contas criadas numa semana (segunda a domingo) e até onde chegaram. */
export interface SemanaDoFunil extends EtapasDoFunil {
  /** Segunda-feira da semana, "AAAA-MM-DD". */
  semana: string;
}

export interface FunilDoPainel {
  inicio: string;
  fim: string;
  /** Semanas de entrada, da mais antiga para a mais nova. */
  semanas?: SemanaDoFunil[];
  contas: number;
  cadastro: number;
  curtida: number;
  match: number;
  conversa: number;
  resposta: number;
  /** Contas de teste e de admin criadas no período, deixadas de fora. */
  foraDaConta: number;
}

export async function carregarFunil(periodo: PeriodoDoPainel): Promise<FunilDoPainel> {
  const { data, error } = await supabase.rpc("painel_funil", { p_periodo: periodo });
  lancaSeErro(error);
  const linha = data as Omit<FunilDoPainel, "foraDaConta" | "semanas"> & {
    fora_da_conta: number;
    /** Desde a 0033. */
    semanas?: SemanaDoFunil[] | null;
  };
  return {
    inicio: linha.inicio,
    fim: linha.fim,
    contas: linha.contas,
    cadastro: linha.cadastro,
    curtida: linha.curtida,
    match: linha.match,
    conversa: linha.conversa,
    resposta: linha.resposta,
    foraDaConta: linha.fora_da_conta,
    semanas: linha.semanas ?? [],
  };
}

// ───────────────────────── moderação ─────────────────────────

/**
 * Quantos dias dura a suspensão do botão "Suspender". Fica aqui, e não no
 * texto do botão, para o rótulo e a ação nunca discordarem.
 */
export const DIAS_DE_SUSPENSAO = 7;

export type AcaoDeModeracao = "arquivar" | "suspender" | "banir" | "reativar";

export type StatusDeModeracao = "ativo" | "suspenso" | "banido";

export type FiltroDaModeracao = "abertas" | "resolvidas";

export interface MensagemDaDenuncia {
  autor: "denunciante" | "denunciado";
  conteudo: string;
  enviadaEm: string;
}

export interface DenunciadoDoPainel {
  /** null quando a pessoa excluiu a conta — a denúncia fica, ela não. */
  id: string | null;
  nome: string;
  contaExcluida: boolean;
  /** E-mail da conta (0026), para achá-la no Supabase; null se a conta foi excluída. */
  email: string | null;
  idade: number | null;
  cidade: string | null;
  bio: string | null;
  profissao: string | null;
  statusModeracao: StatusDeModeracao | null;
  suspensaoTerminaEm: string | null;
  verificado: boolean;
  /** false = a pessoa se ocultou da fila nos Ajustes (escolha dela, não sanção). */
  visivel: boolean | null;
  /** Quando a conta foi criada — conta recém-criada pesa em denúncia de golpe. */
  entrouEm: string | null;
  denunciasAbertas: number;
  denunciasTotal: number;
  /** Já com URL assinada. Inclui as rejeitadas — e dá para rejeitar daqui. */
  fotos: FotoDoPainel[];
}

export interface DenunciaDoPainel {
  id: string;
  criadoEm: string;
  motivo: string;
  descricao: string | null;
  /** 'aberta' | 'em_analise' | 'resolvida'. É ele que diz se ainda há o que decidir. */
  status: string;
  resolucao: "arquivada" | "suspenso" | "banido" | null;
  analisadoEm: string | null;
  /** E-mail de quem decidiu. */
  analisadoPor: string | null;
  /** false = denúncia anterior à cópia de conversas (migration 0015). */
  conversaCopiada: boolean;
  denunciado: DenunciadoDoPainel;
  conversa: MensagemDaDenuncia[];
}

export interface FilaDeModeracao {
  /** Sempre o total de denúncias abertas, seja qual for o filtro pedido. */
  abertas: number;
  itens: DenunciaDoPainel[];
}

interface LinhaDaDenuncia {
  id: string;
  criado_em: string;
  motivo: string;
  descricao: string | null;
  status: string;
  resolucao: DenunciaDoPainel["resolucao"];
  analisado_em: string | null;
  analisado_por: string | null;
  conversa_copiada: boolean;
  denunciado: {
    id: string | null;
    nome: string;
    conta_excluida: boolean;
    email?: string | null;
    idade: number | null;
    cidade: string | null;
    bio: string | null;
    profissao: string | null;
    status_moderacao: StatusDeModeracao | null;
    suspensao_termina_em: string | null;
    verificacao_status: string | null;
    visivel: boolean | null;
    entrou_em: string | null;
    denuncias_abertas: number;
    denuncias_total: number;
    fotos: LinhaDaFoto[];
  };
  conversa: { autor: MensagemDaDenuncia["autor"]; conteudo: string; enviada_em: string }[];
}

export async function carregarModeracao(filtro: FiltroDaModeracao): Promise<FilaDeModeracao> {
  const { data, error } = await supabase.rpc("painel_moderacao", { p_filtro: filtro });
  lancaSeErro(error);

  const resposta = data as { abertas: number; itens: LinhaDaDenuncia[] | null };
  const itens = resposta.itens ?? [];

  // Uma assinatura só para as fotos de todas as denúncias da página: são
  // dezenas de arquivos, e uma chamada por foto faria a tela abrir devagar.
  const urls = await assinarFotos(
    itens.flatMap((item) => (item.denunciado.fotos ?? []).map((foto) => foto.path)),
  );

  return {
    abertas: resposta.abertas,
    itens: itens.map((item) => ({
      id: item.id,
      criadoEm: item.criado_em,
      motivo: item.motivo,
      descricao: item.descricao,
      status: item.status,
      resolucao: item.resolucao,
      analisadoEm: item.analisado_em,
      analisadoPor: item.analisado_por,
      conversaCopiada: item.conversa_copiada,
      denunciado: {
        id: item.denunciado.id,
        nome: item.denunciado.nome,
        contaExcluida: item.denunciado.conta_excluida,
        email: item.denunciado.email ?? null,
        idade: item.denunciado.idade,
        cidade: item.denunciado.cidade,
        bio: item.denunciado.bio,
        profissao: item.denunciado.profissao,
        statusModeracao: item.denunciado.status_moderacao,
        suspensaoTerminaEm: item.denunciado.suspensao_termina_em,
        verificado: item.denunciado.verificacao_status === "aprovada",
        visivel: item.denunciado.visivel,
        entrouEm: item.denunciado.entrou_em,
        denunciasAbertas: item.denunciado.denuncias_abertas,
        denunciasTotal: item.denunciado.denuncias_total,
        fotos: paraFotos(item.denunciado.fotos, urls),
      },
      conversa: (item.conversa ?? []).map((mensagem) => ({
        autor: mensagem.autor,
        conteudo: mensagem.conteudo,
        enviadaEm: mensagem.enviada_em,
      })),
    })),
  };
}

/**
 * Aplica a decisão. Suspender e banir resolvem também as outras denúncias
 * abertas contra a mesma pessoa — quem decide isso é o banco, na função
 * `moderar`, para não depender de a tela lembrar de fazer.
 */
export async function moderar(
  reportId: string,
  acao: AcaoDeModeracao,
  dias: number = DIAS_DE_SUSPENSAO,
): Promise<void> {
  const { error } = await supabase.rpc("moderar", {
    p_report_id: reportId,
    p_acao: acao,
    p_dias: dias,
  });
  lancaSeErro(error);
}

/**
 * Prazo de resposta a uma denúncia que a App Store exige de app de namoro.
 * Passou disso, o painel destaca a espera em vermelho.
 */
export const PRAZO_DA_DENUNCIA_HORAS = 24;

export interface EsperaDasDenuncias {
  abertas: number;
  /** Há quantos minutos a denúncia aberta mais antiga espera; null sem nenhuma aberta. */
  minutosDaMaisAntiga: number | null;
}

/**
 * Quantas denúncias estão abertas e há quanto tempo a mais antiga espera, para
 * o selo da aba e o aviso na entrada do painel (migration 0025). Não carrega
 * as denúncias. A conta do tempo é feita no banco, com o relógio dele.
 */
export async function carregarEsperaDasDenuncias(): Promise<EsperaDasDenuncias> {
  const { data, error } = await supabase.rpc("painel_espera_das_denuncias");
  lancaSeErro(error);
  const linha = (data ?? {}) as { abertas?: number; minutos_da_mais_antiga?: number | null };
  return {
    abertas: Number(linha.abertas ?? 0),
    minutosDaMaisAntiga:
      linha.minutos_da_mais_antiga === null || linha.minutos_da_mais_antiga === undefined
        ? null
        : Number(linha.minutos_da_mais_antiga),
  };
}

// ───────────────────── fotos e verificação (entrega 3) ─────────────────────

/**
 * A ficha que as três telas do painel mostram da mesma pessoa. Vem da função
 * `ficha_do_painel` no banco, uma só para as telas não divergirem.
 */
export interface PessoaDoPainel {
  id: string;
  nome: string;
  /** E-mail da conta (0026), para achá-la no Supabase. */
  email: string | null;
  idade: number | null;
  cidade: string | null;
  profissao: string | null;
  bio: string | null;
  entrouEm: string | null;
  /** false = a pessoa se ocultou nos Ajustes. Escolha dela, não sanção. */
  visivel: boolean;
  statusModeracao: StatusDeModeracao;
  suspensaoTerminaEm: string | null;
  verificacaoStatus: VerificationStatus;
  denunciasAbertas: number;
  denunciasTotal: number;
}

interface LinhaDaPessoa {
  id: string;
  nome: string;
  email?: string | null;
  idade: number | null;
  cidade: string | null;
  profissao: string | null;
  bio: string | null;
  entrou_em: string | null;
  visivel: boolean;
  status_moderacao: StatusDeModeracao;
  suspensao_termina_em: string | null;
  verificacao_status: VerificationStatus;
  denuncias_abertas: number;
  denuncias_total: number;
}

function paraPessoa(linha: LinhaDaPessoa): PessoaDoPainel {
  return {
    id: linha.id,
    nome: linha.nome,
    email: linha.email ?? null,
    idade: linha.idade,
    cidade: linha.cidade,
    profissao: linha.profissao,
    bio: linha.bio,
    entrouEm: linha.entrou_em,
    visivel: linha.visivel,
    statusModeracao: linha.status_moderacao,
    suspensaoTerminaEm: linha.suspensao_termina_em,
    verificacaoStatus: linha.verificacao_status,
    denunciasAbertas: linha.denuncias_abertas,
    denunciasTotal: linha.denuncias_total,
  };
}

export type StatusDaFoto = "pendente" | "aprovada" | "rejeitada";

export type AcaoDeFoto = "aprovar" | "rejeitar";

export interface FotoDoPainel {
  id: string;
  path: string;
  /** URL assinada; vazia se a assinatura falhou (a tela avisa no lugar da imagem). */
  url: string;
  status: StatusDaFoto;
  principal: boolean;
  criadoEm: string;
  /** null = ninguém olhou esta foto ainda. É isso que a põe na fila. */
  moderadaEm: string | null;
  moderadaPor: string | null;
}

interface LinhaDaFoto {
  id: string;
  path: string;
  status: StatusDaFoto;
  principal: boolean;
  criado_em: string;
  moderada_em: string | null;
  moderada_por: string | null;
}

function paraFotos(linhas: LinhaDaFoto[] | null, urls: Map<string, string>): FotoDoPainel[] {
  return (linhas ?? []).map((linha) => ({
    id: linha.id,
    path: linha.path,
    url: urls.get(linha.path) ?? "",
    status: linha.status,
    principal: linha.principal,
    criadoEm: linha.criado_em,
    moderadaEm: linha.moderada_em,
    moderadaPor: linha.moderada_por,
  }));
}

export type FiltroDasFotos = "novas" | "rejeitadas";

export interface PessoaComFotos {
  pessoa: PessoaDoPainel;
  fotos: FotoDoPainel[];
}

export interface FilaDeFotos {
  /** Pessoas com ao menos uma foto que ninguém olhou, seja qual for o filtro. */
  novas: number;
  itens: PessoaComFotos[];
}

export async function carregarFotos(filtro: FiltroDasFotos): Promise<FilaDeFotos> {
  const { data, error } = await supabase.rpc("painel_fotos", { p_filtro: filtro });
  lancaSeErro(error);

  const resposta = data as { novas: number; itens: (LinhaDaPessoa & { fotos: LinhaDaFoto[] })[] };
  const itens = resposta.itens ?? [];
  const urls = await assinarFotos(itens.flatMap((item) => (item.fotos ?? []).map((f) => f.path)));

  return {
    novas: resposta.novas,
    itens: itens.map((item) => ({
      pessoa: paraPessoa(item),
      fotos: paraFotos(item.fotos, urls),
    })),
  };
}

export interface ResultadoDaFoto {
  acao: AcaoDeFoto;
  nome: string;
  fotos: number;
  /** true = a pessoa ficou sem nenhuma foto aprovada, e some da fila dos outros. */
  semFotoAprovada: boolean;
}

/**
 * Rejeitar não apaga a foto: ela sai do perfil que os outros veem (quem decide
 * isso é a policy `fotos_le`, pelo status), mas continua no bucket — uma
 * denúncia sobre aquela foto ainda precisa dela.
 */
export async function moderarFotos(ids: string[], acao: AcaoDeFoto): Promise<ResultadoDaFoto> {
  const { data, error } = await supabase.rpc("moderar_fotos", { p_ids: ids, p_acao: acao });
  lancaSeErro(error);
  const resposta = data as { acao: AcaoDeFoto; nome: string; fotos: number; sem_foto_aprovada: boolean };
  return {
    acao: resposta.acao,
    nome: resposta.nome,
    fotos: resposta.fotos,
    semFotoAprovada: resposta.sem_foto_aprovada,
  };
}

export type FiltroDaVerificacao = "pendentes" | "decididas";

export type AcaoDeVerificacao = "aprovar" | "recusar";

export interface SelfieDoPainel {
  path: string;
  /** URL assinada; vazia se a assinatura falhou. */
  url: string;
}

export interface VerificacaoDoPainel {
  pessoa: PessoaDoPainel;
  /** Quando o pedido mais antigo ainda pendente foi feito. */
  pedidoEm: string | null;
  decididoEm: string | null;
  decididoPor: string | null;
  /**
   * Selfies que continuam no bucket. Em "pendentes" é o que há para analisar;
   * em "decididas" é sobra de um apagamento que falhou, e a tela oferece
   * apagar de novo.
   */
  selfies: SelfieDoPainel[];
  /** As fotos do perfil, para comparar com a selfie. URLs assinadas. */
  fotos: string[];
}

export interface FilaDeVerificacao {
  /** Pessoas esperando análise, seja qual for o filtro pedido. */
  pendentes: number;
  itens: VerificacaoDoPainel[];
}

export async function carregarVerificacoes(
  filtro: FiltroDaVerificacao,
): Promise<FilaDeVerificacao> {
  const { data, error } = await supabase.rpc("painel_verificacoes", { p_filtro: filtro });
  lancaSeErro(error);

  const resposta = data as {
    pendentes: number;
    itens: (LinhaDaPessoa & {
      pedido_em: string | null;
      decidido_em: string | null;
      decidido_por: string | null;
      selfies: string[];
      fotos: string[];
    })[];
  };
  const itens = resposta.itens ?? [];

  // Dois buckets, duas assinaturas — mas uma chamada para cada, não uma por
  // arquivo: a fila traz até 50 pessoas com várias fotos cada.
  const [selfies, fotos] = await Promise.all([
    assinarSelfies(itens.flatMap((item) => item.selfies ?? [])),
    assinarFotos(itens.flatMap((item) => item.fotos ?? [])),
  ]);

  return {
    pendentes: resposta.pendentes,
    itens: itens.map((item) => ({
      pessoa: paraPessoa(item),
      pedidoEm: item.pedido_em,
      decididoEm: item.decidido_em,
      decididoPor: item.decidido_por,
      selfies: (item.selfies ?? []).map((path) => ({ path, url: selfies.get(path) ?? "" })),
      fotos: (item.fotos ?? []).map((path) => fotos.get(path) ?? "").filter(Boolean),
    })),
  };
}

export interface ResultadoDaVerificacao {
  nome: string;
  /**
   * Selfies que a análise deveria ter apagado e não saíram do bucket. Vazio é
   * o normal; com item, a tela precisa dizer, porque a promessa feita a quem
   * mandou a foto foi que ela some depois da análise.
   */
  selfiesNaoApagadas: string[];
}

/**
 * Apaga as selfies do bucket e carimba no banco o que saiu. Em dois passos de
 * propósito: quem apaga arquivo é a API de Storage, e carimbar antes de o
 * arquivo sair criaria exatamente a mentira que `selfie_apagada_em` existe
 * para evitar.
 */
export async function limparSelfies(paths: string[]): Promise<string[]> {
  if (paths.length === 0) return [];

  const sobraram = await apagarSelfies(paths);
  if (sobraram.length > 0) return sobraram;

  const { error } = await supabase.rpc("marcar_selfies_apagadas", { p_paths: paths });
  // O arquivo já saiu; o que falhou foi a marca. A fila vai continuar
  // oferecendo apagar, e a segunda tentativa carimba — apagar o que não existe
  // mais não é erro no Storage.
  if (error) console.warn("Não foi possível marcar as selfies como apagadas:", error.message);
  return [];
}

/**
 * Decide o selo da PESSOA, não de um pedido: se houver mais de uma selfie
 * pendente, o mesmo veredito vale para todas (quem faz isso é o banco).
 * Recusar quem já tem o selo é como se tira um selo dado por engano.
 */
export async function analisarVerificacao(
  userId: string,
  acao: AcaoDeVerificacao,
): Promise<ResultadoDaVerificacao> {
  const { data, error } = await supabase.rpc("analisar_verificacao", {
    p_user_id: userId,
    p_acao: acao,
  });
  lancaSeErro(error);

  const resposta = data as { nome: string; selfies: string[] | null };
  return {
    nome: resposta.nome,
    selfiesNaoApagadas: await limparSelfies(resposta.selfies ?? []),
  };
}

/** Só o número da fila, para o aviso na aba. Não carrega as selfies. */
export async function contarVerificacoesPendentes(): Promise<number> {
  const { data, error } = await supabase.rpc("painel_verificacoes_pendentes");
  lancaSeErro(error);
  return Number(data ?? 0);
}
