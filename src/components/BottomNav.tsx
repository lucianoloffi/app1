import { MessageCircle, Sparkles, User } from "lucide-react"

export type Tab = "chat" | "swipe" | "profile"

export function BottomNav({
  active,
  onChange,
  unreadCount,
}: {
  active: Tab
  onChange: (tab: Tab) => void
  unreadCount: number
}) {
  const isChat = active === "chat"
  const isSwipe = active === "swipe"
  const isProfile = active === "profile"

  return (
    <div className="flex items-center justify-around border-t border-neutral-200 bg-white px-6 py-3">
      <button
        type="button"
        aria-label="Conversas"
        onClick={() => onChange("chat")}
        className="relative flex h-9 w-9 items-center justify-center"
      >
        <MessageCircle
          size={26}
          className={isChat ? "text-green-600" : "text-neutral-400"}
          fill={isChat ? "#22c55e" : "none"}
          strokeWidth={isChat ? 0 : 2}
        />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      <button
        type="button"
        aria-label="Descobrir"
        onClick={() => onChange("swipe")}
        className="flex h-9 w-9 items-center justify-center"
      >
        <Sparkles
          size={30}
          className={isSwipe ? "text-green-600" : "text-neutral-400"}
          fill={isSwipe ? "#22c55e" : "none"}
          strokeWidth={isSwipe ? 0 : 2}
        />
      </button>

      <button
        type="button"
        aria-label="Perfil"
        onClick={() => onChange("profile")}
        className="flex h-9 w-9 items-center justify-center"
      >
        <User
          size={26}
          className={isProfile ? "text-green-600" : "text-neutral-400"}
          fill={isProfile ? "#22c55e" : "none"}
          strokeWidth={isProfile ? 0 : 2}
        />
      </button>
    </div>
  )
}
