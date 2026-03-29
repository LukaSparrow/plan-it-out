import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex">
      {/* ── Left panel – branding ── */}
      <div className="hidden lg:flex lg:w-[52%] relative bg-surface-0 overflow-hidden flex-col justify-between p-12">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-brand-500/8 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] rounded-full bg-brand-400/6 blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-glow">
              <span className="text-white text-lg">🗺️</span>
            </div>
            <span className="font-display text-xl font-normal text-ink">Plan It Out</span>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <p className="text-ink-muted text-sm font-medium tracking-widest uppercase">Event Co-pilot</p>
            <h1 className="font-display text-5xl xl:text-6xl text-ink leading-none">
              Planuj razem.<br />
              <span className="text-gradient">Bez chaosu.</span>
            </h1>
            <p className="text-ink-muted text-lg leading-relaxed max-w-sm">
              Wspólne checklisy, automatyczne rozliczenia i trasy dojazdu – wszystko w jednym miejscu.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['✅ Wspólne listy', '💸 Split wydatków', '🗺️ Trasy dojazdu', '🔔 Real-time updates'].map((f) => (
              <span key={f} className="text-sm text-ink-muted bg-surface-1 border border-surface-2 px-3 py-1.5 rounded-full">
                {f}
              </span>
            ))}
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {['Jan', 'Anna', 'Piotr', 'Marta'].map((n) => (
                <img
                  key={n}
                  src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${n}&backgroundColor=b6e3f4`}
                  className="w-8 h-8 rounded-full border-2 border-surface-0 bg-surface-2"
                  alt={n}
                />
              ))}
            </div>
            <p className="text-ink-muted text-sm">
              <span className="text-ink font-semibold">2 400+</span> wydarzeń zaplanowanych
            </p>
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10 text-ink-subtle text-sm">
          &copy; {new Date().getFullYear()} Plan It Out · Zbudowane z ❤️ dla organizatorów
        </div>
      </div>

      {/* ── Right panel – form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-surface-0">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <span className="text-white">🗺️</span>
            </div>
            <span className="font-display text-lg text-ink">Plan It Out</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
