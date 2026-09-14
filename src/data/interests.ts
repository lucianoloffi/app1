export interface Interest {
  id: string
  label: string
}

export const INTERESTS: Interest[] = [
  { id: 'praia', label: 'Praia' },
  { id: 'corrida', label: 'Corrida' },
  { id: 'cozinhar', label: 'Cozinhar' },
  { id: 'cinema', label: 'Cinema' },
  { id: 'pets', label: 'Pets' },
  { id: 'shows', label: 'Shows' },
  { id: 'viagem', label: 'Viagem' },
  { id: 'leitura', label: 'Leitura' },
  { id: 'cafe', label: 'Café' },
  { id: 'academia', label: 'Academia' },
  { id: 'futebol', label: 'Futebol' },
  { id: 'volei', label: 'Vôlei' },
  { id: 'surf', label: 'Surf' },
  { id: 'trilha', label: 'Trilha' },
  { id: 'camping', label: 'Camping' },
  { id: 'ciclismo', label: 'Ciclismo' },
  { id: 'yoga', label: 'Yoga' },
  { id: 'danca', label: 'Dança' },
  { id: 'musica_ao_vivo', label: 'Música ao vivo' },
  { id: 'vinho', label: 'Vinho' },
  { id: 'cerveja_artesanal', label: 'Cerveja artesanal' },
  { id: 'gastronomia', label: 'Gastronomia' },
  { id: 'fotografia', label: 'Fotografia' },
  { id: 'arte', label: 'Arte' },
  { id: 'teatro', label: 'Teatro' },
  { id: 'series', label: 'Séries' },
  { id: 'games', label: 'Games' },
  { id: 'tecnologia', label: 'Tecnologia' },
  { id: 'voluntariado', label: 'Voluntariado' },
  { id: 'religiao', label: 'Religião' },
  { id: 'estudar', label: 'Estudar' },
  { id: 'empreender', label: 'Empreender' },
  { id: 'moda', label: 'Moda' },
  { id: 'carros', label: 'Carros' },
  { id: 'pescaria', label: 'Pescaria' },
  { id: 'jardinagem', label: 'Jardinagem' },
]

export const interestLabel = (id: string): string =>
  INTERESTS.find((i) => i.id === id)?.label ?? id
