#!/usr/bin/env node
/**
 * Cria 20 perfis de teste no Supabase — 10 mulheres que buscam homens e 10
 * homens que buscam mulheres —, com foto, interesses e localização, prontos
 * para aparecer na fila do Descobrir.
 *
 *   npm run popular -- --simular     mostra o que seria criado, sem tocar em nada
 *   npm run popular                  cria os perfis (precisa da service role)
 *   npm run popular -- --limpar      apaga os perfis de teste e as fotos deles
 *   npm run popular -- --fotos=cores usa imagens geradas aqui, sem chave do Pexels
 *
 * Por que a service role: criar usuário no auth é a única coisa que a chave
 * anon não faz. Todo o resto — perfil, interesses, fotos, localização — o
 * script grava entrando como cada perfil, exatamente pelo caminho do app, com
 * o RLS ligado. A service role nunca vai para o .env do app nem para o bundle.
 *
 * ATENÇÃO: são contas de verdade no seu projeto. O build publicado no GitHub
 * Pages aponta para o mesmo banco, então elas também aparecem lá. Rode
 * --limpar antes de abrir o app para gente de fora.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { PERFIS, apelido, coordenadaPara, nascimentoPara, telefonePara } from "./dados-de-teste.mjs";
import { FOTOS_POR_PERFIL, fotosDoPerfil, reservaDeFotosDoPexels } from "./fotos-de-teste.mjs";

const DOMINIO_PADRAO = "lovi.test";
const SENHA = "LoviTeste2026!";

// ───────────────────────────── argumentos e .env ─────────────────────────────

const argumentos = process.argv.slice(2);
const temBandeira = (nome) => argumentos.includes(`--${nome}`);
const valorDe = (nome, padrao) =>
  argumentos.find((item) => item.startsWith(`--${nome}=`))?.split("=").slice(1).join("=") ?? padrao;

const simular = temBandeira("simular");
const limpar = temBandeira("limpar");
const modoDeFoto = valorDe("fotos", "pexels");
const dominio = valorDe("dominio", DOMINIO_PADRAO);

function encerra(mensagem) {
  console.error(`\n✗ ${mensagem}\n`);
  process.exit(1);
}

/** Lê o .env do projeto sem depender de pacote — são duas ou três linhas. */
function leEnv() {
  const caminho = resolve(process.cwd(), ".env");
  const valores = {};
  if (existsSync(caminho)) {
    for (const linha of readFileSync(caminho, "utf8").split("\n")) {
      const separador = linha.indexOf("=");
      if (separador > 0 && !linha.trimStart().startsWith("#")) {
        valores[linha.slice(0, separador).trim()] = linha
          .slice(separador + 1)
          .trim()
          .replace(/^["']|["']$/g, "");
      }
    }
  }
  return { ...valores, ...process.env };
}

if (!["pexels", "cores"].includes(modoDeFoto)) {
  encerra(`--fotos aceita "pexels" ou "cores" (recebi "${modoDeFoto}").`);
}

// ───────────────────────────────── simulação ─────────────────────────────────

if (simular) {
  console.log(`\n${PERFIS.length} perfis seriam criados (fotos: ${modoDeFoto}):\n`);
  console.table(
    PERFIS.map((perfil, indice) => ({
      "e-mail": `${apelido(perfil.nome)}@${dominio}`,
      nome: perfil.nome,
      idade: perfil.idade,
      nascimento: nascimentoPara(perfil.idade, indice * 17),
      gênero: perfil.genero,
      busca: perfil.buscaPor,
      cidade: perfil.cidade.replace(", SC", "").replace(", PR", ""),
      intenção: perfil.intencao,
      interesses: perfil.interesses.length,
      coordenada: Object.values(coordenadaPara(perfil.cidade, indice)).join(", "),
    })),
  );
  console.log(`  Senha de todos: ${SENHA}`);
  console.log(`  Fotos por perfil: ${FOTOS_POR_PERFIL}\n`);
  process.exit(0);
}

// ──────────────────────────────── conexão ────────────────────────────────

const env = leEnv();
const url = env.VITE_SUPABASE_URL;
const chaveAnon = env.VITE_SUPABASE_ANON_KEY;
const chaveServico = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !chaveAnon) {
  encerra("Faltam VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env. Rode: npm run configurar");
}
if (!chaveServico) {
  encerra(
    "Falta a service role.\n" +
      "  Painel do Supabase → Project Settings → API Keys → service_role, e rode:\n" +
      "  SUPABASE_SERVICE_ROLE_KEY=cole_aqui npm run popular\n" +
      "  Ela dá acesso total ao banco: não a coloque no .env do app nem a suba para o repositório.",
  );
}

const admin = createClient(url, chaveServico, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Um cliente por perfil, já logado — é assim que o RLS deixa gravar. */
async function clienteDoPerfil(email) {
  const cliente = createClient(url, chaveAnon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await cliente.auth.signInWithPassword({ email, password: SENHA });
  if (error) throw new Error(`não consegui entrar como ${email}: ${error.message}`);
  return cliente;
}

async function contasDeTeste() {
  const encontradas = [];
  for (let pagina = 1; pagina <= 20; pagina++) {
    const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: 200 });
    if (error) throw new Error(`não consegui listar as contas: ${error.message}`);
    encontradas.push(...(data.users ?? []).filter((conta) => conta.email?.endsWith(`@${dominio}`)));
    if ((data.users ?? []).length < 200) break;
  }
  return encontradas;
}

// ───────────────────────────────── limpeza ─────────────────────────────────

async function apagaTudo() {
  const contas = await contasDeTeste();
  if (contas.length === 0) {
    console.log(`\n  Nenhuma conta @${dominio} para apagar.\n`);
    return;
  }

  for (const conta of contas) {
    // Apagar o usuário derruba as linhas em cascata, mas não os arquivos do
    // storage — esses precisam sair antes, senão viram lixo permanente.
    const { data: arquivos } = await admin.storage.from("fotos").list(conta.id);
    if (arquivos?.length) {
      await admin.storage.from("fotos").remove(arquivos.map((item) => `${conta.id}/${item.name}`));
    }
    const { error } = await admin.auth.admin.deleteUser(conta.id);
    if (error) console.error(`  ✗ ${conta.email}: ${error.message}`);
    else console.log(`  ✓ ${conta.email}`);
  }
  console.log(`\n✓ ${contas.length} conta(s) de teste apagadas.\n`);
}

// ───────────────────────────────── criação ─────────────────────────────────

async function criaPerfil(perfil, indice, proximaFoto) {
  const email = `${apelido(perfil.nome)}@${dominio}`;
  const telefone = telefonePara(indice);

  const { data: criado, error: erroConta } = await admin.auth.admin.createUser({
    email,
    password: SENHA,
    email_confirm: true,
    user_metadata: { telefone },
  });
  if (erroConta) {
    const dica = /email/i.test(erroConta.message)
      ? ` — se o Supabase recusou o domínio, rode com --dominio=outro.com`
      : "";
    throw new Error(`${email}: ${erroConta.message}${dica}`);
  }
  const id = criado.user.id;

  const cliente = await clienteDoPerfil(email);
  const falhaSe = (error, onde) => {
    if (error) throw new Error(`${email} (${onde}): ${error.message}`);
  };

  // O trigger do auth já criou perfil, preferências e ajustes; aqui é só
  // preencher, na mesma ordem que o cadastro de 7 passos preenche.
  falhaSe(
    (
      await cliente
        .from("profiles")
        .update({
          nome: perfil.nome,
          telefone,
          data_nascimento: nascimentoPara(perfil.idade, indice * 17),
          bio: perfil.bio,
          genero: perfil.genero,
          cidade: perfil.cidade,
          profissao: perfil.profissao,
          altura_m: perfil.altura,
          status_relacionamento: perfil.status,
          intencao: perfil.intencao,
          bebida: perfil.bebida,
          atividade: perfil.atividade,
          filhos: perfil.filhos,
        })
        .eq("id", id)
    ).error,
    "perfil",
  );

  falhaSe(
    (
      await cliente
        .from("profile_interests")
        .insert(perfil.interesses.map((interesse) => ({ user_id: id, interesse })))
    ).error,
    "interesses",
  );

  // Faixas largas de propósito: assim dá para entrar como qualquer perfil de
  // teste e ver os outros na fila, sem mexer em Filtros antes.
  falhaSe(
    (
      await cliente
        .from("profile_preferences")
        .update({
          interesse_em: perfil.buscaPor,
          intencao_filtro: "todas",
          distancia_max_km: 100,
          idade_min: 18,
          idade_max: 60,
        })
        .eq("user_id", id)
    ).error,
    "preferências",
  );

  const fotos = await fotosDoPerfil(modoDeFoto, perfil, proximaFoto);
  for (const [ordem, foto] of fotos.entries()) {
    const caminho = `${id}/${crypto.randomUUID()}.${foto.extensao}`;
    const { error: erroUpload } = await cliente.storage
      .from("fotos")
      .upload(caminho, foto.bytes, { contentType: foto.tipo, upsert: false });
    falhaSe(erroUpload, `upload da foto ${ordem + 1}`);

    falhaSe(
      (
        await cliente
          .from("photos")
          .insert({ user_id: id, storage_path: caminho, ordem, principal: ordem === 0 })
      ).error,
      `foto ${ordem + 1}`,
    );
  }

  const { lat, lng } = coordenadaPara(perfil.cidade, indice);
  falhaSe((await cliente.rpc("atualizar_localizacao", { p_lat: lat, p_lng: lng })).error, "local");

  // Por último: o trigger só deixa marcar como completo depois dos 3
  // interesses e das 3 fotos existirem.
  falhaSe(
    (await cliente.from("profiles").update({ onboarding_completo: true }).eq("id", id)).error,
    "concluir",
  );

  await cliente.auth.signOut();
  return { email, credito: fotos[0].creditoDe };
}

async function criaTudo() {
  const jaExistem = await contasDeTeste();
  if (jaExistem.length > 0) {
    encerra(
      `Já existem ${jaExistem.length} conta(s) @${dominio} no projeto.\n` +
        "  Rode 'npm run popular -- --limpar' antes de criar de novo.",
    );
  }

  let proximaFoto = null;
  if (modoDeFoto === "pexels") {
    const chave = env.PEXELS_API_KEY;
    if (!chave) {
      encerra(
        "Falta a PEXELS_API_KEY (é gratuita e sai na hora em https://www.pexels.com/api/).\n" +
          "  Depois rode:  PEXELS_API_KEY=cole_aqui npm run popular\n" +
          "  Ou, para não esperar:  npm run popular -- --fotos=cores",
      );
    }
    const porGenero = PERFIS.filter((perfil) => perfil.genero === "mulher").length;
    console.log("  Buscando fotos no Pexels…");
    proximaFoto = await reservaDeFotosDoPexels(chave, porGenero);
  }

  console.log(`\n  Criando ${PERFIS.length} perfis em ${url}\n`);
  const creditos = new Set();
  let criados = 0;

  for (const [indice, perfil] of PERFIS.entries()) {
    try {
      const { email, credito } = await criaPerfil(perfil, indice, proximaFoto);
      if (credito) creditos.add(credito);
      criados++;
      console.log(`  ✓ ${perfil.nome.padEnd(12)} ${perfil.genero.padEnd(7)} ${email}`);
    } catch (problema) {
      console.error(`  ✗ ${perfil.nome.padEnd(12)} ${problema.message}`);
    }
  }

  console.log(`
✓ ${criados} de ${PERFIS.length} perfis criados

  Senha de todos: ${SENHA}
  Para apagar:    npm run popular -- --limpar
`);

  if (creditos.size > 0) {
    console.log(`  Fotos: Pexels — ${[...creditos].sort().join(", ")}\n`);
  }
}

await (limpar ? apagaTudo() : criaTudo());
