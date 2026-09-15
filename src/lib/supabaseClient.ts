import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env (veja .env.example).",
  );
}

/**
 * Cliente único do Supabase. Só os módulos de lib/api/ podem importá-lo —
 * telas e hooks falam apenas com lib/api, o que mantém a troca por Capacitor
 * (Fase 5) restrita a esta camada.
 */
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
