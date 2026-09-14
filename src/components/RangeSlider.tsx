export default function RangeSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="relative h-6 flex items-center">
      <div className="absolute inset-x-0 h-1 rounded-full bg-line-3" />
      <div className="absolute h-1 rounded-full bg-accent" style={{ width: `${pct}%` }} />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range-thumb relative w-full appearance-none bg-transparent"
        style={{ height: 22 }}
      />
      <style>{`
        .range-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: #fff;
          border: 3px solid #8B5CF6;
          cursor: pointer;
          margin-top: 0;
        }
        .range-thumb::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: #fff;
          border: 3px solid #8B5CF6;
          cursor: pointer;
        }
        .range-thumb::-webkit-slider-runnable-track { background: transparent; }
      `}</style>
    </div>
  )
}
