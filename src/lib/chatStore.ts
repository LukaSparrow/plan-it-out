import { create } from 'zustand'
import { toast } from 'sonner'
import Cookies from 'js-cookie'
import { useNotificationStore } from './notificationStore'

interface ChatMessage {
  id: string
  content: string
  event_id: string
  user_id: string
  created_at: string
  user: {
    id: string
    full_name: string
  }
}

interface ChatStore {
  socket: WebSocket | null
  connect: () => void
  disconnect: () => void
  sendMessage: (eventId: string, content: string) => void
  onMessageHandlers: Record<string, (msg: ChatMessage) => void>
  registerHandler: (eventId: string, handler: (msg: ChatMessage) => void) => void
  unregisterHandler: (eventId: string) => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  socket: null,
  onMessageHandlers: {},

  connect: () => {
    const token = Cookies.get('access_token')
    if (!token || get().socket) return

    const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const wsUrl = baseApiUrl.replace(/^http/, 'ws') + `/ws/notifications?token=${token}`

    const ws = new WebSocket(wsUrl)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'new_chat_message') {
          const msg = data.message as ChatMessage
          const currentPath = window.location.pathname
          const handler = get().onMessageHandlers[msg.event_id]
          if (handler && currentPath.includes(`/dashboard/events/${msg.event_id}`)) {
            handler(msg)
          } else {
            const eventTitle = data.event_title || 'wydarzeniu'
            toast.info(`Nowa wiadomość w: ${eventTitle}`, {
              description: `${msg.user.full_name}: ${msg.content}`,
            })
            useNotificationStore.getState().add({
              id: msg.id,
              type: 'chat',
              link: `/dashboard/events/${msg.event_id}`,
              title: eventTitle,
              subtitle: `${msg.user.full_name}: ${msg.content}`,
              createdAt: msg.created_at || new Date().toISOString(),
              read: false,
            })
          }
        }

        if (data.type === 'friend_invite_received') {
          toast.info('Nowe zaproszenie do znajomych', {
            description: `${data.requester_name} chce zostać Twoim znajomym`,
            className: 'bg-surface-1 border-surface-2 text-ink',
          })
          useNotificationStore.getState().add({
            id: `friend-${data.requester_id}-${Date.now()}`,
            type: 'friend_invite',
            link: '/dashboard/friends',
            title: data.requester_name,
            subtitle: 'Zaproszenie do znajomych',
            createdAt: new Date().toISOString(),
            read: false,
          })
        }

        if (data.type === 'event_invite_received') {
          toast.info(`Zaproszenie do wydarzenia`, {
            description: `${data.organizer_name} zaprasza Cię na "${data.event_title}"`,
          })
          useNotificationStore.getState().add({
            id: `event-invite-${data.event_id}-${Date.now()}`,
            type: 'event_invite',
            link: `/dashboard/events/${data.event_id}`,
            title: data.event_title,
            subtitle: `${data.organizer_name} zaprasza Cię`,
            createdAt: new Date().toISOString(),
            read: false,
          })
        }

        if (data.type === 'expense_added') {
          const amountStr = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(data.amount)
          toast.info(`Nowy wydatek: ${data.description}`, {
            description: `${data.payer_name} dodał wydatek ${amountStr} w "${data.event_title}"`,
          })
          useNotificationStore.getState().add({
            id: `expense-${data.event_id}-${Date.now()}`,
            type: 'expense_added',
            link: `/dashboard/events/${data.event_id}`,
            title: `${data.description} · ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(data.amount)}`,
            subtitle: `${data.payer_name} dodał wydatek`,
            createdAt: new Date().toISOString(),
            read: false,
          })
        }

        if (data.type === 'task_assigned') {
          toast.info(`Nowe zadanie: ${data.task_label}`, {
            description: `${data.assigner_name} przypisał Ci zadanie w "${data.event_title}"`,
          })
          useNotificationStore.getState().add({
            id: `task-${data.event_id}-${Date.now()}`,
            type: 'task_assigned',
            link: `/dashboard/events/${data.event_id}`,
            title: data.task_label,
            subtitle: `${data.assigner_name} przypisał Ci zadanie`,
            createdAt: new Date().toISOString(),
            read: false,
          })
        }
      } catch (err) {
        console.error('Error parsing WS message', err)
      }
    }

    ws.onclose = () => {
      set({ socket: null })
    }

    set({ socket: ws })
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.close()
      set({ socket: null })
    }
  },

  sendMessage: (eventId, content) => {
    const { socket } = get()
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ event_id: eventId, content }))
    } else {
      console.warn('Cannot send message, WebSocket is not open')
    }
  },

  registerHandler: (eventId, handler) => {
    set((state) => ({
      onMessageHandlers: { ...state.onMessageHandlers, [eventId]: handler },
    }))
  },

  unregisterHandler: (eventId) => {
    set((state) => {
      const newHandlers = { ...state.onMessageHandlers }
      delete newHandlers[eventId]
      return { onMessageHandlers: newHandlers }
    })
  },
}))
