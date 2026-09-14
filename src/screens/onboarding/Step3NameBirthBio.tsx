import { useAppState } from '../../state/AppState'
import OnboardingShell, { FieldLabel, StepTitle, TextInput } from './OnboardingShell'

export default function Step3NameBirthBio() {
  const { o, updateO, nextStep } = useAppState()

  const formatBirth = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 8)
    if (d.length <= 2) return d
    if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
    return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
  }

  const birthDigits = o.birthDate.replace(/\D/g, '')
  const canProceed = o.name.trim().length > 1 && birthDigits.length >= 8 && o.bio.trim().length > 4

  return (
    <OnboardingShell ctaLabel="Continuar" ctaEnabled={canProceed} onCta={nextStep}>
      <StepTitle title="Como podemos te chamar?" />
      <div className="flex flex-col gap-4">
        <div>
          <FieldLabel>Nome</FieldLabel>
          <TextInput autoFocus placeholder="Seu nome" value={o.name} onChange={(e) => updateO({ name: e.target.value })} />
        </div>
        <div>
          <FieldLabel>Data de nascimento</FieldLabel>
          <TextInput
            inputMode="numeric"
            placeholder="dd/mm/aaaa"
            value={formatBirth(o.birthDate)}
            onChange={(e) => updateO({ birthDate: e.target.value })}
          />
          <p className="mt-1.5 text-[13px] text-ink-60">Mostramos só a idade, nunca a data completa.</p>
        </div>
        <div>
          <FieldLabel>Sobre você</FieldLabel>
          <textarea
            placeholder="Uma frase sobre o que você procura"
            value={o.bio}
            onChange={(e) => updateO({ bio: e.target.value })}
            className="w-full h-24 rounded-xl border border-line-2 bg-white px-4 py-3 text-[15px] font-medium outline-none focus:border-accent resize-none"
          />
        </div>
      </div>
    </OnboardingShell>
  )
}
