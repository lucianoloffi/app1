import { useAppState } from '../../state/AppState'
import { FilterCircleIcon, WifiOffIcon } from '../../components/Icon'

export function QueueExhaustedState() {
  const { resetSeen } = useAppState()
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10 gap-4">
      <div className="w-[150px] h-[150px] rounded-full border-[8px] border-line-3 border-t-accent anim-spin-slow" />
      <h2 className="text-[20px] font-extrabold mt-2">Por hoje é isso</h2>
      <p className="text-[14px] text-ink-60">Você viu todos os perfis disponíveis. Volte mais tarde para ver gente nova.</p>
      <button type="button" onClick={resetSeen} className="mt-2 px-6 py-3 rounded-full bg-accent text-white font-bold shadow-primary">
        Rever os perfis
      </button>
    </div>
  )
}

export function FilteredEmptyState() {
  const { widenFilters, beginEditFilters, filtersSummary } = useAppState()
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10 gap-3">
      <div className="w-24 h-24 rounded-full bg-accent-soft flex items-center justify-center">
        <FilterCircleIcon size={30} color="#5B34C9" />
      </div>
      <h2 className="text-[20px] font-extrabold mt-2">Poucos perfis por aqui</h2>
      <p className="text-[14px] text-ink-60">{filtersSummary}</p>
      <button type="button" onClick={widenFilters} className="mt-2 px-6 py-3 rounded-full bg-accent text-white font-bold shadow-primary">
        Ampliar filtros
      </button>
      <button type="button" onClick={beginEditFilters} className="text-[13px] font-semibold text-ink-40 underline">
        Ajustar manualmente
      </button>
    </div>
  )
}

export function OfflineState() {
  const { toggleOffline } = useAppState()
  return (
    <div className="absolute inset-0 bg-white flex flex-col items-center justify-center text-center px-10 gap-3 z-30">
      <div className="w-24 h-24 rounded-full bg-[#FFF1F1] flex items-center justify-center">
        <WifiOffIcon size={30} color="#C8353C" />
      </div>
      <h2 className="text-[20px] font-extrabold mt-2">Não deu para carregar</h2>
      <p className="text-[14px] text-ink-60">Verifique sua conexão e tente novamente.</p>
      <button type="button" onClick={toggleOffline} className="mt-2 px-6 py-3 rounded-full bg-accent text-white font-bold shadow-primary">
        Tentar de novo
      </button>
    </div>
  )
}
