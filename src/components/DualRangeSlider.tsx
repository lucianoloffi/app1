export default function DualRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
}: {
  min: number
  max: number
  valueMin: number
  valueMax: number
  onChange: (min: number, max: number) => void
}) {
  const pctMin = ((valueMin - min) / (max - min)) * 100
  const pctMax = ((valueMax - min) / (max - min)) * 100

  return (
    <div className="relative h-6 flex items-center">
      <div className="absolute inset-x-0 h-1 rounded-full bg-line-3" />
      <div className="absolute h-1 rounded-full bg-accent" style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }} />
      <input
        type="range"
        min={min}
        max={max}
        value={valueMin}
        onChange={(e) => onChange(Math.min(Number(e.target.value), valueMax - 1), valueMax)}
        className="dual-thumb absolute w-full appearance-none bg-transparent pointer-events-none"
      />
      <input
        type="range"
        min={min}
        max={max}
        value={valueMax}
        onChange={(e) => onChange(valueMin, Math.max(Number(e.target.value), valueMin + 1))}
        className="dual-thumb absolute w-full appearance-none bg-transparent pointer-events-none"
      />
      <style>{`
        .dual-thumb { height: 22px; }
        .dual-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: #fff;
          border: 3px solid #8B5CF6;
          cursor: pointer;
          pointer-events: all;
        }
        .dual-thumb::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: #fff;
          border: 3px solid #8B5CF6;
          cursor: pointer;
          pointer-events: all;
        }
        .dual-thumb::-webkit-slider-runnable-track { background: transparent; }
      `}</style>
    </div>
  )
}
