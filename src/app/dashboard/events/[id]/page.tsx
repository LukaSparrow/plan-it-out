'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  CheckSquare,
  Square,
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  Receipt,
  TrendingUp,
  Loader2,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react'
import {
  cn,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  formatDate,
  formatCurrency,
  formatRelative,
} from '@/lib/utils'
import {
  eventsApi,
  checklistApi,
  expensesApi,
} from '@/lib/api'
import type {
  Event,
  ChecklistItem,
  Expense,
  Balance,
  Participant,
  User,
} from '@/types'

// ─── Helper – User name compat ────────────────────────────────────────────────
// Repo ma niespójność: type ma `full_name`, niektóre komponenty używają `.name`.
// Fallback obsługuje oba i e-mail jako ostatnia deska ratunku.
function userName(u?: Pick<User, 'full_name' | 'email'> & { name?: string }) {
  if (!u) return 'Użytkownik'
  return u.full_name || (u as any).name || u.email?.split('@')[0] || 'Użytkownik'
}

function avatarUrl(u?: Pick<User, 'avatar_url' | 'full_name' | 'email'> & { name?: string }) {
  if (u?.avatar_url) return u.avatar_url
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(userName(u))}`
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function EventDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const eventId = params.id

  const [inviteOpen, setInviteOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)

  // ─── Queries ────────────────────────────────────────────────────────────
  const eventQuery = useQuery<Event>({
    queryKey: ['events', eventId],
    queryFn: async () => {
      const res = await eventsApi.get(eventId)
      // Backend (FastAPI) póki co zwraca minimalny EventRead bez participants/checklist/expenses.
      // Normalizujemy do pełnego kształtu Event z domyślnymi pustymi tablicami.
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
        status: e.status || 'upcoming',
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

  // ─── Mutations ──────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: () => eventsApi.delete(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      router.push('/dashboard/events')
    },
  })

  // ─── Render states ──────────────────────────────────────────────────────
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

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      {/* ─── Top bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link
          href="/dashboard/events"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} />
          Wróć do listy wydarzeń
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setInviteOpen(true)}
            className="btn-outline flex items-center gap-1.5 text-sm"
          >
            <UserPlus size={14} />
            Zaproś
          </button>
          <Link
            href={`/dashboard/events/${event.id}/edit`}
            className="btn-ghost flex items-center gap-1.5 text-sm"
          >
            <Pencil size={14} />
            Edytuj
          </Link>
          <button
            onClick={() => {
              if (
                confirm(
                  `Na pewno usunąć "${event.title}"? Tej akcji nie można cofnąć.`,
                )
              ) {
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
        </div>
      </div>

      {/* ─── Hero ───────────────────────────────────────────────── */}
      <Hero event={event} />

      {/* ─── Main grid ──────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* ── Left column: Checklist + Expenses (2/3) ── */}
        <div className="lg:col-span-2 space-y-6">
          <ChecklistSection
            eventId={event.id}
            items={checklistQuery.data ?? []}
            isLoading={checklistQuery.isLoading}
            isError={checklistQuery.isError}
          />
          <ExpensesSection
            eventId={event.id}
            expenses={expensesQuery.data ?? []}
            balances={balancesQuery.data ?? []}
            isLoading={expensesQuery.isLoading}
            isError={expensesQuery.isError}
            onAdd={() => setExpenseOpen(true)}
          />
        </div>

        {/* ── Right column: Participants + Map (1/3) ── */}
        <div className="space-y-6">
          <ParticipantsSection
            participants={event.participants}
            organizer={event.organizer}
            onInvite={() => setInviteOpen(true)}
          />
          <LocationSection event={event} />
        </div>
      </div>

      {/* ─── Modals ─────────────────────────────────────────────── */}
      {inviteOpen && (
        <InviteModal eventId={event.id} onClose={() => setInviteOpen(false)} />
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

// ─── Hero ────────────────────────────────────────────────────────────────────
function Hero({ event }: { event: Event }) {
  const status = event.status
  const statusBadge = {
    upcoming: { label: 'Nadchodzi', cls: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
    ongoing:  { label: 'W toku',    cls: 'bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400' },
    past:     { label: 'Minione',   cls: 'bg-surface-2 text-ink-muted' },
    cancelled:{ label: 'Anulowane', cls: 'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400' },
  }[status]

  return (
    <div className="card overflow-hidden">
      {/* Color strip / gradient cover */}
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

// ─── Checklist section ───────────────────────────────────────────────────────
function ChecklistSection({
  eventId,
  items,
  isLoading,
  isError,
}: {
  eventId: string
  items: ChecklistItem[]
  isLoading: boolean
  isError: boolean
}) {
  const queryClient = useQueryClient()
  const [newLabel, setNewLabel] = useState('')

  const addMutation = useMutation({
    mutationFn: (label: string) => checklistApi.add(eventId, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'checklist'] })
      setNewLabel('')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (itemId: string) => checklistApi.toggle(eventId, itemId),
    // Optymistyczna aktualizacja - klikasz, UI odpowiada od razu, request leci w tle
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ['events', eventId, 'checklist'] })
      const prev = queryClient.getQueryData<ChecklistItem[]>(['events', eventId, 'checklist'])
      queryClient.setQueryData<ChecklistItem[]>(
        ['events', eventId, 'checklist'],
        (old = []) =>
          old.map((i) => (i.id === itemId ? { ...i, is_done: !i.is_done } : i)),
      )
      return { prev }
    },
    onError: (_err, _itemId, ctx) => {
      // Rollback w razie błędu
      if (ctx?.prev) {
        queryClient.setQueryData(['events', eventId, 'checklist'], ctx.prev)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'checklist'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => checklistApi.delete(eventId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'checklist'] })
    },
  })

  const done = items.filter((i) => i.is_done).length
  const total = items.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const label = newLabel.trim()
    if (!label) return
    addMutation.mutate(label)
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-ink flex items-center gap-2">
          <CheckSquare size={18} className="text-brand-500" />
          Lista zadań
        </h2>
        {total > 0 && (
          <span className="text-xs text-ink-subtle">
            {done}/{total} ({pct}%)
          </span>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Dodaj zadanie… np. „Kupić namiot"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="input-field flex-1"
          disabled={addMutation.isPending}
        />
        <button
          type="submit"
          disabled={!newLabel.trim() || addMutation.isPending}
          className="btn-primary flex items-center gap-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {addMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          Dodaj
        </button>
      </form>

      {/* Items */}
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <InlineError text="Nie udało się wczytać listy zadań." />
      ) : items.length === 0 ? (
        <EmptyHint
          icon="✅"
          title="Brak zadań"
          subtitle="Dodaj pierwsze zadanie, które trzeba załatwić przed wydarzeniem."
        />
      ) : (
        <ul className="divide-y divide-surface-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 py-2.5 group"
            >
              <button
                onClick={() => toggleMutation.mutate(item.id)}
                className="flex-shrink-0 transition-transform active:scale-90"
                aria-label={item.is_done ? 'Odznacz' : 'Zaznacz'}
              >
                {item.is_done ? (
                  <CheckSquare size={18} className="text-brand-500" />
                ) : (
                  <Square size={18} className="text-ink-subtle hover:text-brand-500 transition-colors" />
                )}
              </button>
              <span
                className={cn(
                  'flex-1 text-sm',
                  item.is_done
                    ? 'line-through text-ink-subtle'
                    : 'text-ink',
                )}
              >
                {item.label}
              </span>
              {item.assigned_to && (
                <img
                  src={avatarUrl(item.assigned_to)}
                  alt={userName(item.assigned_to)}
                  title={`Przypisane: ${userName(item.assigned_to)}`}
                  className="w-6 h-6 rounded-full bg-surface-2"
                />
              )}
              <button
                onClick={() => deleteMutation.mutate(item.id)}
                className="text-ink-subtle hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Usuń zadanie"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// ─── Expenses section ────────────────────────────────────────────────────────
function ExpensesSection({
  eventId: _eventId,
  expenses,
  balances,
  isLoading,
  isError,
  onAdd,
}: {
  eventId: string
  expenses: Expense[]
  balances: Balance[]
  isLoading: boolean
  isError: boolean
  onAdd: () => void
}) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const currency = expenses[0]?.currency || 'PLN'

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-ink flex items-center gap-2">
          <Receipt size={18} className="text-brand-500" />
          Wydatki i rozliczenia
        </h2>
        <button
          onClick={onAdd}
          className="btn-primary flex items-center gap-1.5 text-sm"
        >
          <Plus size={14} />
          Dodaj wydatek
        </button>
      </div>

      {/* Summary */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-surface-1 border border-surface-2 rounded-xl p-4">
            <p className="text-xs text-ink-subtle mb-1">Łącznie wydane</p>
            <p className="font-display text-2xl text-ink">
              {formatCurrency(total, currency)}
            </p>
          </div>
          <div className="bg-surface-1 border border-surface-2 rounded-xl p-4">
            <p className="text-xs text-ink-subtle mb-1">Liczba wydatków</p>
            <p className="font-display text-2xl text-ink">{expenses.length}</p>
          </div>
        </div>
      )}

      {/* Balances - "kto komu ile" */}
      {balances.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-medium text-ink-muted mb-2 flex items-center gap-1.5">
            <TrendingUp size={14} />
            Kto komu ile winien
          </h3>
          <ul className="space-y-2">
            {balances.map((b, i) => (
              <li
                key={i}
                className="flex items-center gap-3 bg-surface-1 border border-surface-2 rounded-xl p-3"
              >
                <img
                  src={avatarUrl(b.from)}
                  alt={userName(b.from)}
                  className="w-8 h-8 rounded-full bg-surface-2"
                />
                <div className="flex-1 text-sm">
                  <span className="font-medium text-ink">{userName(b.from)}</span>
                  <span className="text-ink-muted"> winien </span>
                  <span className="font-medium text-ink">{userName(b.to)}</span>
                </div>
                <img
                  src={avatarUrl(b.to)}
                  alt={userName(b.to)}
                  className="w-8 h-8 rounded-full bg-surface-2"
                />
                <span className="font-mono font-semibold text-brand-600 dark:text-brand-400 text-sm">
                  {formatCurrency(b.amount, currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <InlineError text="Nie udało się wczytać wydatków." />
      ) : expenses.length === 0 ? (
        <EmptyHint
          icon="💸"
          title="Brak wydatków"
          subtitle="Dodaj pierwszy wydatek, a my wyliczymy najprostsze rozliczenia."
        />
      ) : (
        <div>
          <h3 className="text-sm font-medium text-ink-muted mb-2">Historia</h3>
          <ul className="divide-y divide-surface-2">
            {expenses.map((exp) => (
              <li key={exp.id} className="py-3 flex items-center gap-3">
                <img
                  src={avatarUrl(exp.paid_by)}
                  alt={userName(exp.paid_by)}
                  className="w-9 h-9 rounded-full bg-surface-2"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink font-medium truncate">
                    {exp.description}
                  </p>
                  <p className="text-xs text-ink-subtle">
                    {userName(exp.paid_by)} zapłacił
                    {exp.split_among.length > 0 && (
                      <> · dzielone na {exp.split_among.length} os.</>
                    )}
                  </p>
                </div>
                <span className="font-mono font-semibold text-ink whitespace-nowrap">
                  {formatCurrency(exp.amount, exp.currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

// ─── Participants section ────────────────────────────────────────────────────
function ParticipantsSection({
  participants,
  organizer,
  onInvite,
}: {
  participants: Participant[]
  organizer: User
  onInvite: () => void
}) {
  const accepted = participants.filter((p) => p.rsvp === 'accepted').length
  const pending = participants.filter((p) => p.rsvp === 'pending').length

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-ink flex items-center gap-2">
          <Users size={18} className="text-brand-500" />
          Uczestnicy
        </h2>
        <button
          onClick={onInvite}
          className="btn-ghost flex items-center gap-1.5 text-sm"
          aria-label="Zaproś znajomego"
        >
          <UserPlus size={14} />
        </button>
      </div>

      {/* Quick stats */}
      {participants.length > 0 && (
        <div className="flex gap-2 mb-4 text-xs">
          <span className="px-2 py-1 rounded-full bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400">
            ✓ {accepted} potwierdzonych
          </span>
          {pending > 0 && (
            <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              ⏳ {pending} oczekuje
            </span>
          )}
        </div>
      )}

      <ul className="space-y-2">
        {/* Organizer always first */}
        <li className="flex items-center gap-3 p-2.5 rounded-xl bg-brand-50/40 dark:bg-brand-950/20 border border-brand-200/40 dark:border-brand-800/30">
          <img
            src={avatarUrl(organizer)}
            alt={userName(organizer)}
            className="w-9 h-9 rounded-full bg-surface-2"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">
              {userName(organizer)}
            </p>
            <p className="text-xs text-ink-subtle">Organizator</p>
          </div>
          <Sparkles size={14} className="text-brand-500" />
        </li>

        {/* Other participants */}
        {participants.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-1 transition-colors"
          >
            <img
              src={avatarUrl(p.user)}
              alt={userName(p.user)}
              className="w-9 h-9 rounded-full bg-surface-2"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">
                {userName(p.user)}
              </p>
              <p className="text-xs text-ink-subtle">
                <RsvpBadge rsvp={p.rsvp} /> · dołączył {formatRelative(p.joined_at)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {participants.length === 0 && (
        <button
          onClick={onInvite}
          className="w-full mt-3 py-3 border border-dashed border-surface-3 rounded-xl text-sm text-ink-muted hover:text-brand-500 hover:border-brand-400 transition-colors flex items-center justify-center gap-2"
        >
          <UserPlus size={14} />
          Zaproś znajomych
        </button>
      )}
    </section>
  )
}

function RsvpBadge({ rsvp }: { rsvp: Participant['rsvp'] }) {
  const cfg = {
    accepted: { label: 'Potwierdzono', cls: 'text-green-600 dark:text-green-400' },
    pending:  { label: 'Oczekuje',     cls: 'text-amber-600 dark:text-amber-400' },
    declined: { label: 'Odrzucono',    cls: 'text-red-500 dark:text-red-400' },
  }[rsvp]
  return <span className={cn('font-medium', cfg.cls)}>{cfg.label}</span>
}

// ─── Location section ───────────────────────────────────────────────────────
function LocationSection({ event }: { event: Event }) {
  const hasCoords =
    typeof event.location_lat === 'number' &&
    typeof event.location_lng === 'number'

  // OSM static-style fallback - tylko gdy są koordynaty.
  // Pełna integracja z Leaflet/Google Maps jest w roadmapie.
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`

  return (
    <section className="card overflow-hidden">
      {/* Map placeholder */}
      <div className="relative h-40 bg-gradient-to-br from-surface-2 to-surface-3 flex items-center justify-center">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 50%, hsl(var(--brand) / 0.3), transparent 50%), radial-gradient(circle at 70% 60%, hsl(var(--brand) / 0.2), transparent 40%)',
          }}
        />
        <div className="relative z-10 text-center">
          <MapPin size={32} className="text-brand-500 mx-auto mb-1" />
          <p className="text-xs text-ink-muted">
            {hasCoords ? 'Mapa wkrótce' : 'Bez koordynatów'}
          </p>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-sm font-medium text-ink-muted mb-2 flex items-center gap-1.5">
          <MapPin size={14} />
          Miejsce
        </h3>
        <p className="text-ink font-medium mb-3">{event.location}</p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline w-full text-sm flex items-center justify-center gap-1.5"
        >
          Otwórz w Mapach Google
        </a>
      </div>
    </section>
  )
}

