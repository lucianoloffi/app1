import { useState } from 'react'
import type { ReactNode } from 'react'
import BottomSheet from './BottomSheet'
import { ChevronRightIcon } from './Icon'

export interface RadioOption<T> {
  value: T
  label: string
}

export default function RadioSheetField<T extends string | null>({
  icon,
  label,
  title,
  value,
  options,
  onChange,
}: {
  icon: ReactNode
  label: string
  title: string
  value: T
  options: RadioOption<T>[]
  onChange: (v: T) => void
}) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value)
  const isEmpty = current === undefined || current.value === null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 bg-white rounded-xl border-[1.5px] border-line-2 px-3.5 py-[9px] text-left hover:border-[#C4A6F3] transition-colors"
      >
        <span className="w-7 h-7 rounded-[10px] bg-bg border border-[#E2E6DF] flex items-center justify-center text-accent-2 shrink-0">
          {icon}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[12px] font-medium text-ink-40">{label}</span>
          <span className={`block text-[15px] font-semibold truncate ${isEmpty ? 'text-ink-40' : 'text-ink'}`}>
            {current ? current.label : 'Selecionar'}
          </span>
        </span>
        <ChevronRightIcon size={16} color="#8A928B" />
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={title}>
        <div className="flex flex-col gap-1.5 pb-2">
          {options.map((opt) => {
            const active = opt.value === value
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left ${active ? 'bg-[#F4EEFE]' : ''}`}
              >
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    active ? 'border-[#7C43F0]' : 'border-[#C9CFC8]'
                  }`}
                >
                  {active && <span className="w-2.5 h-2.5 rounded-full bg-[#7C43F0]" />}
                </span>
                <span className={`text-[15px] ${active ? 'font-bold text-[#3A1E86]' : 'font-medium text-ink'}`}>
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>
      </BottomSheet>
    </>
  )
}
