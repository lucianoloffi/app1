/** Mensagens de erro em português, a partir do que o Supabase devolve. */

/** Campo do formulário a que um erro se refere, quando dá para saber. */
export type CampoDeErro = "email" | "senha" | "telefone" | "cidade";

export interface ErroNoFormulario {
  texto: string;
  /** Com campo, a mensagem aparece embaixo dele em vez de no fim da tela. */
  campo: CampoDeErro | null;
}

/** Erro de aplicação já com texto pronto para a tela. */
export class ErroDeApp extends Error {
  readonly campo: CampoDeErro | null;

  constructor(message: string, campo: CampoDeErro | null = null) {
    super(message);
    this.campo = campo;
  }
}

const MENSAGENS: { teste: RegExp; texto: string; campo?: CampoDeErro }[] = [
  { teste: /already registered|already been registered|user already exists/i, texto: "Este e-mail já está cadastrado.", campo: "email" },
  { teste: /password should be at least|weak.?password/i, texto: "A senha precisa de pelo menos 8 caracteres.", campo: "senha" },
  { teste: /invalid login credentials/i, texto: "E-mail ou senha incorretos." },
  { teste: /email not confirmed/i, texto: "Confirme seu e-mail antes de entrar.", campo: "email" },
  { teste: /invalid email/i, texto: "E-mail inválido.", campo: "email" },
  { teste: /18 anos/i, texto: "É preciso ter 18 anos ou mais para usar o Lovi." },
  { teste: /jwt expired|session.*(expired|missing)|refresh.?token/i, texto: "Sua sessão expirou. Entre de novo." },
  { teste: /failed to fetch|network|offline/i, texto: "Sem conexão. Tente de novo." },
  { teste: /rate limit|too many requests/i, texto: "Muitas tentativas. Aguarde um minuto." },
  { teste: /file size|payload too large/i, texto: "A imagem é grande demais. Escolha outra." },
  { teste: /mime type|not supported/i, texto: "Formato não suportado. Use JPG, PNG ou WEBP." },

  // Erros que o Postgres devolve em inglês e em jargão. Sem estas linhas eles
  // apareciam crus na tela: apagar a cidade e salvar o perfil mostrava
  // "violates foreign key constraint profiles_cidade_fkey" para quem usa o app.
  { teste: /profiles_cidade_fkey/i, texto: "Escolha uma das cidades da lista.", campo: "cidade" },
  { teste: /duplicate key|unique constraint/i, texto: "Esse valor já está em uso." },
  { teste: /violates row-level security|permission denied/i, texto: "Você não tem permissão para fazer isso." },
  { teste: /violates .*constraint|invalid input|not-null/i, texto: "Algum campo está com um valor que não dá para salvar. Confira e tente de novo." },
];

/** Traduz o erro e diz de que campo ele veio, quando dá para saber. */
export function erroNoFormulario(erro: unknown): ErroNoFormulario {
  // ErroDeApp já passou por aqui: o texto está pronto e o campo, se existe, veio junto.
  if (erro instanceof ErroDeApp) return { texto: erro.message, campo: erro.campo };

  const bruto =
    erro instanceof Error
      ? erro.message
      : typeof erro === "string"
        ? erro
        : typeof erro === "object" && erro !== null && "message" in erro
          ? String((erro as { message: unknown }).message)
          : "";

  const encontrada = MENSAGENS.find((item) => item.teste.test(bruto));
  if (encontrada) return { texto: encontrada.texto, campo: encontrada.campo ?? null };
  return { texto: bruto.trim() || "Algo deu errado. Tente de novo.", campo: null };
}

export function mensagemDeErro(erro: unknown): string {
  return erroNoFormulario(erro).texto;
}

export function lancaSeErro(erro: unknown): void {
  if (erro) {
    const { texto, campo } = erroNoFormulario(erro);
    throw new ErroDeApp(texto, campo);
  }
}
