'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  FileText,
  Loader2,
  PartyPopper,
  Users,
  Type,
} from 'lucide-react'
import { eventsApi } from '@/lib/api'
import {
  cn,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  formatDate,
} from '@/lib/utils'
import type { EventCategory } from '@/types'

// ─── Schema ─────────────────────────────────────────────────────────────────
// Frontend zbiera bogaty kształt zgodny z `Event` w types/index.ts.
// Backend obecnie akceptuje wyłącznie: title, description, date, location.
// Pozostałe pola (category, end_date, location_lat/lng) zostają po stronie
// frontu do czasu rozszerzenia API – patrz README "API Contract" oraz roadmapa.
const CATEGORIES: EventCategory[] = [
  'trip',
  'party',
  'meetup',
  'work',
  'sport',
  'other',
]

const eventSchema = z
  .object({
    title: z
      .string()
      .min(3, 'Tytuł musi mieć min. 3 znaki')
      .max(120, 'Tytuł jest zbyt długi (max 120 znaków)'),
    description: z
      .string()
      .max(2000, 'Opis jest zbyt długi (max 2000 znaków)')
      .optional()
      .or(z.literal('')),
    category: z.enum(['trip', 'party', 'meetup', 'work', 'sport', 'other']),
    date: z.string().min(1, 'Wybierz datę'),
    time: z.string().min(1, 'Wybierz godzinę'),
    end_date: z.string().optional().or(z.literal('')),
    end_time: z.string().optional().or(z.literal('')),
    location: z
      .string()
      .min(2, 'Podaj lokalizację')
      .max(200, 'Lokalizacja jest zbyt długa'),
  })
  .refine(
    (d) => {
      // Data startu nie może być w przeszłości (w obrębie minuty)
      const start = new Date(`${d.date}T${d.time}`)
      const now = new Date()
      now.setSeconds(0, 0)
      return start.getTime() >= now.getTime()
    },
    {
      message: 'Data rozpoczęcia nie może być w przeszłości',
      path: ['date'],
    },
  )
  .refine(
    (d) => {
      // Jeśli podano end_date/end_time – muszą być po starcie
      if (!d.end_date && !d.end_time) return true
      if (!d.end_date || !d.end_time) return false
      const start = new Date(`${d.date}T${d.time}`)
      const end = new Date(`${d.end_date}T${d.end_time}`)
      return end.getTime() > start.getTime()
    },
    {
      message: 'Data zakończenia musi być po dacie rozpoczęcia',
      path: ['end_date'],
    },
  )

type EventFormValues = z.infer<typeof eventSchema>

// Domyślne wartości – jutro o 18:00, kategoria "meetup"
function getDefaults(): Partial<EventFormValues> {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yyyy = tomorrow.getFullYear()
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const dd = String(tomorrow.getDate()).padStart(2, '0')
  return {
    title: '',
    description: '',
    category: 'meetup',
    date: `${yyyy}-${mm}-${dd}`,
    time: '18:00',
    end_date: '',
    end_time: '',
    location: '',
  }
}

