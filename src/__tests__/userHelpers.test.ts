/**
 * Testy jednostkowe funkcji pomocniczych dla użytkowników (src/lib/userHelpers.ts).
 */
import { userName, avatarUrl } from '@/lib/userHelpers'

describe('userName()', () => {
  it('zwraca full_name gdy jest ustawione', () => {
    expect(userName({ full_name: 'Jan Kowalski', email: 'jan@example.com' })).toBe('Jan Kowalski')
  })

  it('zwraca fragment maila gdy brak full_name', () => {
    expect(userName({ full_name: '', email: 'anna@example.com' })).toBe('anna')
  })

  it('zwraca "Użytkownik" gdy brak danych', () => {
    expect(userName(undefined)).toBe('Użytkownik')
    expect(userName({ full_name: '', email: '' })).toBe('Użytkownik')
  })

  it('obsługuje pole name (Google OAuth)', () => {
    expect(userName({ full_name: '', email: '', name: 'Google User' } as any)).toBe('Google User')
  })
})

describe('avatarUrl()', () => {
  it('zwraca avatar_url gdy jest ustawione', () => {
    const url = 'https://lh3.googleusercontent.com/test'
    expect(avatarUrl({ avatar_url: url, full_name: 'Jan', email: 'jan@example.com' })).toBe(url)
  })

  it('generuje URL DiceBear gdy brak avatar_url', () => {
    const url = avatarUrl({ avatar_url: undefined, full_name: 'Jan', email: 'jan@example.com' })
    expect(url).toContain('dicebear.com')
    expect(url).toContain('Jan')
  })

  it('nie wyrzuca błędu dla undefined', () => {
    const url = avatarUrl(undefined)
    expect(url).toContain('dicebear.com')
  })
})
