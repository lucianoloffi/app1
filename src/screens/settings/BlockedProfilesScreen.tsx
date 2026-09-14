import { useAppState } from '../../state/AppState'
import StatusBar from '../../components/StatusBar'
import { ChevronLeftIcon } from '../../components/Icon'

export default function BlockedProfilesScreen() {
  const { closeScreen, blockedProfiles, unblockProfile } = useAppState()

  return (
    <div className="absolute inset-0 z-[90] bg-white flex flex-col">
      <StatusBar />
      <div className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-line-3">
        <button type="button" onClick={closeScreen} className="w-[38px] h-[38px] rounded-full border border-line-2 flex items-center justify-center">
          <ChevronLeftIcon size={18} />
        </button>
        <h1 className="text-[20px] font-extrabold">Perfis bloqueados</h1>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-bg px-5 py-5">
        {blockedProfiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-1">
            <p className="text-[15px] font-bold">Nenhum perfil bloqueado</p>
            <p className="text-[13px] text-ink-60">Perfis que você bloquear aparecem aqui.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden">
            {blockedProfiles.map((b, i) => (
              <div key={b.id} className={`flex items-center gap-3 px-4 py-3.5 ${i !== blockedProfiles.length - 1 ? 'border-b border-line-3' : ''}`}>
                <img src={b.photo} alt={b.name} className="w-11 h-11 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold">{b.name}</div>
                  <div className="text-[12px] text-ink-40">bloqueado {b.since}</div>
                </div>
                <button type="button" onClick={() => unblockProfile(b.id)} className="px-4 py-2 rounded-full border border-line-2 text-[13px] font-bold">
                  Desbloquear
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
