const ICE_BY_INTEREST: Record<string, string> = {
  Praia: "Qual praia daqui você mais gosta?",
  Corrida: "Você corre de manhã ou de noite?",
  Cozinhar: "Qual prato você faz melhor?",
  Cinema: "Qual foi o último filme que te marcou?",
  Pets: "Me conta do seu pet?",
  Shows: "Qual foi o melhor show que você viu?",
  Viagem: "Qual a próxima viagem na sua lista?",
  Leitura: "O que você está lendo agora?",
  Café: "Qual o melhor café da cidade pra você?",
  Academia: "Treina em qual horário?",
  Trilha: "Tem alguma trilha aqui que valha a pena?",
  Vinho: "Prefere vinho tinto ou branco?",
  Gastronomia: "Qual restaurante daqui você indica?",
  Fotografia: "Você fotografa com celular ou câmera?",
  Séries: "Qual série você está vendo?",
  Games: "Joga no PC ou no console?",
  Dança: "Você dança o quê?",
};

const GENERIC_ICEBREAKERS = ["O que você faz no fim de semana?", "Aceita um café sábado?"];

/**
 * Sugestões de quebra-gelo para os interesses da pessoa, priorizando os que
 * também estão entre os meus interesses.
 */
export function icebreakersFor(personInterests: string[], myInterests: string[]): string[] {
  const ordered = [
    ...personInterests.filter((interest) => myInterests.includes(interest)),
    ...personInterests.filter((interest) => !myInterests.includes(interest)),
  ];

  const fromInterests = ordered
    .map((interest) => ICE_BY_INTEREST[interest])
    .filter((text): text is string => Boolean(text))
    .slice(0, 2);

  if (fromInterests.length === 0) return GENERIC_ICEBREAKERS;
  return [...fromInterests, ...GENERIC_ICEBREAKERS].slice(0, 3);
}
