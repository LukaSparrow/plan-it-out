'use client'

import { useTheme } from 'next-themes'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sun, Moon, Monitor, LogOut, User, Shield, Calendar, Check, X, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { cn, formatDate } from '@/lib/utils'
import { avatarUrl } from '@/lib/userHelpers'
import { authApi, usersApi } from '@/lib/api'
import { useState, useEffect, Suspense } from 'react'
import { toast } from 'sonner'
import Cookies from 'js-cookie'

const THEMES = [
  { value: 'light', label: 'Jasny', icon: Sun },
  { value: 'dark', label: 'Ciemny', icon: Moon },
  { value: 'system', label: 'Systemowy', icon: Monitor },
] as const

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function SettingsContent() {
  const { user, setUser, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [syncEnabled, setSyncEnabled] = useState(user?.google_calendar_sync ?? false)
  const [togglingSync, setTogglingSync] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  // Sync local state when user store updates
  useEffect(() => {
    setSyncEnabled(user?.google_calendar_sync ?? false)
  }, [user?.google_calendar_sync])

  // Handle OAuth callback result
  useEffect(() => {
    const calendarParam = searchParams.get('calendar')
    if (!calendarParam) return

    if (calendarParam === 'connected') {
      toast.success('Google Calendar połączony!')
      authApi.me().then((res) => setUser(res.data)).catch(() => {})
    } else if (calendarParam === 'error') {
      toast.error('Nie udało się połączyć z Google Calendar.')
    }

    // Remove param from URL without reload
    const url = new URL(window.location.href)
    url.searchParams.delete('calendar')
    window.history.replaceState({}, '', url.toString())
  }, [searchParams, setUser])

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  const handleToggleSync = async () => {
    if (!user?.google_connected) return
    const next = !syncEnabled
    setTogglingSync(true)
    try {
      const res = await usersApi.updatePreferences({ google_calendar_sync: next })
      setSyncEnabled(next)
      setUser({ ...user, ...res.data })
    } catch {
      toast.error('Nie udało się zmienić ustawienia.')
    } finally {
      setTogglingSync(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Odłączyć Google Calendar? Synchronizacja zostanie wyłączona.')) return
    setDisconnecting(true)
    try {
      await usersApi.disconnectCalendar()
      setSyncEnabled(false)
      setUser({ ...user!, google_connected: false, google_calendar_sync: false })
      toast.success('Google Calendar odłączony.')
    } catch {
      toast.error('Nie udało się odłączyć.')
    } finally {
      setDisconnecting(false)
    }
  }

  const calendarConnectUrl = `${API_URL}/auth/google/calendar?token=${Cookies.get('access_token') ?? ''}`

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
              referrerPolicy="no-referrer"
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

        {/* ── Google Calendar ── */}
        <section className="card p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-5 text-ink-muted">
            <Calendar size={16} />
            <h2 className="font-medium text-sm uppercase tracking-wide">Google Calendar</h2>
          </div>

          {user?.google_connected ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between py-2.5 border-b border-surface-2">
                <span className="text-sm text-ink-muted">Konto Google</span>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-full">
                    <Check size={11} />
                    Połączono
                  </span>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors"
                  >
                    {disconnecting ? <Loader2 size={12} className="animate-spin" /> : 'Odłącz'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm text-ink">Automatyczna synchronizacja</p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Dodaje utworzone i zaakceptowane wydarzenia do Twojego kalendarza
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={syncEnabled}
                  onClick={handleToggleSync}
                  disabled={togglingSync}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-50',
                    syncEnabled ? 'bg-brand-500' : 'bg-surface-3',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                      syncEnabled && 'translate-x-5',
                    )}
                  />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-ink-muted">
                Połącz konto Google, aby automatycznie synchronizować wydarzenia
              </p>
              <a
                href={calendarConnectUrl}
                className="btn-outline text-sm flex items-center gap-2 flex-shrink-0"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Połącz z Google
              </a>
            </div>
          )}
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

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
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