// ─── Invite Modal ───────────────────────────────────────────────────────────
function InviteModal({
  eventId,
  onClose,
}: {
  eventId: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const inviteMutation = useMutation({
    mutationFn: (em: string) => eventsApi.invite(eventId, em),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId] })
      onClose()
    },
    onError: () => setError('Nie udało się wysłać zaproszenia.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.includes('@')) {
      setError('Podaj poprawny adres e-mail.')
      return
    }
    inviteMutation.mutate(email)
  }

  return (
    <ModalShell title="Zaproś znajomego" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="invite-email" className="text-sm font-medium text-ink-muted">
            E-mail znajomego
          </label>
          <input
            id="invite-email"
            type="email"
            placeholder="ania@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            autoFocus
          />
        </div>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            Anuluj
          </button>
          <button
            type="submit"
            disabled={inviteMutation.isPending}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {inviteMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <UserPlus size={14} />
            )}
            Wyślij zaproszenie
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

// ─── Add Expense Modal ──────────────────────────────────────────────────────
function AddExpenseModal({
  eventId,
  participants,
  organizer,
  onClose,
}: {
  eventId: string
  participants: Participant[]
  organizer: User
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('PLN')
  // domyślnie wszyscy uczestnicy + organizator
  const allUsers: User[] = [organizer, ...participants.map((p) => p.user)]
  const [splitAmong, setSplitAmong] = useState<string[]>(
    allUsers.map((u) => u.id),
  )
  const [error, setError] = useState<string | null>(null)

  const addMutation = useMutation({
    mutationFn: (data: any) => expensesApi.add(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'expenses'] })
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'balances'] })
      onClose()
    },
    onError: () => setError('Nie udało się dodać wydatku.'),
  })

  const toggleUser = (id: string) => {
    setSplitAmong((curr) =>
      curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id],
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const amt = parseFloat(amount)
    if (!description.trim()) return setError('Opis jest wymagany.')
    if (!amt || amt <= 0) return setError('Kwota musi być większa od 0.')
    if (splitAmong.length === 0) return setError('Wybierz przynajmniej jedną osobę.')

    addMutation.mutate({
      description: description.trim(),
      amount: amt,
      currency,
      split_among: splitAmong,
    })
  }

  return (
    <ModalShell title="Dodaj wydatek" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-muted">Opis</label>
          <input
            type="text"
            placeholder="np. Pizza dla wszystkich"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-1.5">
            <label className="text-sm font-medium text-ink-muted">Kwota</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink-muted">Waluta</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="input-field"
            >
              <option value="PLN">PLN</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink-muted">
            Dzielone na ({splitAmong.length} {splitAmong.length === 1 ? 'osobę' : 'osób'})
          </label>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {allUsers.map((u) => {
              const checked = splitAmong.includes(u.id)
              return (
                <label
                  key={u.id}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                    checked ? 'bg-brand-50 dark:bg-brand-950/30' : 'hover:bg-surface-1',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleUser(u.id)}
                    className="w-4 h-4 accent-brand-500"
                  />
                  <img
                    src={avatarUrl(u)}
                    alt={userName(u)}
                    className="w-7 h-7 rounded-full bg-surface-2"
                  />
                  <span className="text-sm text-ink">{userName(u)}</span>
                </label>
              )
            })}
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            Anuluj
          </button>
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {addMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Dodaj wydatek
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

// ─── Modal Shell ────────────────────────────────────────────────────────────
function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl animate-fade-up"
      >
        <div className="flex items-center justify-between p-5 border-b border-surface-2 sticky top-0 bg-surface-1 z-10">
          <h3 className="font-display text-lg text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="text-ink-subtle hover:text-ink transition-colors p-1 rounded-lg hover:bg-surface-2"
            aria-label="Zamknij"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Helpers: states ────────────────────────────────────────────────────────
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

function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-10 bg-surface-2 rounded-lg animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  )
}

function EmptyHint({
  icon,
  title,
  subtitle,
}: {
  icon: string
  title: string
  subtitle: string
}) {
  return (
    <div className="py-8 text-center bg-surface-1/60 border border-dashed border-surface-2 rounded-2xl">
      <p className="text-3xl mb-2">{icon}</p>
      <p className="text-ink font-medium">{title}</p>
      <p className="text-ink-muted text-xs mt-1 max-w-xs mx-auto">{subtitle}</p>
    </div>
  )
}

function InlineError({ text }: { text: string }) {
  return (
    <div className="px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
      <AlertCircle size={14} />
      {text}
    </div>
  )
}
