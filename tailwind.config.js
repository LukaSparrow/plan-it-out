/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-cabinet)', 'Georgia', 'serif'],
        body: ['var(--font-satoshi)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea6c0a',
          700: '#c2550a',
          800: '#9a3c0a',
          900: '#7c3009',
          950: '#431407',
        },
        surface: {
          0:   'hsl(var(--surface-0))',
          1:   'hsl(var(--surface-1))',
          2:   'hsl(var(--surface-2))',
          3:   'hsl(var(--surface-3))',
        },
        ink: {
          DEFAULT: 'hsl(var(--ink))',
          muted:   'hsl(var(--ink-muted))',
          subtle:  'hsl(var(--ink-subtle))',
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'fade-up':    'fadeUp 0.5s ease forwards',
        'fade-in':    'fadeIn 0.4s ease forwards',
        'slide-left': 'slideLeft 0.4s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideLeft: {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        'card':    '0 2px 8px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04)',
        'card-lg': '0 8px 32px rgba(0,0,0,.10), 0 0 0 1px rgba(0,0,0,.04)',
        'glow':    '0 0 24px rgba(249,115,22,.35)',
      },
    },
  },
  plugins: [],
}
