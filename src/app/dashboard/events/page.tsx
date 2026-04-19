'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Loader2 } from 'lucide-react' // Dodano Loader2
import { EventCard } from '@/components/events/EventCard'
import type { Event, EventStatus } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { eventsApi } from '@/lib/api'

const STATUS_FILTERS: { value: EventStatus | 'all'; label: string }[] = [
  { value: 'all',      label: 'Wszystkie' },
  { value: 'upcoming', label: 'Nadchodzące' },
  { value: 'ongoing',  label: 'W toku' },
  { value: 'past',     label: 'Minione' },
]

export default function EventsPage() {
  const [status, setStatus] = useState<EventStatus | 'all'>('all')
  const [query, setQuery] = useState('')

  const { data: dbEvents = [], isLoading } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await eventsApi.list()
      return res.data.map((e: any) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        date: e.date,
        location: e.location,
        category: 'other', 
        status: 'upcoming',
        organizer_id: e.owner_id,
        organizer: { id: e.owner_id, name: 'Owner', email: '', created_at: '' },
        participants: [],
        checklist_items: [],
        expenses: [],
        created_at: new Date().toISOString(),
      })) as Event[]
    }
  })

  const filtered = dbEvents.filter((e) => {
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
          <p className="text-ink-muted text-sm mt-1">
            {isLoading ? 'Pobieranie...' : `${dbEvents.length} wydarzeń łącznie`}
          </p>
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

      {/* Content Area */}
      {isLoading ? (
        /* Stan ładowania - Spinner i tekst */
        <div className="py-24 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
          <p className="text-ink-muted animate-pulse font-medium">Ładowanie Twoich wydarzeń...</p>
        </div>
      ) : filtered.length === 0 ? (
        /* Stan pusty (tylko gdy dane są załadowane, ale nic nie pasuje) */
        <div className="py-20 text-center bg-surface-1 border border-dashed border-surface-2 rounded-3xl">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-ink font-medium">Nie znaleźliśmy żadnych wydarzeń</p>
          <p className="text-ink-muted text-sm mt-1">Spróbuj zmienić filtry lub wyszukiwaną frazę</p>
        </div>
      ) : (
        /* Grid z wynikami */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((event, i) => (
            <div
              key={event.id}
              className="animate-fade-up opacity-0"
              style={{ 
                animationDelay: `${i * 60}ms`, 
                animationFillMode: 'forwards' 
              }}
            >
              <EventCard event={event} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}