'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { CheckSquare, Square, Loader2 } from 'lucide-react'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { checklistApi } from '@/lib/api'
import type { Event, ChecklistItem } from '@/types'
import { cn } from '@/lib/utils'

interface MyTasksProps {
  events: Event[]
  currentUserId: string
}

export function MyTasks({ events, currentUserId }: MyTasksProps) {
  const queryClient = useQueryClient()

  const checklistQueries = useQueries({
    queries: events.map((e) => ({
      queryKey: ['events', e.id, 'checklist'],
      queryFn: async () => {
        const res = await checklistApi.list(e.id)
        return res.data as ChecklistItem[]
      },
      staleTime: 60_000,
    })),
  })

  const isLoading = checklistQueries.some((q) => q.isLoading)

  const allTasks = useMemo(() => {
    return events.flatMap((event, i) => {
      const items = checklistQueries[i]?.data ?? []
      return items
        .filter((item) => item.assigned_to?.id === currentUserId)
        .map((item) => ({ ...item, eventTitle: event.title, eventId: event.id }))
    })
  }, [events, checklistQueries, currentUserId])

  const pendingCount = allTasks.filter((t) => !t.is_done).length

  const toggle = async (eventId: string, itemId: string) => {
    const key = ['events', eventId, 'checklist']
    await queryClient.cancelQueries({ queryKey: key })
    const prev = queryClient.getQueryData<ChecklistItem[]>(key)
    queryClient.setQueryData<ChecklistItem[]>(key, (old = []) =>
      old.map((i) => (i.id === itemId ? { ...i, is_done: !i.is_done } : i)),
    )
    try {
      await checklistApi.toggle(eventId, itemId)
    } catch {
      if (prev) queryClient.setQueryData(key, prev)
    }
    queryClient.invalidateQueries({ queryKey: key })
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-lg text-ink">Moje zadania</h3>
        {!isLoading && allTasks.length > 0 && (
          <span className="text-xs bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium px-2 py-0.5 rounded-full">
            {pendingCount} do zrobienia
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="py-6 flex items-center justify-center gap-2 text-ink-muted">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Ładowanie zadań…</span>
        </div>
      ) : allTasks.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm text-ink-muted">Nie masz przypisanych zadań</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allTasks.map((task, i) => (
            <div
              key={task.id}
              className={cn(
                'flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-2 transition-all duration-150 animate-fade-up opacity-0',
              )}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}
            >
              <button
                onClick={() => toggle(task.eventId, task.id)}
                className={cn(
                  'flex-shrink-0 transition-colors',
                  task.is_done
                    ? 'text-green-500'
                    : 'text-ink-subtle hover:text-brand-500',
                )}
              >
                {task.is_done ? <CheckSquare size={18} /> : <Square size={18} />}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium',
                    task.is_done ? 'line-through text-ink-subtle' : 'text-ink',
                  )}
                >
                  {task.label}
                </p>
                <Link
                  href={`/dashboard/events/${task.eventId}`}
                  className="text-xs text-ink-subtle hover:text-brand-500 transition-colors truncate block"
                >
                  {task.eventTitle}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
