import { useAppState } from '../../state/AppState'
import StatusBar from '../../components/StatusBar'
import { ChevronRightIcon, SlidersIcon } from '../../components/Icon'
import CompletenessRing from './CompletenessRing'

export default function ProfileTabScreen() {
  const { me, myAge, myPhotos, completeness, openScreen, chats, seenCount, filtersSummary, deleteAccount } = useAppState()
  const conversas = chats.filter((c) => c.messages.length > 0).length

  return (
    <div className="flex flex-col h-full bg-white">
      <StatusBar />
      <button type="button" onClick={() => openScreen('edit')} className="shrink-0 flex items-center gap-4 px-6 pt-4 pb-5 text-left">
        <CompletenessRing percent={completeness.percent} photo={myPhotos[0]} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[22px] font-extrabold truncate">{me.name || 'Você'}</span>
            {me.verified && <span className="text-accent-2 text-[13px] font-bold">✓</span>}
          </div>
          <div className="text-[14px] text-ink-60">
            {me.city}
            {myAge > 0 ? ` · ${myAge}` : ''}
          </div>
          <div className="text-[12px] font-medium text-ink-40 mt-1">{completeness.missingText}</div>
        </div>
        <ChevronRightIcon size={18} color="#8A928B" />
      </button>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-bg px-5 py-5 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label={chats.length === 1 ? 'match' : 'matches'} value={chats.length} />
          <MetricCard label={conversas === 1 ? 'conversa' : 'conversas'} value={conversas} />
          <MetricCard label={seenCount === 1 ? 'perfil visto' : 'perfis vistos'} value={seenCount} />
        </div>

        <button
          type="button"
          onClick={() => openScreen('filters')}
          className="w-full bg-white rounded-2xl px-4 py-4 flex items-center gap-3 text-left"
        >
          <span className="w-[42px] h-[42px] rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
            <SlidersIcon size={19} color="#5B34C9" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold">Filtros de busca</div>
            <div className="text-[13px] text-ink-60 truncate">{filtersSummary}</div>
          </div>
          <ChevronRightIcon size={18} color="#8A928B" />
        </button>

        <div className="bg-white rounded-2xl overflow-hidden">
          <Row label="Verificar meu perfil" />
          <Row label="Configurações e privacidade" onClick={() => openScreen('settings')} />
          <Row label="Sair da conta" destructive onClick={deleteAccount} last />
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl py-4 flex flex-col items-center gap-0.5">
      <span className="text-[20px] font-extrabold">{value}</span>
      <span className="text-[11px] font-medium text-ink-60 text-center">{label}</span>
    </div>
  )
}

function Row({
  label,
  onClick,
  destructive,
  last,
}: {
  label: string
  onClick?: () => void
  destructive?: boolean
  last?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-4 text-left ${!last ? 'border-b border-line-3' : ''}`}
    >
      <span className={`text-[15px] font-semibold ${destructive ? 'text-destructive' : 'text-ink'}`}>{label}</span>
      {!destructive && <ChevronRightIcon size={18} color="#8A928B" />}
    </button>
  )
}
