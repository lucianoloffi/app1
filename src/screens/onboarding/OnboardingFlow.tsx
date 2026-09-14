import { useAppState } from '../../state/AppState'
import Step0Welcome from './Step0Welcome'
import Step1Phone from './Step1Phone'
import Step2Code from './Step2Code'
import Step3NameBirthBio from './Step3NameBirthBio'
import Step4GenderCity from './Step4GenderCity'
import Step5Photos from './Step5Photos'
import Step6IntentInterests from './Step6IntentInterests'
import Step7Lifestyle from './Step7Lifestyle'
import Step8ProfessionHeightStatus from './Step8ProfessionHeightStatus'
import OnboardingSuccess from './OnboardingSuccess'

const STEPS = [
  Step0Welcome,
  Step1Phone,
  Step2Code,
  Step3NameBirthBio,
  Step4GenderCity,
  Step5Photos,
  Step6IntentInterests,
  Step7Lifestyle,
  Step8ProfessionHeightStatus,
]

export default function OnboardingFlow() {
  const { obStep, showSuccess } = useAppState()
  const Step = STEPS[obStep] ?? Step0Welcome

  return (
    <div className="relative h-full">
      <Step />
      {showSuccess && <OnboardingSuccess />}
    </div>
  )
}
