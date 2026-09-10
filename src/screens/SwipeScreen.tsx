import { useState } from "react"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { Heart, X } from "lucide-react"
import { Header } from "../components/Header"
import { useAppState } from "../state/AppState"
import type { Profile } from "../types"
import { EmptyQueueScreen } from "./EmptyQueueScreen"

function ProfileCard({
  profile,
  onLike,
  onDislike,
  isTop,
}: {
  profile: Profile
  onLike: () => void
  onDislike: () => void
  isTop: boolean
}) {
  const [photoIndex, setPhotoIndex] = useState(0)

  const handleTapZone = (direction: "prev" | "next") => {
    setPhotoIndex((i) => {
      if (direction === "next") return Math.min(i + 1, profile.photos.length - 1)
      return Math.max(i - 1, 0)
    })
  }

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.x > 120) onLike()
    else if (info.offset.x < -120) onDislike()
  }

  return (
    <motion.div
      className={`absolute inset-0 ${isTop ? "" : "pointer-events-none"}`}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      style={{ touchAction: "pan-y" }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-neutral-200 shadow-lg">
        <img
          src={profile.photos[photoIndex]}
          alt={profile.name}
          className="h-full w-full object-cover"
          draggable={false}
        />

        {isTop && (
          <div className="absolute inset-x-0 top-0 flex gap-1.5 p-2">
            {profile.photos.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${i === photoIndex ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}

        {isTop && (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              className="absolute inset-y-0 left-0 w-1/2"
              onClick={() => handleTapZone("prev")}
            />
            <button
              type="button"
              aria-label="Próxima foto"
              className="absolute inset-y-0 right-0 w-1/2"
              onClick={() => handleTapZone("next")}
            />
          </>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 pb-16 pt-16">
          <p className="text-2xl font-bold text-white">{profile.name}</p>
          <p className="text-sm text-white/90">{profile.city}</p>
          <p className="text-sm text-white/90">a {profile.distanceKm} km daqui</p>
        </div>

        {isTop && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-10">
            <button
              type="button"
              aria-label="Dislike"
              onClick={onDislike}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg active:scale-95"
            >
              <X size={28} className="text-red-500" strokeWidth={3} />
            </button>
            <button
              type="button"
              aria-label="Like"
              onClick={onLike}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg active:scale-95"
            >
              <Heart size={26} className="text-red-500" fill="#ef4444" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function SwipeScreen() {
  const { queue, like, dislike } = useAppState()

  if (queue.length === 0) {
    return <EmptyQueueScreen />
  }

  const visible = queue.slice(0, 3)

  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="relative flex-1 px-4 pb-4">
        <AnimatePresence>
          {visible
            .slice()
            .reverse()
            .map((profile, idx) => {
              const isTop = idx === visible.length - 1
              return (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  isTop={isTop}
                  onLike={() => like(profile)}
                  onDislike={() => dislike(profile)}
                />
              )
            })}
        </AnimatePresence>
      </div>
    </div>
  )
}
