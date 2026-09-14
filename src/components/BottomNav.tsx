import { useAppState } from '../state/AppState'
import type { Tab } from '../types'

function ChatGlyph({ active }: { active: boolean }) {
  const color = active ? '#8B5CF6' : '#C8CFC7'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M2.6 4.2h18.8v13.4H8.8L4.4 21v-3.4H2.6V4.2Z" stroke={color} strokeWidth={1.8} fill="none" />
    </svg>
  )
}

function DiscoverGlyph({ active }: { active: boolean }) {
  const color = active ? '#8B5CF6' : '#C8CFC7'
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      <rect x="3" y="3" width="24" height="24" rx="9" stroke={color} strokeWidth={2} />
      <path
        d="M15 20.5s-5-3.1-6.8-6.2c-.9-1.6-.2-3.7 1.6-4.2 1.3-.3 2.5.3 3.2 1.3.5.6 1.3.6 1.8 0 .7-1 2-1.6 3.2-1.3 1.8.5 2.5 2.6 1.6 4.2C20 17.4 15 20.5 15 20.5Z"
        fill={color}
      />
    </svg>
  )
}

function ProfileGlyph({ active }: { active: boolean }) {
  const color = active ? '#8B5CF6' : '#C8CFC7'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8.2" r="4" stroke={color} strokeWidth={1.8} />
      <path d="M4 20.5c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  )
}

export default function BottomNav() {
  const { tab, setTab, totalUnread } = useAppState()

  const item = (key: Tab, label: string, glyph: (active: boolean) => JSX.Element, big?: boolean) => {
    const active = tab === key
    return (
      <button
        type="button"
        onClick={() => setTab(key)}
        className="relative flex flex-1 flex-col items-center justify-center gap-1 pt-1"
      >
        <span className={big ? '' : ''}>{glyph(active)}</span>
        <span className={`text-[10px] font-semibold ${active ? 'text-accent' : 'text-icon-inactive'}`}>{label}</span>
        {key === 'chats' && totalUnread > 0 && (
          <span className="absolute top-0 right-[26%] min-w-[16px] h-4 px-1 rounded-full bg-coral text-white text-[9px] font-bold flex items-center justify-center">
            {totalUnread}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="shrink-0 h-[84px] pb-3 bg-white border-t border-line-3 flex items-stretch px-2">
      {item('chats', 'Conversas', (a) => <ChatGlyph active={a} />)}
      {item('discover', 'Descobrir', (a) => <DiscoverGlyph active={a} />, true)}
      {item('profile', 'Perfil', (a) => <ProfileGlyph active={a} />)}
    </div>
  )
}
