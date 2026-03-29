'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Users, Wallet, Settings,
  LogOut, Menu, X, Bell, Moon, Sun, Plus,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'

const NAV = [
  { href: '/dashboard',          icon: LayoutDashboard, label: 'Dashboard'   },
  { href: '/dashboard/events',   icon: Calendar,        label: 'Wydarzenia'  },
  { href: '/dashboard/friends',  icon: Users,           label: 'Znajomi'     },
  { href: '/dashboard/expenses', icon: Wallet,          label: 'Rozliczenia' },
  { href: '/dashboard/settings', icon: Settings,        label: 'Ustawienia'  },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0 shadow-glow">
          <span className="text-sm">🗺️</span>
        </div>
        <span className="font-display text-lg text-ink">Plan It Out</span>
      </div>

      {/* New event button */}
      <div className="px-3 mb-4">
        <button
          onClick={() => router.push('/dashboard/events/new')}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2"
        >
          <Plus size={16} />
          Nowe wydarzenie
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                  : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
              )}
            >
              <Icon size={18} className={active ? 'text-brand-500' : ''} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-5 space-y-1 border-t border-surface-2 pt-4 mt-4">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-ink-muted hover:bg-surface-2 hover:text-ink transition-all"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Tryb jasny' : 'Tryb ciemny'}
        </button>

        {/* User card */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <img
              src={user.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.name}`}
              className="w-8 h-8 rounded-full bg-surface-2 flex-shrink-0"
              alt={user.name}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
              <p className="text-xs text-ink-subtle truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-ink-subtle hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
              title="Wyloguj"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-dvh bg-surface-0 overflow-hidden">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-surface-2 bg-surface-1 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-surface-1 border-r border-surface-2 z-10">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-ink-subtle hover:text-ink"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-surface-2 bg-surface-1 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-ink-muted hover:text-ink">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-500 flex items-center justify-center">
              <span className="text-xs">🗺️</span>
            </div>
            <span className="font-display text-base text-ink">Plan It Out</span>
          </div>
          <button className="relative text-ink-muted hover:text-ink">
            <Bell size={20} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-500 rounded-full" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
