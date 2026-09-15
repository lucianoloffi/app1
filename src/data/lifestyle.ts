import {
  ACTIVITY_LABEL,
  DRINK_LABEL,
  KIDS_LABEL,
  RELATIONSHIP_STATUS_LABEL,
  type Activity,
  type Drink,
  type Kids,
  type RelationshipStatus,
} from "../types";

export const LIFE_ICON_PATH: Record<"bebida" | "atividade" | "filhos", string> = {
  bebida:
    "M3.6 3.6h16.8a1 1 0 01.74 1.67L13 14.2v4.2h3.4a.9.9 0 010 1.8H7.6a.9.9 0 010-1.8H11v-4.2L2.86 5.27A1 1 0 013.6 3.6zm3.1 3.1L12 12.5l5.3-5.8H6.7z",
  atividade:
    "M3 10.1a1.1 1.1 0 012.2 0v3.8a1.1 1.1 0 01-2.2 0v-3.8zm3.3-2.3a1.2 1.2 0 012.4 0v3.1h6.6V7.8a1.2 1.2 0 012.4 0v8.4a1.2 1.2 0 01-2.4 0v-3.1H8.7v3.1a1.2 1.2 0 01-2.4 0V7.8zm12.5 2.3a1.1 1.1 0 012.2 0v3.8a1.1 1.1 0 01-2.2 0v-3.8z",
  filhos:
    "M8.4 3.6a2.9 2.9 0 110 5.8 2.9 2.9 0 010-5.8zm0 7c3 0 4.8 1.9 4.8 4.7v4.3a.9.9 0 01-.9.9H4.5a.9.9 0 01-.9-.9v-4.3c0-2.8 1.8-4.7 4.8-4.7zm8.6-1.2a2.3 2.3 0 110 4.6 2.3 2.3 0 010-4.6zm0 5.6c2.2 0 3.4 1.4 3.4 3.4v2.3a.9.9 0 01-.9.9h-4.2a.9.9 0 01-.9-.9V18.4c0-2 1.3-3.4 2.6-3.4z",
};

export const DRINK_OPTIONS: { value: Drink; label: string }[] = (
  ["nao-bebo", "socialmente", "frequentemente"] as Drink[]
).map((value) => ({ value, label: DRINK_LABEL[value] }));

export const ACTIVITY_OPTIONS: { value: Activity; label: string }[] = (
  ["todo-dia", "algumas-vezes", "raramente"] as Activity[]
).map((value) => ({ value, label: ACTIVITY_LABEL[value] }));

export const KIDS_OPTIONS: { value: Kids; label: string }[] = (
  ["tenho", "nao-tenho", "quero-ter", "nao-quero"] as Kids[]
).map((value) => ({ value, label: KIDS_LABEL[value] }));

export const LIFE_GROUPS = [
  { key: "bebida" as const, title: "Bebida", icon: LIFE_ICON_PATH.bebida, options: DRINK_OPTIONS },
  {
    key: "atividade" as const,
    title: "Atividade física",
    icon: LIFE_ICON_PATH.atividade,
    options: ACTIVITY_OPTIONS,
  },
  { key: "filhos" as const, title: "Filhos", icon: LIFE_ICON_PATH.filhos, options: KIDS_OPTIONS },
];

/** Ordem das chips no passo 8 do cadastro (sem "Prefiro não dizer"). */
export const ONBOARDING_STATUS_OPTIONS: { value: RelationshipStatus; label: string }[] = (
  ["solteiro", "divorciado", "viuvo", "separado", "namorando"] as RelationshipStatus[]
).map((value) => ({ value, label: RELATIONSHIP_STATUS_LABEL[value] }));

/** Ordem das opções na folha "Status de relacionamento" (Editar perfil). */
export const STATUS_SHEET_OPTIONS: { value: RelationshipStatus; label: string }[] = (
  ["solteiro", "namorando", "divorciado", "separado", "viuvo"] as RelationshipStatus[]
).map((value) => ({ value, label: RELATIONSHIP_STATUS_LABEL[value] }));
