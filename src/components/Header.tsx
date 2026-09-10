import { Sparkles } from "lucide-react"

export function Header({ right }: { right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 pb-3 pt-4">
      <div className="w-16" />
      <div className="flex items-center gap-1 text-finder-dark" style={{ color: "#16a34a" }}>
        <Sparkles size={22} className="text-green-600" fill="#22c55e" strokeWidth={1} />
        <span className="text-xl font-extrabold tracking-tight text-green-600">Finder</span>
      </div>
      <div className="flex w-16 justify-end">{right}</div>
    </div>
  )
}
