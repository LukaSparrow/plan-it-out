'use client'

import { Calendar as CalendarIcon, MapPin, Users } from 'lucide-react'
import { cn, CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS, formatDate } from '@/lib/utils'
import type { EventCategory } from '@/types'

export interface EventPreviewCardProps {
  title?: string
  description?: string
  category?: EventCategory
  date?: string
  time?: string
  location?: string
}

export function EventPreviewCard({
  title,
  description,
  category = 'meetup',
  date,
  time,
  location,
}: EventPreviewCardProps) {
  const displayTitle = title?.trim() || 'Tytuł Twojego wydarzenia'
  const displayLocation = location?.trim() || 'Lokalizacja'

  let displayDate = 'Data i godzina'
  if (date && time) {
    try {
      const iso = new Date(`${date}T${time}`).toISOString()
      displayDate = formatDate(iso, 'd MMM yyyy, HH:mm')
    } catch {
      // fallback do placeholder
    }
  }

  return (
    <div className="card overflow-hidden">
      <div
        className={cn(
          'h-1.5 bg-gradient-to-r',
          CATEGORY_COLORS[category],
        )}
      />
      <div className="p-5">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-sm">{CATEGORY_ICONS[category]}</span>
          <span className="text-xs text-ink-subtle font-medium">
            {CATEGORY_LABELS[category]}
          </span>
        </div>
        <h3
          className={cn(
            'font-semibold text-base leading-snug line-clamp-2 mb-3',
            title ? 'text-ink' : 'text-ink-subtle italic',
          )}
        >
          {displayTitle}
        </h3>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <CalendarIcon size={13} className="flex-shrink-0" />
            <span>{displayDate}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <MapPin size={13} className="flex-shrink-0" />
            <span
              className={cn(
                'truncate',
                !location && 'text-ink-subtle italic',
              )}
            >
              {displayLocation}
            </span>
          </div>
        </div>

        {description && (
          <p className="text-xs text-ink-muted line-clamp-3 pt-3 border-t border-surface-2">
            {description}
          </p>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-2">
          <div className="flex items-center gap-1.5 text-xs text-ink-subtle">
            <Users size={13} />
            <span>Tylko Ty (na razie)</span>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            Nadchodzi
          </span>
        </div>
      </div>
    </div>
  )
}
