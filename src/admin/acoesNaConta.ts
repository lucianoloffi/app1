import { DIAS_DE_SUSPENSAO, type AcaoNaConta, type StatusDeModeracao } from "../lib/api/admin";
import { dataHora } from "./datas";

/**
 * Os textos de suspender, banir e reativar pela conta (`moderar_conta`,
 * migration 0036), num lugar só. As duas telas que fazem isso, o menu de cada
 * linha da aba Usuários e a faixa do perfil aberto, têm de dizer a mesma coisa.
 * Mudou o que `moderar_conta` faz? Mude aqui.
 */

/**
 * O nome para pôr numa frase, ou null. Quem parou o cadastro antes do nome
 * chega como "Sem nome" (é o que `painel_usuarios` devolve), e "Suspender Sem
 * nome por 7 dias?" não se lê.
 */
export function nomeDeVerdade(nome: string | null | undefined): string | null {
  const limpo = (nome ?? "").trim();
  return limpo && limpo !== "Sem nome" ? limpo : null;
}

export const ROTULO_DA_ACAO: Record<AcaoNaConta, string> = {
  suspender: `Suspender ${DIAS_DE_SUSPENSAO} dias`,
  banir: "Banir",
  reativar: "Reativar conta",
};

/** O que faz sentido para cada situação: não se suspende quem já está suspenso. */
export function acoesPossiveis(status: StatusDeModeracao): AcaoNaConta[] {
  if (status === "banido") return ["reativar"];
  if (status === "suspenso") return ["banir", "reativar"];
  return ["suspender", "banir"];
}

export function perguntaDaAcao(acao: AcaoNaConta, nome: string | null): string {
  if (acao === "suspender") {
    return `Suspender ${nome ?? "esta conta"} por ${DIAS_DE_SUSPENSAO} dias?`;
  }
  if (acao === "banir") {
    return `Banir ${nome ?? "esta conta"}? O acesso é cortado até alguém reativar.`;
  }
  return nome ? `Devolver o acesso de ${nome}?` : "Devolver o acesso desta conta?";
}

/**
 * A decisão pela conta não fecha denúncia nenhuma (0036): quem decide pode não
 * ter lido nenhuma, e uma delas pode pedir mais. A confirmação avisa.
 */
export function notaDasDenuncias(acao: AcaoNaConta, abertas: number): string | null {
  if (acao === "reativar" || abertas === 0) return null;
  return abertas === 1
    ? "A denúncia aberta continua na fila de Moderação."
    : `As ${abertas} denúncias abertas continuam na fila de Moderação.`;
}

/** "Conta de", e não "Fulano suspenso": o nome não diz o gênero. */
export function avisoDaAcao(
  acao: AcaoNaConta,
  feito: { nome: string; terminaEm: string | null },
): string {
  const nome = nomeDeVerdade(feito.nome);
  const conta = nome ? `Conta de ${nome}` : "Conta";
  if (acao === "suspender") return `${conta} suspensa até ${dataHora(feito.terminaEm)}.`;
  if (acao === "banir") return `${conta} banida.`;
  return nome ? `Acesso de ${nome} devolvido.` : "Acesso da conta devolvido.";
}
