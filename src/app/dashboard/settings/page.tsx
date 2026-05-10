'use client'

import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { Sun, Moon, Monitor, LogOut, User, Shield, Calendar } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { cn, formatDate } from '@/lib/utils'
import { avatarUrl } from '@/lib/userHelpers'

const THEMES = [
  { value: 'light', label: 'Jasny', icon: Sun },
  { value: 'dark', label: 'Ciemny', icon: Moon },
  { value: 'system', label: 'Systemowy', icon: Monitor },
] as const

export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto animate-fade-up">
      <h1 className="font-display text-3xl text-ink mb-1">Ustawienia</h1>
      <p className="text-ink-muted mb-8">Profil, wygląd i konto.</p>

      <div className="space-y-6">
        {/* ── Profile ── */}
        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5 text-ink-muted">
            <User size={16} />
            <h2 className="font-medium text-sm uppercase tracking-wide">Profil</h2>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <img
              src={avatarUrl(user ?? undefined)}
              alt={user?.full_name ?? 'Użytkownik'}
              className="w-16 h-16 rounded-full bg-surface-2 flex-shrink-0"
            />
            <div>
              <p className="font-display text-xl text-ink">{user?.full_name ?? '—'}</p>
              <p className="text-sm text-ink-muted">{user?.email ?? '—'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Field label="Imię i nazwisko" value={user?.full_name ?? '—'} />
            <Field label="Adres e-mail" value={user?.email ?? '—'} />
          </div>
        </section>

        {/* ── Appearance ── */}
        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5 text-ink-muted">
            <Monitor size={16} />
            <h2 className="font-medium text-sm uppercase tracking-wide">Wygląd</h2>
          </div>

          <p className="text-sm text-ink-muted mb-3">Motyw kolorystyczny</p>
          <div className="flex gap-2 flex-wrap">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                  theme === value
                    ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400'
                    : 'border-surface-3 text-ink-muted hover:bg-surface-1 hover:text-ink',
                )}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Account ── */}
        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5 text-ink-muted">
            <Shield size={16} />
            <h2 className="font-medium text-sm uppercase tracking-wide">Konto</h2>
          </div>

          {user?.created_at && (
            <div className="flex items-center gap-2 text-sm text-ink-muted mb-5">
              <Calendar size={14} />
              <span>
                Konto założone{' '}
                <span className="text-ink font-medium">
                  {formatDate(user.created_at, 'd MMMM yyyy')}
                </span>
              </span>
            </div>
          )}

          <div className="pt-4 border-t border-surface-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-4 py-2.5 rounded-xl transition-colors"
            >
              <LogOut size={15} />
              Wyloguj się
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-surface-2 last:border-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-sm text-ink font-medium">{value}</span>
    </div>
  )
}
