import { AnimatePresence, motion } from "framer-motion"
import type { Profile } from "../types"

export function MatchOverlay({
  profile,
  onClose,
  onGoToChat,
}: {
  profile: Profile | null
  onClose: () => void
  onGoToChat: () => void
}) {
  return (
    <AnimatePresence>
      {profile && (
        <motion.div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-black/60 px-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative flex h-64 w-64 items-center justify-center"
            initial={{ scale: 0.4, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 16 }}
          >
            <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full drop-shadow-xl">
              <path
                fill="white"
                d="M100 4 L118 66 L182 52 L138 100 L182 148 L118 134 L100 196 L82 134 L18 148 L62 100 L18 52 L82 66 Z"
              />
            </svg>
            <img
              src={profile.photos[0]}
              alt={profile.name}
              className="absolute inset-0 h-full w-full rounded-full object-cover opacity-70 mix-blend-luminosity"
              style={{ clipPath: "circle(38% at 50% 50%)" }}
            />
            <div className="relative text-3xl font-black leading-tight text-neutral-900">
              Deu
              <br />
              match!
            </div>
          </motion.div>

          <p className="text-sm text-white/90">
            Você e {profile.name} curtiram um ao outro.
          </p>

          <div className="flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={onGoToChat}
              className="w-full rounded-full bg-green-500 py-3 font-semibold text-white active:scale-95"
            >
              Enviar mensagem
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full border border-white/50 py-3 font-semibold text-white active:scale-95"
            >
              Continuar buscando
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
