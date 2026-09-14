import { useRef, useState } from 'react'
import { useAppState } from '../../state/AppState'
import StatusBar from '../../components/StatusBar'
import { ChevronRightIcon } from '../../components/Icon'

function matchesLabel(count: number) {
  if (count === 0) return 'Seus matches'
  if (count === 1) return 'Você tem 1 novo match!'
  return `Você tem ${count} novos matches!`
}

export default function ChatsListScreen() {
  const { chats, openChat, openDetail, newMatchesCount } = useAppState()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [showChevron, setShowChevron] = useState(true)

  const handleScroll = () => {
    const el = scrollerRef.current
    if (!el) return
    setShowChevron(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }

  const advanceStrip = () => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: el.clientWidth * 0.7, behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <StatusBar />
      <div className="h-14 shrink-0 flex items-center justify-between px-6">
        <h1 className="text-[26px] font-extrabold">Conversas</h1>
        <button type="button" className="w-10 h-10 rounded-full bg-bg flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16211A" strokeWidth={2.2}>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="px-6 pb-2">
        <div className="text-[15px] font-bold mb-3">{matchesLabel(newMatchesCount)}</div>
        <div className="relative">
          <div
            ref={scrollerRef}
            onScroll={handleScroll}
            className="flex gap-3.5 overflow-x-auto no-scrollbar pb-1"
          >
            {chats.map((c) => (
              <button key={c.id} type="button" onClick={() => openDetail(c.profile, 'chat')} className="shrink-0 flex flex-col items-center gap-1">
                <img
                  src={c.profile.photos[0]}
                  alt={c.profile.name}
                  className={`w-[70px] h-[70px] rounded-full object-cover ${c.isNew ? 'ring-[3px] ring-accent' : ''}`}
                />
                <span className="text-[11px] font-semibold text-ink-60 max-w-[70px] truncate">{c.profile.name}</span>
              </button>
            ))}
          </div>
          {showChevron && chats.length > 3 && (
            <div className="absolute right-0 top-0 bottom-4 flex items-center">
              <div className="w-14 h-full bg-gradient-to-l from-white via-white/70 to-transparent absolute right-0" />
              <button
                type="button"
                onClick={advanceStrip}
                className="relative w-[26px] h-[26px] rounded-full bg-white/[.55] backdrop-blur flex items-center justify-center"
              >
                <ChevronRightIcon size={13} color="#8B5CF6" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-2">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-1">
            <p className="text-[15px] font-bold">Nenhuma conversa ainda</p>
            <p className="text-[13px] text-ink-60">Continue curtindo perfis para encontrar seus matches.</p>
          </div>
        ) : (
          chats.map((c) => {
            const last = c.messages[c.messages.length - 1]
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => openChat(c.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <img
                  onClick={(e) => {
                    e.stopPropagation()
                    openDetail(c.profile, 'chat')
                  }}
                  src={c.profile.photos[0]}
                  alt={c.profile.name}
                  className="w-[58px] h-[58px] rounded-full object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-semibold truncate">{c.profile.name}</span>
                    {c.isNew && (
                      <span className="px-2 py-0.5 rounded-full bg-accent-soft text-accent-2 text-[10px] font-bold shrink-0">
                        deu match!
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-ink-60 truncate">{last ? last.text : 'Diga oi! 👋'}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {last && <span className="text-[11px] font-medium text-ink-40">{last.time}</span>}
                  {c.unread > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center">
                      {c.unread}
                    </span>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
