import type { OnboardingStep } from "../types";

export const PROGRESS_STEPS: OnboardingStep[] = [
  "phone",
  "code",
  "name-birthdate",
  "gender-interest-city",
  "photos",
  "about-intention-interests",
];

export const TOTAL_PROGRESS_SEGMENTS = PROGRESS_STEPS.length;

export function progressIndexFor(step: OnboardingStep): number {
  const index = PROGRESS_STEPS.indexOf(step);
  return index === -1 ? 0 : index + 1;
}

export const CITY_OPTIONS = [
  "Joinville, SC",
  "São Francisco do Sul, SC",
  "Jaraguá do Sul, SC",
  "Blumenau, SC",
  "Florianópolis, SC",
  "Balneário Camboriú, SC",
  "Itajaí, SC",
  "Curitiba, PR",
  "São Paulo, SP",
  "Porto Alegre, RS",
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
  "Yoga",
  "Música",
  "Fotografia",
  "Games",
  "Trilhas",
  "Dança",
  "Vinho",
];

export const MAX_INTERESTS = 6;
export const MIN_PHOTOS = 3;
export const MAX_PHOTOS = 4;
