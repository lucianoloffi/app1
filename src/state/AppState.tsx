import { createContext, useCallback, useContext, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { initialProfiles } from "../data/profiles"
import { placeholderPhoto } from "../data/placeholder"
import type { ChatMessage, Gender, Interaction, Match, Profile } from "../types"

interface UserProfile {
  name: string
  bio: string
  city: string
  birthdate: string
  gender: Gender
  photo: string
}

interface Settings {
  interestedIn: Gender
  minAge: number
  maxAge: number
  notifications: boolean
  hideProfile: boolean
}

interface AppStateValue {
  queue: Profile[]
  interactions: Record<string, Interaction>
  matches: Match[]
  lastMatch: Profile | null
  userProfile: UserProfile
  settings: Settings
  like: (profile: Profile) => void
  dislike: (profile: Profile) => void
  clearLastMatch: () => void
  openMatch: (profileId: string) => void
  unmatch: (profileId: string) => void
  sendMessage: (profileId: string, text: string) => void
  updateUserProfile: (patch: Partial<UserProfile>) => void
  updateSettings: (patch: Partial<Settings>) => void
  unreadMatchCount: number
}

const AppStateContext = createContext<AppStateValue | null>(null)

const openingLines: Record<string, string> = {
  p1: "Oi! Curti seu perfil, bora trocar uma ideia?",
  p2: "E aí! Também curte praia? haha",
  p3: "Olá estava aqui pensando em conversar com alguém bacana!",
  p6: "Oi! Vi que curte arte também, adorei.",
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Profile[]>(initialProfiles)
  const [interactions, setInteractions] = useState<Record<string, Interaction>>({})
  const [matches, setMatches] = useState<Match[]>([])
  const [lastMatch, setLastMatch] = useState<Profile | null>(null)

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "",
    bio: "",
    city: "",
    birthdate: "1998-01-20",
    gender: "Homem",
    photo: placeholderPhoto("me", "Você"),
  })

  const [settings, setSettings] = useState<Settings>({
    interestedIn: "Mulher",
    minAge: 18,
    maxAge: 32,
    notifications: false,
    hideProfile: false,
  })

  const removeFromQueue = useCallback((profileId: string) => {
    setQueue((prev) => prev.filter((p) => p.id !== profileId))
  }, [])

  const dislike = useCallback(
    (profile: Profile) => {
      setInteractions((prev) => ({ ...prev, [profile.id]: "dislike" }))
      removeFromQueue(profile.id)
    },
    [removeFromQueue],
  )

  const like = useCallback(
    (profile: Profile) => {
      setInteractions((prev) => ({ ...prev, [profile.id]: "like" }))
      removeFromQueue(profile.id)

      if (profile.willMatch) {
        const opening = openingLines[profile.id] ?? "Oi! Adorei seu perfil :)"
        const message: ChatMessage = {
          id: `${profile.id}-open`,
          sender: "them",
          text: opening,
          time: "agora",
        }
        setMatches((prev) => [
          { profile, isNew: true, messages: [message] },
          ...prev,
        ])
        setLastMatch(profile)
      }
    },
    [removeFromQueue],
  )

  const clearLastMatch = useCallback(() => setLastMatch(null), [])

  const openMatch = useCallback((profileId: string) => {
    setMatches((prev) =>
      prev.map((m) => (m.profile.id === profileId ? { ...m, isNew: false } : m)),
    )
  }, [])

  const unmatch = useCallback((profileId: string) => {
    setMatches((prev) => prev.filter((m) => m.profile.id !== profileId))
    setInteractions((prev) => ({ ...prev, [profileId]: "dislike" }))
  }, [])

  const sendMessage = useCallback((profileId: string, text: string) => {
    if (!text.trim()) return
    const myMessage: ChatMessage = {
      id: `${profileId}-${Date.now()}`,
      sender: "me",
      text,
      time: "agora",
    }
    setMatches((prev) =>
      prev.map((m) =>
        m.profile.id === profileId
          ? { ...m, isNew: false, messages: [...m.messages, myMessage] }
          : m,
      ),
    )
  }, [])

  const updateUserProfile = useCallback((patch: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...patch }))
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const unreadMatchCount = useMemo(
    () => matches.filter((m) => m.isNew).length,
    [matches],
  )

  const value: AppStateValue = {
    queue,
    interactions,
    matches,
    lastMatch,
    userProfile,
    settings,
    like,
    dislike,
    clearLastMatch,
    openMatch,
    unmatch,
    sendMessage,
    updateUserProfile,
    updateSettings,
    unreadMatchCount,
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider")
  return ctx
}
