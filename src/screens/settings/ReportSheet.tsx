import BottomSheet from '../../components/BottomSheet'
import { useAppState } from '../../state/AppState'

const REASONS = [
  'Fotos falsas ou de outra pessoa',
  'Comportamento ofensivo',
  'Golpe ou pedido de dinheiro',
  'Perfil de menor de idade',
  'Outro motivo',
]

export default function ReportSheet() {
  const { reportTarget, closeReport, submitReport } = useAppState()

  return (
    <BottomSheet open={!!reportTarget} onClose={closeReport} title={reportTarget ? `Denunciar ${reportTarget.name}` : ''}>
      <p className="text-[13px] text-ink-60 mb-4">A denúncia é anônima. Nossa equipe analisa em até 24h.</p>
      <div className="flex flex-col gap-1.5 pb-2">
        {REASONS.map((reason) => (
          <button
            key={reason}
            type="button"
            onClick={submitReport}
            className="text-left rounded-xl px-3.5 py-3.5 border border-line-3 text-[14px] font-medium"
          >
            {reason}
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}
