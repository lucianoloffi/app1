const TEMPLATES: Record<string, string> = {
  Praia: "Qual sua praia favorita?",
  Corrida: "Corre de manhã ou à noite?",
  Cozinhar: "Qual seu prato mais ousado na cozinha?",
  Cinema: "Qual foi o último filme que você viu?",
  Pets: "Manda uma foto do seu pet aí!",
  Shows: "Qual foi o último show que você foi?",
  Viagem: "Qual o próximo lugar que você quer conhecer?",
  Leitura: "Está lendo algum livro bom agora?",
  Café: "Café coado ou espresso?",
  Yoga: "Manhã ou noite pra praticar?",
  Música: "Qual música não sai da sua cabeça essa semana?",
  Fotografia: "Celular ou câmera de verdade?",
  Games: "Qual jogo você tá viciado agora?",
  Trilhas: "Qual foi a trilha mais bonita que você já fez?",
  Dança: "Que tipo de dança você curte?",
  Vinho: "Tinto ou branco?",
};

/** Sugestões de quebra-gelo derivadas dos interesses em comum entre os dois perfis. */
export function icebreakersFor(sharedInterests: string[]): string[] {
  const suggestions = sharedInterests
    .map((interest) => TEMPLATES[interest])
    .filter((text): text is string => Boolean(text));

  if (suggestions.length > 0) return suggestions.slice(0, 3);

  return ["Oi! adorei seu perfil, bora trocar uma ideia?"];
}
