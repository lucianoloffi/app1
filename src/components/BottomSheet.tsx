import type { ReactNode } from 'react'
import { XIcon } from './Icon'

export default function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  maxHeight = '80%',
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  maxHeight?: string
}) {
  if (!open) return null
  return (
    <div className="absolute inset-0 z-[120] flex flex-col justify-end">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(14,18,15,.42)]"
      />
      <div
        className="anim-sheet-up relative bg-white rounded-t-[24px] flex flex-col overflow-hidden"
        style={{ maxHeight }}
      >
        {title && (
          <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
            <h3 className="text-[17px] font-extrabold">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="w-[30px] h-[30px] rounded-full bg-bg flex items-center justify-center"
            >
              <XIcon size={14} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto no-scrollbar px-6 pb-4 flex-1">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-line-3 shrink-0">{footer}</div>}
      </div>
    </div>
  )
}
