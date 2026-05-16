/**
 * Store powiadomień w czasie rzeczywistym (Zustand + persist).
 * Powiadomienia są zasilane przez chatStore (WebSocket) i utrzymywane
 * między sesjami (localStorage). Maksymalnie 50 wpisów — starsze są odcinane.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AppNotification {
  id: string
  type: 'chat' | 'friend_invite' | 'event_invite' | 'task_assigned' | 'expense_added'
  link: string      // URL do którego kieruje kliknięcie w powiadomienie
  title: string
  subtitle: string
  createdAt: string
  read: boolean
}

interface NotificationStore {
  notifications: AppNotification[]
  panelOpen: boolean
  add: (n: AppNotification) => void
  openPanel: () => void
  closePanel: () => void
  markAllRead: () => void
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      panelOpen: false,

      /** Dodaje powiadomienie na górę listy — duplikaty (ten sam id) są ignorowane. */
      add: (n) =>
        set((state) => {
          if (state.notifications.some((existing) => existing.id === n.id)) return state
          return { notifications: [n, ...state.notifications].slice(0, 50) }
        }),

      openPanel: () => set({ panelOpen: true }),
      closePanel: () => set({ panelOpen: false }),

      /** Oznacza wszystkie powiadomienia jako przeczytane. */
      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
    }),
    {
      name: 'pio-notifications',
      // panelOpen nie jest persystowany — panel zawsze startuje zamknięty
      partialize: (state) => ({ notifications: state.notifications }),
    },
  ),
)
