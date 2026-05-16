/**
 * Pomocnicze funkcje używane w całej aplikacji.
 * cn() – łączenie klas Tailwind z deduplicacją konfliktów.
 * formatDate/formatRelative – formatowanie dat po polsku.
 * getEventStatus – wyznaczanie statusu wydarzenia po stronie klienta.
 * buildGoogleCalendarUrl – generowanie linku "Dodaj do Google Calendar".
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'

/** Łączy klasy CSS z obsługą konfliktów Tailwind (np. p-2 + p-4 = p-4). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formatuje datę ISO na czytelną formę, np. "15 maj 2025, 18:00". */
export function formatDate(dateStr: string, fmt = 'd MMM yyyy') {
  return format(parseISO(toUtc(dateStr)), fmt, { locale: pl })
}

/** Backend zwraca naiwne daty bez strefy — doklejamy 'Z' aby JS traktował je jako UTC. */
function toUtc(dateStr: string): string {
  return /[Zz]|[+-]\d{2}:?\d{2}$/.test(dateStr) ? dateStr : dateStr + 'Z'
}

/** Formatuje datę względnie, np. "3 godziny temu". */
export function formatRelative(dateStr: string) {
  return formatDistanceToNow(parseISO(toUtc(dateStr)), { addSuffix: true, locale: pl })
}

/**
 * Oblicza status wydarzenia po stronie klienta na podstawie dat.
 * Nie ufaj polu `status` z backendu — może być nieaktualne (stary cache).
 */
export function getEventStatus(dateStr: string, endDateStr?: string) {
  const now = new Date()
  const start = parseISO(dateStr)
  const end = endDateStr ? parseISO(endDateStr) : null

  if (end && isAfter(now, end)) return 'past'
  if (isAfter(now, start)) return 'ongoing'
  return 'upcoming'
}

/** Formatuje kwotę według polskich ustawień regionalnych, np. "25,50 zł". */
export function formatCurrency(amount: number, currency = 'PLN') {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
  }).format(amount)
}

export const CATEGORY_LABELS = {
  trip:   'Wyjazd',
  party:  'Impreza',
  meetup: 'Spotkanie',
  work:   'Praca',
  sport:  'Sport',
  other:  'Inne',
} as const

export const CATEGORY_COLORS = {
  trip:   'from-blue-500 to-cyan-400',
  party:  'from-pink-500 to-rose-400',
  meetup: 'from-violet-500 to-purple-400',
  work:   'from-slate-500 to-gray-400',
  sport:  'from-green-500 to-emerald-400',
  other:  'from-orange-500 to-amber-400',
} as const

/**
 * Buduje URL do Google Calendar ("Dodaj do kalendarza") z danymi wydarzenia.
 * Brak end_date → domyślnie 2 godziny od startu.
 * Format dat wymagany przez Google: YYYYMMDDTHHmmssZ (bez myślników i dwukropków).
 */
export function buildGoogleCalendarUrl(event: {
  title: string
  date: string
  end_date?: string | null
  location?: string | null
  description?: string | null
}): string {
  const fmt = (iso: string) =>
    iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '').replace('Z', 'Z')
  const start = fmt(event.date)
  const end = event.end_date
    ? fmt(event.end_date)
    : fmt(new Date(new Date(event.date).getTime() + 2 * 3_600_000).toISOString())
  const params = new URLSearchParams({ action: 'TEMPLATE', text: event.title, dates: `${start}/${end}` })
  if (event.location) params.set('location', event.location)
  if (event.description) params.set('details', event.description)
  return `https://calendar.google.com/calendar/render?${params}`
}

export const CATEGORY_ICONS = {
  trip:   '✈️',
  party:  '🎉',
  meetup: '🤝',
  work:   '💼',
  sport:  '⚽',
  other:  '📌',
} as const
