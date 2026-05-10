'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, MessageSquare, X } from 'lucide-react'
import { useNotificationStore } from '@/lib/notificationStore'
import { formatRelative } from '@/lib/utils'

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
      {/* Transparent backdrop to catch outside clicks */}
      <div className="fixed inset-0 z-40" onClick={closePanel} />

      <div className="fixed top-14 right-4 z-50 w-80 bg-surface-1 border border-surface-2 rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-2">
          <h3 className="font-medium text-ink text-sm">Powiadomienia</h3>
          <button
            onClick={closePanel}
            className="text-ink-subtle hover:text-ink transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Bell size={28} className="mx-auto text-ink-subtle mb-2" />
            <p className="text-sm text-ink-muted">Brak powiadomień</p>
            <p className="text-xs text-ink-subtle mt-1">
              Pojawią się tu wiadomości z Twoich wydarzeń.
            </p>
          </div>
        ) : (
          <ul className="max-h-96 overflow-y-auto divide-y divide-surface-2">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => {
                    router.push(`/dashboard/events/${n.eventId}`)
                    closePanel()
                  }}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-surface-2 transition-colors text-left"
                >
                  <MessageSquare
                    size={15}
                    className="text-brand-500 flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink-muted truncate">
                      {n.eventTitle}
                    </p>
                    <p className="text-sm text-ink truncate">
                      <span className="font-medium">{n.senderName}:</span>{' '}
                      {n.content}
                    </p>
                    <p className="text-xs text-ink-subtle mt-0.5">
                      {formatRelative(n.createdAt)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
