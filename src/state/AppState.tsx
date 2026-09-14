import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { PROFILES } from '../data/profiles'
import { INITIAL_CHATS } from '../data/chats'
import {
  DEFAULT_FILTERS,
  DEMO_FILTERS,
  DEMO_ME,
  DEMO_PHOTOS,
  EMPTY_ONBOARDING,
  pravatar,
} from '../data/defaults'
import { iceBreakersFor } from '../data/iceBreakers'
import type {
  Chat,
  Filters,
  Me,
  Message,
  OnboardingData,
  PhotoSlot,
  Profile,
  Tab,
} from '../types'

export type AppScreen =
  | 'filters'
  | 'settings'
  | 'edit'
  | 'managePhotos'
  | 'perms'
  | 'blocked'
  | 'phoneChange'

export type AppStage = 'onboarding' | 'app'

interface BlockedEntry {
  id: string
  name: string
  photo: string
  since: string
}

interface SettingsState {
  profileVisible: boolean
  showDistance: boolean
  notifMatches: boolean
  notifMessages: boolean
  notifNews: boolean
}

interface DetailState {
  profile: Profile
  from: 'card' | 'chat'
}

const ONBOARDING_STEPS = 9

function ageFromBirthDate(birthDate: string): number {
  const digits = birthDate.replace(/\D/g, '')
  if (digits.length < 8) return 0
  const day = Number(digits.slice(0, 2))
  const month = Number(digits.slice(2, 4))
  const year = Number(digits.slice(4, 8))
  const born = new Date(year, month - 1, day)
  if (Number.isNaN(born.getTime())) return 0
  const now = new Date()
  let age = now.getFullYear() - born.getFullYear()
  const m = now.getMonth() - born.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age--
  return age
}

interface AppStateValue {
  stage: AppStage
  goToLogin: () => void

  // onboarding
  obStep: number
  o: OnboardingData
  updateO: (patch: Partial<OnboardingData>) => void
  nextStep: () => void
  prevStep: () => void
  finishOnboarding: () => void
  showSuccess: boolean

  // tabs / navigation
  tab: Tab
  setTab: (t: Tab) => void
  screenStack: AppScreen[]
  openScreen: (s: AppScreen) => void
  closeScreen: () => void

  // profile
  me: Me
  updateMe: (patch: Partial<Me>) => void
  myPhotos: PhotoSlot[]
  setMyPhotos: (photos: PhotoSlot[]) => void
  completeness: { percent: number; missingText: string; filled: number; total: number }
  myAge: number

  // discover / queue
  queue: Profile[]
  currentProfile: Profile | null
  photoIndex: number
  nextPhoto: () => void
  swipe: { dir: 'left' | null; key: number }
  likeCurrent: () => void
  dislikeCurrent: () => void
  skipCurrent: () => void
  resetSeen: () => void
  hasAnyUnseen: boolean
  seenCount: number
  commonInterests: (p: Profile) => string[]
  otherInterests: (p: Profile) => string[]

  // filters
  filters: Filters
  filtersDraft: Filters
  filtersChanged: boolean
  beginEditFilters: () => void
  updateFiltersDraft: (patch: Partial<Filters>) => void
  revertFilters: () => void
  applyFilters: () => void
  widenFilters: () => void
  filtersSummary: string

  // detail
  detail: DetailState | null
  openDetail: (p: Profile, from: 'card' | 'chat') => void
  closeDetail: () => void

  // match
  matchedProfile: Profile | null
  closeMatch: () => void
  goToMatchChat: () => void

  // chats
  chats: Chat[]
  chatId: string | null
  openChat: (id: string) => void
  closeChat: () => void
  activeChat: Chat | null
  draft: string
  setDraft: (v: string) => void
  sendMessage: () => void
  typingChatId: string | null
  unmatchChat: (id: string) => void
  finalizeChat: (id: string) => void
  reopenChat: (id: string) => void
  totalUnread: number
  newMatchesCount: number
  iceBreakersFor: (p: Profile) => string[]

  // report / block
  reportTarget: { id: string; name: string } | null
  openReport: (id: string, name: string) => void
  closeReport: () => void
  submitReport: () => void
  blockedProfiles: BlockedEntry[]
  blockProfile: (id: string, name: string, photo: string) => void
  unblockProfile: (id: string) => void

