export const ICE_BY_INTEREST: Record<string, string> = {
  praia: 'Pôr do sol na praia ou nas montanhas — qual seu favorito?',
  corrida: 'Corrida de manhã cedo ou de noite pra você?',
  cozinhar: 'Qual prato você manda bem na cozinha?',
  cinema: 'Última série ou filme que te marcou?',
  pets: 'Conta aí, qual é o nome do seu pet?',
  shows: 'Qual foi o melhor show que você já foi?',
  viagem: 'Próximo destino da sua lista de viagens?',
  leitura: 'Tá lendo algum livro bom agora?',
  cafe: 'Café coado, expresso ou aquele bem doce?',
  academia: 'Treino de manhã ou à noite?',
  futebol: 'Qual time você torce?',
  volei: 'Vôlei de praia ou de quadra?',
  surf: 'Onde você costuma surfar por aqui?',
  trilha: 'Qual foi a trilha mais bonita que você já fez?',
  camping: 'Camping na praia ou na serra?',
  ciclismo: 'Pedal na cidade ou trilha de bike?',
  yoga: 'Yoga de manhã bota o dia em ordem, né?',
  danca: 'Qual ritmo você mais curte dançar?',
  musica_ao_vivo: 'Já viu alguma banda boa ao vivo ultimamente?',
  vinho: 'Tinto ou branco?',
  cerveja_artesanal: 'Qual cervejaria você mais curte?',
  gastronomia: 'Qual restaurante você recomendaria de olhos fechados?',
  fotografia: 'Você fotografa com celular ou câmera de verdade?',
  arte: 'Já foi em alguma exposição boa recentemente?',
  teatro: 'Peça de teatro que você recomenda?',
  series: 'Qual série você tá maratonando agora?',
  games: 'Qual jogo você não larga?',
  tecnologia: 'Alguma novidade de tecnologia que te empolgou?',
  voluntariado: 'Que legal que você faz trabalho voluntário — em quê?',
  religiao: 'Sua fé faz parte importante do seu dia a dia?',
  estudar: 'Tá estudando alguma coisa nova?',
  empreender: 'Conta sobre o que você empreende!',
  moda: 'Você acompanha alguma referência de moda?',
  carros: 'Carro dos sonhos, qual seria?',
  pescaria: 'Pescaria de rio ou de mar?',
  jardinagem: 'Sua horta ou jardim tem algo especial crescendo?',
}

export const GENERIC_ICE_BREAKERS = [
  'Oi! Como está sendo sua semana?',
  'O que não pode faltar num fim de semana bom pra você?',
  'Qual foi a última coisa que te fez rir de verdade?',
]

export function iceBreakersFor(myInterests: string[], theirInterests: string[]): string[] {
  const common = theirInterests.filter((i) => myInterests.includes(i))
  const rest = theirInterests.filter((i) => !common.includes(i))
  const ordered = [...common, ...rest]
  const phrases = ordered.map((i) => ICE_BY_INTEREST[i]).filter(Boolean) as string[]
  const unique = Array.from(new Set(phrases))
  if (unique.length === 0) return GENERIC_ICE_BREAKERS.slice(0, 2)
  return unique.slice(0, 3)
}
