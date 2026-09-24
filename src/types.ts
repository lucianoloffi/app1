/** Mesmas chaves do check de `profiles.intencao` (migration 0028). */
export type Intention = "serio" | "conhecer" | "casual" | "nao_sei";

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
  /** Selo de verificado. Só o "sim ou não" sai do servidor (migration 0022). */
  verified?: boolean;
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
  | "intention"
  | "interests"
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

/**
 * Decisão da moderação sobre a conta. Não confundir com `visible`, que é a
 * escolha da própria pessoa de aparecer ou não na fila.
 */
export type ModerationStatus = "ativo" | "suspenso" | "banido";

/**
 * Decisão da moderação sobre UMA foto (`photos.status_moderacao`). Não
 * confundir com ModerationStatus, que é sobre a conta inteira.
 */
export type PhotoStatus = "pendente" | "aprovada" | "rejeitada";

/**
 * Foto do próprio perfil. Leva o status junto porque a dona precisa saber
 * quando uma foto dela foi reprovada: antes só a URL chegava à tela, e a foto
 * reprovada continuava aparecendo para ela como se nada tivesse acontecido,
 * enquanto os outros já não a viam.
 */
export interface MyPhoto {
  url: string;
  status: PhotoStatus;
}

export interface MyProfile {
  name: string;
  city: string;
  birthdate: string;
  gender: Gender;
  bio: string;
  photos: MyPhoto[];
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
  moderationStatus?: ModerationStatus;
  /** Fim da suspensão, em ISO. null quando não há prazo (ou não há suspensão). */
  suspendedUntil?: string | null;
  approximateLocation?: boolean;
}

/**
 * O que a tela de edição de perfil mexe — e só isso. O resto do MyProfile é do
 * servidor (selo de verificado, sanção da moderação, modo cidade, telefone) e
 * não passa pelas mãos da tela.
 *
 * Existe porque esses campos são opcionais em MyProfile, então um objeto sem
 * nenhum deles passava batido pelo TypeScript: a tela devolvia um perfil novo
 * com os 13 campos editáveis, o App trocava o estado inteiro por ele, e o selo
 * de verificado sumia até recarregar a página. Junto com o selo iam a sanção
 * (quem estava suspenso voltava a ver o app) e o modo cidade (o GPS
 * sobrescrevia a escolha no abrir seguinte).
 */
export type PerfilEditavel = Pick<
  MyProfile,
  | "name"
  | "city"
  | "birthdate"
  | "gender"
  | "bio"
  | "photos"
  | "intention"
  | "interestedIn"
  | "interests"
  | "lifestyle"
  | "profession"
  | "height"
  | "relationshipStatus"
>;

export interface Filters {
  /** Intenções aceitas na fila. Nunca vazia: sem nenhuma, não viria ninguém. */
  intentions: Intention[];
  distanceKm: number;
  minAge: number;
  maxAge: number;
  interestedIn: FilterGender;
}

export type SwipeDirection = "left" | "right" | null;

export type Tab = "chats" | "discover" | "profile";

export const INTENTION_LABEL: Record<Intention, string> = {
  serio: "Relacionamento sério",
  conhecer: "Conhecer alguém",
  casual: "Algo casual",
  nao_sei: "Ainda não sei",
};

/**
 * Todas as intenções, na ordem das telas. Filtro sem recorte nenhum: é o que
 * vale para quem acabou de se cadastrar e nunca abriu os filtros.
 */
export const TODAS_AS_INTENCOES = Object.keys(INTENTION_LABEL) as Intention[];

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
