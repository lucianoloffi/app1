import { useState } from 'react'
import BottomSheet from './BottomSheet'
import { AddChip, InterestChip } from './Chip'
import { INTERESTS, interestLabel } from '../data/interests'
import { useAppState } from '../state/AppState'

const MAX = 6

export default function InterestsField({
  value,
  onChange,
  min = 3,
}: {
  value: string[]
  onChange: (ids: string[]) => void
  min?: number
}) {
  const [open, setOpen] = useState(false)
  const { showToast } = useAppState()

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id))
      return
    }
    if (value.length >= MAX) {
      showToast('Máximo de 6 interesses')
      return
    }
    onChange([...value, id])
  }

  const missing = Math.max(0, min - value.length)

  return (
    <div>
      <div className="text-[16px] font-bold mb-2.5">
        Interesses{missing > 0 ? ` · mínimo ${min}` : ''}
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map((id) => (
          <InterestChip key={id} label={interestLabel(id)} onRemove={() => toggle(id)} />
        ))}
        <AddChip onClick={() => setOpen(true)} />
      </div>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Seus interesses"
        footer={
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full py-3.5 rounded-full bg-accent text-white font-bold shadow-primary"
          >
            Concluir
          </button>
        }
      >
        <div className="flex items-center justify-between pb-3 sticky top-0 bg-white">
          <span className="text-[13px] font-bold text-accent-2">
            {missing > 0 ? `Escolha ${missing} para o mínimo` : ''}
          </span>
          <span className="text-[13px] font-semibold text-ink-40">{value.length}/{MAX}</span>
        </div>
        <div className="flex flex-wrap gap-2 pb-2">
          {INTERESTS.map((interest) => {
            const selected = value.includes(interest.id)
            return (
              <button
                key={interest.id}
                type="button"
                onClick={() => toggle(interest.id)}
                className={`px-3.5 py-2.5 rounded-full text-[14px] font-semibold border ${
                  selected
                    ? 'bg-accent-soft text-accent-2 border-accent-line'
                    : 'bg-white text-ink-60 border-line-2'
                }`}
              >
                {interest.label}
              </button>
            )
          })}
        </div>
      </BottomSheet>
    </div>
  )
}
