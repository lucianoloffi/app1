export default function StatusBar({ offline }: { offline?: boolean }) {
  return (
    <div className="shrink-0">
      <div className="h-11 flex items-center justify-between px-6 text-[13px] font-semibold">
        <span>9:41</span>
        <span className="flex items-center gap-1">
          <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
            <rect x="0" y="6" width="3" height="5" rx="0.5" fill="#16211A" />
            <rect x="4.5" y="4" width="3" height="7" rx="0.5" fill="#16211A" />
            <rect x="9" y="2" width="3" height="9" rx="0.5" fill="#16211A" />
            <rect x="13" y="0" width="3" height="11" rx="0.5" fill="#16211A" />
          </svg>
          <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
            <path
              d="M8 1.5C10.8 1.5 13.3 2.6 15 4.4L13.6 5.8C12.2 4.3 10.2 3.4 8 3.4C5.8 3.4 3.8 4.3 2.4 5.8L1 4.4C2.7 2.6 5.2 1.5 8 1.5Z"
              fill="#16211A"
            />
            <circle cx="8" cy="8.5" r="1.5" fill="#16211A" />
          </svg>
          <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
            <rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke="#16211A" opacity=".4" />
            <rect x="2" y="2" width="15" height="7" rx="1.5" fill="#16211A" />
            <rect x="21.5" y="3.5" width="1.5" height="4" rx="0.75" fill="#16211A" opacity=".4" />
          </svg>
        </span>
      </div>
      {offline && (
        <div className="h-[3px] bg-destructive w-full" />
      )}
    </div>
  )
}
