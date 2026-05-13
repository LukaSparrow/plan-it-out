'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  UserPlus,
  LogOut,
  Loader2,
  AlertCircle,
  CalendarCheck,
  CalendarPlus,
  X,
} from 'lucide-react'
import { getEventStatus, buildGoogleCalendarUrl } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'
import { eventsApi, checklistApi, expensesApi } from '@/lib/api'
import { EventChat } from '@/components/events/EventChat'
import { EventHero } from '@/components/events/EventHero'
import { ChecklistSection } from '@/components/events/ChecklistSection'
import { ExpensesSection } from '@/components/events/ExpensesSection'
import { ParticipantsSection } from '@/components/events/ParticipantsSection'
import { LocationSection } from '@/components/events/LocationSection'
import { InviteModal } from '@/components/modals/InviteModal'
import { AddExpenseModal } from '@/components/modals/AddExpenseModal'
import type { Event, ChecklistItem, Expense, Balance } from '@/types'

export default function EventDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const eventId = params.id

  const [inviteOpen, setInviteOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)

  const eventQuery = useQuery<Event>({
    queryKey: ['events', eventId],
    queryFn: async () => {
      const res = await eventsApi.get(eventId)
      const e = res.data
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        date: e.date,
        end_date: e.end_date,
        location: e.location,
        location_lat: e.location_lat,
        location_lng: e.location_lng,
        category: e.category || 'other',
        status: getEventStatus(e.date, e.end_date),
        organizer_id: e.owner_id || e.organizer_id,
        organizer: e.organizer || {
          id: e.owner_id,
          full_name: 'Organizator',
          email: '',
          created_at: '',
        },
        participants: e.participants || [],
        checklist_items: e.checklist_items || [],
        expenses: e.expenses || [],
        cover_color: e.cover_color,
        created_at: e.created_at || new Date().toISOString(),
      } as Event
    },
    retry: 1,
  })

  const checklistQuery = useQuery<ChecklistItem[]>({
    queryKey: ['events', eventId, 'checklist'],
    queryFn: async () => {
      const res = await checklistApi.list(eventId)
      return res.data
    },
    enabled: !!eventId,
    retry: 1,
  })

  const expensesQuery = useQuery<Expense[]>({
    queryKey: ['events', eventId, 'expenses'],
    queryFn: async () => {
      const res = await expensesApi.list(eventId)
      return res.data
    },
    enabled: !!eventId,
    retry: 1,
  })

  const balancesQuery = useQuery<Balance[]>({
    queryKey: ['events', eventId, 'balances'],
    queryFn: async () => {
      const res = await expensesApi.balances(eventId)
      return res.data
    },
    enabled: !!eventId,
    retry: 1,
  })

  const rsvpMutation = useMutation({
    mutationFn: (accept: boolean) => eventsApi.rsvp(eventId, accept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => eventsApi.delete(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      router.push('/dashboard/events')
    },
  })

  const leaveMutation = useMutation({
    mutationFn: () => eventsApi.leave(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      router.push('/dashboard/events')
    },
  })

  useEffect(() => {
    if (!eventQuery.data) return
    const hash = window.location.hash
    if (!hash) return
    setTimeout(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [eventQuery.data])

  useEffect(() => {
    const handler: EventListener = (evt) => {
      const { eventId } = (evt as CustomEvent).detail
      if (eventId === params.id) {
        queryClient.invalidateQueries({ queryKey: ['events', params.id] })
      }
    }
    window.addEventListener('ws:event-updated', handler)
    return () => window.removeEventListener('ws:event-updated', handler)
  }, [params.id, queryClient])

  if (eventQuery.isLoading) return <LoadingState />
  if (eventQuery.isError || !eventQuery.data) {
    return (
      <ErrorState
        message={
          (eventQuery.error as any)?.response?.status === 404
            ? 'Nie znaleziono wydarzenia o podanym ID.'
            : 'Nie udało się wczytać wydarzenia. Spróbuj ponownie później.'
        }
      />
    )
  }

  const event = eventQuery.data
  const myParticipant = event.participants.find((p) => p.user.id === user?.id)
  const isPendingRsvp = myParticipant?.rsvp === 'pending'

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link
          href="/dashboard/events"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} />
          Wróć do listy wydarzeń
        </Link>

        <div className="flex items-center gap-2">
          <a
            href={buildGoogleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline flex items-center gap-1.5 text-sm"
          >
            <CalendarPlus size={14} />
            Dodaj do kalendarza
          </a>
          <button
            onClick={() => setInviteOpen(true)}
            className="btn-outline flex items-center gap-1.5 text-sm"
          >
            <UserPlus size={14} />
            Zaproś
          </button>
          {user?.id !== event.organizer_id && (
            <button
              onClick={() => {
                if (confirm('Na pewno opuścić to wydarzenie?')) {
                  leaveMutation.mutate()
                }
              }}
              disabled={leaveMutation.isPending}
              className="btn-ghost flex items-center gap-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
            >
              {leaveMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <LogOut size={14} />
              )}
              Opuść
            </button>
          )}
          {user?.id === event.organizer_id && (
            <>
              <Link
                href={`/dashboard/events/${event.id}/edit`}
                className="btn-ghost flex items-center gap-1.5 text-sm"
              >
                <Pencil size={14} />
                Edytuj
              </Link>
              <button
                onClick={() => {
                  if (confirm(`Na pewno usunąć "${event.title}"? Tej akcji nie można cofnąć.`)) {
                    deleteMutation.mutate()
                  }
                }}
                disabled={deleteMutation.isPending}
                className="btn-ghost flex items-center gap-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Usuń
              </button>
            </>
          )}
        </div>
      </div>

      <EventHero event={event} />

      {isPendingRsvp && (
        <div id="rsvp" className="mt-6 scroll-mt-16 card p-4 sm:p-5 border-l-4 border-l-brand-500 flex items-center justify-between gap-4 animate-fade-up">
          <div className="flex items-center gap-3">
            <CalendarCheck size={20} className="text-brand-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-ink">Zostałeś zaproszony na to wydarzenie</p>
              <p className="text-xs text-ink-muted mt-0.5">Zaakceptuj lub odrzuć zaproszenie</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => rsvpMutation.mutate(false)}
              disabled={rsvpMutation.isPending}
              className="btn-ghost text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1.5 disabled:opacity-50"
            >
              {rsvpMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
              Odrzuć
            </button>
            <button
              onClick={() => rsvpMutation.mutate(true)}
              disabled={rsvpMutation.isPending}
              className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {rsvpMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <CalendarCheck size={13} />}
              Zaakceptuj
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <div id="chat" className="scroll-mt-16">
            <EventChat eventId={event.id} />
          </div>
          <div id="checklist" className="scroll-mt-16">
            <ChecklistSection
              eventId={event.id}
              items={checklistQuery.data ?? []}
              isLoading={checklistQuery.isLoading}
              isError={checklistQuery.isError}
              participants={event.participants}
              organizer={event.organizer}
            />
          </div>
          <div id="expenses" className="scroll-mt-16">
            <ExpensesSection
              eventId={event.id}
              expenses={expensesQuery.data ?? []}
              balances={balancesQuery.data ?? []}
              isLoading={expensesQuery.isLoading}
              isError={expensesQuery.isError}
              onAdd={() => setExpenseOpen(true)}
            />
          </div>
        </div>

        <div className="space-y-6">
          <ParticipantsSection
            participants={event.participants}
            organizer={event.organizer}
            onInvite={() => setInviteOpen(true)}
          />
          <LocationSection event={event} />
        </div>
      </div>

      {inviteOpen && (
        <InviteModal eventId={event.id} participants={event.participants} onClose={() => setInviteOpen(false)} />
      )}
      {expenseOpen && (
        <AddExpenseModal
          eventId={event.id}
          participants={event.participants}
          organizer={event.organizer}
          onClose={() => setExpenseOpen(false)}
        />
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
        <p className="text-ink-muted animate-pulse font-medium">
          Ładowanie wydarzenia…
        </p>
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <Link
        href="/dashboard/events"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Wróć do listy wydarzeń
      </Link>
      <div className="py-20 text-center bg-surface-1 border border-dashed border-surface-2 rounded-3xl">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-ink font-medium">Coś poszło nie tak</p>
        <p className="text-ink-muted text-sm mt-1 max-w-md mx-auto">{message}</p>
      </div>
    </div>
  )
}
