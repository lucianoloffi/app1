import { useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { Toast } from "./components/Toast";
import { useChats } from "./chats/useChats";
import { useDiscoverQueue } from "./discover/useDiscoverQueue";
import { useToast } from "./hooks/useToast";
import { OnboardingFlow } from "./onboarding/OnboardingFlow";
import { ChatScreen } from "./screens/ChatScreen";
import { ChatsScreen } from "./screens/ChatsScreen";
import { DiscoverScreen } from "./screens/DiscoverScreen";
import { EditProfileScreen } from "./screens/EditProfileScreen";
import { MatchOverlay } from "./screens/MatchOverlay";
import { ProfileDetailScreen } from "./screens/ProfileDetailScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import type { Filters, MyProfile, OnboardingState, Tab } from "./types";

type Stage = "onboarding" | "main";

const INITIAL_FILTERS: Filters = {
  intention: "todas",
  distanceKm: 25,
  city: "",
  minAge: 25,
  maxAge: 45,
  interestedIn: "mulher",
};

function buildMyProfile(state: OnboardingState): MyProfile {
  return {
    name: state.name,
    city: state.city,
    birthdate: state.birthdate,
    gender: state.gender ?? "outros",
    bio: state.bio,
    photos: state.photos.filter((photo): photo is string => Boolean(photo)),
    intention: state.intention ?? "conhecer",
    interests: state.interests,
  };
}

export default function App() {
  const [stage, setStage] = useState<Stage>("onboarding");
  const [tab, setTab] = useState<Tab>("discover");
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);

  const { message: toastMessage, showToast } = useToast();
  const chats = useChats();
  const discover = useDiscoverQueue({
    filters,
    onMatch: (profile) => chats.addMatchChat(profile),
  });

  if (stage === "onboarding") {
    return (
      <div className="app-shell">
        <div className="app-shell__content">
          <OnboardingFlow
            onComplete={(state) => {
              setMyProfile(buildMyProfile(state));
              if (state.interestedIn) {
                setFilters((prev) => ({ ...prev, interestedIn: state.interestedIn! }));
              }
              setStage("main");
            }}
          />
        </div>
      </div>
    );
  }

  if (detailOpen && discover.current) {
    return (
      <div className="app-shell">
        <div className="app-shell__content">
          <ProfileDetailScreen
            profile={discover.current}
            onBack={() => setDetailOpen(false)}
            onLike={() => {
              discover.like();
              setDetailOpen(false);
            }}
            onDislike={() => {
              discover.dislike();
              setDetailOpen(false);
            }}
          />
        </div>
      </div>
    );
  }

  if (editingProfile && myProfile) {
    return (
      <div className="app-shell">
        <div className="app-shell__content">
          <EditProfileScreen
            profile={myProfile}
            onCancel={() => setEditingProfile(false)}
            onSave={(profile) => {
              setMyProfile(profile);
              setEditingProfile(false);
              showToast("Perfil atualizado");
            }}
          />
        </div>
      </div>
    );
  }

  const activeChat = activeChatId ? chats.chats.find((chat) => chat.id === activeChatId) : null;

  if (activeChat) {
    return (
      <div className="app-shell">
        <div className="app-shell__content">
          <ChatScreen
            chat={activeChat}
            onBack={() => setActiveChatId(null)}
            onSend={chats.sendMessage}
            onReceive={chats.receiveMessage}
          />
        </div>
      </div>
    );
  }

  const totalUnread = chats.chats.reduce((sum, chat) => sum + chat.unread, 0);
  const conversationsCount = chats.chats.filter((chat) => chat.messages.length > 0).length;

  return (
    <div className="app-shell">
      <div className="app-shell__content">
        {tab === "discover" && (
          <DiscoverScreen
            current={discover.current}
            photoIndex={discover.photoIndex}
            swipeDirection={discover.swipeDirection}
            onNextPhoto={discover.nextPhoto}
            onLike={discover.like}
            onDislike={discover.dislike}
            onOpenProfile={() => setDetailOpen(true)}
            onIncreaseDistance={() => {
              setFilters((prev) => ({ ...prev, distanceKm: 50 }));
              discover.resetQueue();
            }}
            onReviewFilters={() => setTab("profile")}
          />
        )}
        {tab === "chats" && (
          <ChatsScreen
            chats={chats.chats}
            onOpenChat={(chatId) => {
              chats.openChat(chatId);
              setActiveChatId(chatId);
            }}
          />
        )}
        {tab === "profile" && (
          <ProfileScreen
            myProfile={myProfile}
            matchesCount={chats.chats.length}
            conversationsCount={conversationsCount}
            seenCount={discover.seenCount}
            filters={filters}
            onChangeFilters={setFilters}
            onEditProfile={() => setEditingProfile(true)}
            onViewOnboardingAgain={() => setStage("onboarding")}
            onRestartSimulation={() => window.location.reload()}
            onShowToast={showToast}
          />
        )}

        {discover.matchProfile && (
          <MatchOverlay
            profile={discover.matchProfile}
            onOpenChat={() => {
              discover.dismissMatch();
              setTab("chats");
            }}
            onContinue={discover.dismissMatch}
          />
        )}

        <Toast message={toastMessage} />
      </div>
      <BottomNav active={tab} onChange={setTab} unreadChats={totalUnread} />
    </div>
  );
}
