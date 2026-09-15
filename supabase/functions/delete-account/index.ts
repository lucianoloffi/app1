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

async function apagarPasta(admin: ReturnType<typeof createClient>, bucket: string, userId: string) {
  const { data, error } = await admin.storage.from(bucket).list(userId, { limit: 100 });
  if (error || !data?.length) return;
  await admin.storage.from(bucket).remove(data.map((file) => `${userId}/${file.name}`));
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

  await apagarPasta(admin, "fotos", userId);
  await apagarPasta(admin, "verificacoes", userId);

  // Apagar o usuário do auth remove profiles e, em cascata, todo o resto.
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return json({ error: "Não foi possível excluir a conta agora." }, 500);

  return json({ ok: true });
});
