import { useState } from 'react'
import { useAppState } from '../../state/AppState'
import type { Profile } from '../../types'
import { INTENT_LABEL } from '../../data/labels'
import { interestLabel } from '../../data/interests'
import { ChevronDownIcon, DotsIcon, SlidersIcon } from '../../components/Icon'

export default function DiscoverCard({ profile }: { profile: Profile }) {
  const {
    photoIndex,
    nextPhoto,
    openDetail,
    beginEditFilters,
    commonInterests,
    otherInterests,
    skipCurrent,
    openReport,
    blockProfile,
  } = useAppState()
  const [menuOpen, setMenuOpen] = useState(false)

  const common = commonInterests(profile).slice(0, 3)
  const others = otherInterests(profile).slice(0, 3)

  return (
    <div
      className="relative w-full h-full rounded-[28px] overflow-hidden shadow-card"
      style={{ backgroundImage: `url(${profile.photos[photoIndex]})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      onClick={() => {
        if (!menuOpen) nextPhoto()
      }}
    >
      <div className="absolute top-0 inset-x-0 flex gap-1 p-3.5 z-10">
        {profile.photos.map((_, i) => (
          <span key={i} className={`h-[3px] flex-1 rounded-full ${i === photoIndex ? 'bg-white' : 'bg-white/35'}`} />
        ))}
      </div>

      <div className="absolute top-[26px] left-4 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen((v) => !v)
          }}
          className="w-[34px] h-[34px] rounded-full bg-[rgba(22,33,26,.55)] backdrop-blur flex items-center justify-center"
        >
          <DotsIcon size={18} color="#fff" />
        </button>
        <span className="h-[34px] px-3 rounded-full bg-[rgba(22,33,26,.72)] text-white text-[11px] font-bold flex items-center">
          {INTENT_LABEL[profile.intent]}
        </span>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          beginEditFilters()
        }}
        className="absolute top-[26px] right-4 z-10 w-[34px] h-[34px] rounded-full bg-[rgba(22,33,26,.55)] backdrop-blur flex items-center justify-center"
      >
        <SlidersIcon size={17} color="#fff" />
      </button>

      {menuOpen && (
        <div
          className="absolute top-[64px] left-4 z-20 w-[238px] bg-white rounded-2xl shadow-[0_18px_40px_-14px_rgba(0,0,0,.35)] overflow-hidden text-[14px] font-semibold"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              skipCurrent()
            }}
            className="w-full text-left px-4 py-3.5 border-b border-line-3"
          >
            Pular este perfil
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              openReport(profile.id, profile.name)
            }}
            className="w-full text-left px-4 py-3.5 border-b border-line-3"
          >
            Denunciar perfil
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              blockProfile(profile.id, profile.name, profile.photos[0])
            }}
            className="w-full text-left px-4 py-3.5 text-destructive"
          >
            Bloquear perfil
          </button>
        </div>
      )}

      <div
        className="absolute bottom-0 inset-x-0 pt-[28px] px-[22px] pb-[22px] z-10"
        style={{
          background: 'linear-gradient(to top, rgba(10,18,12,.94), rgba(10,18,12,.55) 55%, transparent)',
        }}
      >
        <div className="text-white font-extrabold text-[30px] leading-none">
          {profile.name}, {profile.age}
        </div>
        <div className="text-white text-[15px] font-medium mt-1">{profile.profession}</div>
        <div className="text-white/80 text-[14px] font-medium">
          {profile.city} · a {profile.distanceKm} km daqui
        </div>
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {common.map((id) => (
            <span key={id} className="px-3 py-1.5 rounded-full bg-accent text-white text-[12px] font-semibold">
              {interestLabel(id)}
            </span>
          ))}
          {others.map((id) => (
            <span
              key={id}
              className="px-3 py-1.5 rounded-full bg-white/[.18] border border-white/40 text-white text-[12px] font-semibold"
            >
              {interestLabel(id)}
            </span>
          ))}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              openDetail(profile, 'card')
            }}
            className="ml-auto w-[34px] h-[34px] rounded-full bg-white/[.22] backdrop-blur flex items-center justify-center shrink-0"
          >
            <ChevronDownIcon size={18} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  )
}
