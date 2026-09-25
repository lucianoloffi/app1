import {
  ACTIVITY_LABEL,
  DIET_LABEL,
  DRINK_LABEL,
  KIDS_LABEL,
  POLITICS_LABEL,
  RELATIONSHIP_STATUS_LABEL,
  RELIGION_LABEL,
  SMOKE_LABEL,
  type Activity,
  type Diet,
  type Drink,
  type Kids,
  type Politics,
  type RelationshipStatus,
  type Religion,
  type Smoke,
} from "../types";

/** Opções na ordem das chaves do rótulo, que é a ordem da tela. */
function opcoesDe<T extends string>(rotulos: Record<T, string>): { value: T; label: string }[] {
  return (Object.keys(rotulos) as T[]).map((value) => ({ value, label: rotulos[value] }));
}

export const LIFE_ICON_PATH: Record<"bebida" | "atividade" | "filhos" | "fumo", string> = {
  bebida:
    "M3.6 3.6h16.8a1 1 0 01.74 1.67L13 14.2v4.2h3.4a.9.9 0 010 1.8H7.6a.9.9 0 010-1.8H11v-4.2L2.86 5.27A1 1 0 013.6 3.6zm3.1 3.1L12 12.5l5.3-5.8H6.7z",
  atividade:
    "M3 10.1a1.1 1.1 0 012.2 0v3.8a1.1 1.1 0 01-2.2 0v-3.8zm3.3-2.3a1.2 1.2 0 012.4 0v3.1h6.6V7.8a1.2 1.2 0 012.4 0v8.4a1.2 1.2 0 01-2.4 0v-3.1H8.7v3.1a1.2 1.2 0 01-2.4 0V7.8zm12.5 2.3a1.1 1.1 0 012.2 0v3.8a1.1 1.1 0 01-2.2 0v-3.8z",
  filhos:
    "M8.4 3.6a2.9 2.9 0 110 5.8 2.9 2.9 0 010-5.8zm0 7c3 0 4.8 1.9 4.8 4.7v4.3a.9.9 0 01-.9.9H4.5a.9.9 0 01-.9-.9v-4.3c0-2.8 1.8-4.7 4.8-4.7zm8.6-1.2a2.3 2.3 0 110 4.6 2.3 2.3 0 010-4.6zm0 5.6c2.2 0 3.4 1.4 3.4 3.4v2.3a.9.9 0 01-.9.9h-4.2a.9.9 0 01-.9-.9V18.4c0-2 1.3-3.4 2.6-3.4z",
  fumo:
    "M2.5 14.5h13.2a.9.9 0 01.9.9v2.2a.9.9 0 01-.9.9H2.5a.9.9 0 01-.9-.9v-2.2a.9.9 0 01.9-.9zm15.6 0h1.6v4h-1.6v-4zm2.6 0h1.6v4h-1.6v-4zM18 5.5c1.9.6 3.2 2.1 3.2 4.3v2.9h-1.6V9.8c0-1.4-.8-2.4-2.1-2.8L18 5.5z",
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

export const SMOKE_OPTIONS = opcoesDe<Smoke>(SMOKE_LABEL);

export const LIFE_GROUPS = [
  { key: "bebida" as const, title: "Bebida", icon: LIFE_ICON_PATH.bebida, options: DRINK_OPTIONS },
  {
    key: "atividade" as const,
    title: "Atividade física",
    icon: LIFE_ICON_PATH.atividade,
    options: ACTIVITY_OPTIONS,
  },
  { key: "filhos" as const, title: "Filhos", icon: LIFE_ICON_PATH.filhos, options: KIDS_OPTIONS },
  {
    key: "fumo" as const,
    title: "Fumo",
    question: "Você fuma?",
    icon: LIFE_ICON_PATH.fumo,
    options: SMOKE_OPTIONS,
  },
];

const VALUE_ICON_PATH: Record<"alimentacao" | "religiao" | "politica", string> = {
  alimentacao:
    "M17 3c-5 0-9.5 2.6-10.8 8.2-.6 2.6-.3 5 .6 6.9L4.3 20.6a.9.9 0 101.3 1.3l2.6-2.6c1.6.8 3.4 1 5.3.6C19 18.6 21 13.6 21 7V3.9a.9.9 0 00-.9-.9H17zm-1 4.2a.9.9 0 011.3 1.3l-6.9 6.9a.9.9 0 01-1.3-1.3L16 7.2z",
  religiao: "M12 2.2l2.6 6 6.5.6-4.9 4.3 1.5 6.4L12 16.1l-5.7 3.4 1.5-6.4-4.9-4.3 6.5-.6L12 2.2z",
  politica:
    "M4 10h16v1.8H4V10zm1.2 3h2v5h-2v-5zm5.8 0h2v5h-2v-5zm5.8 0h2v5h-2v-5zM3 19.2h18V21H3v-1.8zM12 2.5l9 5.3v.9H3v-.9l9-5.3z",
};

/**
 * "Seus valores" no cadastro e o grupo Valores na tela Interesses. `title` é
 * o do cadastro; `shortTitle`, o da linha do perfil, que é mais estreita.
 */
export const VALUE_GROUPS = [
  {
    key: "alimentacao" as const,
    title: "Alimentação",
    shortTitle: "Alimentação",
    icon: VALUE_ICON_PATH.alimentacao,
    options: opcoesDe<Diet>(DIET_LABEL),
  },
  {
    key: "religiao" as const,
    title: "Religião ou crença",
    shortTitle: "Religião ou crença",
    icon: VALUE_ICON_PATH.religiao,
    options: opcoesDe<Religion>(RELIGION_LABEL),
  },
  {
    key: "politica" as const,
    title: "Política num relacionamento",
    shortTitle: "Política",
    icon: VALUE_ICON_PATH.politica,
    options: opcoesDe<Politics>(POLITICS_LABEL),
  },
];

/**
 * Status de relacionamento, na mesma ordem no cadastro e na tela Interesses.
 * Eram duas listas, cada uma numa ordem. "Prefiro não dizer" não entra: na
 * folha ele é a opção vazia do RowBottomSheet, e no cadastro é desmarcar.
 */
export const STATUS_OPTIONS: { value: RelationshipStatus; label: string }[] = (
  Object.keys(RELATIONSHIP_STATUS_LABEL) as RelationshipStatus[]
).map((value) => ({ value, label: RELATIONSHIP_STATUS_LABEL[value] }));
