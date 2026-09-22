// Exclusão definitiva da conta (LGPD, art. 18).
// Precisa da service role: a chave anon não apaga usuários do auth nem
// arquivos de storage fora das políticas do próprio dono.
//
// Deploy: supabase functions deploy delete-account
//
// A função só apaga a conta de quem chamou — o id vem do JWT, nunca do corpo.

import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/**
 * Buckets onde há arquivo de usuário, sempre numa pasta com o id da pessoa
 * (as policies de storage exigem isso no envio). Bucket novo com arquivo de
 * usuário tem de entrar aqui, senão a exclusão deixa o arquivo para trás.
 */
const BUCKETS_DO_USUARIO = ["fotos", "verificacoes"];

/** Tamanho de cada página da listagem e de cada lote do remove. */
const POR_PAGINA = 100;

type Admin = ReturnType<typeof createClient>;

/**
 * Todos os caminhos dentro de uma pasta, página por página. Antes era uma
 * chamada só com limit 100: quem tinha mais de 100 arquivos numa pasta (dá
 * para chegar lá pedindo verificação repetidas vezes) ficava com o excedente
 * no bucket depois de excluir a conta — contra o que a política de
 * privacidade promete. Entra em subpastas também: hoje não há nenhuma, mas
 * a listagem as devolve como itens sem id, e ignorá-las seria o mesmo erro.
 *
 * Lista tudo antes de apagar qualquer coisa: apagar no meio da paginação
 * desloca o offset e pula arquivos.
 */
async function listarTudo(admin: Admin, bucket: string, pasta: string): Promise<string[]> {
  const caminhos: string[] = [];
  for (let offset = 0; ; offset += POR_PAGINA) {
    const { data, error } = await admin.storage
      .from(bucket)
      .list(pasta, { limit: POR_PAGINA, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`listar ${bucket}/${pasta}: ${error.message}`);
    const itens = data ?? [];

    for (const item of itens) {
      const caminho = `${pasta}/${item.name}`;
      if (!item.id) caminhos.push(...(await listarTudo(admin, bucket, caminho)));
      else caminhos.push(caminho);
    }
    if (itens.length < POR_PAGINA) return caminhos;
  }
}

async function apagarPasta(admin: Admin, bucket: string, userId: string) {
  const caminhos = await listarTudo(admin, bucket, userId);
  for (let i = 0; i < caminhos.length; i += POR_PAGINA) {
    const { error } = await admin.storage.from(bucket).remove(caminhos.slice(i, i + POR_PAGINA));
    if (error) throw new Error(`apagar ${bucket}/${userId}: ${error.message}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !serviceRole || !anon) return json({ error: "Função mal configurada" }, 500);

  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "Sessão expirada" }, 401);

  const comUsuario = createClient(url, anon, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: sessao, error: erroSessao } = await comUsuario.auth.getUser();
  if (erroSessao || !sessao?.user) return json({ error: "Sessão expirada" }, 401);

  const userId = sessao.user.id;
  const admin = createClient(url, serviceRole, { auth: { persistSession: false } });

  // Arquivos primeiro, e só depois o usuário. Se o storage falhar, a conta
  // NÃO é apagada: antes o erro era ignorado e a conta sumia com os arquivos
  // ficando para trás, sem ninguém saber — e sem conta, sem como tentar de
  // novo. Assim a pessoa recebe o erro e pode repetir o pedido.
  try {
    for (const bucket of BUCKETS_DO_USUARIO) await apagarPasta(admin, bucket, userId);
  } catch (problema) {
    console.error("delete-account: falha ao apagar arquivos", problema);
    return json({ error: "Não foi possível excluir a conta agora." }, 500);
  }

  // Apagar o usuário do auth remove profiles e, em cascata, todo o resto.
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return json({ error: "Não foi possível excluir a conta agora." }, 500);

  return json({ ok: true });
});
