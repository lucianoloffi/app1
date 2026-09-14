import type { Filters, Lifestyle, Me, OnboardingData } from '../types'

export const pravatar = (n: number) => `https://i.pravatar.cc/600?img=${n}`

export const EMPTY_LIFESTYLE: Lifestyle = { drink: null, activity: null, kids: null }

export const DEFAULT_FILTERS: Filters = {
  seeking: 'todos',
  ageMin: 25,
  ageMax: 45,
  dist: 25,
  intent: 'todos',
}

export const DEMO_ME: Me = {
  name: 'Você',
  city: 'Joinville, SC',
  birthDate: '14/03/1998',
  gender: 'mulher',
  bio: '',
  interests: ['praia', 'cafe', 'series', 'yoga'],
  lifestyle: { drink: 'socialmente', activity: 'algumas_vezes', kids: 'quero_ter' },
  relationshipStatus: 'solteiro',
  profession: 'Analista de marketing',
  height: 1.68,
  verified: true,
}

export const DEMO_PHOTOS: (string | null)[] = [
  pravatar(47),
  pravatar(48),
  pravatar(49),
  pravatar(44),
  null,
  null,
]

export const DEMO_FILTERS: Filters = {
  seeking: 'homens',
  ageMin: 25,
  ageMax: 45,
  dist: 25,
  intent: 'todos',
}

export const EMPTY_ONBOARDING: OnboardingData = {
  phone: '',
  code: '',
  name: '',
  birthDate: '',
  bio: '',
  sou: null,
  meInteressoEm: null,
  city: '',
  photos: [],
  intent: null,
  interests: [],
  lifestyle: { ...EMPTY_LIFESTYLE },
  profession: '',
  height: 1.7,
  relationshipStatus: null,
}
