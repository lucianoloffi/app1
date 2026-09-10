import { useState } from "react"
import { ChevronLeft, MoreVertical, Send } from "lucide-react"
import { useAppState } from "../state/AppState"

export function ChatConversationScreen({
  profileId,
  onBack,
}: {
  profileId: string
  onBack: () => void
}) {
  const { matches, sendMessage, unmatch } = useAppState()
  const [text, setText] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const match = matches.find((m) => m.profile.id === profileId)

  if (!match) {
    onBack()
    return null
  }

  const handleSend = () => {
    if (!text.trim()) return
    sendMessage(profileId, text)
    setText("")
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-3">
        <button type="button" onClick={onBack} aria-label="Voltar" className="p-1">
          <ChevronLeft size={22} className="text-neutral-700" />
        </button>
        <img
          src={match.profile.photos[0]}
          alt={match.profile.name}
          className="h-9 w-9 rounded-full object-cover"
        />
        <p className="flex-1 text-base font-semibold text-neutral-900">
          {match.profile.name}, {match.profile.age}
        </p>
        <div className="relative">
          <button
            type="button"
            aria-label="Mais opções"
            className="p-1"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreVertical size={20} className="text-neutral-500" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-10 w-44 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-neutral-700 active:bg-neutral-50"
                onClick={() => setMenuOpen(false)}
              >
                Denunciar
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-red-500 active:bg-neutral-50"
                onClick={() => {
                  setMenuOpen(false)
                  unmatch(profileId)
                  onBack()
                }}
              >
                Desfazer match
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto bg-neutral-50 px-3 py-4">
        {match.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                msg.sender === "me"
                  ? "bg-green-500 text-white"
                  : "bg-white text-neutral-900 shadow-sm"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-neutral-200 px-3 py-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend()
          }}
          placeholder="Escreva sua mensagem aqui"
          className="flex-1 rounded-full bg-neutral-100 px-4 py-2 text-sm outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          aria-label="Enviar"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white active:scale-95"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
