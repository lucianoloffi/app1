import { useRef } from 'react'
import { useAppState } from '../../state/AppState'
import StatusBar from '../../components/StatusBar'
import { HeartIcon, XIcon } from '../../components/Icon'
import DiscoverCard from './DiscoverCard'
import { QueueExhaustedState, FilteredEmptyState, OfflineState } from './DiscoverStates'

export default function DiscoverScreen() {
  const { currentProfile, hasAnyUnseen, likeCurrent, dislikeCurrent, swipe, offline, toggleOffline } = useAppState()
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startPress = () => {
    pressTimer.current = setTimeout(() => toggleOffline(), 800)
  }
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <StatusBar offline={offline} />
      <div
        className="h-14 shrink-0 flex items-center justify-center gap-1.5 select-none"
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
      >
        <HeartIcon size={30} color="#5B34C9" />
        <span className="font-display font-black text-[32px] text-accent-2 leading-none">lovi</span>
      </div>

      <div className="relative flex-1 min-h-0 px-4 pt-1.5 pb-3">
        {offline ? (
          <OfflineState />
        ) : currentProfile ? (
          <div key={currentProfile.id} className={`absolute inset-4 top-1.5 bottom-3 ${swipe.dir ? 'anim-card-out' : 'anim-card-in'}`}>
            <DiscoverCard profile={currentProfile} />
          </div>
        ) : hasAnyUnseen ? (
          <FilteredEmptyState />
        ) : (
          <QueueExhaustedState />
        )}
      </div>

      {!offline && currentProfile && (
        <div className="shrink-0 flex items-center justify-center gap-7 pb-5">
          <button
            type="button"
            onClick={dislikeCurrent}
            className="w-[60px] h-[60px] rounded-full bg-white border border-line flex items-center justify-center transition-transform active:scale-90 hover:scale-105"
          >
            <XIcon size={26} color="#16211A" />
          </button>
          <button
            type="button"
            onClick={likeCurrent}
            className="w-[76px] h-[76px] rounded-full bg-coral flex items-center justify-center shadow-like transition-transform active:scale-90 hover:scale-105"
          >
            <HeartIcon size={32} color="#fff" />
          </button>
        </div>
      )}
    </div>
  )
}
