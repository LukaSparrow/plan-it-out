"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Calendar, Users, Wallet, Settings, Plus, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import { useEffect, useState } from "react";

const DASHBOARD_NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/events", icon: Calendar, label: "Wydarzenia" },
  { href: "/dashboard/friends", icon: Users, label: "Znajomi" },
  { href: "/dashboard/expenses", icon: Wallet, label: "Rozliczenia" },
  { href: "/dashboard/settings", icon: Settings, label: "Ustawienia" },
];

interface SidebarProps {
  closeMobile?: () => void
}

export function Sidebar({ closeMobile }: SidebarProps) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0 shadow-glow">
          <span className="text-sm">🗺️</span>
        </div>
        <span className="font-display text-lg text-ink">Plan It Out</span>
      </div>

      {/* New Event Button */}
      <div className="px-3 mb-4">
        <button
          onClick={() => {
            router.push('/dashboard/events/new')
            closeMobile?.()
          }}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2"
        >
          <Plus size={16} />
          Nowe wydarzenie
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {DASHBOARD_NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={closeMobile}
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

      {/* Bottom Section */}
      <div className="px-3 pb-5 space-y-1 border-t border-surface-2 pt-4 mt-4">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-ink-muted hover:bg-surface-2 hover:text-ink transition-all"
        >
          {!mounted ? (
            <div className="w-[18px] h-[18px]" /> 
          ) : theme === 'dark' ? (
            <Sun size={18} />
          ) : (
            <Moon size={18} />
          )}
          
          {!mounted ? 'Ładowanie...' : theme === 'dark' ? 'Tryb jasny' : 'Tryb ciemny'}
        </button>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <img
              src={user.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.full_name}`}
              className="w-8 h-8 rounded-full bg-surface-2 flex-shrink-0"
              alt={user.full_name}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{user.full_name}</p>
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
  );
}
