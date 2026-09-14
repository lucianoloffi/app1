import { useAppState } from '../../state/AppState'
import OnboardingShell, { StepTitle } from './OnboardingShell'
import InterestsField from '../../components/InterestsField'
import type { Intent } from '../../types'

const INTENTS: { value: Intent; title: string; subtitle: string }[] = [
  { value: 'serio', title: 'Relacionamento sério', subtitle: 'Busco algo pra construir com o tempo' },
  { value: 'conhecer', title: 'Conhecer pessoas', subtitle: 'Sem pressa, só trocando ideia' },
  { value: 'amizade', title: 'Amizade', subtitle: 'Gente nova pra somar' },
]

export default function Step6IntentInterests() {
  const { o, updateO, nextStep } = useAppState()
  const canProceed = !!o.intent && o.interests.length >= 3

  return (
    <OnboardingShell ctaLabel="Continuar" ctaEnabled={canProceed} onCta={nextStep}>
      <StepTitle title="Intenção e interesses" />
      <div className="text-[12px] font-bold uppercase tracking-[.08em] text-ink-40 mb-2.5">
        O que você busca
      </div>
      <div className="flex flex-col gap-2.5 mb-6">
        {INTENTS.map((opt) => {
          const active = o.intent === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateO({ intent: opt.value })}
              className={`text-left rounded-2xl px-4 py-3.5 border transition-colors ${
                active ? 'bg-ink border-ink' : 'bg-white border-line-2'
              }`}
            >
              <div className={`text-[15px] font-bold ${active ? 'text-white' : 'text-ink'}`}>{opt.title}</div>
              <div className={`text-[13px] mt-0.5 ${active ? 'text-[#B8C0B8]' : 'text-ink-60'}`}>{opt.subtitle}</div>
            </button>
          )
        })}
      </div>
      <InterestsField value={o.interests} onChange={(interests) => updateO({ interests })} />
    </OnboardingShell>
  )
}
