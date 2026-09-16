import { supabase } from "../supabaseClient";
import { lancaSeErro, mensagemDeErro, ErroDeApp } from "../errors";

export interface DadosDeCadastro {
  email: string;
  senha: string;
  telefone: string;
}

export const SENHA_MINIMA = 8;

export interface ResultadoDoCadastro {
  id: string;
  /** true quando o projeto exige confirmar o e-mail antes de liberar a sessão. */
  precisaConfirmarEmail: boolean;
}

export async function cadastrar({
  email,
  senha,
  telefone,
}: DadosDeCadastro): Promise<ResultadoDoCadastro> {
  if (senha.length < SENHA_MINIMA) {
    throw new ErroDeApp(`A senha precisa de pelo menos ${SENHA_MINIMA} caracteres.`, "senha");
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: senha,
    options: { data: { telefone } },
  });
  lancaSeErro(error);

  const id = data.user?.id;
  if (!id) throw new ErroDeApp("Não foi possível criar a conta agora.");
  return { id, precisaConfirmarEmail: !data.session };
}

export async function entrar(email: string, senha: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
  lancaSeErro(error);
}

export async function sair(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  lancaSeErro(error);
}

/** Envia o e-mail de recuperação de senha. */
export async function recuperarSenha(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
  });
  lancaSeErro(error);
}

export async function definirNovaSenha(senha: string): Promise<void> {
  if (senha.length < SENHA_MINIMA) {
    throw new ErroDeApp(`A senha precisa de pelo menos ${SENHA_MINIMA} caracteres.`, "senha");
  }
  const { error } = await supabase.auth.updateUser({ password: senha });
  lancaSeErro(error);
}

export async function usuarioAtual(): Promise<{ id: string; email: string } | null> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  return user ? { id: user.id, email: user.email ?? "" } : null;
}

/** Avisa a cada login/logout. Devolve a função que cancela a inscrição. */
export function aoMudarSessao(callback: (logado: boolean) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => callback(Boolean(sessao)));
  return () => data.subscription.unsubscribe();
}

export { mensagemDeErro };
