"use client";

import { useEffect } from "react";
import { Menu, X, Bell, Search } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "./SideBar";
import { useChatStore } from "@/lib/chatStore";
import { useNotificationStore } from "@/lib/notificationStore";
import { useSearchStore } from "@/lib/searchStore";
import { eventsApi, friendsApi } from "@/lib/api";
import type { EventInvite, FriendRequest } from "@/types";
import { NotificationPanel } from "./NotificationPanel";
import { SearchModal } from "./SearchModal";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const connect = useChatStore((state) => state.connect);
  const disconnect = useChatStore((state) => state.disconnect);
  const { notifications, openPanel } = useNotificationStore();
  const { openSearch } = useSearchStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    const { add } = useNotificationStore.getState()

    eventsApi.invites().then((res) => {
      res.data.forEach((invite: EventInvite) => {
        add({
          id: `event-invite-${invite.participant_id}`,
          type: 'event_invite',
          link: `/dashboard/events/${invite.event_id}#rsvp`,
          title: invite.event_title,
          subtitle: invite.organizer ? `${invite.organizer.full_name} zaprasza Cię` : 'Zaproszenie do wydarzenia',
          createdAt: invite.event_date,
          read: false,
        })
      })
    }).catch(() => {})

    friendsApi.requests().then((res) => {
      res.data.forEach((req: FriendRequest) => {
        add({
          id: `friend-${req.id}`,
          type: 'friend_invite',
          link: '/dashboard/friends',
          title: req.requester.full_name,
          subtitle: 'Zaproszenie do znajomych',
          createdAt: req.created_at,
          read: false,
        })
      })
    }).catch(() => {})
  }, []);

  return (
    <div className="flex h-dvh bg-surface-0 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-surface-2 bg-surface-1">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-surface-1 border-r border-surface-2">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-ink-subtle"
            >
              <X size={20} />
            </button>
            <Sidebar closeMobile={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-surface-2 bg-surface-1">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-ink-muted"
          >
            <Menu size={22} />
          </button>
          <span className="font-display text-base text-ink">Plan It Out</span>
          <div className="flex items-center gap-1">
            <button
              onClick={openSearch}
              className="p-2 text-ink-muted hover:text-ink transition-colors"
            >
              <Search size={20} />
            </button>
            <button
              onClick={openPanel}
              className="relative p-2 text-ink-muted hover:text-ink transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Global modals — available on every dashboard page */}
      <NotificationPanel />
      <SearchModal />
    </div>
  );
}
