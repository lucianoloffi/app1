import { useState } from 'react'
import BottomSheet from './BottomSheet'
import RangeSlider from './RangeSlider'
import { RulerIcon } from './Icon'

export default function HeightField({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDraft(value)
          setOpen(true)
        }}
        className="w-full text-left"
      >
        <span className="block text-[13px] font-semibold text-ink-40 mb-1.5">Altura</span>
        <span className="flex items-center gap-2 rounded-xl border border-line-2 bg-white px-4 py-3.5">
          <RulerIcon size={16} color="#5B34C9" />
          <span className="text-[15px] font-semibold">{value.toFixed(2).replace('.', ',')} m</span>
        </span>
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Altura">
        <div className="py-4">
          <div className="text-center text-[22px] font-extrabold text-accent mb-6">
            {draft.toFixed(2).replace('.', ',')} m
          </div>
          <RangeSlider min={1.0} max={2.2} step={0.01} value={draft} onChange={setDraft} />
        </div>
        <button
          type="button"
          onClick={() => {
            onChange(draft)
            setOpen(false)
          }}
          className="w-full py-3.5 rounded-full bg-accent text-white font-bold shadow-primary mb-2"
        >
          Concluído
        </button>
      </BottomSheet>
    </>
  )
}
