import { useAppState } from '../../state/AppState'
import { CheckIcon } from '../../components/Icon'

export default function OnboardingSuccess() {
  const { o } = useAppState()
  return (
    <div className="absolute inset-0 z-[300] bg-white flex flex-col items-center justify-center gap-5 text-center px-10">
      <div className="anim-pop w-[118px] h-[118px] rounded-full bg-accent flex items-center justify-center">
        <CheckIcon size={54} color="#fff" />
      </div>
      <h1 className="text-[26px] font-extrabold">Conta criada!</h1>
      <p className="text-[15px] text-ink-60">
        {o.name ? `Bem-vindo(a) ao lovi, ${o.name}.` : 'Bem-vindo(a) ao lovi.'}
      </p>
      <div className="flex gap-1.5 mt-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-accent anim-typing-dot"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
