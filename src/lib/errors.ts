/** Mensagens de erro em português, a partir do que o Supabase devolve. */

const MENSAGENS: { teste: RegExp; texto: string }[] = [
  { teste: /already registered|already been registered|user already exists/i, texto: "Este e-mail já está cadastrado." },
  { teste: /password should be at least|weak.?password/i, texto: "A senha precisa de pelo menos 8 caracteres." },
  { teste: /invalid login credentials/i, texto: "E-mail ou senha incorretos." },
  { teste: /email not confirmed/i, texto: "Confirme seu e-mail antes de entrar." },
  { teste: /invalid email/i, texto: "E-mail inválido." },
  { teste: /18 anos/i, texto: "É preciso ter 18 anos ou mais para usar o Lovi." },
  { teste: /jwt expired|session.*(expired|missing)|refresh.?token/i, texto: "Sua sessão expirou. Entre de novo." },
  { teste: /failed to fetch|network|offline/i, texto: "Sem conexão. Tente de novo." },
  { teste: /rate limit|too many requests/i, texto: "Muitas tentativas. Aguarde um minuto." },
  { teste: /file size|payload too large/i, texto: "A imagem é grande demais. Escolha outra." },
  { teste: /mime type|not supported/i, texto: "Formato não suportado. Use JPG, PNG ou WEBP." },
];

export function mensagemDeErro(erro: unknown): string {
  const bruto =
    erro instanceof Error
      ? erro.message
      : typeof erro === "string"
        ? erro
        : typeof erro === "object" && erro !== null && "message" in erro
          ? String((erro as { message: unknown }).message)
          : "";

  const encontrada = MENSAGENS.find((item) => item.teste.test(bruto));
  if (encontrada) return encontrada.texto;
  return bruto.trim() || "Algo deu errado. Tente de novo.";
}

/** Erro de aplicação já com texto pronto para a tela. */
export class ErroDeApp extends Error {}

export function lancaSeErro(erro: unknown): void {
  if (erro) throw new ErroDeApp(mensagemDeErro(erro));
}
