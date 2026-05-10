import { create } from 'zustand'
import { toast } from 'sonner'
import Cookies from 'js-cookie'

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
  // callback rejestrowany w szczegółach eventu aby odświeżać cache
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

    // Ustawienie odpowiedniego API URL dla WebSocket (zamieniajac http na ws)
    const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const wsUrl = baseApiUrl.replace(/^http/, 'ws') + `/ws/notifications?token=${token}`
    
    const ws = new WebSocket(wsUrl)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'new_chat_message') {
          const msg = data.message as ChatMessage
          const currentPath = window.location.pathname
          
          // Uruchom hanlder jeśli jesteśmy na stronie czatu (np. żeby odświeżyć React Query cache)
          const handler = get().onMessageHandlers[msg.event_id]
          if (handler && currentPath.includes(`/dashboard/events/${msg.event_id}`)) {
             handler(msg)
          } else {
             // Jesteśmy gdzie indziej - daj powiadomienie
             // Używamy event_title przesłanego z backendu dla czytelności
             const eventTitle = data.event_title ? data.event_title : "wydarzeniu"
             toast.info(`Nowa wiadomość w: ${eventTitle}`, {
                description: `${msg.user.full_name}: ${msg.content}`,
                className: 'bg-surface-1 border-surface-2 text-ink',
             })
          }
        }
      } catch (err) {
        console.error('Error parsing WS message', err)
      }
    }

    ws.onclose = () => {
      set({ socket: null })
      // Można opcjonalnie dodać timeout z reconnectem
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
      console.warn("Cannot send message, WebSocket is not open")
    }
  },

  registerHandler: (eventId, handler) => {
    set((state) => ({
      onMessageHandlers: { ...state.onMessageHandlers, [eventId]: handler }
    }))
  },

  unregisterHandler: (eventId) => {
    set((state) => {
      const newHandlers = { ...state.onMessageHandlers }
      delete newHandlers[eventId]
      return { onMessageHandlers: newHandlers }
    })
  }
}))
