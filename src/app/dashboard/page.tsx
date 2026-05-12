'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Bell, Plus, Search, Check, X, CalendarCheck } from 'lucide-react'
import { useQuery, useQueries, useMutation, useQueryClient, DefaultError } from '@tanstack/react-query'
import { eventsApi, checklistApi, expensesApi, friendsApi } from '@/lib/api'
import { getEventStatus, formatDate, CATEGORY_ICONS } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'
import { Event, ChecklistItem, Expense, EventInvite, User } from '@/types'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { MyTasks } from '@/components/dashboard/MyTasks'
import { EventCard } from '@/components/events/EventCard'
import { useNotificationStore } from '@/lib/notificationStore'
import { useSearchStore } from '@/lib/searchStore'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { notifications, openPanel } = useNotificationStore()
  const { openSearch } = useSearchStore()
  const unreadCount = notifications.filter((n) => !n.read).length

  const { data: dbEvents = [], isLoading } = useQuery<Event[], DefaultError>({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await eventsApi.list()
      // Map API events up to our frontend types
      return res.data.map((e: any) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        date: e.date,
        location: e.location,
        category: e.category ?? 'other',
        status: getEventStatus(e.date, e.end_date),
        organizer_id: e.owner_id,
        organizer: { id: e.owner_id, full_name: '', email: '', created_at: '' },
        participant_count: e.participant_count ?? 0,
        participants: [],
        checklist_items: [],
        expenses: [],
        created_at: e.created_at ?? new Date().toISOString(),
      })) as Event[]
    }
  })

  // Fetch checklists and expenses for all events in parallel.
  // Same query keys as MyTasks + Expenses page — TanStack Query shares the cache.
  const checklistQueries = useQueries({
    queries: dbEvents.map((e) => ({
      queryKey: ['events', e.id, 'checklist'],
      queryFn: async () => {
        const res = await checklistApi.list(e.id)
        return res.data as ChecklistItem[]
      },
      staleTime: 60_000,
      enabled: dbEvents.length > 0,
    })),
  })

  const expenseQueries = useQueries({
    queries: dbEvents.map((e) => ({
      queryKey: ['events', e.id, 'expenses'],
      queryFn: async () => {
        const res = await expensesApi.list(e.id)
        return res.data as Expense[]
      },
      staleTime: 60_000,
      enabled: dbEvents.length > 0,
    })),
  })

  const friendsQuery = useQuery<User[]>({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await friendsApi.list()
      return res.data
    },
    staleTime: 60_000,
  })

  const eventInvitesQuery = useQuery<EventInvite[]>({
    queryKey: ['events', 'invites'],
    queryFn: async () => {
      const res = await eventsApi.invites()
      return res.data
    },
    staleTime: 30_000,
  })

  const queryClient = useQueryClient()

  const rsvpMutation = useMutation({
    mutationFn: ({ eventId, accept }: { eventId: string; accept: boolean }) =>
      eventsApi.rsvp(eventId, accept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', 'invites'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const stats = useMemo(() => {
    const upcoming = dbEvents.filter((e) => e.status === 'upcoming').length

    const allItems = checklistQueries.flatMap((q) => q.data ?? [])
    const checklistDone = allItems.filter((i) => i.is_done).length

    const totalExpenses = expenseQueries
      .flatMap((q) => q.data ?? [])
      .reduce((sum, ex) => sum + ex.amount, 0)

    return {
      eventsCount: dbEvents.length,
      upcomingCount: upcoming,
      friendsCount: friendsQuery.data?.length ?? 0,
      checklistDone,
      checklistTotal: allItems.length,
      totalExpenses,
    }
  }, [dbEvents, checklistQueries, expenseQueries, friendsQuery.data])

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Dzień dobry'
    if (h < 18) return 'Witaj'
    return 'Dobry wieczór'
  })()

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* ── Top bar ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <p className="text-sm text-ink-subtle font-medium">
            {new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="font-display text-3xl lg:text-4xl text-ink mt-0.5">
            {greeting}, <span className="text-gradient">{user?.full_name?.split(' ')[0] ?? 'Użytkowniku'}</span> 👋
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 animate-fade-up opacity-0 animation-delay-100" style={{ animationFillMode: 'forwards' }}>
          <button
            onClick={openSearch}
            className="hidden lg:flex btn-ghost items-center gap-2 text-sm"
          >
            <Search size={16} />
            Szukaj
          </button>
          <button
            onClick={openPanel}
            className="relative btn-ghost p-2.5 hidden lg:flex"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand-500 rounded-full" />
            )}
          </button>
          <Link href="/dashboard/events/new" className="btn-primary hidden lg:flex items-center gap-2 text-sm">
            <Plus size={16} />
            Nowe wydarzenie
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <DashboardStats {...stats} />

      {/* ── Pending event invites ── */}
      {(eventInvitesQuery.data?.length ?? 0) > 0 && (
        <div className="card p-5 animate-fade-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <h2 className="font-display text-lg text-ink flex items-center gap-2 mb-4">
            <CalendarCheck size={18} className="text-brand-500" />
            Zaproszenia do wydarzeń
            <span className="text-xs bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium px-2 py-0.5 rounded-full">
              {eventInvitesQuery.data!.length}
            </span>
          </h2>
          <ul className="divide-y divide-surface-2">
            {eventInvitesQuery.data!.map((invite) => (
              <li key={invite.participant_id} className="flex items-center gap-3 py-3">
                <span className="text-xl flex-shrink-0">
                  {CATEGORY_ICONS[invite.event_category as keyof typeof CATEGORY_ICONS] ?? '📌'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-ink truncate">{invite.event_title}</p>
                  <p className="text-xs text-ink-subtle">
                    {formatDate(invite.event_date, 'd MMM yyyy')}
                    {invite.organizer && ` · od ${invite.organizer.full_name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => rsvpMutation.mutate({ eventId: invite.event_id, accept: true })}
                    disabled={rsvpMutation.isPending}
                    className="btn-primary flex items-center gap-1 text-xs py-1.5 px-3 disabled:opacity-50"
                  >
                    <Check size={13} />
                    Akceptuj
                  </button>
                  <button
                    onClick={() => rsvpMutation.mutate({ eventId: invite.event_id, accept: false })}
                    disabled={rsvpMutation.isPending}
                    className="btn-ghost flex items-center gap-1 text-xs py-1.5 px-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                  >
                    <X size={13} />
                    Odrzuć
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column – recent events */}
        <div className="xl:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-ink">Moje wydarzenia</h2>
              <Link href="/dashboard/events" className="text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors">
                Zobacz wszystkie →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {isLoading ? (
                <div className="col-span-2 text-center text-ink-muted py-8">Ładowanie wydarzeń...</div>
              ) : dbEvents.slice(0, 4).map((event, i) => (
                <div
                  key={event.id}
                  className="animate-fade-up opacity-0"
                  style={{ animationDelay: `${(i + 3) * 80}ms`, animationFillMode: 'forwards' }}
                >
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          </div>

          {/* My tasks */}
          <div className="animate-fade-up opacity-0" style={{ animationDelay: '560ms', animationFillMode: 'forwards' }}>
            <MyTasks
              events={dbEvents}
              currentUserId={user?.id ?? ''}
              checklistData={checklistQueries.map((q) => q.data)}
              isLoadingChecklists={checklistQueries.some((q) => q.isLoading)}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="animate-fade-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
            <UpcomingEvents events={dbEvents} />
          </div>
          <div className="animate-fade-up opacity-0" style={{ animationDelay: '480ms', animationFillMode: 'forwards' }}>
            <ActivityFeed events={dbEvents} />
          </div>
        </div>
      </div>
    </div>
  )
}
