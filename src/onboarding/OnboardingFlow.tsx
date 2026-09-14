import { useState } from "react";
import type {
  FilterGender,
  Gender,
  Intention,
  Lifestyle,
  OnboardingState,
  OnboardingStep,
  RelationshipStatus,
} from "../types";
import { MAX_INTERESTS } from "./constants";
import { LoginFlow } from "./LoginFlow";
import { CodeScreen } from "./screens/CodeScreen";
import { GenderInterestCityScreen } from "./screens/GenderInterestCityScreen";
import { IntentionInterestsScreen } from "./screens/IntentionInterestsScreen";
import { LifestyleScreen } from "./screens/LifestyleScreen";
import { NameBirthdateScreen } from "./screens/NameBirthdateScreen";
import { PhoneScreen } from "./screens/PhoneScreen";
import { PhotosScreen } from "./screens/PhotosScreen";
import { ProfessionHeightStatusScreen } from "./screens/ProfessionHeightStatusScreen";
import { SuccessScreen } from "./screens/SuccessScreen";
import { WelcomeScreen } from "./screens/WelcomeScreen";

const INITIAL_STATE: OnboardingState = {
  step: "welcome",
  phone: "",
  code: "",
  name: "",
  birthdate: "",
  bio: "",
  gender: null,
  interestedIn: null,
  city: "",
  photos: [null, null, null, null],
  intention: null,
  interests: [],
  lifestyle: { bebida: null, atividade: null, filhos: null },
  profession: "",
  height: 1.7,
  relationshipStatus: null,
};

const DEMO_LOGIN_STATE: OnboardingState = {
  step: null,
  phone: "47988124470",
  code: "1234",
  name: "Mariana Silva",
  birthdate: "12/05/1996",
  bio: "Voltei a usar o app depois de um tempo.",
  gender: "mulher",
  interestedIn: "homem",
  city: "Joinville, SC",
  photos: ["https://i.pravatar.cc/600?img=48", null, null, null],
  intention: "serio",
  interests: ["Praia", "Viagem", "Café"],
  lifestyle: { bebida: "socialmente", atividade: "algumas-vezes", filhos: "nao-tenho" },
  profession: "Fisioterapeuta",
  height: 1.68,
  relationshipStatus: "solteiro",
};

interface OnboardingFlowProps {
  onComplete: (state: OnboardingState) => void;
  onShowToast: (message: string) => void;
}

export function OnboardingFlow({ onComplete, onShowToast }: OnboardingFlowProps) {
  const [state, setState] = useState<OnboardingState>(INITIAL_STATE);
  const [mode, setMode] = useState<"signup" | "login">("signup");

  function goTo(step: OnboardingStep) {
    setState((prev) => ({ ...prev, step }));
  }

  if (mode === "login") {
    return (
      <LoginFlow
        onGoSignup={() => setMode("signup")}
        onLoginSuccess={() => onComplete(DEMO_LOGIN_STATE)}
        onShowToast={onShowToast}
      />
    );
  }

  switch (state.step) {
    case "welcome":
      return (
        <WelcomeScreen onCreateAccount={() => goTo("phone")} onHaveAccount={() => setMode("login")} />
      );

    case "phone":
      return (
        <PhoneScreen
          phone={state.phone}
          onChangePhone={(phone) => setState((prev) => ({ ...prev, phone }))}
          onBack={() => goTo("welcome")}
          onNext={() => goTo("code")}
        />
      );

    case "code":
      return (
        <CodeScreen
          code={state.code}
          onChangeCode={(code) => setState((prev) => ({ ...prev, code }))}
          onBack={() => goTo("phone")}
          onNext={() => goTo("name-birthdate")}
        />
      );

    case "name-birthdate":
      return (
        <NameBirthdateScreen
          name={state.name}
          birthdate={state.birthdate}
          bio={state.bio}
          onChangeName={(name) => setState((prev) => ({ ...prev, name }))}
          onChangeBirthdate={(birthdate) => setState((prev) => ({ ...prev, birthdate }))}
          onChangeBio={(bio) => setState((prev) => ({ ...prev, bio }))}
          onBack={() => goTo("code")}
          onNext={() => goTo("gender-interest-city")}
        />
      );

    case "gender-interest-city":
      return (
        <GenderInterestCityScreen
          gender={state.gender}
          interestedIn={state.interestedIn}
          city={state.city}
          onChangeGender={(gender: Gender) => setState((prev) => ({ ...prev, gender }))}
          onChangeInterestedIn={(interestedIn: FilterGender) =>
            setState((prev) => ({ ...prev, interestedIn }))
          }
          onChangeCity={(city) => setState((prev) => ({ ...prev, city }))}
          onBack={() => goTo("name-birthdate")}
          onNext={() => goTo("photos")}
        />
      );

    case "photos":
      return (
        <PhotosScreen
          photos={state.photos}
          onChangePhotos={(photos) => setState((prev) => ({ ...prev, photos }))}
          onBack={() => goTo("gender-interest-city")}
          onNext={() => goTo("intention-interests")}
        />
      );

    case "intention-interests":
      return (
        <IntentionInterestsScreen
          intention={state.intention}
          interests={state.interests}
          onChangeIntention={(intention: Intention) =>
            setState((prev) => ({ ...prev, intention }))
          }
          onToggleInterest={(interest) =>
            setState((prev) => ({
              ...prev,
              interests: prev.interests.includes(interest)
                ? prev.interests.filter((item) => item !== interest)
                : prev.interests.length >= MAX_INTERESTS
                  ? prev.interests
                  : [...prev.interests, interest],
            }))
          }
          onOverMax={() => onShowToast("Máximo de 6 interesses")}
          onBack={() => goTo("photos")}
          onFinish={() => goTo("lifestyle")}
        />
      );

    case "lifestyle":
      return (
        <LifestyleScreen
          lifestyle={state.lifestyle}
          onChange={(lifestyle: Lifestyle) => setState((prev) => ({ ...prev, lifestyle }))}
          onBack={() => goTo("intention-interests")}
          onNext={() => goTo("profession-height-status")}
        />
      );

    case "profession-height-status":
      return (
        <ProfessionHeightStatusScreen
          profession={state.profession}
          height={state.height}
          relationshipStatus={state.relationshipStatus}
          onChangeProfession={(profession) => setState((prev) => ({ ...prev, profession }))}
          onChangeHeight={(height) => setState((prev) => ({ ...prev, height }))}
          onChangeStatus={(relationshipStatus: RelationshipStatus) =>
            setState((prev) => ({ ...prev, relationshipStatus }))
          }
          onBack={() => goTo("lifestyle")}
          onFinish={() => goTo("success")}
        />
      );

    case "success":
      return <SuccessScreen name={state.name} onDone={() => onComplete(state)} />;

    default:
      return null;
  }
}
