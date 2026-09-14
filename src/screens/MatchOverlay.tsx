import { useAppState } from '../state/AppState'
import { HeartIcon } from '../components/Icon'
import { DEMO_PHOTOS } from '../data/defaults'

export default function MatchOverlay() {
  const { matchedProfile, closeMatch, goToMatchChat } = useAppState()
  if (!matchedProfile) return null

  const myPhoto = DEMO_PHOTOS.find(Boolean) ?? DEMO_PHOTOS[0]

  return (
    <div className="absolute inset-0 z-[250] bg-[rgba(12,20,14,.82)] flex flex-col items-center justify-center text-center px-8 overflow-hidden">
      <div className="anim-halo absolute w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,.55),transparent_70%)]" />

      <div className="relative anim-beat-in">
        <div className="anim-heart-loop drop-shadow-[0_0_40px_rgba(139,92,246,.9)]">
          <HeartIcon size={180} color="#8B5CF6" />
        </div>
      </div>

      <h1
        className="font-display font-black text-white text-[38px] mt-2 anim-cascade"
        style={{ textShadow: '0 6px 30px rgba(139,92,246,.8)', animationDelay: '150ms' }}
      >
        deu match!
      </h1>

      <div className="flex items-center mt-6 anim-cascade" style={{ animationDelay: '200ms' }}>
        <img src={myPhoto ?? undefined} alt="Você" className="w-[76px] h-[76px] rounded-full object-cover border-4 border-white -mr-[18px]" />
        <img
          src={matchedProfile.photos[0]}
          alt={matchedProfile.name}
          className="w-[76px] h-[76px] rounded-full object-cover border-4 border-white"
        />
      </div>

      <p className="text-white/85 text-[15px] mt-4 anim-cascade" style={{ animationDelay: '300ms' }}>
        Você e {matchedProfile.name} curtiram um ao outro.
      </p>

      <div className="flex flex-col items-center gap-3 mt-8 w-full anim-cascade" style={{ animationDelay: '300ms' }}>
        <button type="button" onClick={goToMatchChat} className="w-full py-3.5 rounded-full bg-accent text-white font-bold shadow-primary">
          Abrir conversa
        </button>
        <button type="button" onClick={closeMatch} className="text-[14px] font-semibold text-white/80 underline">
          Continuar vendo perfis
        </button>
      </div>
    </div>
  )
}
