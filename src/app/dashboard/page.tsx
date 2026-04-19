'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Bell, Plus, Search } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { useQuery } from '@tanstack/react-query'
import { eventsApi } from '@/lib/api'
import { DefaultError } from '@tanstack/react-query'
import { Event } from '@/types'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { MyTasks } from '@/components/dashboard/MyTasks'
import { EventCard } from '@/components/events/EventCard'

export default function DashboardPage() {
  const { user } = useAuthStore()

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

  // Stats derived from events data
  const stats = useMemo(() => {
    const upcoming = dbEvents.filter((e) => e.status === 'upcoming').length
    const allItems = dbEvents.flatMap((e) => e.checklist_items || [])
    const done = allItems.filter((i) => i?.is_done).length
    const totalExpenses = dbEvents.flatMap((e) => e.expenses || []).reduce((sum, ex) => sum + ex.amount, 0)
    
    return {
      eventsCount: dbEvents.length,
      upcomingCount: upcoming,
      friendsCount: 0,
      checklistDone:0, // docelowo z backendu
      checklistTotal: allItems.length,
      totalExpenses,
    }
  }, [dbEvents])

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
          <button className="hidden sm:flex btn-ghost items-center gap-2 text-sm">
            <Search size={16} />
            Szukaj
          </button>
          <button className="relative btn-ghost p-2.5">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand-500 rounded-full" />
          </button>
          <Link href="/dashboard/events/new" className="btn-primary hidden sm:flex items-center gap-2 text-sm">
            <Plus size={16} />
            Nowe wydarzenie
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <DashboardStats {...stats} />

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
          <MyTasks events={dbEvents} currentUserId={user?.id ?? 'usr_1'} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <UpcomingEvents events={dbEvents} />
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
