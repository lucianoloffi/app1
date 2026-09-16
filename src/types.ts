export type Intention = "serio" | "conhecer" | "amizade";

export type Gender = "homem" | "mulher" | "outros";

export type FilterGender = "homem" | "mulher" | "todos";

export type Drink = "nao-bebo" | "socialmente" | "frequentemente";
export type Activity = "todo-dia" | "algumas-vezes" | "raramente";
export type Kids = "tenho" | "nao-tenho" | "quero-ter" | "nao-quero";

export interface Lifestyle {
  bebida: Drink | null;
  atividade: Activity | null;
  filhos: Kids | null;
}

export type RelationshipStatus =
  | "solteiro"
  | "namorando"
  | "casado"
  | "divorciado"
  | "separado"
  | "viuvo";

export interface Profile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  profession: string;
  city: string;
  /** null quando a distância está oculta, é aproximada ou falta GPS meu. */
  distanceKm: number | null;
  intention: Intention;
  interests: string[];
  bio: string;
  photos: string[];
  lifestyle?: Lifestyle;
  relationshipStatus?: RelationshipStatus;
  height?: number;
}

export interface ChatMessage {
  mine: boolean;
  text: string;
  failed?: boolean;
  /** Ausente enquanto a mensagem ainda não foi gravada no servidor. */
  id?: string;
  createdAt?: string;
}

export interface Chat {
  id: string;
  profileId: string;
  name: string;
  photo: string;
  isNew: boolean;
  unread: number;
  time: string;
  locked?: boolean;
  messages: ChatMessage[];
}

export type OnboardingStep =
  | "welcome"
  | "account"
  | "name-birthdate"
  | "gender-interest-city"
  | "photos"
  | "intention-interests"
  | "lifestyle"
  | "profession-height-status"
  | "success"
  | null;

export interface OnboardingState {
  step: OnboardingStep;
  email: string;
  password: string;
  phone: string;
  acceptedTerms: boolean;
  acceptedSensitiveData: boolean;
  name: string;
  birthdate: string;
  bio: string;
  gender: Gender | null;
  interestedIn: FilterGender | null;
  city: string;
  photos: (string | null)[];
  intention: Intention | null;
  interests: string[];
  lifestyle: Lifestyle;
  profession: string;
  height: number;
  relationshipStatus: RelationshipStatus | null;
}

export type VerificationStatus = "nao_solicitada" | "pendente" | "aprovada" | "rejeitada";

export interface MyProfile {
  name: string;
  city: string;
  birthdate: string;
  gender: Gender;
  bio: string;
  photos: string[];
  intention: Intention;
  interestedIn: FilterGender;
  interests: string[];
  lifestyle: Lifestyle;
  profession: string;
  height: number;
  relationshipStatus: RelationshipStatus | null;
  email?: string;
  phone?: string;
  visible?: boolean;
  showDistance?: boolean;
  verificationStatus?: VerificationStatus;
  approximateLocation?: boolean;
}

export interface Filters {
  intention: Intention | "todas";
  distanceKm: number;
  minAge: number;
  maxAge: number;
  interestedIn: FilterGender;
}

export type SwipeDirection = "left" | "right" | null;

export type Tab = "chats" | "discover" | "profile";

export const INTENTION_LABEL: Record<Intention, string> = {
  serio: "Relacionamento sério",
  conhecer: "Conhecer pessoas",
  amizade: "Amizade",
};

export const DRINK_LABEL: Record<Drink, string> = {
  "nao-bebo": "Não bebo",
  socialmente: "Socialmente",
  frequentemente: "Frequentemente",
};

export const ACTIVITY_LABEL: Record<Activity, string> = {
  "todo-dia": "Todo dia",
  "algumas-vezes": "Algumas vezes na semana",
  raramente: "Raramente",
};

export const KIDS_LABEL: Record<Kids, string> = {
  tenho: "Tenho",
  "nao-tenho": "Não tenho",
  "quero-ter": "Quero ter",
  "nao-quero": "Não quero",
};

export const RELATIONSHIP_STATUS_LABEL: Record<RelationshipStatus, string> = {
  solteiro: "Solteiro(a)",
  namorando: "Namorando",
  casado: "Casado(a)",
  divorciado: "Divorciado(a)",
  separado: "Separado(a)",
  viuvo: "Viúvo(a)",
};

export function heightLabel(meters: number): string {
  return `${meters.toFixed(2).replace(".", ",")} m`;
}
