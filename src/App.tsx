import { useState } from "react"
import { PhoneFrame } from "./components/PhoneFrame"
import { BottomNav, type Tab } from "./components/BottomNav"
import { MatchOverlay } from "./components/MatchOverlay"
import { SwipeScreen } from "./screens/SwipeScreen"
import { ChatListScreen } from "./screens/ChatListScreen"
import { ChatConversationScreen } from "./screens/ChatConversationScreen"
import { ProfileScreen } from "./screens/ProfileScreen"
import { SettingsScreen } from "./screens/SettingsScreen"
import { AppStateProvider, useAppState } from "./state/AppState"

function AppShell() {
  const [tab, setTab] = useState<Tab>("swipe")
  const [openChatId, setOpenChatId] = useState<string | null>(null)
  const [profileView, setProfileView] = useState<"profile" | "settings">("profile")

  const { lastMatch, clearLastMatch, openMatch, unreadMatchCount } = useAppState()

  const handleTabChange = (next: Tab) => {
    setOpenChatId(null)
    setTab(next)
  }

  const handleOpenChat = (profileId: string) => {
    openMatch(profileId)
    setOpenChatId(profileId)
  }

  const showBottomNav = !(tab === "chat" && openChatId)

  return (
    <PhoneFrame>
      <div className="relative min-h-0 flex-1">
        {tab === "swipe" && <SwipeScreen />}

        {tab === "chat" &&
          (openChatId ? (
            <ChatConversationScreen profileId={openChatId} onBack={() => setOpenChatId(null)} />
          ) : (
            <ChatListScreen onOpenChat={handleOpenChat} />
          ))}

        {tab === "profile" && (
          <div className="flex h-full flex-col">
            <div className="flex justify-center gap-2 border-b border-neutral-100 px-4 pt-2">
              <button
                type="button"
                onClick={() => setProfileView("profile")}
                className={`px-3 py-1.5 text-sm font-medium ${
                  profileView === "profile"
                    ? "border-b-2 border-green-500 text-green-600"
                    : "text-neutral-400"
                }`}
              >
                Perfil
              </button>
              <button
                type="button"
                onClick={() => setProfileView("settings")}
                className={`px-3 py-1.5 text-sm font-medium ${
                  profileView === "settings"
                    ? "border-b-2 border-green-500 text-green-600"
                    : "text-neutral-400"
                }`}
              >
                Configurações
              </button>
            </div>
            <div className="min-h-0 flex-1">
              {profileView === "profile" ? (
                <ProfileScreen onDone={() => setTab("swipe")} />
              ) : (
                <SettingsScreen onDone={() => setTab("swipe")} />
              )}
            </div>
          </div>
        )}

        <MatchOverlay
          profile={lastMatch}
          onClose={clearLastMatch}
          onGoToChat={() => {
            if (lastMatch) {
              handleOpenChat(lastMatch.id)
              setTab("chat")
            }
            clearLastMatch()
          }}
        />
      </div>

      {showBottomNav && (
        <BottomNav active={tab} onChange={handleTabChange} unreadCount={unreadMatchCount} />
      )}
    </PhoneFrame>
  )
}

export default function App() {
  return (
    <AppStateProvider>
      <AppShell />
    </AppStateProvider>
  )
}
