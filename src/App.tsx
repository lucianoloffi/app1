import { useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { useDiscoverQueue } from "./discover/useDiscoverQueue";
import { OnboardingFlow } from "./onboarding/OnboardingFlow";
import { DiscoverScreen } from "./screens/DiscoverScreen";
import { MatchOverlay } from "./screens/MatchOverlay";
import { PlaceholderScreen } from "./screens/PlaceholderScreen";
import { ProfileDetailScreen } from "./screens/ProfileDetailScreen";
import type { Tab } from "./types";

type Stage = "onboarding" | "main";

export default function App() {
  const [stage, setStage] = useState<Stage>("onboarding");
  const [tab, setTab] = useState<Tab>("discover");
  const [detailOpen, setDetailOpen] = useState(false);
  const discover = useDiscoverQueue();

  if (stage === "onboarding") {
    return (
      <div className="app-shell">
        <div className="app-shell__content">
          <OnboardingFlow onComplete={() => setStage("main")} />
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
            onResetQueue={discover.resetQueue}
          />
        )}
        {tab === "chats" && (
          <PlaceholderScreen
            title="Conversas"
            support="Em breve: lista de matches e conversas."
          />
        )}
        {tab === "profile" && (
          <PlaceholderScreen title="Perfil" support="Em breve: seu perfil e filtros." />
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
      </div>
      <BottomNav active={tab} onChange={setTab} unreadChats={0} />
    </div>
  );
}
