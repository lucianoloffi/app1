import type { Activity, Drink, Intent, Kids, RelationshipStatus } from '../types'

export const INTENT_LABEL: Record<Intent, string> = {
  serio: 'Relacionamento sério',
  conhecer: 'Conhecer pessoas',
  amizade: 'Amizade',
}

export const DRINK_LABEL: Record<Drink, string> = {
  nao_bebo: 'Não bebo',
  socialmente: 'Socialmente',
  frequentemente: 'Frequentemente',
}

export const ACTIVITY_LABEL: Record<Activity, string> = {
  todo_dia: 'Todo dia',
  algumas_vezes: 'Algumas vezes na semana',
  raramente: 'Raramente',
}

export const KIDS_LABEL: Record<Kids, string> = {
  tenho: 'Tenho',
  nao_tenho: 'Não tenho',
  quero_ter: 'Quero ter',
  nao_quero: 'Não quero',
}

export const STATUS_LABEL: Record<RelationshipStatus, string> = {
  solteiro: 'Solteiro(a)',
  namorando: 'Namorando',
  divorciado: 'Divorciado(a)',
  separado: 'Separado(a)',
  viuvo: 'Viúvo(a)',
  prefiro_nao_dizer: 'Prefiro não dizer',
}
