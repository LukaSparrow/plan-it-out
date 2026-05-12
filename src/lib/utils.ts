import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns'
import { pl } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string, fmt = 'd MMM yyyy') {
  return format(parseISO(toUtc(dateStr)), fmt, { locale: pl })
}

function toUtc(dateStr: string): string {
  return /[Zz]|[+-]\d{2}:?\d{2}$/.test(dateStr) ? dateStr : dateStr + 'Z'
}

export function formatRelative(dateStr: string) {
  return formatDistanceToNow(parseISO(toUtc(dateStr)), { addSuffix: true, locale: pl })
}

export function getEventStatus(dateStr: string, endDateStr?: string) {
  const now = new Date()
  const start = parseISO(dateStr)
  const end = endDateStr ? parseISO(endDateStr) : null

  if (end && isAfter(now, end)) return 'past'
  if (isAfter(now, start)) return 'ongoing'
  return 'upcoming'
}

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

export const CATEGORY_ICONS = {
  trip:   '✈️',
  party:  '🎉',
  meetup: '🤝',
  work:   '💼',
  sport:  '⚽',
  other:  '📌',
} as const
