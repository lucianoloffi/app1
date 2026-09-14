import { useAppState } from '../../state/AppState'
import OnboardingShell, { StepTitle } from './OnboardingShell'

export default function Step1Phone() {
  const { o, updateO, nextStep } = useAppState()
  const digits = o.phone.replace(/\D/g, '')

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 2) return d
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }

  return (
    <OnboardingShell ctaLabel="Continuar" ctaEnabled={digits.length >= 10} onCta={nextStep} showBack={false}>
      <StepTitle title="Qual seu número?" support="Enviamos um código por SMS. Seu número nunca aparece no perfil." />
      <div className="flex gap-2">
        <div className="w-[58px] h-[54px] rounded-xl border border-line-2 flex items-center justify-center font-bold text-[15px] shrink-0">
          +55
        </div>
        <input
          autoFocus
          inputMode="numeric"
          placeholder="(47) 99988-7766"
          value={formatPhone(o.phone)}
          onChange={(e) => updateO({ phone: e.target.value })}
          className="flex-1 rounded-xl border border-line-2 px-4 text-[17px] font-semibold outline-none focus:border-accent"
        />
      </div>
    </OnboardingShell>
  )
}
