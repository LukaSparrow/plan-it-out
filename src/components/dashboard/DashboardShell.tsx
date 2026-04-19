"use client";

import { useState } from "react";
import { Menu, X, Bell } from "lucide-react";
import { Sidebar } from "./SideBar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          <button className="relative text-ink-muted">
            <Bell size={20} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-500 rounded-full" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
