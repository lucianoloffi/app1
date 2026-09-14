import { useAppState } from '../../state/AppState'
import OnboardingShell, { StepTitle } from './OnboardingShell'
import { CameraIcon } from '../../components/Icon'

const PLACEHOLDER_POOL = [3, 8, 18, 22, 26, 34, 38, 42]

export default function Step5Photos() {
  const { o, updateO, nextStep } = useAppState()
  const slots = [0, 1, 2, 3]

  const addPhotoAt = (index: number) => {
    if (o.photos[index]) return
    const used = o.photos.length
    const n = PLACEHOLDER_POOL[used % PLACEHOLDER_POOL.length]
    const next = [...o.photos]
    next[index] = `https://i.pravatar.cc/600?img=${n}`
    updateO({ photos: next })
  }

  return (
    <OnboardingShell ctaLabel="Continuar" ctaEnabled={o.photos.filter(Boolean).length >= 3} onCta={nextStep}>
      <StepTitle title="Adicione suas fotos" support="Toque para simular o envio. A primeira foto é a principal." />
      <div className="grid grid-cols-2 gap-3">
        {slots.map((i) => {
          const photo = o.photos[i]
          return (
            <button
              key={i}
              type="button"
              onClick={() => addPhotoAt(i)}
              className="relative aspect-[3/4] rounded-[18px] overflow-hidden flex flex-col items-center justify-center gap-2"
              style={
                photo
                  ? { backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: '#F8F4FF', border: '2px dashed #C4A6F3' }
              }
            >
              {!photo && (
                <>
                  <CameraIcon size={26} color="#5B34C9" />
                  <span className="text-[13px] font-bold text-accent-2">
                    {i === 0 ? 'Foto principal' : 'Adicionar foto'}
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>
    </OnboardingShell>
  )
}
