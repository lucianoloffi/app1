import type { MyProfile } from "../types";

/**
 * O que a moderação decidiu sobre a conta de quem está usando o app, já com a
 * suspensão vencida descartada. null = pode usar o app normalmente.
 *
 * A suspensão vence pelo relógio: o banco guarda a data do fim e trata
 * suspensão vencida como conta ativa (`sob_sancao`, migration 0015). Aqui a
 * conta é a mesma, feita no aparelho — alguns minutos de diferença de relógio
 * não mudam nada num prazo de dias, e o servidor continua sendo quem decide.
 */
export type SituacaoDeModeracao =
  | { tipo: "banido" }
  | { tipo: "suspenso"; ate: Date | null }
  | null;

export function situacaoDeModeracao(perfil: MyProfile | null): SituacaoDeModeracao {
  if (!perfil) return null;
  if (perfil.moderationStatus === "banido") return { tipo: "banido" };
  if (perfil.moderationStatus !== "suspenso") return null;

  const ate = perfil.suspendedUntil ? new Date(perfil.suspendedUntil) : null;
  if (ate && !Number.isNaN(ate.getTime())) {
    if (ate.getTime() <= Date.now()) return null;
    return { tipo: "suspenso", ate };
  }
  // Suspensão sem prazo não deveria existir (o painel sempre grava um), mas se
  // aparecer, vale como bloqueio: soltar por falta de data seria o pior lado
  // para errar.
  return { tipo: "suspenso", ate: null };
}

/** "28/09 às 14:32" — como o aviso de suspensão mostra o fim do prazo. */
export function momentoPorExtenso(data: Date): string {
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const hora = String(data.getHours()).padStart(2, "0");
  const minuto = String(data.getMinutes()).padStart(2, "0");
  return `${dia}/${mes} às ${hora}:${minuto}`;
}
