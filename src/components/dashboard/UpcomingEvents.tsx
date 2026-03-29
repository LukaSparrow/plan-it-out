'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Event } from '@/types'
import { formatDate, CATEGORY_COLORS, CATEGORY_ICONS, cn } from '@/lib/utils'

interface UpcomingEventsProps {
  events: Event[]
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  const upcoming = events
    .filter((e) => e.status === 'upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-lg text-ink">Nadchodzące</h3>
        <Link
          href="/dashboard/events"
          className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
        >
          Wszystkie <ArrowRight size={13} />
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-3xl mb-2">🗓️</p>
          <p className="text-sm text-ink-muted">Brak nadchodzących wydarzeń</p>
          <Link href="/dashboard/events/new" className="text-xs text-brand-500 hover:underline mt-1 inline-block">
            Zaplanuj pierwsze →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {upcoming.map((event, i) => (
            <Link
              key={event.id}
              href={`/dashboard/events/${event.id}`}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl hover:bg-surface-2 transition-all duration-150 group animate-fade-up opacity-0'
              )}
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'forwards' }}
            >
              {/* Color dot */}
              <div className={cn('w-2 h-2 rounded-full bg-gradient-to-br flex-shrink-0', CATEGORY_COLORS[event.category])} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {CATEGORY_ICONS[event.category]} {event.title}
                </p>
                <p className="text-xs text-ink-subtle">{formatDate(event.date, 'EEEE, d MMM')}</p>
              </div>

              {/* Participants */}
              <div className="flex -space-x-1.5 flex-shrink-0">
                {event.participants.slice(0, 3).map((p) => (
                  <img
                    key={p.id}
                    src={p.user.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${p.user.name}`}
                    className="w-5 h-5 rounded-full border-2 border-surface-1 bg-surface-2"
                    alt={p.user.name}
                  />
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
