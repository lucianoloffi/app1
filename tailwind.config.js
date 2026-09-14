/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Nunito"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: '#8B5CF6',
        'accent-2': '#5B34C9',
        'accent-soft': '#F1EAFE',
        'accent-line': '#DCCBFB',
        coral: '#FF5A5F',
        ink: '#16211A',
        'ink-60': '#5C6660',
        'ink-40': '#8A928B',
        line: '#E3E7E3',
        'line-2': '#DCE0D8',
        'line-3': '#EDEFEA',
        bg: '#F4F6F3',
        surface: '#FFFFFF',
        'icon-inactive': '#C8CFC7',
        'gender-man': '#2F6FED',
        'gender-woman': '#C42B7C',
        'gender-other': '#5C6660',
        destructive: '#C8353C',
      },
      boxShadow: {
        card: '0 20px 40px -22px rgba(15,40,25,.6)',
        primary: '0 10px 24px -10px rgba(139,92,246,.9)',
        like: '0 12px 26px -10px rgba(255,90,95,.9)',
      },
      transitionTimingFunction: {
        std: 'cubic-bezier(.22,1,.36,1)',
      },
    },
  },
  plugins: [],
}
