'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, MessageSquare, UserPlus, CalendarCheck, ClipboardList, Receipt, X } from 'lucide-react'
import { useNotificationStore, type AppNotification } from '@/lib/notificationStore'
import { formatRelative } from '@/lib/utils'

const TYPE_CONFIG = {
  chat: {
    Icon: MessageSquare,
    color: 'text-brand-500',
    bg: 'bg-brand-50 dark:bg-brand-950/30',
  },
  friend_invite: {
    Icon: UserPlus,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  event_invite: {
    Icon: CalendarCheck,
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-950/30',
  },
  task_assigned: {
    Icon: ClipboardList,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  expense_added: {
    Icon: Receipt,
    color: 'text-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
  },
}

function NotificationItem({ n, onClick }: { n: AppNotification; onClick: () => void }) {
  const cfg = TYPE_CONFIG[n.type]
  return (
    <li>
      <button
        onClick={onClick}
        className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-surface-2 transition-colors text-left"
      >
        <span className={`flex-shrink-0 mt-0.5 p-1.5 rounded-lg ${cfg.bg}`}>
          <cfg.Icon size={14} className={cfg.color} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink truncate">{n.title}</p>
          <p className="text-xs text-ink-muted truncate mt-0.5">{n.subtitle}</p>
          <p className="text-xs text-ink-subtle mt-1">{formatRelative(n.createdAt)}</p>
        </div>
        {!n.read && (
          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-brand-500 mt-1.5" />
        )}
      </button>
    </li>
  )
}

export function NotificationPanel() {
  const { notifications, panelOpen, closePanel, markAllRead } = useNotificationStore()
  const router = useRouter()

  useEffect(() => {
    if (panelOpen) markAllRead()
  }, [panelOpen, markAllRead])

  useEffect(() => {
    if (!panelOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [panelOpen, closePanel])

  if (!panelOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-fade-in"
        onClick={closePanel}
      />

      <div className="fixed right-0 top-0 h-full w-80 z-50 bg-surface-1 border-l border-surface-2 shadow-2xl flex flex-col animate-slide-left">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-2 flex-shrink-0">
          <h3 className="font-display text-base text-ink">Powiadomienia</h3>
          <button
            onClick={closePanel}
            className="text-ink-subtle hover:text-ink transition-colors p-1 rounded-lg hover:bg-surface-2"
            aria-label="Zamknij"
          >
            <X size={16} />
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
            <Bell size={32} className="text-ink-subtle mb-3" />
            <p className="text-sm font-medium text-ink-muted">Brak powiadomień</p>
            <p className="text-xs text-ink-subtle mt-1 max-w-[200px]">
              Tu pojawią się wiadomości, zaproszenia do wydarzeń i do znajomych.
            </p>
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto divide-y divide-surface-2">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                n={n}
                onClick={() => {
                  router.push(n.link)
                  closePanel()
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
