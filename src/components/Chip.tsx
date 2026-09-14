import type { ReactNode } from 'react'

export function Chip({
  selected,
  onClick,
  children,
  disabled,
}: {
  selected: boolean
  onClick?: () => void
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 rounded-full text-[14px] font-semibold border transition-colors ${
        selected
          ? 'bg-accent-soft text-accent-2 border-accent-line'
          : 'bg-white text-ink-60 border-line-2'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      {children}
    </button>
  )
}

export function InterestChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 pl-3.5 pr-2 py-2 rounded-full text-[13px] font-semibold bg-[#F8F5FE] border border-[#EDE6FB] text-accent-2">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover ${label}`}
        className="w-4 h-4 rounded-full bg-[#E7DCFC] flex items-center justify-center text-accent-2 text-[10px] leading-none"
      >
        ×
      </button>
    </span>
  )
}

export function AddChip({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 rounded-full text-[13px] font-semibold bg-white border border-accent-line text-accent-2"
    >
      + Adicionar
    </button>
  )
}
