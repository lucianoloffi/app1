export default function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5 px-7 pt-3">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-line-3'}`}
        />
      ))}
    </div>
  )
}