export default function NewEventPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: getDefaults(),
    mode: 'onBlur',
  })

  // Live values na podgląd karty
  const watched = watch()

  const createMutation = useMutation({
    mutationFn: async (data: EventFormValues) => {
      const isoDate = new Date(`${data.date}T${data.time}`).toISOString()
      // Wysyłamy tylko pola, które aktualnie obsługuje backend (FastAPI EventBase)
      const payload = {
        title: data.title,
        description: data.description || undefined,
        date: isoDate,
        location: data.location,
      }
      const res = await eventsApi.create(payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      router.push('/dashboard/events')
    },
    onError: () => {
      setApiError(
        'Nie udało się utworzyć wydarzenia. Sprawdź połączenie i spróbuj ponownie.',
      )
    },
  })

  const onSubmit = (data: EventFormValues) => {
    setApiError(null)
    createMutation.mutate(data)
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      {/* ─── Header ───────────────────────────────────────────────────── */}
      <div className="mb-8">
        <Link
          href="/dashboard/events"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Wróć do listy wydarzeń
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl text-ink flex items-center gap-2">
              Nowe wydarzenie
              <PartyPopper size={26} className="text-brand-500" />
            </h1>
            <p className="text-ink-muted text-sm mt-1.5">
              Wypełnij szczegóły – znajomych dodasz w następnym kroku.
            </p>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="mb-5 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          {apiError}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* ─── Form ─────────────────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="card p-6 sm:p-8 space-y-7"
          noValidate
        >
          {/* Tytuł */}
          <div className="space-y-1.5">
            <label
              htmlFor="title"
              className="text-sm font-medium text-ink-muted flex items-center gap-1.5"
            >
              <Type size={14} />
              Tytuł wydarzenia
            </label>
            <input
              id="title"
              type="text"
              placeholder="np. Wyjazd na Mazury 🏞️"
              className={cn(
                'input-field',
                errors.title && 'border-red-400 focus:border-red-400',
              )}
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Kategoria */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink-muted">
              Kategoria
            </label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {CATEGORIES.map((cat) => {
                    const active = field.value === cat
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => field.onChange(cat)}
                        className={cn(
                          'relative flex flex-col items-center gap-1 px-2 py-3 rounded-xl border text-xs font-medium transition-all duration-200 active:scale-95',
                          active
                            ? 'border-brand-400 bg-brand-50 dark:bg-brand-950/30 text-ink shadow-sm'
                            : 'border-surface-2 bg-surface-1 hover:border-surface-3 text-ink-muted hover:text-ink',
                        )}
                      >
                        <span className="text-lg leading-none">
                          {CATEGORY_ICONS[cat]}
                        </span>
                        <span>{CATEGORY_LABELS[cat]}</span>
                        {active && (
                          <span
                            className={cn(
                              'absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-gradient-to-r',
                              CATEGORY_COLORS[cat],
                            )}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            />
          </div>

          {/* Data + Godzina rozpoczęcia */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink-muted flex items-center gap-1.5">
              <CalendarIcon size={14} />
              Rozpoczęcie
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                aria-label="Data rozpoczęcia"
                className={cn(
                  'input-field',
                  errors.date && 'border-red-400 focus:border-red-400',
                )}
                {...register('date')}
              />
              <input
                type="time"
                aria-label="Godzina rozpoczęcia"
                className={cn(
                  'input-field',
                  errors.time && 'border-red-400 focus:border-red-400',
                )}
                {...register('time')}
              />
            </div>
            {(errors.date || errors.time) && (
              <p className="text-xs text-red-500">
                {errors.date?.message || errors.time?.message}
              </p>
            )}
          </div>

          {/* Data + Godzina zakończenia (opcjonalne) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink-muted flex items-center gap-1.5">
              <Clock size={14} />
              Zakończenie
              <span className="text-ink-subtle font-normal">
                (opcjonalnie)
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                aria-label="Data zakończenia"
                className={cn(
                  'input-field',
                  errors.end_date && 'border-red-400 focus:border-red-400',
                )}
                {...register('end_date')}
              />
              <input
                type="time"
                aria-label="Godzina zakończenia"
                className={cn(
                  'input-field',
                  errors.end_time && 'border-red-400 focus:border-red-400',
                )}
                {...register('end_time')}
              />
            </div>
            {errors.end_date && (
              <p className="text-xs text-red-500">{errors.end_date.message}</p>
            )}
          </div>

          {/* Lokalizacja */}
          <div className="space-y-1.5">
            <label
              htmlFor="location"
              className="text-sm font-medium text-ink-muted flex items-center gap-1.5"
            >
              <MapPin size={14} />
              Lokalizacja
            </label>
            <input
              id="location"
              type="text"
              placeholder="np. Kawiarnia Relax, ul. Floriańska 12, Kraków"
              className={cn(
                'input-field',
                errors.location && 'border-red-400 focus:border-red-400',
              )}
              {...register('location')}
            />
            {errors.location ? (
              <p className="text-xs text-red-500">{errors.location.message}</p>
            ) : (
              <p className="text-xs text-ink-subtle">
                Integracja z mapą pojawi się w widoku szczegółu wydarzenia.
              </p>
            )}
          </div>

          {/* Opis */}
          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="text-sm font-medium text-ink-muted flex items-center gap-1.5"
            >
              <FileText size={14} />
              Opis
              <span className="text-ink-subtle font-normal">
                (opcjonalnie)
              </span>
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="Co planujesz, co warto wziąć, jakieś szczegóły dla uczestników…"
              className={cn(
                'input-field resize-none',
                errors.description && 'border-red-400 focus:border-red-400',
              )}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Akcje */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-surface-2">
            <p className="text-xs text-ink-subtle flex items-center gap-1.5">
              <Users size={13} />
              Po utworzeniu zaprosisz znajomych i dodasz checklistę.
            </p>
            <div className="flex gap-2 sm:gap-3">
              <Link href="/dashboard/events" className="btn-ghost text-sm">
                Anuluj
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || createMutation.isPending}
                className="btn-primary flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting || createMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Tworzenie…
                  </>
                ) : (
                  <>
                    <PartyPopper size={16} />
                    Utwórz wydarzenie
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* ─── Live preview ─────────────────────────────────────────── */}
        <aside className="hidden lg:block sticky top-6">
          <p className="text-xs font-medium text-ink-subtle uppercase tracking-wider mb-2 px-1">
            Podgląd
          </p>
          <PreviewCard
            title={watched.title}
            description={watched.description}
            category={watched.category}
            date={watched.date}
            time={watched.time}
            location={watched.location}
          />
          <p className="text-xs text-ink-subtle mt-3 px-1 leading-relaxed">
            Tak Twoje wydarzenie będzie widoczne na liście dla uczestników.
          </p>
        </aside>
      </div>
    </div>
  )
}

// ─── Preview card ─────────────────────────────────────────────────────────────
interface PreviewCardProps {
  title?: string
  description?: string
  category?: EventCategory
  date?: string
  time?: string
  location?: string
}

function PreviewCard({
  title,
  description,
  category = 'meetup',
  date,
  time,
  location,
}: PreviewCardProps) {
  const displayTitle = title?.trim() || 'Tytuł Twojego wydarzenia'
  const displayLocation = location?.trim() || 'Lokalizacja'

  let displayDate = 'Data i godzina'
  if (date && time) {
    try {
      const iso = new Date(`${date}T${time}`).toISOString()
      displayDate = formatDate(iso, 'd MMM yyyy, HH:mm')
    } catch {
      // ignore – fallback do placeholder
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
