import { useState } from "react";
import type { Gender, Intention, OnboardingState, OnboardingStep } from "../types";
import { MAX_INTERESTS } from "./constants";
import { AboutIntentionInterestsScreen } from "./screens/AboutIntentionInterestsScreen";
import { CodeScreen } from "./screens/CodeScreen";
import { GenderInterestCityScreen } from "./screens/GenderInterestCityScreen";
import { NameBirthdateScreen } from "./screens/NameBirthdateScreen";
import { PhoneScreen } from "./screens/PhoneScreen";
import { PhotosScreen } from "./screens/PhotosScreen";
import { SuccessScreen } from "./screens/SuccessScreen";
import { WelcomeScreen } from "./screens/WelcomeScreen";

const INITIAL_STATE: OnboardingState = {
  step: "welcome",
  phone: "",
  code: "",
  name: "",
  birthdate: "",
  gender: null,
  interestedIn: null,
  city: "",
  photos: [null, null, null, null],
  bio: "",
  intention: null,
  interests: [],
};

interface OnboardingFlowProps {
  onComplete: (state: OnboardingState) => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [state, setState] = useState<OnboardingState>(INITIAL_STATE);

  function goTo(step: OnboardingStep) {
    setState((prev) => ({ ...prev, step }));
  }

  switch (state.step) {
    case "welcome":
      return (
        <WelcomeScreen onCreateAccount={() => goTo("phone")} onHaveAccount={() => goTo("phone")} />
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
          onChangeName={(name) => setState((prev) => ({ ...prev, name }))}
          onChangeBirthdate={(birthdate) => setState((prev) => ({ ...prev, birthdate }))}
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
          onChangeInterestedIn={(interestedIn: Gender) =>
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
          onNext={() => goTo("about-intention-interests")}
        />
      );

    case "about-intention-interests":
      return (
        <AboutIntentionInterestsScreen
          bio={state.bio}
          intention={state.intention}
          interests={state.interests}
          onChangeBio={(bio) => setState((prev) => ({ ...prev, bio }))}
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
          onBack={() => goTo("photos")}
          onFinish={() => goTo("success")}
        />
      );

    case "success":
      return <SuccessScreen name={state.name} onDone={() => onComplete(state)} />;

    default:
      return null;
  }
}
