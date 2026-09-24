import type { OnboardingStep } from "../types";

export const PROGRESS_STEPS: OnboardingStep[] = [
  "account",
  "name-birthdate",
  "gender-interest-city",
  "photos",
  "intention",
  "interests",
  "lifestyle",
  "profession-height-status",
];

export const TOTAL_PROGRESS_SEGMENTS = PROGRESS_STEPS.length;

export function progressIndexFor(step: OnboardingStep): number {
  const index = PROGRESS_STEPS.indexOf(step);
  return index === -1 ? 0 : index + 1;
}

export const CITY_OPTIONS = [
  "Joinville, SC",
  "Jaraguá do Sul, SC",
  "São Francisco do Sul, SC",
  "São José, SC",
  "São João Batista, SC",
  "São Bento do Sul, SC",
  "Balneário Camboriú, SC",
  "Florianópolis, SC",
  "Curitiba, PR",
  "São João do Triunfo, PR",
  "Blumenau, SC",
  "Itajaí, SC",
  "Araquari, SC",
];

/**
 * A cidade precisa ser uma da lista: `profiles.cidade` é chave estrangeira de
 * `cities`, e é de lá que sai o centro do município usado quando a pessoa não
 * libera o GPS. Valor fora da lista o banco recusa.
 */
export function cidadeValida(valor: string): boolean {
  return CITY_OPTIONS.includes(valor);
}

export const INTEREST_OPTIONS = [
  "Praia",
  "Corrida",
  "Cozinhar",
  "Cinema",
  "Pets",
  "Shows",
  "Viagem",
  "Leitura",
  "Café",
  "Academia",
  "Musculação",
  "Futebol",
  "Vôlei",
  "Surf",
  "Trilha",
  "Camping",
  "Ciclismo",
  "Yoga",
  "Dança",
  "Música ao vivo",
  "Vinho",
  "Cerveja artesanal",
  "Gastronomia",
  "Fotografia",
  "Arte",
  "Teatro",
  "Séries",
  "Games",
  "Tecnologia",
  "Voluntariado",
  "Religião",
  "Estudar",
  "Empreender",
  "Moda",
  "Carros",
  "Pescaria",
];

export const MAX_INTERESTS = 6;
export const MAX_ONBOARDING_PHOTOS = 4;
export const MIN_ONBOARDING_PHOTOS = 1;
export const MAX_PROFILE_PHOTOS = 6;

/**
 * Tamanho máximo dos textos do perfil, em caracteres. O banco tem o mesmo
 * limite (check constraints da migration 0024); aqui ele vira maxLength, a nota
 * embaixo do campo e o contador. Antes não havia limite nenhum: dava para
 * gravar uma bio de um megabyte pela API, e a fila de todo mundo carregaria.
 *
 * Mudou o número? Precisa de migration nova com o mesmo valor — se o app
 * deixar passar mais do que o banco aceita, quem digita até o fim recebe erro.
 */
export const NOME_MAXIMO = 40;
export const PROFISSAO_MAXIMA = 60;
export const BIO_MAXIMA = 500;
/** O maior de INTEREST_OPTIONS tem 17 ("Cerveja artesanal"); folga para os próximos. */
export const INTERESSE_MAXIMO = 30;
