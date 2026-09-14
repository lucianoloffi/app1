import { useState } from 'react'
import { useAppState } from '../../state/AppState'
import StatusBar from '../../components/StatusBar'
import { CameraIcon, ChevronLeftIcon } from '../../components/Icon'

const POOL = [3, 8, 18, 22, 26, 34, 38, 42, 50, 55]

export default function ManagePhotosScreen() {
  const { myPhotos, setMyPhotos, closeScreen, simulateUpload, showToast } = useAppState()
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [failedIndex, setFailedIndex] = useState<number | null>(null)

  const upload = async (index: number) => {
    setFailedIndex(null)
    setUploadingIndex(index)
    const ok = await simulateUpload()
    setUploadingIndex(null)
    if (!ok) {
      setFailedIndex(index)
      return
    }
    const n = POOL[index % POOL.length]
    const next = [...myPhotos]
    next[index] = `https://i.pravatar.cc/600?img=${n}`
    setMyPhotos(next)
  }

  const remove = (index: number) => {
    const next = [...myPhotos]
    next[index] = null
    setMyPhotos(next)
  }

  const makeCover = (index: number) => {
    if (index === 0 || !myPhotos[index]) return
    const next = [...myPhotos]
    ;[next[0], next[index]] = [next[index], next[0]]
    setMyPhotos(next)
    showToast('Nova capa definida')
  }

  return (
    <div className="absolute inset-0 z-[90] bg-white flex flex-col">
      <StatusBar />
      <div className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-line-3">
        <button type="button" onClick={closeScreen} className="w-[38px] h-[38px] rounded-full border border-line-2 flex items-center justify-center">
          <ChevronLeftIcon size={18} />
        </button>
        <h1 className="text-[20px] font-extrabold">Gerenciar fotos</h1>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-bg px-5 py-5">
        <div className="grid grid-cols-2 gap-3">
          {myPhotos.map((photo, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div
                className="relative aspect-[3/4] rounded-[18px] overflow-hidden flex items-center justify-center"
                style={
                  photo
                    ? { backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { background: '#F8F4FF', border: '2px dashed #C4A6F3' }
                }
              >
                {i === 0 && photo && (
                  <span className="absolute top-2 left-2 bg-[rgba(22,33,26,.6)] text-white text-[9px] font-bold uppercase tracking-[.05em] rounded px-2 py-0.5">
                    Capa
                  </span>
                )}
                {uploadingIndex === i && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-4 border-line-3 border-t-accent anim-spin-slow" />
                  </div>
                )}
                {!photo && uploadingIndex !== i && (
                  <button type="button" onClick={() => upload(i)} className="flex flex-col items-center gap-1.5">
                    <CameraIcon size={22} color="#5B34C9" />
                    <span className="text-[12px] font-bold text-accent-2">Adicionar</span>
                  </button>
                )}
              </div>
              {failedIndex === i && (
                <div className="flex items-center justify-between bg-[#FDECEC] rounded-lg px-2.5 py-1.5">
                  <span className="text-[11px] font-semibold text-destructive">Falha no envio</span>
                  <button type="button" onClick={() => upload(i)} className="text-[11px] font-bold text-destructive underline">
                    Tentar de novo
                  </button>
                </div>
              )}
              {photo && (
                <div className="flex gap-1.5">
                  {i !== 0 && (
                    <button type="button" onClick={() => makeCover(i)} className="flex-1 py-2 rounded-lg border border-line-2 text-[11px] font-bold">
                      Tornar capa
                    </button>
                  )}
                  <button type="button" onClick={() => remove(i)} className="flex-1 py-2 rounded-lg border border-line-2 text-[11px] font-bold text-destructive">
                    Remover
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
