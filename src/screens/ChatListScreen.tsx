import { Header } from "../components/Header"
import { useAppState } from "../state/AppState"

export function ChatListScreen({ onOpenChat }: { onOpenChat: (profileId: string) => void }) {
  const { matches } = useAppState()
  const newMatches = matches.filter((m) => m.isNew)

  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="flex-1 overflow-y-auto bg-neutral-100">
        {matches.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center text-neutral-400">
            <p className="text-sm">
              Seus matches vão aparecer aqui. Dê like em alguém para começar a conversar!
            </p>
          </div>
        ) : (
          <>
            {newMatches.length > 0 && (
              <div className="px-4 pb-3 pt-4">
                <p className="mb-3 text-sm text-neutral-500">
                  Você tem {newMatches.length} novo{newMatches.length > 1 ? "s" : ""} match
                  {newMatches.length > 1 ? "es" : ""}!
                </p>
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                  {newMatches.map((m) => (
                    <button
                      key={m.profile.id}
                      type="button"
                      onClick={() => onOpenChat(m.profile.id)}
                      className="flex flex-col items-center gap-1"
                    >
                      <img
                        src={m.profile.photos[0]}
                        alt={m.profile.name}
                        className="h-16 w-16 rounded-full border-2 border-green-500 object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-neutral-200 bg-white">
              {matches.map((m) => {
                const last = m.messages[m.messages.length - 1]
                return (
                  <button
                    key={m.profile.id}
                    type="button"
                    onClick={() => onOpenChat(m.profile.id)}
                    className="flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left active:bg-neutral-50"
                  >
                    <img
                      src={m.profile.photos[0]}
                      alt={m.profile.name}
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-neutral-900">
                        {m.profile.name}{" "}
                        {m.isNew && <span className="font-normal text-green-600">deu match!</span>}
                      </p>
                      <p className="truncate text-sm text-neutral-500">{last?.text}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
