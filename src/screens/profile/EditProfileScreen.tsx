import { useState } from 'react'
import { useAppState } from '../../state/AppState'
import StatusBar from '../../components/StatusBar'
import InterestsField from '../../components/InterestsField'
import HeightField from '../../components/HeightField'
import RadioSheetField from '../../components/RadioSheetField'
import { ActivityIcon, DrinkIcon, KidsIcon, StatusHeartIcon } from '../../components/Icon'
import type { Activity, Drink, Kids, Lifestyle, Me, RelationshipStatus } from '../../types'

const STATUS_OPTS: { value: RelationshipStatus | null; label: string }[] = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'namorando', label: 'Namorando' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'separado', label: 'Separado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: null, label: 'Prefiro não dizer' },
]
const DRINK_OPTS: { value: Drink | null; label: string }[] = [
  { value: 'nao_bebo', label: 'Não bebo' },
  { value: 'socialmente', label: 'Socialmente' },
  { value: 'frequentemente', label: 'Frequentemente' },
  { value: null, label: 'Prefiro não dizer' },
]
const ACTIVITY_OPTS: { value: Activity | null; label: string }[] = [
  { value: 'todo_dia', label: 'Todo dia' },
  { value: 'algumas_vezes', label: 'Algumas vezes na semana' },
  { value: 'raramente', label: 'Raramente' },
  { value: null, label: 'Prefiro não dizer' },
]
const KIDS_OPTS: { value: Kids | null; label: string }[] = [
  { value: 'tenho', label: 'Tenho' },
  { value: 'nao_tenho', label: 'Não tenho' },
  { value: 'quero_ter', label: 'Quero ter' },
  { value: 'nao_quero', label: 'Não quero' },
  { value: null, label: 'Prefiro não dizer' },
]

export default function EditProfileScreen() {
  const { me, updateMe, myPhotos, closeScreen, openScreen } = useAppState()
  const [form, setForm] = useState<Me>({ ...me })

  const patch = (p: Partial<Me>) => setForm((prev) => ({ ...prev, ...p }))
  const patchLifestyle = (p: Partial<Lifestyle>) => setForm((prev) => ({ ...prev, lifestyle: { ...prev.lifestyle, ...p } }))

  const filledPhotos = myPhotos.filter(Boolean).length

  const save = () => {
    updateMe(form)
    closeScreen()
  }

  return (
    <div className="absolute inset-0 z-[80] bg-white flex flex-col">
      <StatusBar />
      <div className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-line-3">
        <button type="button" onClick={closeScreen} className="text-[15px] font-semibold text-ink-60">
          Cancelar
        </button>
        <h1 className="text-[16px] font-bold">Editar perfil</h1>
        <button type="button" onClick={save} className="text-[15px] font-bold text-accent-2">
          Concluído
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-bg px-5 py-5 flex flex-col gap-4">
        <div className="bg-white rounded-[18px] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[15px] font-bold">Minhas fotos</span>
            <span className="px-2.5 py-1 rounded-full bg-accent-soft text-accent-2 text-[12px] font-bold">{filledPhotos}/6</span>
            <button type="button" onClick={() => openScreen('managePhotos')} className="text-[13px] font-semibold text-accent-2">
              Gerenciar ›
            </button>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {myPhotos.map((photo, i) => {
              const isCover = i === 0
              return (
                <div
                  key={i}
                  className={`relative rounded-xl overflow-hidden bg-[#F6F4FB] border border-[#EDE6FB] ${
                    isCover ? 'col-span-2 row-span-2 aspect-square' : 'aspect-[3/4]'
                  }`}
                >
                  {photo && <img src={photo} alt="" className="w-full h-full object-cover" />}
                  {isCover && photo && (
                    <span className="absolute bottom-1 left-1 right-1 text-center bg-[rgba(22,33,26,.6)] text-white text-[9px] font-bold uppercase tracking-[.05em] rounded py-0.5">
                      Capa
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-[12px] text-ink-60 mt-3">
            {filledPhotos < 3
              ? 'Perfis com pelo menos 3 fotos recebem mais matches.'
              : filledPhotos < 6
                ? `Quanto mais fotos, mais atrativo fica seu perfil. Você ainda pode adicionar ${6 - filledPhotos} fotos.`
                : 'Perfil completo de fotos. Você pode reordenar tornando outra a capa.'}
          </p>
        </div>

        <div className="bg-white rounded-[18px] p-4 flex flex-col gap-4">
          <Field label="Nome" value={form.name} onChange={(v) => patch({ name: v })} />
          <Field label="Localidade" value={form.city} onChange={(v) => patch({ city: v })} />
          <div className="flex gap-3">
            <div className="flex-1">
              <Field label="Nascimento" value={form.birthDate} onChange={(v) => patch({ birthDate: v })} placeholder="dd/mm/aaaa" />
            </div>
            <div className="flex-1">
              <label className="block text-[13px] font-semibold text-ink-40 mb-1.5">Gênero</label>
              <select
                value={form.gender ?? ''}
                onChange={(e) => patch({ gender: (e.target.value || null) as Me['gender'] })}
                className="w-full rounded-xl border border-line-2 bg-white px-3 py-3.5 text-[15px] font-medium outline-none"
              >
                <option value="">—</option>
                <option value="homem">Homem</option>
                <option value="mulher">Mulher</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Field label="Profissão" value={form.profession} onChange={(v) => patch({ profession: v })} />
            </div>
            <div className="flex-1">
              <HeightField value={form.height} onChange={(h) => patch({ height: h })} />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-ink-40 mb-1.5">Sobre você</label>
            <textarea
              value={form.bio}
              onChange={(e) => patch({ bio: e.target.value })}
              className="w-full h-[74px] rounded-xl border border-line-2 bg-white px-4 py-3 text-[15px] font-medium outline-none resize-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-[18px] p-4">
          <InterestsField value={form.interests} onChange={(interests) => patch({ interests })} />
        </div>

        <div className="flex flex-col gap-2.5">
          <RadioSheetField
            icon={<StatusHeartIcon />}
            label="Status de relacionamento"
            title="Status de relacionamento"
            value={form.relationshipStatus}
            options={STATUS_OPTS}
            onChange={(v) => patch({ relationshipStatus: v })}
          />
          <RadioSheetField
            icon={<DrinkIcon />}
            label="Bebida"
            title="Bebida"
            value={form.lifestyle.drink}
            options={DRINK_OPTS}
            onChange={(v) => patchLifestyle({ drink: v })}
          />
          <RadioSheetField
            icon={<ActivityIcon />}
            label="Atividade física"
            title="Atividade física"
            value={form.lifestyle.activity}
            options={ACTIVITY_OPTS}
            onChange={(v) => patchLifestyle({ activity: v })}
          />
          <RadioSheetField
            icon={<KidsIcon />}
            label="Filhos"
            title="Filhos"
            value={form.lifestyle.kids}
            options={KIDS_OPTS}
            onChange={(v) => patchLifestyle({ kids: v })}
          />
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-ink-40 mb-1.5">{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line-2 bg-white px-4 py-3.5 text-[15px] font-medium outline-none focus:border-accent"
      />
    </div>
  )
}
