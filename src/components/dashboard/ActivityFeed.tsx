'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Calendar, Plus } from 'lucide-react'
import { cn, formatRelative, formatDate, CATEGORY_ICONS } from '@/lib/utils'
import type { Event } from '@/types'

interface ActivityFeedProps {
  events: Event[]
}

interface ActivityItem {
  id: string
  type: 'new' | 'upcoming'
  eventId: string
  eventTitle: string
  eventCategory: string
  message: string
  time: string
}

const TYPE_STYLE = {
  new: {
    Icon: Plus,
    bg: 'bg-brand-100 dark:bg-brand-950/50',
    color: 'text-brand-600 dark:text-brand-400',
  },
  upcoming: {
    Icon: Calendar,
    bg: 'bg-blue-100 dark:bg-blue-950/50',
    color: 'text-blue-600 dark:text-blue-400',
  },
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  const items = useMemo<ActivityItem[]>(() => {
    const result: ActivityItem[] = []
    const now = new Date()

    const sorted = [...events].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )

    sorted.slice(0, 3).forEach((e) => {
      result.push({
        id: `new-${e.id}`,
        type: 'new',
        eventId: e.id,
        eventTitle: e.title,
        eventCategory: e.category,
        message: `Dodano wydarzenie „${e.title}"`,
        time: formatRelative(e.created_at),
      })
    })

    const upcoming = events
      .filter((e) => new Date(e.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3)

    upcoming.forEach((e) => {
      result.push({
        id: `upcoming-${e.id}`,
        type: 'upcoming',
        eventId: e.id,
        eventTitle: e.title,
        eventCategory: e.category,
        message: `„${e.title}" – ${formatDate(e.date, 'd MMM, HH:mm')}`,
        time: formatRelative(e.date),
      })
    })

    // Deduplicate by eventId, keep first occurrence
    const seen = new Set<string>()
    return result.filter((item) => {
      if (seen.has(item.eventId)) return false
      seen.add(item.eventId)
      return true
    }).slice(0, 5)
  }, [events])

  return (
    <div className="card p-5">
      <h3 className="font-display text-lg text-ink mb-5">Aktywność</h3>

      {items.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-ink-muted">Brak aktywności do wyświetlenia.</p>
          <p className="text-xs text-ink-subtle mt-1">
            Zacznij od stworzenia pierwszego wydarzenia!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, i) => {
            const { Icon, bg, color } = TYPE_STYLE[item.type]
            return (
              <Link
                key={item.id}
                href={`/dashboard/events/${item.eventId}`}
                className={cn(
                  'flex items-start gap-3 animate-fade-up opacity-0 group',
                )}
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'forwards' }}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    bg,
                  )}
                >
                  <Icon size={15} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink leading-snug group-hover:text-brand-500 transition-colors">
                    <span className="mr-1">
                      {CATEGORY_ICONS[item.eventCategory as keyof typeof CATEGORY_ICONS] ?? '📌'}
                    </span>
                    {item.message}
                  </p>
                  <p className="text-xs text-ink-subtle mt-0.5">{item.time}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
