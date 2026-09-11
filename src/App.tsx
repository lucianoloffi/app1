import { useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { OnboardingFlow } from "./onboarding/OnboardingFlow";
import { DiscoverScreen } from "./screens/DiscoverScreen";
import { PlaceholderScreen } from "./screens/PlaceholderScreen";
import type { Tab } from "./types";

type Stage = "onboarding" | "main";

export default function App() {
  const [stage, setStage] = useState<Stage>("onboarding");
  const [tab, setTab] = useState<Tab>("discover");

  if (stage === "onboarding") {
    return (
      <div className="app-shell">
        <div className="app-shell__content">
          <OnboardingFlow onComplete={() => setStage("main")} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-shell__content">
        {tab === "discover" && <DiscoverScreen />}
        {tab === "chats" && (
          <PlaceholderScreen
            title="Conversas"
            support="Em breve: lista de matches e conversas."
          />
        )}
        {tab === "profile" && (
          <PlaceholderScreen title="Perfil" support="Em breve: seu perfil e filtros." />
        )}
      </div>
      <BottomNav active={tab} onChange={setTab} unreadChats={0} />
    </div>
  );
}
