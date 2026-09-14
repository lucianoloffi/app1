import type { ReactNode } from 'react'

export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-[390px] h-[844px] bg-white rounded-[40px] shadow-[0_30px_60px_-20px_rgba(15,40,25,.45)] overflow-hidden ring-1 ring-black/5">
      <div className="absolute inset-0 flex flex-col">{children}</div>
    </div>
  )
}
