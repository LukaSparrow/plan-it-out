/**
 * Pomocnicy do wyświetlania danych użytkownika.
 * Używane w komponentach, które dostają niepełne obiekty user (np. z zagnieżdżonych relacji).
 */
import type { User } from '@/types'

/** Zwraca czytelną nazwę użytkownika — full_name, fragment maila lub "Użytkownik". */
export function userName(u?: Pick<User, 'full_name' | 'email'> & { name?: string }) {
  if (!u) return 'Użytkownik'
  return u.full_name || (u as any).name || u.email?.split('@')[0] || 'Użytkownik'
}

/** Zwraca URL avatara — prawdziwy z profilu lub wygenerowany przez DiceBear. */
export function avatarUrl(u?: Pick<User, 'avatar_url' | 'full_name' | 'email'> & { name?: string }) {
  if (u?.avatar_url) return u.avatar_url
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(userName(u))}`
}
