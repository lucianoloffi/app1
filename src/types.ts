export type Gender = 'homem' | 'mulher' | 'outro'
export type SeekingGender = 'homens' | 'mulheres' | 'todos'
export type Intent = 'serio' | 'conhecer' | 'amizade'
export type IntentFilter = Intent | 'todos'
export type Drink = 'nao_bebo' | 'socialmente' | 'frequentemente'
export type Activity = 'todo_dia' | 'algumas_vezes' | 'raramente'
export type Kids = 'tenho' | 'nao_tenho' | 'quero_ter' | 'nao_quero'
export type RelationshipStatus =
  | 'solteiro'
  | 'namorando'
  | 'divorciado'
  | 'separado'
  | 'viuvo'
  | 'prefiro_nao_dizer'

export interface Lifestyle {
  drink: Drink | null
  activity: Activity | null
  kids: Kids | null
}

export interface Prompt {
  label: string
  answer: string
}

export interface Profile {
  id: string
  name: string
  age: number
  gender: Gender
  city: string
  distanceKm: number
  profession: string
  bio: string
  photos: string[]
  interests: string[]
  intent: Intent
  prompt: Prompt
  lifestyle: Lifestyle
  height: number
  relationshipStatus: RelationshipStatus
}

export interface Message {
  id: string
  from: 'me' | 'them'
  text: string
  time: string
  failed?: boolean
}

export interface Chat {
  id: string
  profile: Profile
  messages: Message[]
  unread: number
  isNew: boolean
  locked: boolean
}

export interface Filters {
  seeking: SeekingGender
  ageMin: number
  ageMax: number
  dist: number
  intent: IntentFilter
}

export interface OnboardingData {
  phone: string
  code: string
  name: string
  birthDate: string
  bio: string
  sou: Gender | null
  meInteressoEm: SeekingGender | null
  city: string
  photos: string[]
  intent: Intent | null
  interests: string[]
  lifestyle: Lifestyle
  profession: string
  height: number
  relationshipStatus: RelationshipStatus | null
}

export interface Me {
  name: string
  city: string
  birthDate: string
  gender: Gender | null
  bio: string
  interests: string[]
  lifestyle: Lifestyle
  relationshipStatus: RelationshipStatus | null
  profession: string
  height: number
  verified: boolean
}

export type PhotoSlot = string | null

export type OverlayKey =
  | 'filters'
  | 'settings'
  | 'edit'
  | 'photosOpen'
  | 'report'
  | 'cardMenu'
  | 'menu'
  | 'interestSheet'
  | 'statusSheet'
  | 'lifeSheet'
  | 'heightSheet'
  | 'delete'
  | 'perms'
  | 'blocked'
  | 'phoneChange'

export type LifeSheetKind = 'drink' | 'activity' | 'kids' | null

export type Tab = 'discover' | 'chats' | 'profile'
