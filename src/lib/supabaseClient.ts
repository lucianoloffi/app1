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

  const posicao = [...valor].findIndex((caractere) => {
    const codigo = caractere.codePointAt(0) ?? 0;
    return codigo < 0x20 || codigo > 0x7e;
  });

  if (posicao >= 0) {
    const codigo = valor.codePointAt(posicao) ?? 0;
    const hexa = codigo.toString(16).toUpperCase().padStart(4, "0");
    const vizinhanca = valor.slice(Math.max(0, posicao - 12), posicao + 12);
    return (
      `${nome} tem um caractere inválido na posição ${posicao + 1} de ${valor.length} ` +
      `(U+${hexa}), aqui: "…${vizinhanca}…". ` +
      `Costuma ser o "…" de uma chave copiada cortada, uma aspa curva ou um espaço colado junto. ` +
      `Copie o valor inteiro no painel do Supabase (Project Settings → API Keys), pelo botão de copiar.`
    );
  }

  return null;
}

const url = limpa(import.meta.env.VITE_SUPABASE_URL);
const anonKey = limpa(import.meta.env.VITE_SUPABASE_ANON_KEY);

/** Mensagem pronta para a tela quando o .env está errado; null = tudo certo. */
export const erroDeConfiguracao: string | null =
  verifica("VITE_SUPABASE_URL", url) ?? verifica("VITE_SUPABASE_ANON_KEY", anonKey);

/** Espera antes de cada nova tentativa; somadas, cobrem uns 10 segundos. */
const ESPERAS_DO_TOKEN_ADIANTADO_MS = [1000, 2000, 3000, 4000];

/**
 * O relógio do servidor de login às vezes está uns segundos à frente do banco,
 * e o banco recusa o token recém-emitido como "do futuro" (PGRST303). Mostrar
 * "tente de novo em alguns segundos" não bastava: no cadastro, a conta já
 * tinha sido criada quando a gravação dos consentimentos falhava, a pessoa
 * ficava presa na tela da conta e, ao tocar de novo em "Criar conta", ouvia
 * que o e-mail já estava cadastrado. Como o mesmo token passa a valer sozinho
 * em segundos, esperar e repetir aqui resolve para todas as chamadas de uma vez.
 */
async function fetchQueEsperaOTokenValer(
  entrada: RequestInfo | URL,
  opcoes?: RequestInit,
): Promise<Response> {
  let resposta = await fetch(entrada, opcoes);
  for (const espera of ESPERAS_DO_TOKEN_ADIANTADO_MS) {
    if (!(await tokenDoFuturo(resposta))) break;
    await new Promise((resolve) => setTimeout(resolve, espera));
    resposta = await fetch(entrada, opcoes);
  }
  return resposta;
}

async function tokenDoFuturo(resposta: Response): Promise<boolean> {
  if (resposta.status !== 401 && resposta.status !== 403) return false;
  try {
    return /pgrst303|issued at future/i.test(await resposta.clone().text());
  } catch {
    return false;
  }
}

export const supabase = createClient(
  erroDeConfiguracao ? "https://configuracao.invalida" : url,
  erroDeConfiguracao ? "sem-chave" : anonKey,
  {
    global: { fetch: fetchQueEsperaOTokenValer },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
