/**
 * Store WebSocket dla czatu i powiadomień w czasie rzeczywistym.
 * Jedno połączenie na aplikację — tworzone po zalogowaniu w DashboardShell.
 * Odbiera zdarzenia z backendu i przekazuje je do powiadomień/handlerów stron.
 *
 * Typy zdarzeń obsługiwane przez onmessage:
 *   new_chat_message    – nowa wiadomość na czacie wydarzenia
 *   friend_invite_received – przychodzące zaproszenie do znajomych
 *   event_invite_received  – zaproszenie do wydarzenia
 *   expense_added          – nowy wydatek w wydarzeniu
 *   participant_joined     – ktoś zaakceptował RSVP
 *   task_assigned          – zadanie przypisane do bieżącego użytkownika
 */
import { create } from 'zustand'
import { toast } from 'sonner'
import Cookies from 'js-cookie'
import { useNotificationStore } from './notificationStore'
import { ClickableToast } from '@/components/ui/ClickableToast'

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
    // Nie łącz ponownie jeśli socket już istnieje lub brak tokena
    if (!token || get().socket) return

    // Zamieniamy http → ws (lub https → wss) żeby dostać poprawny URL WebSocket
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
            // Użytkownik jest na stronie tego wydarzenia — przekaż do handlera komponentu czatu
            handler(msg)
          } else {
            // Użytkownik jest gdzie indziej — pokaż toast + zapisz w notificationStore
            const eventTitle = data.event_title || 'wydarzeniu'
            const link = `/dashboard/events/${msg.event_id}#chat`
            toast.custom((t) => (
              <ClickableToast
                toastId={t}
                title={`Nowa wiadomość w: ${eventTitle}`}
                description={`${msg.user.full_name}: ${msg.content}`}
                link={link}
                borderClass="border-l-brand-500"
              />
            ))
            useNotificationStore.getState().add({
              id: msg.id,
              type: 'chat',
              link,
              title: eventTitle,
              subtitle: `${msg.user.full_name}: ${msg.content}`,
              createdAt: msg.created_at || new Date().toISOString(),
              read: false,
            })
          }
        }

        if (data.type === 'friend_invite_received') {
          const link = '/dashboard/friends'
          toast.custom((t) => (
            <ClickableToast
              toastId={t}
              title="Nowe zaproszenie do znajomych"
              description={`${data.requester_name} chce zostać Twoim znajomym`}
              link={link}
              borderClass="border-l-blue-500"
            />
          ))
          useNotificationStore.getState().add({
            id: `friend-${data.requester_id}-${Date.now()}`,
            type: 'friend_invite',
            link,
            title: data.requester_name,
            subtitle: 'Zaproszenie do znajomych',
            createdAt: new Date().toISOString(),
            read: false,
          })
        }

        if (data.type === 'event_invite_received') {
          const link = `/dashboard/events/${data.event_id}#rsvp`
          toast.custom((t) => (
            <ClickableToast
              toastId={t}
              title="Zaproszenie do wydarzenia"
              description={`${data.organizer_name} zaprasza Cię na "${data.event_title}"`}
              link={link}
              borderClass="border-l-brand-500"
            />
          ))
          useNotificationStore.getState().add({
            id: `event-invite-${data.event_id}-${Date.now()}`,
            type: 'event_invite',
            link,
            title: data.event_title,
            subtitle: `${data.organizer_name} zaprasza Cię`,
            createdAt: new Date().toISOString(),
            read: false,
          })
        }

        if (data.type === 'expense_added') {
          const amountStr = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(data.amount)
          const link = `/dashboard/events/${data.event_id}#expenses`
          toast.custom((t) => (
            <ClickableToast
              toastId={t}
              title={`Nowy wydatek: ${data.description}`}
              description={`${data.payer_name} dodał wydatek ${amountStr} w "${data.event_title}"`}
              link={link}
              borderClass="border-l-violet-500"
            />
          ))
          useNotificationStore.getState().add({
            id: `expense-${data.event_id}-${Date.now()}`,
            type: 'expense_added',
            link,
            title: `${data.description} · ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(data.amount)}`,
            subtitle: `${data.payer_name} dodał wydatek`,
            createdAt: new Date().toISOString(),
            read: false,
          })
        }

        if (data.type === 'participant_joined') {
          // Odśwież dane wydarzenia (lista uczestników) przez customowy event DOM
          window.dispatchEvent(new CustomEvent('ws:event-updated', {
            detail: { eventId: data.event_id },
          }))
        }

        if (data.type === 'task_assigned') {
          const link = `/dashboard/events/${data.event_id}#checklist`
          toast.custom((t) => (
            <ClickableToast
              toastId={t}
              title={`Nowe zadanie: ${data.task_label}`}
              description={`${data.assigner_name} przypisał Ci zadanie w "${data.event_title}"`}
              link={link}
              borderClass="border-l-brand-500"
            />
          ))
          useNotificationStore.getState().add({
            id: `task-${data.event_id}-${Date.now()}`,
            type: 'task_assigned',
            link,
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
