import type { ReactNode } from 'react'
import { useAppState } from '../../state/AppState'
import ProgressBar from '../../components/ProgressDots'
import StatusBar from '../../components/StatusBar'
import { ChevronLeftIcon } from '../../components/Icon'

export default function OnboardingShell({
  children,
  ctaLabel,
  ctaEnabled = true,
  onCta,
  showBack = true,
  showProgress = true,
}: {
  children: ReactNode
  ctaLabel: string
  ctaEnabled?: boolean
  onCta: () => void
  showBack?: boolean
  showProgress?: boolean
}) {
  const { obStep, prevStep, goToLogin } = useAppState()

  return (
    <div className="flex flex-col h-full bg-white">
      <StatusBar />
      {showProgress && <ProgressBar step={obStep} total={9} />}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-7 pt-6">{children}</div>
      <div className="shrink-0 px-7 pb-6 pt-3 flex items-center gap-3">
        {showBack && (
          <button
            type="button"
            onClick={prevStep}
            className="w-12 h-12 rounded-full border border-line-2 flex items-center justify-center shrink-0"
          >
            <ChevronLeftIcon size={20} />
          </button>
        )}
        <button
          type="button"
          disabled={!ctaEnabled}
          onClick={onCta}
          className={`flex-1 py-[17px] rounded-full font-bold text-[16px] transition-colors ${
            ctaEnabled ? 'bg-accent text-white shadow-primary' : 'bg-line-3 text-[#A9B0A9]'
          }`}
        >
          {ctaLabel}
        </button>
      </div>
      <button
        type="button"
        onClick={goToLogin}
        className="shrink-0 pb-6 text-center text-[14px] font-semibold text-ink-40 underline"
      >
        Já tenho conta
      </button>
    </div>
  )
}

export function StepTitle({ title, support }: { title: string; support?: string }) {
  return (
    <div className="mb-7">
      <h1 className="text-[28px] font-extrabold tracking-[-.025em] leading-tight">{title}</h1>
      {support && <p className="mt-2 text-[15px] text-ink-60">{support}</p>}
    </div>
  )
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="block text-[13px] font-semibold text-ink-40 mb-1.5">{children}</label>
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-line-2 bg-white px-4 py-3.5 text-[15px] font-medium outline-none focus:border-accent placeholder:text-ink-40/70"
    />
  )
}
