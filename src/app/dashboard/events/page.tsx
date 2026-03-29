'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter } from 'lucide-react'
import { MOCK_EVENTS } from '@/lib/mock-data'
import { EventCard } from '@/components/events/EventCard'
import { CATEGORY_LABELS } from '@/lib/utils'
import type { EventStatus, EventCategory } from '@/types'

const STATUS_FILTERS: { value: EventStatus | 'all'; label: string }[] = [
  { value: 'all',      label: 'Wszystkie' },
  { value: 'upcoming', label: 'Nadchodzące' },
  { value: 'ongoing',  label: 'W toku' },
  { value: 'past',     label: 'Minione' },
]

export default function EventsPage() {
  const [status, setStatus] = useState<EventStatus | 'all'>('all')
  const [query, setQuery] = useState('')

  const filtered = MOCK_EVENTS.filter((e) => {
    const matchStatus = status === 'all' || e.status === status
    const matchQuery  = e.title.toLowerCase().includes(query.toLowerCase()) ||
                        e.location.toLowerCase().includes(query.toLowerCase())
    return matchStatus && matchQuery
  })

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink">Moje wydarzenia</h1>
          <p className="text-ink-muted text-sm mt-1">{MOCK_EVENTS.length} wydarzeń łącznie</p>
        </div>
        <Link href="/dashboard/events/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} />
          Nowe wydarzenie
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            type="text"
            placeholder="Szukaj po tytule lub lokalizacji…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-1 bg-surface-1 border border-surface-2 rounded-xl p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                status === f.value
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-2'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-ink-muted">Brak wydarzeń pasujących do filtrów</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((event, i) => (
            <div
              key={event.id}
              className="animate-fade-up opacity-0"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}
            >
              <EventCard event={event} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
