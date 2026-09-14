export default function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-[46px] h-7 rounded-full p-[3px] transition-colors ${checked ? 'bg-accent' : 'bg-line-2'}`}
    >
      <span
        className={`block w-[22px] h-[22px] rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
