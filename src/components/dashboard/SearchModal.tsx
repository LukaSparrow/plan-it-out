'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Calendar, MapPin } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { eventsApi } from '@/lib/api'
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  formatDate,
  getEventStatus,
} from '@/lib/utils'
import { useSearchStore } from '@/lib/searchStore'
import type { Event } from '@/types'

export function SearchModal() {
  const { open, closeSearch } = useSearchStore()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await eventsApi.list()
      return (res.data as any[]).map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        date: e.date,
        location: e.location,
        category: e.category ?? 'other',
        status: getEventStatus(e.date, e.end_date),
        organizer_id: e.owner_id,
        organizer: { id: e.owner_id, full_name: '', email: '', created_at: '' },
        participants: [],
        checklist_items: [],
        expenses: [],
        created_at: e.created_at ?? new Date().toISOString(),
      })) as Event[]
    },
    staleTime: 60_000,
  })

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return events
      .filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q) ||
          CATEGORY_LABELS[e.category]?.toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [query, events])

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        open ? closeSearch() : useSearchStore.getState().openSearch()
      }
      if (e.key === 'Escape' && open) closeSearch()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, closeSearch])

  const navigate = (eventId: string) => {
    router.push(`/dashboard/events/${eventId}`)
    closeSearch()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm animate-fade-in px-4"
      onClick={closeSearch}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-surface-1 border border-surface-2 rounded-2xl shadow-2xl overflow-hidden animate-fade-up"
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-2">
          <Search size={17} className="text-ink-subtle flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Szukaj wydarzeń…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-ink placeholder:text-ink-subtle outline-none text-base"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-ink-subtle hover:text-ink transition-colors"
            >
              <X size={16} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 text-xs text-ink-subtle border border-surface-3 rounded px-1.5 py-0.5">
              Esc
            </kbd>
          )}
        </div>

        {/* Results */}
        {query.trim() ? (
          <ul className="max-h-80 overflow-y-auto py-1">
            {results.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-ink-muted">
                Nie znaleziono wydarzeń dla „{query}"
              </li>
            ) : (
              results.map((event) => (
                <li key={event.id}>
                  <button
                    onClick={() => navigate(event.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors text-left"
                  >
                    <span className="text-xl flex-shrink-0">
                      {CATEGORY_ICONS[event.category]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-ink-muted mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDate(event.date, 'd MMM yyyy')}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin size={11} />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : (
          <div className="px-4 py-6 text-center text-sm text-ink-muted">
            Wpisz nazwę, miejsce lub kategorię wydarzenia
            <p className="text-xs text-ink-subtle mt-1">
              Skrót:{' '}
              <kbd className="border border-surface-3 rounded px-1 py-0.5">⌘K</kbd>{' '}
              /{' '}
              <kbd className="border border-surface-3 rounded px-1 py-0.5">Ctrl K</kbd>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
