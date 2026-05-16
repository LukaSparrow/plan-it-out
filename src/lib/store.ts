/**
 * Globalny store autoryzacji (Zustand + persist).
 * Trzyma dane zalogowanego użytkownika i synchronizuje token JWT z ciasteczkiem.
 * Stan user/isAuthenticated przeżywa odświeżenie strony (localStorage).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import { User } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User) => void
  setToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      /** Zapisuje dane użytkownika po udanym zalogowaniu. */
      setUser: (user) => set({ user, isAuthenticated: true }),

      /** Zapisuje token JWT w ciasteczku (ważny 7 dni). */
      setToken: (token) => {
        Cookies.set('access_token', token, { expires: 7, sameSite: 'lax' })
      },

      /** Usuwa token i dane użytkownika z pamięci i ciasteczka. */
      logout: () => {
        Cookies.remove('access_token')
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'plan-it-out-auth',
      // Persystujemy tylko user i isAuthenticated — token żyje osobno w ciasteczku
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
