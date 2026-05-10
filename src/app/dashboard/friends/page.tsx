'use client'

import { useState, useMemo } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { Users, Search, Calendar, Mail } from 'lucide-react'
import { eventsApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { CATEGORY_ICONS, formatDate, getEventStatus } from '@/lib/utils'
import { avatarUrl } from '@/lib/userHelpers'
import type { User } from '@/types'

interface FriendEntry {
  user: User
  sharedEvents: { id: string; title: string; date: string; category: string }[]
}

export default function FriendsPage() {
  const { user: currentUser } = useAuthStore()
  const [search, setSearch] = useState('')

  const eventsListQuery = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await eventsApi.list()
      return (res.data as any[]).map((e) => ({
        id: e.id as string,
        title: e.title as string,
        date: e.date as string,
        category: (e.category ?? 'other') as string,
        status: getEventStatus(e.date as string, e.end_date as string | undefined),
        location: e.location as string,
        organizer_id: e.owner_id as string,
        organizer: { id: e.owner_id, full_name: '', email: '', created_at: '' },
        participants: [],
        checklist_items: [],
        expenses: [],
        created_at: e.created_at as string,
      }))
    },
  })

  const eventIds = eventsListQuery.data?.map((e) => e.id) ?? []

  const eventDetailQueries = useQueries({
    queries: eventIds.map((id) => ({
      queryKey: ['events', id],
      queryFn: async () => {
        const res = await eventsApi.get(id)
        return res.data as any
      },
    })),
  })

  const isLoading =
    eventsListQuery.isLoading || eventDetailQueries.some((q) => q.isLoading)

  const friends = useMemo<FriendEntry[]>(() => {
    const map = new Map<string, FriendEntry>()

    eventDetailQueries.forEach((q, idx) => {
      if (!q.data) return
      const ev = q.data
      const participants: any[] = ev.participants ?? []

      participants.forEach((p: any) => {
        const u: User = p.user
        if (!u || u.id === currentUser?.id) return

        const eventEntry = {
          id: eventIds[idx],
          title: ev.title,
          date: ev.date,
          category: ev.category ?? 'other',
        }

        const existing = map.get(u.id)
        if (existing) {
          existing.sharedEvents.push(eventEntry)
        } else {
          map.set(u.id, { user: u, sharedEvents: [eventEntry] })
        }
      })
    })

    return Array.from(map.values()).sort(
      (a, b) => b.sharedEvents.length - a.sharedEvents.length,
    )
  }, [eventDetailQueries, currentUser?.id, eventIds])

  const filtered = useMemo(() => {
    if (!search.trim()) return friends
    const q = search.toLowerCase()
    return friends.filter(
      (f) =>
        f.user.full_name?.toLowerCase().includes(q) ||
        f.user.email?.toLowerCase().includes(q),
    )
  }, [friends, search])

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-ink">Znajomi</h1>
          <p className="text-ink-muted mt-1">
            {isLoading
              ? 'Ładowanie…'
              : friends.length === 0
                ? 'Nie masz jeszcze znajomych w wydarzeniach'
                : `${friends.length} ${friends.length === 1 ? 'osoba' : 'osób'} z Twoich wydarzeń`}
          </p>
        </div>

        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
          />
          <input
            type="text"
            placeholder="Szukaj znajomych…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 w-60"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-surface-2 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-surface-2 rounded w-3/4" />
                  <div className="h-3 bg-surface-2 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-surface-2 rounded w-full mb-2" />
              <div className="h-3 bg-surface-2 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <Users size={40} className="mx-auto text-ink-subtle mb-4" />
          {friends.length === 0 ? (
            <>
              <p className="text-ink font-medium">Brak znajomych</p>
              <p className="text-sm text-ink-muted mt-1">
                Zaproś kogoś do swojego pierwszego wydarzenia!
              </p>
            </>
          ) : (
            <>
              <p className="text-ink font-medium">Brak wyników</p>
              <p className="text-sm text-ink-muted mt-1">Spróbuj innej frazy.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ user, sharedEvents }) => (
            <div
              key={user.id}
              className="card p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={avatarUrl(user)}
                  alt={user.full_name}
                  className="w-12 h-12 rounded-full bg-surface-2 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-medium text-ink truncate">{user.full_name}</p>
                  <p className="text-xs text-ink-subtle flex items-center gap-1 truncate">
                    <Mail size={11} />
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-surface-2">
                <Calendar size={13} className="text-brand-500 flex-shrink-0" />
                <span className="text-xs text-ink-muted">
                  <span className="font-semibold text-ink">{sharedEvents.length}</span>{' '}
                  {sharedEvents.length === 1
                    ? 'wspólne wydarzenie'
                    : 'wspólnych wydarzeń'}
                </span>
              </div>

              <ul className="space-y-1.5">
                {sharedEvents.slice(0, 3).map((ev) => (
                  <li key={ev.id} className="flex items-center gap-2 text-xs text-ink-muted">
                    <span className="flex-shrink-0">
                      {CATEGORY_ICONS[ev.category as keyof typeof CATEGORY_ICONS] ?? '📌'}
                    </span>
                    <span className="truncate">{ev.title}</span>
                    <span className="ml-auto flex-shrink-0 text-ink-subtle">
                      {formatDate(ev.date, 'd MMM')}
                    </span>
                  </li>
                ))}
                {sharedEvents.length > 3 && (
                  <li className="text-xs text-ink-subtle pl-5">
                    +{sharedEvents.length - 3} więcej
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
