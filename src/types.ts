export type Gender = "Homem" | "Mulher" | "Outros"

export interface Profile {
  id: string
  name: string
  age: number
  city: string
  distanceKm: number
  photos: string[]
  bio: string
  gender: Gender
  /** Simulates that this profile already liked "me", so liking back creates a match. */
  willMatch: boolean
}

export interface ChatMessage {
  id: string
  sender: "me" | "them"
  text: string
  time: string
}

export interface Match {
  profile: Profile
  isNew: boolean
  messages: ChatMessage[]
}

export type Interaction = "like" | "dislike"
