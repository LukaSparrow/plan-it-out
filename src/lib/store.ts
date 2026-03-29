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

      setUser: (user) => set({ user, isAuthenticated: true }),

      setToken: (token) => {
        Cookies.set('access_token', token, { expires: 7, sameSite: 'strict' })
      },

      logout: () => {
        Cookies.remove('access_token')
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'plan-it-out-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
