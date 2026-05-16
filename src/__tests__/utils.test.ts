/**
 * Testy jednostkowe funkcji pomocniczych z src/lib/utils.ts.
 * Nie wymagają DOM ani renderowania — czysta logika.
 */
import { cn, formatCurrency, getEventStatus, buildGoogleCalendarUrl } from '@/lib/utils'

describe('cn()', () => {
  it('łączy klasy CSS', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('rozwiązuje konflikty Tailwind (p-2 vs p-4)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('ignoruje wartości falsy', () => {
    expect(cn('a', undefined, false, null, 'b')).toBe('a b')
  })

  it('obsługuje obiekty warunkowe', () => {
    expect(cn({ 'text-red-500': true, 'text-green-500': false })).toBe('text-red-500')
  })
})

describe('formatCurrency()', () => {
  it('formatuje kwotę w PLN', () => {
    const result = formatCurrency(25.5, 'PLN')
    expect(result).toMatch(/25[,.]50/)
    expect(result).toMatch(/zł|PLN/)
  })

  it('domyślnie używa PLN', () => {
    const result = formatCurrency(100)
    expect(result).toMatch(/100/)
  })
})

describe('getEventStatus()', () => {
  const future = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
  const past = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const recentPast = new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minut temu

  it('zwraca "upcoming" dla przyszłego wydarzenia', () => {
    expect(getEventStatus(future)).toBe('upcoming')
  })

  it('zwraca "past" gdy end_date jest w przeszłości', () => {
    expect(getEventStatus(past, recentPast)).toBe('past')
  })

  it('zwraca "ongoing" gdy start minął ale brak end_date', () => {
    expect(getEventStatus(recentPast)).toBe('ongoing')
  })

  it('zwraca "ongoing" gdy start minął a end_date w przyszłości', () => {
    expect(getEventStatus(recentPast, future)).toBe('ongoing')
  })

  it('zwraca "past" gdy start i end w przeszłości', () => {
    const earlierPast = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    expect(getEventStatus(earlierPast, past)).toBe('past')
  })
})

describe('buildGoogleCalendarUrl()', () => {
  const baseEvent = {
    title: 'Test Event',
    date: '2025-12-15T18:00:00.000Z',
    end_date: '2025-12-15T20:00:00.000Z',
    location: 'Warszawa',
    description: 'Opis',
  }

  it('zwraca URL Google Calendar', () => {
    const url = buildGoogleCalendarUrl(baseEvent)
    expect(url).toContain('calendar.google.com')
    expect(url).toContain('action=TEMPLATE')
    expect(url).toContain('Test+Event')
  })

  it('zawiera datę w formacie bez myślników', () => {
    const url = buildGoogleCalendarUrl(baseEvent)
    // Format dat Google: YYYYMMDDTHHmmssZ
    expect(url).toContain('20251215T')
  })

  it('zawiera lokalizację i opis', () => {
    const url = buildGoogleCalendarUrl(baseEvent)
    expect(url).toContain('Warszawa')
    expect(url).toContain('Opis')
  })

  it('generuje end_date +2h gdy brak end_date', () => {
    const { end_date: _, ...noEnd } = baseEvent
    const url = buildGoogleCalendarUrl(noEnd)
    expect(url).toContain('dates=')
    // Daty w URL: start/end — powinny być dwie wartości
    const datesParam = new URL(url).searchParams.get('dates')
    expect(datesParam?.split('/').length).toBe(2)
  })
})
