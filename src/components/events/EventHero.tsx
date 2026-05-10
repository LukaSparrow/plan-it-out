'use client'

import { Calendar as CalendarIcon, MapPin, Users } from 'lucide-react'
import { cn, CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS, formatDate } from '@/lib/utils'
import type { Event } from '@/types'

export function EventHero({ event }: { event: Event }) {
  const status = event.status
  const statusBadge = {
    upcoming:  { label: 'Nadchodzi', cls: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
    ongoing:   { label: 'W toku',    cls: 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400' },
    past:      { label: 'Minione',   cls: 'bg-surface-2 text-ink-muted' },
    cancelled: { label: 'Anulowane', cls: 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400' },
  }[status]

  return (
    <div className="card overflow-hidden">
      <div
        className={cn(
          'h-32 sm:h-40 bg-gradient-to-br relative',
          CATEGORY_COLORS[event.category],
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <span className="absolute top-4 left-4 text-4xl sm:text-5xl drop-shadow-md">
          {CATEGORY_ICONS[event.category]}
        </span>
        <span
          className={cn(
            'absolute top-4 right-4 text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-md',
            statusBadge.cls,
          )}
        >
          {statusBadge.label}
        </span>
      </div>

      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs text-ink-subtle font-medium uppercase tracking-wider">
            {CATEGORY_LABELS[event.category]}
          </span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl text-ink mb-4 leading-tight">
          {event.title}
        </h1>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon size={15} className="text-brand-500" />
            <span className="text-ink">
              {formatDate(event.date, 'd MMMM yyyy, HH:mm')}
            </span>
            {event.end_date && (
              <span className="text-ink-subtle">
                → {formatDate(event.end_date, 'd MMMM, HH:mm')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-brand-500" />
            <span className="text-ink">{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={15} className="text-brand-500" />
            <span className="text-ink">
              {event.participants.length + 1} osób
            </span>
          </div>
        </div>

        {event.description && (
          <p className="text-ink-muted text-sm leading-relaxed pt-4 border-t border-surface-2">
            {event.description}
          </p>
        )}
      </div>
    </div>
  )
}
