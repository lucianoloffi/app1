import { supabase } from "../supabaseClient";
import { lancaSeErro } from "../errors";
import { assinarFotos } from "./photos";

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
  /** URLs assinadas, já prontas para a tela. Inclui fotos rejeitadas. */
  fotos: string[];
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
    fotos: string[];
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
  const urls = await assinarFotos(itens.flatMap((item) => item.denunciado.fotos ?? []));

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
        fotos: (item.denunciado.fotos ?? [])
          .map((caminho) => urls.get(caminho) ?? "")
          .filter(Boolean),
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

/** Só o número da fila, para o aviso na aba. Não carrega as denúncias. */
export async function contarDenunciasAbertas(): Promise<number> {
  const { data, error } = await supabase.rpc("painel_denuncias_abertas");
  lancaSeErro(error);
  return Number(data ?? 0);
}