  // settings
  settings: SettingsState
  updateSettings: (patch: Partial<SettingsState>) => void
  deleteAccount: () => void

  // simulations
  toast: string | null
  showToast: (msg: string) => void
  offline: boolean
  toggleOffline: () => void
  simulateUpload: () => Promise<boolean>
}

const AppStateContext = createContext<AppStateValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<AppStage>('onboarding')
  const [obStep, setObStep] = useState(0)
  const [o, setO] = useState<OnboardingData>({ ...EMPTY_ONBOARDING })
  const [showSuccess, setShowSuccess] = useState(false)

  const [tab, setTab] = useState<Tab>('discover')
  const [screenStack, setScreenStack] = useState<AppScreen[]>([])

  const [me, setMe] = useState<Me>({ ...DEMO_ME })
  const [myPhotos, setMyPhotos] = useState<PhotoSlot[]>([...DEMO_PHOTOS])

  const [seenIds, setSeenIds] = useState<Set<string>>(new Set())
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set())
  const [photoIndex, setPhotoIndex] = useState(0)
  const [swipe, setSwipe] = useState<{ dir: 'left' | null; key: number }>({ dir: null, key: 0 })
  const likeCounter = useRef(0)

  const [filters, setFilters] = useState<Filters>({ ...DEMO_FILTERS })
  const [filtersDraft, setFiltersDraft] = useState<Filters>({ ...DEMO_FILTERS })
  const [filtersSnapshot, setFiltersSnapshot] = useState<Filters>({ ...DEMO_FILTERS })

  const [detail, setDetail] = useState<DetailState | null>(null)
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null)

  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS)
  const [chatId, setChatId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [typingChatId, setTypingChatId] = useState<string | null>(null)

  const [reportTarget, setReportTarget] = useState<{ id: string; name: string } | null>(null)
  const [blockedProfiles, setBlockedProfiles] = useState<BlockedEntry[]>([
    { id: 'b1', name: 'Renato', photo: pravatar(70), since: 'há 2 semanas' },
  ])

  const [settings, setSettings] = useState<SettingsState>({
    profileVisible: true,
    showDistance: true,
    notifMatches: true,
    notifMessages: true,
    notifNews: true,
  })

  const [toast, setToast] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1800)
  }, [])

  const goToLogin = useCallback(() => {
    setMe({ ...DEMO_ME })
    setMyPhotos([...DEMO_PHOTOS])
    setFilters({ ...DEMO_FILTERS })
    setStage('app')
    setTab('discover')
  }, [])

  // ---------- onboarding ----------
  const updateO = useCallback((patch: Partial<OnboardingData>) => {
    setO((prev) => ({ ...prev, ...patch }))
  }, [])
  const nextStep = useCallback(() => setObStep((s) => Math.min(ONBOARDING_STEPS - 1, s + 1)), [])
  const prevStep = useCallback(() => setObStep((s) => Math.max(0, s - 1)), [])

  const finishOnboarding = useCallback(() => {
    setShowSuccess(true)
    setTimeout(() => {
      const filledPhotos = o.photos.slice(0, 6)
      const photos: PhotoSlot[] = [...filledPhotos, ...Array(6 - filledPhotos.length).fill(null)]
      setMyPhotos(photos)
      setMe({
        name: o.name || 'Você',
        city: o.city || 'Joinville, SC',
        birthDate: o.birthDate,
        gender: o.sou,
        bio: o.bio,
        interests: o.interests,
        lifestyle: o.lifestyle,
        relationshipStatus: o.relationshipStatus,
        profession: o.profession,
        height: o.height,
        verified: false,
      })
      setFilters({
        seeking: o.meInteressoEm ?? 'todos',
        ageMin: DEFAULT_FILTERS.ageMin,
        ageMax: DEFAULT_FILTERS.ageMax,
        dist: DEFAULT_FILTERS.dist,
        intent: o.intent ?? 'todos',
      })
      setSeenIds(new Set())
      setStage('app')
      setTab('discover')
      setShowSuccess(false)
      setObStep(0)
      setO({ ...EMPTY_ONBOARDING })
    }, 3000)
  }, [o])

  // ---------- navigation ----------
  const openScreen = useCallback((s: AppScreen) => setScreenStack((st) => [...st, s]), [])
  const closeScreen = useCallback(() => setScreenStack((st) => st.slice(0, -1)), [])

  // ---------- profile completeness ----------
  const myAge = useMemo(() => ageFromBirthDate(me.birthDate), [me.birthDate])

  const completeness = useMemo(() => {
    const fields: Array<[boolean, string]> = [
      [!!me.name, 'seu nome'],
      [!!me.city, 'sua cidade'],
      [!!me.birthDate, 'seu nascimento'],
      [!!me.gender, 'seu gênero'],
      [!!me.profession, 'sua profissão'],
      [!!me.relationshipStatus, 'seu status'],
      [!!me.height, 'sua altura'],
      [me.bio.trim().length > 4, 'sua bio'],
      [me.interests.length >= 3, 'seus interesses'],
      [!!(me.lifestyle.drink && me.lifestyle.activity && me.lifestyle.kids), 'seu estilo de vida'],
    ]
    const filledFields = fields.filter(([ok]) => ok).length
    const filledPhotos = myPhotos.filter(Boolean).length
    const total = fields.length + myPhotos.length
    const filled = filledFields + filledPhotos
    const percent = Math.round((filled / total) * 100)
    const missingPhotos = myPhotos.length - filledPhotos
    const missingField = fields.find(([ok]) => !ok)?.[1]
    let missingText = 'Perfil completo'
    if (missingPhotos > 0 && missingField) {
      missingText = `Faltam ${missingPhotos} foto${missingPhotos > 1 ? 's' : ''} e ${missingField}`
    } else if (missingPhotos > 0) {
      missingText = `Faltam ${missingPhotos} foto${missingPhotos > 1 ? 's' : ''}`
    } else if (missingField) {
      missingText = `Falta ${missingField}`
    }
    return { percent, missingText, filled, total }
  }, [me, myPhotos])

  const updateMe = useCallback((patch: Partial<Me>) => setMe((prev) => ({ ...prev, ...patch })), [])

  // ---------- discover / queue ----------
  const queue = useMemo(() => {
    return PROFILES.filter((p) => {
      if (seenIds.has(p.id) || blockedIds.has(p.id)) return false
      if (filters.seeking === 'homens' && p.gender !== 'homem') return false
      if (filters.seeking === 'mulheres' && p.gender !== 'mulher') return false
      if (p.age < filters.ageMin || p.age > filters.ageMax) return false
      if (p.distanceKm > filters.dist) return false
      if (filters.intent !== 'todos' && p.intent !== filters.intent) return false
      return true
    })
  }, [filters, seenIds, blockedIds])

  const currentProfile = queue[0] ?? null

  const hasAnyUnseen = useMemo(
    () => PROFILES.some((p) => !seenIds.has(p.id) && !blockedIds.has(p.id)),
    [seenIds, blockedIds],
  )

  const nextPhoto = useCallback(() => {
    if (!currentProfile) return
    setPhotoIndex((i) => (i + 1) % currentProfile.photos.length)
  }, [currentProfile])

  const commonInterests = useCallback((p: Profile) => p.interests.filter((i) => me.interests.includes(i)), [me.interests])
  const otherInterests = useCallback((p: Profile) => p.interests.filter((i) => !me.interests.includes(i)), [me.interests])

  const triggerMatch = useCallback((p: Profile): boolean => {
    likeCounter.current += 1
    const isMatch = likeCounter.current % 2 === 0
    if (!isMatch) return false
    setMatchedProfile(p)
    setChats((prev) => {
      if (prev.some((c) => c.id === p.id)) return prev
      const newChat: Chat = { id: p.id, profile: p, messages: [], unread: 0, isNew: true, locked: false }
      return [newChat, ...prev]
    })
    return true
  }, [])

  const advance = useCallback(
    (id: string, dir: 'left') => {
      setSwipe({ dir, key: Date.now() })
      setTimeout(() => {
        setSeenIds((prev) => new Set(prev).add(id))
        setPhotoIndex(0)
        setSwipe({ dir: null, key: Date.now() })
      }, 240)
    },
    [],
  )

  const likeCurrent = useCallback(() => {
    if (!currentProfile) return
    const p = currentProfile
    const matched = triggerMatch(p)
    // The card only slides away once the match overlay is dismissed (see
    // closeMatch / goToMatchChat); a non-match advances immediately.
    if (!matched) advance(p.id, 'left')
  }, [currentProfile, advance, triggerMatch])

  const dislikeCurrent = useCallback(() => {
    if (!currentProfile) return
    advance(currentProfile.id, 'left')
  }, [currentProfile, advance])

  const skipCurrent = useCallback(() => {
    if (!currentProfile) return
    advance(currentProfile.id, 'left')
    showToast('Perfil pulado')
  }, [currentProfile, advance, showToast])

  const resetSeen = useCallback(() => {
    setSeenIds(new Set())
    setPhotoIndex(0)
  }, [])

  // ---------- filters ----------
  const filtersChanged = useMemo(
    () => JSON.stringify(filtersDraft) !== JSON.stringify(filtersSnapshot),
    [filtersDraft, filtersSnapshot],
  )

  const beginEditFilters = useCallback(() => {
    setFiltersDraft(filters)
    setFiltersSnapshot(filters)
    openScreen('filters')
  }, [filters, openScreen])

  const updateFiltersDraft = useCallback((patch: Partial<Filters>) => {
    setFiltersDraft((prev) => ({ ...prev, ...patch }))
  }, [])

  const revertFilters = useCallback(() => setFiltersDraft(filtersSnapshot), [filtersSnapshot])

  const applyFilters = useCallback(() => {
    setFilters(filtersDraft)
    updateMe({})
    setTab('discover')
    closeScreen()
  }, [filtersDraft, updateMe, closeScreen])

  const widenFilters = useCallback(() => {
    const widened = { ...DEFAULT_FILTERS, seeking: filters.seeking }
    setFilters(widened)
    setFiltersDraft(widened)
    setFiltersSnapshot(widened)
  }, [filters.seeking])

  const filtersSummary = useMemo(() => {
    const genderLabel = filters.seeking === 'homens' ? 'Homens' : filters.seeking === 'mulheres' ? 'Mulheres' : 'Todos os gêneros'
    const intentLabel =
      filters.intent === 'serio' ? 'Relacionamento sério' : filters.intent === 'conhecer' ? 'Conhecer pessoas' : filters.intent === 'amizade' ? 'Amizade' : 'Todos'
    return `${genderLabel} · ${filters.ageMin}–${filters.ageMax} anos · até ${filters.dist} km · ${intentLabel}`
  }, [filters])

  // ---------- detail ----------
  const openDetail = useCallback((p: Profile, from: 'card' | 'chat') => setDetail({ profile: p, from }), [])
  const closeDetail = useCallback(() => setDetail(null), [])

  // ---------- match ----------
  const closeMatch = useCallback(() => {
    if (!matchedProfile) return
    advance(matchedProfile.id, 'left')
    setMatchedProfile(null)
  }, [matchedProfile, advance])

  const goToMatchChat = useCallback(() => {
    if (!matchedProfile) return
    const id = matchedProfile.id
    advance(id, 'left')
    setMatchedProfile(null)
    setTab('chats')
    setChatId(id)
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, isNew: false } : c)))
  }, [matchedProfile, advance])

  // ---------- chats ----------
  const openChat = useCallback((id: string) => {
    setChatId(id)
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, isNew: false, unread: 0 } : c)))
  }, [])
  const closeChat = useCallback(() => setChatId(null), [])
  const activeChat = useMemo(() => chats.find((c) => c.id === chatId) ?? null, [chats, chatId])

  const sendMessage = useCallback(() => {
    if (!chatId || !draft.trim()) return
    const text = draft.trim()
    setDraft('')
    const msg: Message = { id: `me-${Date.now()}`, from: 'me', text, time: 'agora' }
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, msg] } : c)))
    setTypingChatId(chatId)
    setTimeout(() => {
      setTypingChatId((cur) => (cur === chatId ? null : cur))
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== chatId) return c
          const replies = iceBreakersFor(me.interests, c.profile.interests)
          const reply = replies[Math.floor(Math.random() * replies.length)] ?? 'Haha, gostei disso!'
          const replyMsg: Message = { id: `them-${Date.now()}`, from: 'them', text: reply, time: 'agora' }
          return { ...c, messages: [...c.messages, replyMsg] }
        }),
      )
    }, 1600)
  }, [chatId, draft, me.interests])

  const unmatchChat = useCallback((id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id))
    setSeenIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setChatId((cur) => (cur === id ? null : cur))
    showToast('Match desfeito')
  }, [showToast])

  const finalizeChat = useCallback((id: string) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, locked: true } : c)))
    showToast('Conversa finalizada')
  }, [showToast])

  const reopenChat = useCallback((id: string) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, locked: false } : c)))
  }, [])

  const totalUnread = useMemo(() => chats.reduce((sum, c) => sum + c.unread, 0), [chats])
  const newMatchesCount = useMemo(() => chats.filter((c) => c.isNew).length, [chats])

  // ---------- report / block ----------
  const openReport = useCallback((id: string, name: string) => setReportTarget({ id, name }), [])
  const closeReport = useCallback(() => setReportTarget(null), [])
  const submitReport = useCallback(() => {
    closeReport()
    showToast('Denúncia enviada. Vamos analisar em até 24h.')
  }, [closeReport, showToast])

  const blockProfile = useCallback(
    (id: string, name: string, photo: string) => {
      setBlockedIds((prev) => new Set(prev).add(id))
      setChats((prev) => prev.filter((c) => c.id !== id))
      setBlockedProfiles((prev) => [{ id, name, photo, since: 'agora' }, ...prev])
      setDetail(null)
      showToast(`${name} foi bloqueado(a)`)
    },
    [showToast],
  )

  const unblockProfile = useCallback((id: string) => {
    setBlockedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setBlockedProfiles((prev) => prev.filter((b) => b.id !== id))
  }, [])

  // ---------- settings ----------
  const updateSettings = useCallback((patch: Partial<SettingsState>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const deleteAccount = useCallback(() => {
    setStage('onboarding')
    setObStep(0)
    setO({ ...EMPTY_ONBOARDING })
    setScreenStack([])
    setChats([])
    setSeenIds(new Set())
    setBlockedIds(new Set())
  }, [])

  // ---------- simulations ----------
  const toggleOffline = useCallback(() => setOffline((v) => !v), [])
  const simulateUpload = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(Math.random() > 0.28), 900)
    })
  }, [])

  const value: AppStateValue = {
    stage,
    goToLogin,
    obStep,
    o,
    updateO,
    nextStep,
    prevStep,
    finishOnboarding,
    showSuccess,
    tab,
    setTab,
    screenStack,
    openScreen,
    closeScreen,
    me,
    updateMe,
    myPhotos,
    setMyPhotos,
    completeness,
    myAge,
    queue,
    currentProfile,
    photoIndex,
    nextPhoto,
    swipe,
    likeCurrent,
    dislikeCurrent,
    skipCurrent,
    resetSeen,
    hasAnyUnseen,
    seenCount: seenIds.size,
    commonInterests,
    otherInterests,
    filters,
    filtersDraft,
    filtersChanged,
    beginEditFilters,
    updateFiltersDraft,
    revertFilters,
    applyFilters,
    widenFilters,
    filtersSummary,
    detail,
    openDetail,
    closeDetail,
    matchedProfile,
    closeMatch,
    goToMatchChat,
    chats,
    chatId,
    openChat,
    closeChat,
    activeChat,
    draft,
    setDraft,
    sendMessage,
    typingChatId,
    unmatchChat,
    finalizeChat,
    reopenChat,
    totalUnread,
    newMatchesCount,
    iceBreakersFor: (p: Profile) => iceBreakersFor(me.interests, p.interests),
    reportTarget,
    openReport,
    closeReport,
    submitReport,
    blockedProfiles,
    blockProfile,
    unblockProfile,
    settings,
    updateSettings,
    deleteAccount,
    toast,
    showToast,
    offline,
    toggleOffline,
    simulateUpload,
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
