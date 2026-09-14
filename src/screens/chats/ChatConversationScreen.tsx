import { useEffect, useRef, useState } from 'react'
import { useAppState } from '../../state/AppState'
import StatusBar from '../../components/StatusBar'
import { ChevronLeftIcon, DotsIcon, LockIcon } from '../../components/Icon'

export default function ChatConversationScreen() {
  const {
    activeChat,
    closeChat,
    openDetail,
    draft,
    setDraft,
    sendMessage,
    typingChatId,
    unmatchChat,
    finalizeChat,
    reopenChat,
    openReport,
    blockProfile,
    iceBreakersFor,
  } = useAppState()
  const [menuOpen, setMenuOpen] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight })
  }, [activeChat?.messages.length, typingChatId])

  if (!activeChat) return null
  const { profile } = activeChat
  const isTyping = typingChatId === activeChat.id
  const breakers = iceBreakersFor(profile)

  return (
    <div className="flex flex-col h-full bg-white">
      <StatusBar />
      <div className="h-[64px] shrink-0 flex items-center gap-3 px-5 border-b border-line-3 relative">
        <button type="button" onClick={closeChat} className="shrink-0">
          <ChevronLeftIcon size={22} />
        </button>
        <button type="button" onClick={() => openDetail(profile, 'chat')} className="shrink-0">
          <img src={profile.photos[0]} alt={profile.name} className="w-11 h-11 rounded-full object-cover" />
        </button>
        <span className="flex-1 text-[17px] font-bold truncate">{profile.name}</span>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        >
          <DotsIcon size={20} />
        </button>

        {menuOpen && (
          <div className="absolute top-[58px] right-4 z-20 w-[250px] bg-white rounded-2xl shadow-[0_18px_40px_-14px_rgba(0,0,0,.35)] overflow-hidden text-[14px] font-semibold">
            <button type="button" onClick={() => { setMenuOpen(false); openDetail(profile, 'chat') }} className="w-full text-left px-4 py-3.5 border-b border-line-3">
              Ver perfil
            </button>
            <button type="button" onClick={() => { setMenuOpen(false); openReport(profile.id, profile.name) }} className="w-full text-left px-4 py-3.5 border-b border-line-3">
              Denunciar
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                blockProfile(profile.id, profile.name, profile.photos[0])
              }}
              className="w-full text-left px-4 py-3.5 border-b border-line-3 text-destructive"
            >
              Bloquear
            </button>
            <button type="button" onClick={() => { setMenuOpen(false); unmatchChat(profile.id) }} className="w-full text-left px-4 py-3.5 border-b border-line-3 text-destructive">
              Desfazer match
            </button>
            <button type="button" onClick={() => { setMenuOpen(false); finalizeChat(profile.id) }} className="w-full text-left px-4 py-3.5 text-destructive">
              Finalizar conversa
            </button>
          </div>
        )}
      </div>

      <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-bg px-5 py-5 flex flex-col gap-3">
        <span className="self-center text-[12px] font-semibold text-ink-40 mb-1">Hoje</span>
        {activeChat.messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.from === 'me' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[78%] rounded-[18px] px-4 py-2.5 text-[15px] ${
                m.from === 'me' ? 'bg-accent text-white' : 'bg-white text-ink'
              }`}
            >
              {m.text}
            </div>
            {m.failed && (
              <span className="text-[11px] text-destructive font-semibold mt-1">Não enviada · Tentar de novo</span>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-1 bg-white rounded-full px-4 py-3 w-fit">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-[7px] h-[7px] rounded-full bg-ink-40 anim-typing-dot" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        )}
      </div>

      {activeChat.locked ? (
        <div className="shrink-0 flex items-center gap-2 justify-center px-5 py-4 border-t border-line-3 bg-white">
          <LockIcon size={16} color="#8A928B" />
          <span className="text-[14px] font-semibold text-ink-40">Conversa finalizada</span>
          <button type="button" onClick={() => reopenChat(profile.id)} className="text-[14px] font-bold text-accent-2 underline">
            Reabrir
          </button>
        </div>
      ) : (
        <div className="shrink-0 border-t border-line-3 bg-white px-4 pt-3 pb-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
            {breakers.map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => setDraft(phrase)}
                className="shrink-0 px-3.5 py-2 rounded-full bg-accent-soft border border-accent-line text-accent-2 text-[13px] font-semibold whitespace-nowrap"
              >
                {phrase}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendMessage()
              }}
              placeholder="Escreva uma mensagem"
              className="flex-1 rounded-full bg-bg px-4 py-3 text-[15px] outline-none"
            />
            <button
              type="button"
              onClick={sendMessage}
              className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shrink-0"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 20l16-8L4 4l2 7 9 1-9 1-2 7Z" fill="#fff" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
