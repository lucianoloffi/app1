import { supabase } from "../supabaseClient";

/**
 * Último dia (no relógio do aparelho) em que o uso já foi registrado. Evita
 * chamar o banco toda vez que o app volta para a frente: o servidor já ignora
 * a repetição, mas não precisa receber a chamada.
 */
let ultimoDiaRegistrado: string | null = null;

/**
 * Registra que a pessoa usou o app hoje, para os números de usuários ativos
 * do painel admin (tabela atividade_diaria, migration 0013). Um registro por
 * pessoa por dia; o dia contado é o de São Paulo, decidido no servidor.
 *
 * Nunca atrapalha o app: se falhar (sem internet, por exemplo), não avisa
 * ninguém e tenta de novo na próxima vez que o app voltar para a frente.
 */
export async function registrarAtividade(): Promise<void> {
  const hoje = new Date().toDateString();
  if (ultimoDiaRegistrado === hoje) return;

  const { error } = await supabase.rpc("registrar_atividade");
  if (!error) ultimoDiaRegistrado = hoje;
}

/** Ao sair da conta: a próxima pessoa a entrar neste aparelho conta de novo. */
export function esquecerAtividadeRegistrada(): void {
  ultimoDiaRegistrado = null;
}
