import Link from 'next/link'
import { MapPin, Calendar, Users, CheckSquare } from 'lucide-react'
import { Event } from '@/types'
import { formatDate, CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS, cn } from '@/lib/utils'

interface EventCardProps {
  event: Event
  className?: string
}

export function EventCard({ event, className }: EventCardProps) {
  const doneItems = event.checklist_items.filter((i) => i.is_done).length
  const totalItems = event.checklist_items.length
  const checklistPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

  return (
    <Link href={`/dashboard/events/${event.id}`} className={cn('card-hover block group', className)}>
      {/* Color strip */}
      <div className={cn('h-1.5 rounded-t-2xl bg-gradient-to-r', CATEGORY_COLORS[event.category])} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{CATEGORY_ICONS[event.category]}</span>
              <span className="text-xs text-ink-subtle font-medium">{CATEGORY_LABELS[event.category]}</span>
            </div>
            <h3 className="font-semibold text-ink text-base leading-snug line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {event.title}
            </h3>
          </div>

          {/* Status badge */}
          <StatusBadge status={event.status} />
        </div>

        {/* Meta */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <Calendar size={13} className="flex-shrink-0" />
            <span>{formatDate(event.date, 'd MMM yyyy, HH:mm')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <MapPin size={13} className="flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Avatars */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {event.participants.slice(0, 4).map((p) => (
                <img
                  key={p.id}
                  src={p.user.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${p.user.name}`}
                  className="w-6 h-6 rounded-full border-2 border-surface-1 bg-surface-2"
                  alt={p.user.name}
                  title={p.user.name}
                />
              ))}
              {event.participants.length > 4 && (
                <div className="w-6 h-6 rounded-full border-2 border-surface-1 bg-surface-3 flex items-center justify-center text-[10px] font-medium text-ink-muted">
                  +{event.participants.length - 4}
                </div>
              )}
            </div>
            <span className="text-xs text-ink-subtle">{event.participants.length} os.</span>
          </div>

          {/* Checklist progress */}
          {totalItems > 0 && (
            <div className="flex items-center gap-1.5">
              <CheckSquare size={13} className="text-ink-subtle" />
              <div className="flex items-center gap-1">
                <div className="w-16 h-1 bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', CATEGORY_COLORS[event.category], 'bg-gradient-to-r')}
                    style={{ width: `${checklistPct}%` }}
                  />
                </div>
                <span className="text-xs text-ink-subtle">{doneItems}/{totalItems}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function StatusBadge({ status }: { status: Event['status'] }) {
  const config = {
    upcoming: { label: 'Nadchodzi', className: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
    ongoing:  { label: 'W toku',    className: 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400' },
    past:     { label: 'Minione',   className: 'bg-surface-2 text-ink-muted' },
    cancelled:{ label: 'Anulowane', className: 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400' },
  }[status]

  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0', config.className)}>
      {config.label}
    </span>
  )
}
