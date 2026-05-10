"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useChatStore } from "@/lib/chatStore";

interface EventChatProps {
  eventId: string;
}

export function EventChat({ eventId }: EventChatProps) {
  const [inputValue, setInputValue] = useState("");
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const registerHandler = useChatStore((state) => state.registerHandler);
  const unregisterHandler = useChatStore((state) => state.unregisterHandler);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["event-chat", eventId],
    queryFn: async () => {
      const res = await api.get(`/events/${eventId}/chat`);
      return res.data as any[];
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post(`/events/${eventId}/chat`, {
        event_id: eventId,
        content: content,
      });
      return response.data;
    },
  });

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      container.scrollTop = container.scrollHeight;
      return;
    }
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  useEffect(() => {
    registerHandler(eventId, (newMessage) => {
      // Aktualizacja cache'a TanStack Query po przyjsciu nowej wiadomosci z WS
      queryClient.setQueryData(["event-chat", eventId], (oldData: any[]) => {
        if (!oldData) return [newMessage];
        // Zabezpieczenie przed nieskończoną pętlą renderowania i duplikatami
        if (oldData.some(m => m.id === newMessage.id)) return oldData;
        return [...oldData, newMessage];
      });
    });

    return () => {
      unregisterHandler(eventId);
    };
  }, [eventId, registerHandler, unregisterHandler, queryClient]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    sendMessageMutation.mutate(inputValue.trim());
    setInputValue("");
  };

  if (isLoading) {
    return <div className="p-4 text-center text-ink-muted">Ładowanie czatu...</div>;
  }

  return (
    <div className="flex flex-col h-[500px] border border-surface-2 rounded-xl bg-surface-0 overflow-hidden">
      <div className="p-3 border-b border-surface-2 bg-surface-1 font-medium text-ink">
        Czat wydarzenia
      </div>
      
      <div ref={messagesContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-ink-muted text-sm mt-4">
            Brak wiadomości. Bądź pierwszy!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === currentUser?.id;
            
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="text-xs text-ink-muted mb-1 px-1">
                  {isMe ? "Ty" : msg.user.full_name}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    isMe
                      ? "bg-brand-500 text-white rounded-tr-sm"
                      : "bg-surface-2 text-ink rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-surface-2 bg-surface-1">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Napisz wiadomość..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 bg-surface-0 border border-surface-2 text-ink text-sm rounded-lg px-3 py-2 outline-none focus:border-brand-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}