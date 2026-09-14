import { useAppState } from '../../state/AppState'
import OnboardingShell, { StepTitle } from './OnboardingShell'

export default function Step2Code() {
  const { o, updateO, nextStep } = useAppState()
  const code = o.code.slice(0, 4)

  return (
    <OnboardingShell ctaLabel="Continuar" ctaEnabled={code.length === 4} onCta={nextStep}>
      <StepTitle title="Digite o código" support="Enviamos 4 dígitos por SMS para o seu número." />
      <input
        autoFocus
        inputMode="numeric"
        value={code}
        onChange={(e) => updateO({ code: e.target.value.replace(/\D/g, '').slice(0, 4) })}
        className="w-full text-center rounded-xl border border-line-2 py-4 text-[30px] font-extrabold tracking-[.5em] outline-none focus:border-accent"
      />
      <button
        type="button"
        onClick={() => updateO({ code: '1234' })}
        className="mt-4 block mx-auto text-[13px] font-semibold text-accent-2 underline"
      >
        Preencher código de teste (1234)
      </button>
    </OnboardingShell>
  )
}
