import { useState } from 'react'
import { useAppState } from '../../state/AppState'
import StatusBar from '../../components/StatusBar'
import { ChevronLeftIcon } from '../../components/Icon'

type Status = 'Permitido' | 'Bloqueado' | 'Pendente'

const ITEMS: { key: string; label: string; status: Status }[] = [
  { key: 'loc', label: 'Localização', status: 'Permitido' },
  { key: 'notif', label: 'Notificações', status: 'Permitido' },
  { key: 'cam', label: 'Câmera', status: 'Pendente' },
]

export default function PermissionsScreen() {
  const { closeScreen } = useAppState()
  const [statuses, setStatuses] = useState<Record<string, Status>>(
    Object.fromEntries(ITEMS.map((i) => [i.key, i.status])),
  )
  const [dialogKey, setDialogKey] = useState<string | null>(null)

  const badgeColor = (s: Status) =>
    s === 'Permitido' ? 'bg-accent-soft text-accent-2' : s === 'Bloqueado' ? 'bg-[#FDECEC] text-destructive' : 'bg-bg text-ink-40'

  return (
    <div className="absolute inset-0 z-[90] bg-white flex flex-col">
      <StatusBar />
      <div className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-line-3">
        <button type="button" onClick={closeScreen} className="w-[38px] h-[38px] rounded-full border border-line-2 flex items-center justify-center">
          <ChevronLeftIcon size={18} />
        </button>
        <h1 className="text-[20px] font-extrabold">Permissões do app</h1>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-bg px-5 py-5 flex flex-col gap-3">
        {ITEMS.map((item) => (
          <div key={item.key} className="bg-white rounded-2xl px-4 py-4 flex items-center justify-between">
            <div>
              <div className="text-[15px] font-bold">{item.label}</div>
              <span className={`inline-block mt-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${badgeColor(statuses[item.key])}`}>
                {statuses[item.key]}
              </span>
            </div>
            {statuses[item.key] !== 'Permitido' && (
              <button
                type="button"
                onClick={() => setDialogKey(item.key)}
                className="px-4 py-2.5 rounded-full bg-accent text-white text-[13px] font-bold"
              >
                Solicitar
              </button>
            )}
          </div>
        ))}
      </div>

      {dialogKey && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[rgba(14,18,15,.42)] px-8">
          <div className="anim-pop bg-white rounded-2xl p-6 w-full max-w-[280px] text-center">
            <p className="text-[15px] font-bold mb-1">Permitir acesso?</p>
            <p className="text-[13px] text-ink-60 mb-5">O Lovi gostaria de acessar este recurso do seu dispositivo.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStatuses((s) => ({ ...s, [dialogKey]: 'Bloqueado' }))
                  setDialogKey(null)
                }}
                className="flex-1 py-3 rounded-full border border-line-2 text-[14px] font-bold"
              >
                Não permitir
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatuses((s) => ({ ...s, [dialogKey]: 'Permitido' }))
                  setDialogKey(null)
                }}
                className="flex-1 py-3 rounded-full bg-accent text-white text-[14px] font-bold"
              >
                Permitir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
