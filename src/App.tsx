import { useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { Toast } from "./components/Toast";
import { useChats } from "./chats/useChats";
import { findProfileById } from "./data/mockProfiles";
import { useDiscoverQueue } from "./discover/useDiscoverQueue";
import { useToast } from "./hooks/useToast";
import { OnboardingFlow } from "./onboarding/OnboardingFlow";
import { BlockedProfilesScreen, type BlockedProfile } from "./screens/BlockedProfilesScreen";
import { ChatScreen } from "./screens/ChatScreen";
import { ChatsScreen } from "./screens/ChatsScreen";
import { DiscoverScreen } from "./screens/DiscoverScreen";
import { EditProfileScreen } from "./screens/EditProfileScreen";
import { FiltersScreen } from "./screens/FiltersScreen";
import { MatchOverlay } from "./screens/MatchOverlay";
import { PermissionsScreen } from "./screens/PermissionsScreen";
import { PhoneChangeScreen } from "./screens/PhoneChangeScreen";
import { ProfileDetailScreen } from "./screens/ProfileDetailScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import type { Filters, MyProfile, OnboardingState, Profile, Tab } from "./types";

type Stage = "onboarding" | "main";

const INITIAL_FILTERS: Filters = {
  intention: "todas",
  distanceKm: 25,
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
    interestedIn: state.interestedIn ?? "todos",
    interests: state.interests,
    lifestyle: state.lifestyle,
    profession: state.profession,
    height: state.height,
    relationshipStatus: state.relationshipStatus,
  };
}

