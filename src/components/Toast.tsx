import { useAppState } from '../state/AppState'

export default function Toast() {
  const { toast } = useAppState()
  if (!toast) return null
  return (
    <div className="pointer-events-none absolute inset-x-6 bottom-[110px] z-[200] flex justify-center">
      <div className="anim-toast pointer-events-auto max-w-full bg-ink text-white text-[14px] font-semibold px-5 py-3 rounded-2xl shadow-lg text-center">
        {toast}
      </div>
    </div>
  )
}
