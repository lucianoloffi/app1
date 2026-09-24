// Manda o e-mail de "match novo" para os dois lados do match (migration 0027).
//
// Deploy: supabase functions deploy avisar-match --no-verify-jwt
//
// Quem chama é o banco (gatilho matches_aviso_por_email, pelo pg_net), não o
// app: não há JWT de usuário, daí o --no-verify-jwt. A porta é o segredo no
// cabeçalho x-aviso-segredo, o mesmo guardado no Vault. E o corpo traz só o id
// do match — quem recebe e para qual e-mail é o banco que diz
// (destinatarios_do_aviso_de_match), então nem com o segredo dá para mandar
// e-mail para um endereço qualquer.
//
// Segredos da função (Edge Functions → Secrets):
//   RESEND_API_KEY       chave do Resend, só com permissão de envio
//   AVISO_MATCH_SEGREDO  texto aleatório longo, igual ao 'aviso_match_segredo' do Vault
//   AVISO_REMETENTE      opcional; padrão "Lovi <avisos@lovidates.com>"
//   APP_URL              opcional; padrão "https://lovidates.com/app1/"

import { createClient } from "jsr:@supabase/supabase-js@2";

const REMETENTE_PADRAO = "Lovi <avisos@lovidates.com>";
const APP_URL_PADRAO = "https://lovidates.com/app1/";
/** Resposta a quem escreve de volta: o remetente é só de envio. */
const RESPONDER_PARA = "contato@lovidates.com";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Comparação em tempo constante: `===` entrega o segredo aos poucos pelo tempo de resposta. */
function mesmoSegredo(recebido: string, esperado: string): boolean {
  const a = new TextEncoder().encode(recebido);
  const b = new TextEncoder().encode(esperado);
  let diferenca = a.length ^ b.length;
  for (let i = 0; i < b.length; i++) diferenca |= (a[i] ?? 0) ^ b[i];
  return diferenca === 0;
}

/**
 * O texto não diz quem é a outra pessoa, nem mostra foto. Caixa de e-mail às
 * vezes é compartilhada ou aparece na tela de bloqueio, e um match revela
 * interesse — e, pelo gênero, orientação sexual. O nome fica para dentro do app.
 */
function mensagem(appUrl: string) {
  const assunto = "Deu match no Lovi 💜";
  const texto =
    "Deu match!\n\n" +
    "Alguém que você curtiu também curtiu você. Abra o Lovi para ver quem é e começar a conversa:\n" +
    `${appUrl}\n\n` +
    "—\n" +
    "Você recebeu este e-mail porque tem uma conta no Lovi com o aviso de novos matches ligado. " +
    "Para não receber mais, desligue em Ajustes › Notificações › Novos matches.";

  const html = `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#f4f6f3;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f3;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:20px;padding:32px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#16211a;">
            <tr>
              <td style="font-size:28px;font-weight:900;color:#8b5cf6;padding-bottom:20px;">lovi</td>
            </tr>
            <tr>
              <td style="font-size:24px;font-weight:800;padding-bottom:10px;">Deu match! 💜</td>
            </tr>
            <tr>
              <td style="font-size:16px;line-height:1.5;padding-bottom:24px;">
                Alguém que você curtiu também curtiu você. Abra o Lovi para ver quem é e começar a conversa.
              </td>
            </tr>
            <tr>
              <td>
                <a href="${appUrl}" style="display:inline-block;background:#8b5cf6;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:999px;">Ver meu match</a>
              </td>
            </tr>
            <tr>
              <td style="font-size:12px;line-height:1.5;color:#6b746e;padding-top:28px;">
                Você recebeu este e-mail porque tem uma conta no Lovi com o aviso de novos matches ligado.
                Para não receber mais, desligue em Ajustes › Notificações › Novos matches.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { assunto, texto, html };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const segredo = Deno.env.get("AVISO_MATCH_SEGREDO");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!segredo || !resendKey || !url || !serviceRole) {
    console.error("avisar-match: falta configurar AVISO_MATCH_SEGREDO ou RESEND_API_KEY.");
    return json({ error: "Função não configurada." }, 500);
  }

  if (!mesmoSegredo(req.headers.get("x-aviso-segredo") ?? "", segredo)) {
    return json({ error: "Não autorizado." }, 401);
  }

  let matchId: unknown;
  try {
    matchId = (await req.json())?.match_id;
  } catch {
    matchId = null;
  }
  if (typeof matchId !== "string" || !UUID.test(matchId)) {
    return json({ error: "match_id inválido." }, 400);
  }

  const admin = createClient(url, serviceRole, { auth: { persistSession: false } });
  const { data, error } = await admin.rpc("destinatarios_do_aviso_de_match", {
    p_match_id: matchId,
  });
  if (error) {
    console.error(`avisar-match ${matchId}: ${error.message}`);
    return json({ error: "Não deu para ler o match." }, 500);
  }

  const destinatarios = (data ?? []) as { user_id: string; email: string }[];
  const { assunto, texto, html } = mensagem(Deno.env.get("APP_URL") ?? APP_URL_PADRAO);
  const remetente = Deno.env.get("AVISO_REMETENTE") ?? REMETENTE_PADRAO;

  // Um e-mail por pessoa, nunca os dois no mesmo "para": cada um veria o
  // endereço do outro antes de o app mostrar sequer o nome.
  const falhas: string[] = [];
  for (const { user_id, email } of destinatarios) {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: remetente,
        to: [email],
        reply_to: RESPONDER_PARA,
        subject: assunto,
        text: texto,
        html,
      }),
    });
    if (!resposta.ok) {
      // O e-mail não vai para o log: só o id da conta, que basta para achar a pessoa.
      console.error(
        `avisar-match ${matchId}: envio para ${user_id} falhou (${resposta.status}): ${await resposta.text()}`,
      );
      falhas.push(user_id);
    }
  }

  if (falhas.length) return json({ enviados: destinatarios.length - falhas.length, falhas }, 502);
  return json({ enviados: destinatarios.length });
});
