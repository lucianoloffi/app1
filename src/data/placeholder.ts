const PALETTES: [string, string][] = [
  ["#f6a6c1", "#f97362"],
  ["#8ec5fc", "#e0c3fc"],
  ["#a1c4fd", "#c2e9fb"],
  ["#fbc2eb", "#a6c1ee"],
  ["#ffecd2", "#fcb69f"],
  ["#84fab0", "#8fd3f4"],
  ["#f6d365", "#fda085"],
  ["#a8edea", "#fed6e3"],
]

function hashSeed(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  return h
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")
}

/** Generates a self-contained SVG data URI portrait placeholder, no network required. */
export function placeholderPhoto(seed: string, name: string) {
  const hash = hashSeed(seed)
  const [c1, c2] = PALETTES[hash % PALETTES.length]
  const label = initials(name)
  const cx = 40 + (hash % 20)
  const cy = 34 + ((hash >> 3) % 10)

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="1100" fill="url(#g)"/>
  <circle cx="${cx * 8}" cy="${cy * 8}" r="150" fill="rgba(255,255,255,0.35)"/>
  <circle cx="${cx * 8}" cy="${(cy + 34) * 8}" r="230" fill="rgba(255,255,255,0.28)"/>
  <text x="400" y="600" font-family="system-ui, sans-serif" font-size="220" font-weight="700"
        fill="rgba(255,255,255,0.9)" text-anchor="middle" dominant-baseline="middle">${label}</text>
</svg>`.trim()

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
