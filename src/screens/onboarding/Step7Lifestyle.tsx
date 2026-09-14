import { useAppState } from '../../state/AppState'
import OnboardingShell, { StepTitle } from './OnboardingShell'
import { Chip } from '../../components/Chip'
import { ActivityIcon, DrinkIcon, KidsIcon } from '../../components/Icon'
import type { Activity, Drink, Kids } from '../../types'

const DRINK_OPTS: { value: Drink; label: string }[] = [
  { value: 'nao_bebo', label: 'Não bebo' },
  { value: 'socialmente', label: 'Socialmente' },
  { value: 'frequentemente', label: 'Frequentemente' },
]
const ACTIVITY_OPTS: { value: Activity; label: string }[] = [
  { value: 'todo_dia', label: 'Todo dia' },
  { value: 'algumas_vezes', label: 'Algumas vezes na semana' },
  { value: 'raramente', label: 'Raramente' },
]
const KIDS_OPTS: { value: Kids; label: string }[] = [
  { value: 'tenho', label: 'Tenho' },
  { value: 'nao_tenho', label: 'Não tenho' },
  { value: 'quero_ter', label: 'Quero ter' },
  { value: 'nao_quero', label: 'Não quero' },
]

function Block({
  icon,
  title,
  options,
  value,
  onChange,
}: {
  icon: React.ReactNode
  title: string
  options: { value: string; label: string }[]
  value: string | null
  onChange: (v: string) => void
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="w-7 h-7 rounded-[10px] bg-bg border border-[#E2E6DF] flex items-center justify-center text-accent-2">
          {icon}
        </span>
        <span className="text-[12px] font-bold uppercase tracking-[.08em] text-accent-2">{title}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <Chip key={opt.value} selected={value === opt.value} onClick={() => onChange(opt.value)}>
            {opt.label}
          </Chip>
        ))}
      </div>
    </div>
  )
}

export default function Step7Lifestyle() {
  const { o, updateO, nextStep } = useAppState()

  return (
    <OnboardingShell ctaLabel="Continuar" ctaEnabled onCta={nextStep}>
      <StepTitle title="Estilo de vida" />
      <div className="flex flex-col gap-[30px]">
        <Block
          icon={<DrinkIcon />}
          title="Bebida"
          options={DRINK_OPTS}
          value={o.lifestyle.drink}
          onChange={(v) => updateO({ lifestyle: { ...o.lifestyle, drink: v as Drink } })}
        />
        <Block
          icon={<ActivityIcon />}
          title="Atividade física"
          options={ACTIVITY_OPTS}
          value={o.lifestyle.activity}
          onChange={(v) => updateO({ lifestyle: { ...o.lifestyle, activity: v as Activity } })}
        />
        <Block
          icon={<KidsIcon />}
          title="Filhos"
          options={KIDS_OPTS}
          value={o.lifestyle.kids}
          onChange={(v) => updateO({ lifestyle: { ...o.lifestyle, kids: v as Kids } })}
        />
      </div>
      <button type="button" onClick={nextStep} className="block mx-auto mt-[18px] text-[14px] font-semibold text-ink-40 underline">
        Preencher depois
      </button>
    </OnboardingShell>
  )
}
