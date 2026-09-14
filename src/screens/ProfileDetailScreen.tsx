import { useAppState } from '../state/AppState'
import { ChevronLeftIcon, HeartIcon, XIcon } from '../components/Icon'
import { INTENT_LABEL, ACTIVITY_LABEL, DRINK_LABEL, KIDS_LABEL, STATUS_LABEL } from '../data/labels'
import { interestLabel } from '../data/interests'

export default function ProfileDetailScreen() {
  const { detail, closeDetail, commonInterests, otherInterests, likeCurrent, dislikeCurrent, openReport } = useAppState()
  if (!detail) return null
  const { profile, from } = detail

  const common = commonInterests(profile)
  const other = otherInterests(profile)

  const lifestyleRows: { label: string; value: string }[] = [
    { label: 'Status de relacionamento', value: STATUS_LABEL[profile.relationshipStatus] },
    ...(profile.lifestyle.drink ? [{ label: 'Bebida', value: DRINK_LABEL[profile.lifestyle.drink] }] : []),
    ...(profile.lifestyle.activity ? [{ label: 'Atividade física', value: ACTIVITY_LABEL[profile.lifestyle.activity] }] : []),
    ...(profile.lifestyle.kids ? [{ label: 'Filhos', value: KIDS_LABEL[profile.lifestyle.kids] }] : []),
    { label: 'Altura', value: `${profile.height.toFixed(2).replace('.', ',')} m` },
  ]

  return (
    <div className="absolute inset-0 z-[90] bg-white flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <div className="relative h-[230px] shrink-0">
          <img src={profile.photos[0]} alt={profile.name} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={closeDetail}
            className="absolute top-[26px] left-4 w-[38px] h-[38px] rounded-full bg-[rgba(22,33,26,.55)] backdrop-blur flex items-center justify-center"
          >
            <ChevronLeftIcon size={18} color="#fff" />
          </button>
          <span className="absolute top-[26px] right-4 h-[34px] px-3 rounded-full bg-[rgba(22,33,26,.72)] text-white text-[11px] font-bold flex items-center">
            {INTENT_LABEL[profile.intent]}
          </span>
        </div>

        <div className="px-6 py-[18px] flex flex-col gap-[18px] pb-28">
          <div>
            <h1 className="text-[26px] font-extrabold">
              {profile.name}, {profile.age}
            </h1>
            <p className="text-[14px] text-ink-60 mt-0.5">
              {profile.profession} · {profile.city}
            </p>
          </div>

          {profile.bio && <p className="text-[15px] text-ink leading-relaxed">{profile.bio}</p>}

          {profile.prompt.answer && (
            <div className="bg-bg rounded-2xl px-4 py-3.5">
              <div className="text-[12px] font-bold uppercase tracking-[.08em] text-ink-40">{profile.prompt.label}</div>
              <div className="text-[15px] font-medium mt-1">{profile.prompt.answer}</div>
            </div>
          )}

          <div>
            <div className="text-[13px] font-bold uppercase tracking-[.08em] text-ink-40 mb-2.5">Interesses</div>
            <div className="flex flex-wrap gap-2">
              {common.map((id) => (
                <span key={id} className="px-3.5 py-2 rounded-full text-[14px] font-semibold bg-[#E4D6FE] text-[#4A25A8] border border-[#C9AEF9]">
                  {interestLabel(id)}
                </span>
              ))}
              {other.map((id) => (
                <span key={id} className="px-3.5 py-2 rounded-full text-[14px] font-semibold bg-[#F7F4FD] text-[#655291] border border-[#ECE6F8]">
                  {interestLabel(id)}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[13px] font-bold uppercase tracking-[.08em] text-ink-40 mb-2.5">Estilo de vida</div>
            <div className="flex flex-col divide-y divide-line-3">
              {lifestyleRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between py-3">
                  <span className="text-[14px] font-medium text-ink-60">{row.label}</span>
                  <span className="text-[14px] font-semibold">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => openReport(profile.id, profile.name)}
            className="text-[13px] font-semibold text-ink-40 underline self-start"
          >
            Denunciar {profile.name}
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5 bg-white border-t border-line-3">
        {from === 'chat' ? (
          <button
            type="button"
            onClick={closeDetail}
            className="w-full py-3.5 rounded-full bg-accent text-white font-bold shadow-primary"
          >
            Voltar à conversa
          </button>
        ) : (
          <div className="flex items-center justify-center gap-7">
            <button
              type="button"
              onClick={() => {
                dislikeCurrent()
                closeDetail()
              }}
              className="w-[60px] h-[60px] rounded-full bg-white border border-line flex items-center justify-center"
            >
              <XIcon size={26} color="#16211A" />
            </button>
            <button
              type="button"
              onClick={() => {
                likeCurrent()
                closeDetail()
              }}
              className="w-[76px] h-[76px] rounded-full bg-coral flex items-center justify-center shadow-like"
            >
              <HeartIcon size={32} color="#fff" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
