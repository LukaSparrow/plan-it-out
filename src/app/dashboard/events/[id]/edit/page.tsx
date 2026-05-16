'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  FileText,
  Loader2,
  Save,
  Type,
} from 'lucide-react'
import { eventsApi } from '@/lib/api'
import { cn, CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/utils'
import type { EventCategory } from '@/types'
import { LocationPickerModal } from '@/components/ui/LocationPickerModal'
import type { ConfirmedLocation } from '@/components/ui/LocationPickerModal'

const CATEGORIES: EventCategory[] = ['trip', 'party', 'meetup', 'work', 'sport', 'other']

const editSchema = z
  .object({
    title: z.string().min(3, 'Tytuł musi mieć min. 3 znaki').max(120, 'Tytuł jest zbyt długi'),
    description: z.string().max(2000, 'Opis jest zbyt długi').optional().or(z.literal('')),
    category: z.enum(['trip', 'party', 'meetup', 'work', 'sport', 'other']),
    date: z.string().min(1, 'Wybierz datę'),
    time: z.string().min(1, 'Wybierz godzinę'),
    end_date: z.string().optional().or(z.literal('')),
    end_time: z.string().optional().or(z.literal('')),
    location: z.string().min(2, 'Podaj lokalizację').max(200),
  })
  .refine(
    (d) => {
      if (!d.end_date) return true
      const start = new Date(`${d.date}T${d.time}`)
      const end = new Date(`${d.end_date}T${d.end_time || '23:59'}`)
      return end.getTime() > start.getTime()
    },
    { message: 'Data zakończenia musi być po dacie rozpoczęcia', path: ['end_date'] },
  )

type EditFormValues = z.infer<typeof editSchema>

function isoToFields(iso?: string): { date: string; time: string } {
  if (!iso) return { date: '', time: '' }
  // Naive datetimes from API have no timezone suffix — treat as UTC
  const utc = /[Zz]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : iso + 'Z'
  const d = new Date(utc)
  return {
    date: d.toLocaleDateString('en-CA'),
    time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
  }
}

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [apiError, setApiError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickedLocation, setPickedLocation] = useState<ConfirmedLocation | null>(null)

  const eventQuery = useQuery({
    queryKey: ['events', id],
    queryFn: async () => {
      const res = await eventsApi.get(id)
      return res.data as any
    },
    retry: 1,
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'meetup',
      date: '',
      time: '',
      end_date: '',
      end_time: '',
      location: '',
    },
  })

  // Pre-fill once event data loads
  useEffect(() => {
    const e = eventQuery.data
    if (!e) return
    const { date, time } = isoToFields(e.date)
    const { date: endDate, time: endTime } = isoToFields(e.end_date)
    reset({
      title: e.title ?? '',
      description: e.description ?? '',
      category: e.category ?? 'meetup',
      date,
      time,
      end_date: endDate,
      end_time: endTime,
      location: e.location ?? '',
    })
    if (e.location_lat && e.location_lng) {
      setPickedLocation({ text: e.location ?? '', lat: e.location_lat, lng: e.location_lng })
    }
  }, [eventQuery.data, reset])

  const updateMutation = useMutation({
    mutationFn: async (data: EditFormValues) => {
      const isoDate = new Date(`${data.date}T${data.time}`).toISOString()
      const isoEndDate = data.end_date
        ? new Date(`${data.end_date}T${data.end_time || '23:59'}`).toISOString()
        : undefined
      const res = await eventsApi.update(id, {
        title: data.title,
        description: data.description || undefined,
        date: isoDate,
        end_date: isoEndDate,
        location: data.location,
        category: data.category,
        location_lat: pickedLocation?.lat,
        location_lng: pickedLocation?.lng,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', id] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      router.push(`/dashboard/events/${id}`)
    },
    onError: () => {
      setApiError('Nie udało się zapisać zmian. Sprawdź połączenie i spróbuj ponownie.')
    },
  })

  const onSubmit = (data: EditFormValues) => {
    setApiError(null)
    updateMutation.mutate(data)
  }

  if (eventQuery.isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    )
  }

  if (eventQuery.isError) {
    return (
      <div className="p-8 text-center text-ink-muted">
        Nie udało się wczytać wydarzenia.
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto animate-fade-up">
      <div className="mb-8">
        <Link
          href={`/dashboard/events/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Wróć do wydarzenia
        </Link>
        <h1 className="font-display text-3xl text-ink">Edytuj wydarzenie</h1>
        <p className="text-ink-muted text-sm mt-1">
          Zmiany zostaną zapisane i widoczne dla wszystkich uczestników.
        </p>
      </div>

      {apiError && (
        <div className="mb-5 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 sm:p-8 space-y-7" noValidate>
        {/* Tytuł */}
        <div className="space-y-1.5">
          <label htmlFor="title" className="text-sm font-medium text-ink-muted flex items-center gap-1.5">
            <Type size={14} />
            Tytuł wydarzenia
          </label>
          <input
            id="title"
            type="text"
            className={cn('input-field', errors.title && 'border-red-400 focus:border-red-400')}
            {...register('title')}
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* Kategoria */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-ink-muted">Kategoria</label>
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
                      <span className="text-lg leading-none">{CATEGORY_ICONS[cat]}</span>
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

        {/* Rozpoczęcie */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-muted flex items-center gap-1.5">
            <CalendarIcon size={14} />
            Rozpoczęcie
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              className={cn('input-field', errors.date && 'border-red-400')}
              {...register('date')}
            />
            <input
              type="time"
              className={cn('input-field', errors.time && 'border-red-400')}
              {...register('time')}
            />
          </div>
          {(errors.date || errors.time) && (
            <p className="text-xs text-red-500">{errors.date?.message || errors.time?.message}</p>
          )}
        </div>

        {/* Zakończenie */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-muted flex items-center gap-1.5">
            <Clock size={14} />
            Zakończenie
            <span className="text-ink-subtle font-normal">(opcjonalnie)</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              className={cn('input-field', errors.end_date && 'border-red-400')}
              {...register('end_date')}
            />
            <input
              type="time"
              className={cn('input-field', errors.end_time && 'border-red-400')}
              {...register('end_time')}
            />
          </div>
          {errors.end_date && <p className="text-xs text-red-500">{errors.end_date.message}</p>}
        </div>

        {/* Lokalizacja */}
        <div className="space-y-1.5">
          <label htmlFor="location" className="text-sm font-medium text-ink-muted flex items-center gap-1.5">
            <MapPin size={14} />
            Lokalizacja
          </label>
          <div className="flex gap-2">
            <input
              id="location"
              type="text"
              className={cn('input-field flex-1', errors.location && 'border-red-400')}
              {...register('location')}
            />
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="btn-outline flex items-center gap-1.5 text-sm flex-shrink-0"
              title="Wybierz na mapie"
            >
              <MapPin size={14} />
              Mapa
            </button>
          </div>
          {pickedLocation && (
            <p className="text-xs text-brand-500 flex items-center gap-1">
              <MapPin size={11} />
              {pickedLocation.lat.toFixed(4)}, {pickedLocation.lng.toFixed(4)}
            </p>
          )}
          {errors.location && <p className="text-xs text-red-500">{errors.location.message}</p>}
        </div>

        {/* Opis */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium text-ink-muted flex items-center gap-1.5">
            <FileText size={14} />
            Opis
            <span className="text-ink-subtle font-normal">(opcjonalnie)</span>
          </label>
          <textarea
            id="description"
            rows={4}
            className={cn('input-field resize-none', errors.description && 'border-red-400')}
            {...register('description')}
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-3 border-t border-surface-2">
          <Link href={`/dashboard/events/${id}`} className="btn-ghost text-sm">
            Anuluj
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || updateMutation.isPending}
            className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting || updateMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Zapisywanie…
              </>
            ) : (
              <>
                <Save size={16} />
                Zapisz zmiany
              </>
            )}
          </button>
        </div>
      </form>

      <LocationPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={(loc) => {
          setPickedLocation(loc)
          setValue('location', loc.text, { shouldValidate: true })
        }}
        initial={pickedLocation ?? undefined}
      />
    </div>
  )
}
