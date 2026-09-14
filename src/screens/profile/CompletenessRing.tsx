export default function CompletenessRing({ percent, photo }: { percent: number; photo: string | null }) {
  const r = 41
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c

  return (
    <div className="relative w-[88px] h-[88px] shrink-0">
      <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
        <circle cx="44" cy="44" r={r} stroke="#EDE6FB" strokeWidth={4} fill="none" />
        <circle
          cx="44"
          cy="44"
          r={r}
          stroke="#8B5CF6"
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-[8px] rounded-full overflow-hidden bg-bg flex items-center justify-center">
        {photo ? (
          <img src={photo} alt="Você" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[24px] font-bold text-ink-40">?</span>
        )}
      </div>
      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white border border-[#EDE6FB] rounded-full px-2 py-0.5 text-[11px] font-extrabold text-accent-2 whitespace-nowrap">
        {percent}%
      </span>
    </div>
  )
}
