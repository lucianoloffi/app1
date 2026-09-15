import type { OnboardingStep } from "../types";

export const PROGRESS_STEPS: OnboardingStep[] = [
  "account",
  "name-birthdate",
  "gender-interest-city",
  "photos",
  "intention-interests",
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
  "Jardinagem",
];

export const MIN_INTERESTS = 3;
export const MAX_INTERESTS = 6;
export const MAX_ONBOARDING_PHOTOS = 4;
export const MIN_ONBOARDING_PHOTOS = 3;
export const MAX_PROFILE_PHOTOS = 6;

export function selectedInterestsLabel(count: number): string {
  return count < MIN_INTERESTS ? `Interesses · mínimo ${MIN_INTERESTS}` : "Interesses";
}