export default function App() {
  const [stage, setStage] = useState<Stage>("onboarding");
  const [tab, setTab] = useState<Tab>("discover");

  const [detailProfile, setDetailProfile] = useState<Profile | null>(null);
  const [detailChatId, setDetailChatId] = useState<string | null>(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [phoneChangeOpen, setPhoneChangeOpen] = useState(false);
  const [myPhone, setMyPhone] = useState("+55 (47) 98812-4470");
  const [blockedProfiles, setBlockedProfiles] = useState<BlockedProfile[]>([]);
  const [offlineSim, setOfflineSim] = useState(false);

  const { message: toastMessage, showToast } = useToast();
  const chats = useChats();
  const discover = useDiscoverQueue({
    filters,
    onMatch: (profile) => chats.addMatchChat(profile),
  });

  function openProfile(profile: Profile, chatId: string | null = null) {
    setDetailProfile(profile);
    setDetailChatId(chatId);
  }

  function openProfileById(profileId: string, chatId: string | null = null) {
    const profile = findProfileById(profileId);
    if (!profile) {
      showToast("Perfil não disponível");
      return;
    }
    openProfile(profile, chatId);
  }

  function blockProfile(id: string, name: string, photo: string) {
    setBlockedProfiles((prev) => [{ id, name, photo, when: "agora" }, ...prev]);
  }

  if (stage === "onboarding") {
    return (
      <div className="app-shell">
        <div className="app-shell__content">
          <OnboardingFlow
            onShowToast={showToast}
            onComplete={(state) => {
              setMyProfile(buildMyProfile(state));
              if (state.interestedIn) {
                setFilters((prev) => ({ ...prev, interestedIn: state.interestedIn! }));
              }
              if (state.intention) {
                setFilters((prev) => ({ ...prev, intention: state.intention! }));
              }
              setStage("main");
            }}
          />
        </div>
      </div>
    );
  }

  if (detailProfile) {
    return (
      <div className="app-shell">
        <div className="app-shell__content">
          <ProfileDetailScreen
            profile={detailProfile}
            fromChat={detailChatId !== null}
            onBack={() => {
              if (detailChatId) setActiveChatId(detailChatId);
              setDetailProfile(null);
              setDetailChatId(null);
            }}
            onLike={() => {
              discover.like();
              setDetailProfile(null);
            }}
            onDislike={() => {
              discover.dislike();
              setDetailProfile(null);
            }}
            onShowToast={showToast}
          />
        </div>
      </div>
    );
  }

  if (activeChatId) {
    const activeChat = chats.chats.find((chat) => chat.id === activeChatId);
    if (activeChat) {
      return (
        <div className="app-shell">
          <div className="app-shell__content">
            <ChatScreen
              chat={activeChat}
              onBack={() => setActiveChatId(null)}
              onSend={chats.sendMessage}
              onReceive={chats.receiveMessage}
              onUndoMatch={(chatId) => {
                chats.removeChat(chatId);
                setActiveChatId(null);
              }}
              onLockChat={chats.lockChat}
              onUnlockChat={chats.unlockChat}
              onOpenProfile={(profileId) => openProfileById(profileId, activeChatId)}
              onBlock={(chatId) => {
                blockProfile(activeChat.profileId, activeChat.name, activeChat.photo);
                chats.removeChat(chatId);
                setActiveChatId(null);
              }}
              onShowToast={showToast}
            />
          </div>
        </div>
      );
    }
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
            onShowToast={showToast}
          />
        </div>
      </div>
    );
  }

  if (filtersOpen) {
    return (
      <div className="app-shell">
        <div className="app-shell__content">
          <FiltersScreen
            filters={filters}
            onClose={() => setFiltersOpen(false)}
            onApply={(next) => {
              setFilters(next);
              setMyProfile((prev) =>
                prev
                  ? {
                      ...prev,
                      interestedIn: next.interestedIn,
                      intention: next.intention === "todas" ? prev.intention : next.intention,
                    }
                  : prev,
              );
              setFiltersOpen(false);
              setTab("discover");
              showToast("Filtros aplicados — fila de perfis refeita");
            }}
          />
        </div>
      </div>
    );
  }

  if (phoneChangeOpen) {
    return (
      <div className="app-shell">
        <div className="app-shell__content">
          <PhoneChangeScreen
            currentPhone={myPhone}
            onBack={() => setPhoneChangeOpen(false)}
            onConfirm={(phone) => {
              setMyPhone(phone);
              setPhoneChangeOpen(false);
            }}
            onShowToast={showToast}
          />
        </div>
      </div>
    );
  }

  if (permissionsOpen) {
    return (
      <div className="app-shell">
        <div className="app-shell__content">
          <PermissionsScreen onBack={() => setPermissionsOpen(false)} />
        </div>
      </div>
    );
  }

  if (blockedOpen) {
    return (
      <div className="app-shell">
        <div className="app-shell__content">
          <BlockedProfilesScreen
            blocked={blockedProfiles}
            onUnblock={(id) => {
              const person = blockedProfiles.find((item) => item.id === id);
              setBlockedProfiles((prev) => prev.filter((item) => item.id !== id));
              if (person) showToast(`${person.name} desbloqueado`);
            }}
            onBack={() => setBlockedOpen(false)}
          />
        </div>
      </div>
    );
  }

  if (settingsOpen) {
    return (
      <div className="app-shell">
        <div className="app-shell__content">
          <SettingsScreen
            currentPhone={myPhone}
            blockedCount={blockedProfiles.length}
            offlineSim={offlineSim}
            onToggleOfflineSim={() => setOfflineSim((prev) => !prev)}
            onBack={() => setSettingsOpen(false)}
            onOpenBlocked={() => setBlockedOpen(true)}
            onOpenPermissions={() => setPermissionsOpen(true)}
            onOpenPhoneChange={() => setPhoneChangeOpen(true)}
            onDeleteAccount={() => {
              showToast("Conta excluída. Sentiremos sua falta.");
              setSettingsOpen(false);
              setMyProfile(null);
              setStage("onboarding");
            }}
            onShowToast={showToast}
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
            hasAnyMatch={discover.hasAnyMatch}
            offline={offlineSim}
            photoIndex={discover.photoIndex}
            swipeDirection={discover.swipeDirection}
            onNextPhoto={discover.nextPhoto}
            onLike={discover.like}
            onDislike={discover.dislike}
            onOpenProfile={(profile) => openProfile(profile)}
            onOpenFilters={() => setFiltersOpen(true)}
            onWidenFilters={() => {
              setFilters((prev) => ({ ...prev, distanceKm: 60, minAge: 18, maxAge: 70 }));
              showToast("Filtros ampliados: até 60 km e 18–70 anos");
            }}
            onRestoreProfiles={discover.resetQueue}
            onRetryConnection={() => {
              setOfflineSim(false);
              showToast("Conexão restabelecida");
            }}
            onBlock={(profile) => blockProfile(profile.id, profile.name, profile.photos[0])}
            onShowToast={showToast}
          />
        )}
        {tab === "chats" && (
          <ChatsScreen
            chats={chats.chats}
            onOpenChat={(chatId) => {
              chats.openChat(chatId);
              setActiveChatId(chatId);
            }}
            onOpenProfile={(profileId) => openProfileById(profileId, null)}
          />
        )}
        {tab === "profile" && (
          <ProfileScreen
            myProfile={myProfile}
            matchesCount={chats.chats.length}
            conversationsCount={conversationsCount}
            seenCount={discover.seenCount}
            filters={filters}
            onOpenEdit={() => setEditingProfile(true)}
            onOpenFilters={() => setFiltersOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            onVerifyProfile={() => showToast("Em breve")}
            onLogout={() => {
              setStage("onboarding");
              setMyProfile(null);
            }}
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
