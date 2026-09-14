import { useAppState } from '../../state/AppState'
import OnboardingShell, { FieldLabel, StepTitle, TextInput } from './OnboardingShell'
import { Chip } from '../../components/Chip'
import RangeSlider from '../../components/RangeSlider'
import type { RelationshipStatus } from '../../types'

const STATUS_OPTS: { value: RelationshipStatus; label: string }[] = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'namorando', label: 'Namorando' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'separado', label: 'Separado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
]

export default function Step8ProfessionHeightStatus() {
  const { o, updateO, finishOnboarding } = useAppState()

  return (
    <OnboardingShell ctaLabel="Concluir cadastro" ctaEnabled onCta={finishOnboarding}>
      <StepTitle title="Só mais um pouco" />
      <div className="flex flex-col gap-7">
        <div>
          <FieldLabel>Qual sua profissão</FieldLabel>
          <TextInput
            placeholder="ex: arquiteta, professor, autônomo"
            value={o.profession}
            onChange={(e) => updateO({ profession: e.target.value })}
          />
        </div>
        <div>
          <div className="text-[16px] font-bold mb-2.5">Altura</div>
          <RangeSlider min={1.0} max={2.2} step={0.01} value={o.height} onChange={(v) => updateO({ height: v })} />
          <div className="flex justify-end mt-2">
            <input
              value={o.height.toFixed(2).replace('.', ',') + ' m'}
              onChange={(e) => {
                const n = Number(e.target.value.replace(',', '.').replace(/[^0-9.]/g, ''))
                if (!Number.isNaN(n)) updateO({ height: Math.min(2.2, Math.max(1.0, n)) })
              }}
              className="w-[88px] text-center rounded-lg border border-line-2 py-2 text-[14px] font-bold"
            />
          </div>
        </div>
        <div>
          <div className="text-[16px] font-bold mb-2.5">Status de relacionamento</div>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTS.map((opt) => (
              <Chip
                key={opt.value}
                selected={o.relationshipStatus === opt.value}
                onClick={() => updateO({ relationshipStatus: opt.value })}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>
        <p className="text-[13px] text-ink-60 -mt-3">Arraste ou digite. Você pode mudar depois no seu perfil.</p>
      </div>
      <button
        type="button"
        onClick={finishOnboarding}
        className="block mx-auto mt-5 mb-2 text-[14px] font-semibold text-ink-40 underline"
      >
        Preencher depois
      </button>
    </OnboardingShell>
  )
}
