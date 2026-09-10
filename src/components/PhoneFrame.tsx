import type { ReactNode } from "react"

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white text-neutral-900 sm:h-[844px] sm:max-h-[92vh] sm:w-[390px] sm:rounded-[44px] sm:border-8 sm:border-neutral-900 sm:shadow-2xl">
      <div className="relative flex h-full min-h-0 flex-col">{children}</div>
    </div>
  )
}
