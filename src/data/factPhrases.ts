import type { Activity, Diet, Drink, Gender, Kids, Politics, Religion, Smoke } from "../types";

/**
 * As respostas como frase inteira, para os blocos do perfil de outra pessoa,
 * que mostram só ícone e resposta. Com o rótulo fora da vista, "Não" ao lado
 * do cigarro e "Tenho" ao lado dos filhos não diziam nada. Os `*_LABEL` de
 * `types.ts` continuam valendo onde a pergunta está escrita (cadastro, folhas).
 * Estado civil e altura se explicam sozinhos e seguem os de sempre (o estado
 * civil só passa por `concordaGenero`).
 */
export const DRINK_PHRASE: Record<Drink, string> = {
  "nao-bebo": "Não bebo",
  socialmente: "Bebo socialmente",
  frequentemente: "Bebo com frequência",
};

export const ACTIVITY_PHRASE: Record<Activity, string> = {
  "todo-dia": "Atividade física todo dia",
  "algumas-vezes": "Atividade física algumas vezes na semana",
  raramente: "Raramente faço atividade física",
};

export const KIDS_PHRASE: Record<Kids, string> = {
  tenho: "Tenho filhos",
  "nao-tenho": "Não tenho filhos",
  "quero-ter": "Quero ter filhos",
  "nao-quero": "Não quero ter filhos",
};

export const SMOKE_PHRASE: Record<Smoke, string> = {
  // "Fumo" sozinho também se lê como o substantivo, o tabaco.
  sim: "Sou fumante",
  nao: "Não fumo",
  as_vezes: "Fumo às vezes",
};

export const DIET_PHRASE: Record<Diet, string> = {
  como_de_tudo: "Como de tudo",
  vegetariano: "Vegetariano(a)",
  vegano: "Vegano(a)",
  outra: "Outro tipo de alimentação",
};

export const RELIGION_PHRASE: Record<Religion, string> = {
  catolica: "Religião católica",
  evangelica: "Religião evangélica",
  espirita: "Espírita",
  umbanda_candomble: "Umbanda / Candomblé",
  judaica: "Religião judaica",
  outra: "Outra religião",
  agnostico: "Agnóstico(a)",
  ateu: "Ateu/Ateia",
  sem_religiao: "Sem religião",
};

export const POLITICS_PHRASE: Record<Politics, string> = {
  muito_importante: "Política é muito importante",
  importante: "Política é importante",
  pouco_importante: "Política é pouco importante",
  nao_faz_diferenca: "Política não faz diferença",
};

/**
 * Concorda a frase com o gênero de quem é o perfil: "Solteiro(a)" vira
 * "Solteira" ou "Solteiro". Para "outros" fica como está, com o "(a)".
 * O perfil sabe o gênero, então não há por que mostrar "Ateu" a uma mulher.
 */
export function concordaGenero(frase: string, gender: Gender): string {
  if (gender === "outros") return frase;
  const feminino = gender === "mulher";
  return frase
    .replace("Ateu/Ateia", feminino ? "Ateia" : "Ateu")
    .replace(/o\(a\)/g, feminino ? "a" : "o");
}
