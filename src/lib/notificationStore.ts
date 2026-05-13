import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AppNotification {
  id: string
  type: 'chat' | 'friend_invite' | 'event_invite' | 'task_assigned' | 'expense_added'
  link: string
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

      add: (n) =>
        set((state) => {
          if (state.notifications.some((existing) => existing.id === n.id)) return state
          return { notifications: [n, ...state.notifications].slice(0, 50) }
        }),

      openPanel: () => set({ panelOpen: true }),
      closePanel: () => set({ panelOpen: false }),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
    }),
    {
      name: 'pio-notifications',
      partialize: (state) => ({ notifications: state.notifications }),
    },
  ),
)
