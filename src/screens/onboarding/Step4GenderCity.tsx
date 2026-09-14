import { useMemo, useState } from 'react'
import { useAppState } from '../../state/AppState'
import OnboardingShell, { FieldLabel, StepTitle, TextInput } from './OnboardingShell'
import { Chip } from '../../components/Chip'
import type { Gender, SeekingGender } from '../../types'

const CITIES = [
  'Joinville, SC',
  'Jaraguá do Sul, SC',
  'Blumenau, SC',
  'Florianópolis, SC',
  'Curitiba, PR',
  'São Paulo, SP',
  'Balneário Camboriú, SC',
  'Itajaí, SC',
]

export default function Step4GenderCity() {
  const { o, updateO, nextStep } = useAppState()
  const [showSuggestions, setShowSuggestions] = useState(false)

  const suggestions = useMemo(() => {
    if (o.city.trim().length < 3) return []
    return CITIES.filter((c) => c.toLowerCase().includes(o.city.toLowerCase())).slice(0, 4)
  }, [o.city])

  const canProceed = !!o.sou && !!o.meInteressoEm && o.city.trim().length > 2

  const souOptions: { value: Gender; label: string }[] = [
    { value: 'homem', label: 'Homem' },
    { value: 'mulher', label: 'Mulher' },
    { value: 'outro', label: 'Outro' },
  ]
  const interesseOptions: { value: SeekingGender; label: string }[] = [
    { value: 'homens', label: 'Homens' },
    { value: 'mulheres', label: 'Mulheres' },
    { value: 'todos', label: 'Todos' },
  ]

  return (
    <OnboardingShell ctaLabel="Continuar" ctaEnabled={canProceed} onCta={nextStep}>
      <StepTitle title="Sobre você" />
      <div className="flex flex-col gap-6">
        <div>
          <div className="text-[16px] font-bold mb-2.5">Sou</div>
          <div className="flex flex-wrap gap-2">
            {souOptions.map((opt) => (
              <Chip key={opt.value} selected={o.sou === opt.value} onClick={() => updateO({ sou: opt.value })}>
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[16px] font-bold mb-2.5">Me interesso em</div>
          <div className="flex flex-wrap gap-2">
            {interesseOptions.map((opt) => (
              <Chip
                key={opt.value}
                selected={o.meInteressoEm === opt.value}
                onClick={() => updateO({ meInteressoEm: opt.value })}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>
        <div className="relative">
          <FieldLabel>Cidade</FieldLabel>
          <TextInput
            placeholder="Sua cidade"
            value={o.city}
            onChange={(e) => {
              updateO({ city: e.target.value })
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white rounded-xl border border-line-2 shadow-lg overflow-hidden">
              {suggestions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    updateO({ city: c })
                    setShowSuggestions(false)
                  }}
                  className="w-full text-left px-4 py-3 text-[14px] font-medium border-b border-line-3 last:border-0 hover:bg-bg"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </OnboardingShell>
  )
}
