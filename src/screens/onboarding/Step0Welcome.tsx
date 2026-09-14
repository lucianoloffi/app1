import { useAppState } from '../../state/AppState'
import StatusBar from '../../components/StatusBar'
import { HeartIcon } from '../../components/Icon'

export default function Step0Welcome() {
  const { nextStep, goToLogin } = useAppState()

  return (
    <div className="flex flex-col h-full bg-white px-7">
      <StatusBar />
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <div
          className="w-36 h-36 rounded-[36px] flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(150deg,#8B5CF6,#6B2FD6 45%,#4B1FA8)',
            boxShadow: '0 20px 42px -20px rgba(75,31,168,.8)',
          }}
        >
          <HeartIcon size={54} color="#F6F0FF" />
          <span className="font-display font-black text-white text-[40px] leading-none -mt-3">
            lovi
          </span>
        </div>
        <div>
          <h1 className="text-[22px] font-bold leading-snug">
            Para quem procura algo sério, perto de você
          </h1>
          <p className="mt-2 text-[15px] text-ink-60">
            Combine por intenção e interesses, não só por swipe.
          </p>
        </div>
      </div>
      <div className="shrink-0 pb-6 flex flex-col gap-4">
        <button
          type="button"
          onClick={nextStep}
          className="w-full py-[17px] rounded-full bg-accent text-white font-bold text-[16px] shadow-primary"
        >
          Criar conta
        </button>
        <button type="button" onClick={goToLogin} className="text-center text-[14px] font-semibold text-ink-40 underline">
          Já tenho conta
        </button>
      </div>
    </div>
  )
}
