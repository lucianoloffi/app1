#!/usr/bin/env node
/**
 * Escreve o arquivo .env a partir da chave do Supabase.
 *
 *   npm run configurar              → lê a chave da área de transferência
 *   npm run configurar -- <chave>   → recebe a chave como argumento
 *
 * Existe porque colar a chave (são 200+ caracteres em uma linha só) no
 * terminal ou em um editor costuma embaralhar o texto, e o erro que aparece
 * depois — um header HTTP inválido — não diz nada sobre a causa.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DESTINO = resolve(process.cwd(), ".env");

function leDaAreaDeTransferencia() {
  const tentativas =
    process.platform === "darwin"
      ? [["pbpaste", []]]
      : process.platform === "win32"
        ? [["powershell", ["-NoProfile", "-Command", "Get-Clipboard"]]]
        : [
            ["wl-paste", []],
            ["xclip", ["-selection", "clipboard", "-o"]],
            ["xsel", ["--clipboard", "--output"]],
          ];

  for (const [comando, argumentos] of tentativas) {
    try {
      return execFileSync(comando, argumentos, { encoding: "utf8" });
    } catch {
      /* tenta o próximo */
    }
  }
  return null;
}

/** Tira tudo que não pertence a uma chave do Supabase (espaços, "…", aspas). */
function limpa(bruto) {
  return bruto.replace(/[^A-Za-z0-9._-]/g, "");
}

/** A chave legada é um JWT e traz o identificador do projeto no meio. */
function urlDoProjeto(chave) {
  const partes = chave.split(".");
  if (partes.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(partes[1], "base64").toString("utf8"));
    return payload.ref ? `https://${payload.ref}.supabase.co` : null;
  } catch {
    return null;
  }
}

function urlJaConfigurada() {
  if (!existsSync(DESTINO)) return null;
  const linha = readFileSync(DESTINO, "utf8")
    .split("\n")
    .find((atual) => atual.startsWith("VITE_SUPABASE_URL="));
  const valor = linha?.slice("VITE_SUPABASE_URL=".length).trim();
  return valor && /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(valor) ? valor : null;
}

function encerra(mensagem) {
  console.error(`\n✗ ${mensagem}\n`);
  process.exit(1);
}

const argumento = process.argv.slice(2).join(" ").trim();
const bruto = argumento || leDaAreaDeTransferencia();

if (!bruto) {
  encerra(
    "Não consegui ler a área de transferência.\n" +
      "  Copie a chave no painel do Supabase e rode de novo, ou passe a chave direto:\n" +
      "  npm run configurar -- COLE_A_CHAVE_AQUI",
  );
}

const chave = limpa(bruto);

if (!chave) encerra("A área de transferência está vazia. Copie a chave no painel do Supabase.");

const pareceJwt = chave.split(".").length === 3 && chave.startsWith("ey");
const parecePublishable = chave.startsWith("sb_publishable_");

if (!pareceJwt && !parecePublishable) {
  encerra(
    `Isso não parece uma chave do Supabase (${chave.length} caracteres).\n` +
      "  A chave certa começa com 'eyJ' (anon legada) ou com 'sb_publishable_'.\n" +
      "  Confira se você copiou a chave, e não outra coisa.",
  );
}

const url = urlDoProjeto(chave) ?? urlJaConfigurada();

if (!url) {
  encerra(
    "Não descobri o endereço do projeto a partir dessa chave.\n" +
      "  Rode assim, com o endereço junto:\n" +
      "  npm run configurar -- https://SEU-PROJETO.supabase.co CHAVE",
  );
}

writeFileSync(DESTINO, `VITE_SUPABASE_URL=${url}\nVITE_SUPABASE_ANON_KEY=${chave}\n`, "utf8");

const removidos = bruto.trim().length - chave.length;
console.log(`
✓ Arquivo .env criado

  Projeto: ${url}
  Chave:   ${chave.length} caracteres (${chave.slice(0, 12)}…${chave.slice(-6)})${
    removidos > 0 ? `\n  Limpei ${removidos} caractere(s) que vieram junto na cópia.` : ""
  }

  Agora rode: npm run dev
`);
