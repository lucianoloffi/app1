import { createClient } from "@supabase/supabase-js";

/**
 * Cliente único do Supabase. Só os módulos de lib/api/ podem importá-lo —
 * telas e hooks falam apenas com lib/api, o que mantém a troca por Capacitor
 * (Fase 5) restrita a esta camada.
 */

function limpa(valor: string | undefined): string {
  return (valor ?? "").trim().replace(/^["']|["']$/g, "");
}

/**
 * O erro mais comum na configuração é copiar a chave truncada do painel, que
 * termina em "…". Como o caractere não cabe em um header HTTP, o navegador
 * recusa qualquer requisição com uma mensagem incompreensível. Melhor detectar
 * aqui e dizer o que fazer.
 */
function verifica(nome: string, valor: string): string | null {
  if (!valor) return `Falta ${nome} no arquivo .env (veja o .env.example).`;
  if (!/^[\x20-\x7E]+$/.test(valor)) {
    return `${nome} tem caractere inválido — provavelmente a chave foi copiada cortada, com "…" no fim. Copie o valor inteiro no painel do Supabase (Project Settings → API Keys) usando o botão de copiar.`;
  }
  return null;
}

const url = limpa(import.meta.env.VITE_SUPABASE_URL);
const anonKey = limpa(import.meta.env.VITE_SUPABASE_ANON_KEY);

/** Mensagem pronta para a tela quando o .env está errado; null = tudo certo. */
export const erroDeConfiguracao: string | null =
  verifica("VITE_SUPABASE_URL", url) ?? verifica("VITE_SUPABASE_ANON_KEY", anonKey);

export const supabase = createClient(
  erroDeConfiguracao ? "https://configuracao.invalida" : url,
  erroDeConfiguracao ? "sem-chave" : anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
