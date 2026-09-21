import { supabase } from "../supabaseClient";
import { lancaSeErro } from "../errors";

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
