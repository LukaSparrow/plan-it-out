import { create } from 'zustand'

export interface AppNotification {
  id: string
  eventId: string
  eventTitle: string
  senderName: string
  content: string
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

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  panelOpen: false,

  add: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications].slice(0, 50),
    })),

  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
}))
