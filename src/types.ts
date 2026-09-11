export type Intention = "serio" | "conhecer" | "amizade";

export type Gender = "homem" | "mulher" | "outros";

export interface Profile {
  id: string;
  name: string;
  age: number;
  profession: string;
  city: string;
  distanceKm: number;
  intention: Intention;
  interests: string[];
  bio: string;
  prompt: {
    label: string;
    answer: string;
  };
  photos: string[];
  likesYou?: boolean;
}

export interface ChatMessage {
  mine: boolean;
  text: string;
}

export interface Chat {
  id: string;
  profileId: string;
  name: string;
  photo: string;
  isNew: boolean;
  unread: number;
  time: string;
  status?: string;
  messages: ChatMessage[];
}

export type OnboardingStep =
  | "welcome"
  | "phone"
  | "code"
  | "name-birthdate"
  | "gender-interest-city"
  | "photos"
  | "about-intention-interests"
  | "success"
  | null;

export interface OnboardingState {
  step: OnboardingStep;
  phone: string;
  code: string;
  name: string;
  birthdate: string;
  gender: Gender | null;
  interestedIn: Gender | null;
  city: string;
  photos: (string | null)[];
  bio: string;
  intention: Intention | null;
  interests: string[];
}

export interface Filters {
  intention: Intention | "todas";
  distanceKm: number;
  city: string;
  minAge: number;
  maxAge: number;
  interestedIn: Gender | null;
}

export type SwipeDirection = "left" | "right" | null;

export type Tab = "chats" | "discover" | "profile";

export const INTENTION_LABEL: Record<Intention, string> = {
  serio: "Busca algo sério",
  conhecer: "Quer conhecer pessoas",
  amizade: "Busca amizade",
};
