'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckSquare, Square } from 'lucide-react'
import { Event } from '@/types'
import { cn } from '@/lib/utils'

interface MyTasksProps {
  events: Event[]
  currentUserId: string
}

export function MyTasks({ events, currentUserId }: MyTasksProps) {
  // Collect all items assigned to the current user
  const allTasks = events.flatMap((event) =>
    event.checklist_items
      .filter((item) => item.assigned_to?.id === currentUserId)
      .map((item) => ({ ...item, eventTitle: event.title, eventId: event.id }))
  )

  const pending = allTasks.filter((t) => !t.is_done)
  const done = allTasks.filter((t) => t.is_done)

  const [localDone, setLocalDone] = useState<Set<string>>(new Set(done.map((t) => t.id)))

  const toggle = (id: string) => {
    setLocalDone((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    // TODO: call checklistApi.toggle(eventId, id)
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-lg text-ink">Moje zadania</h3>
        {allTasks.length > 0 && (
          <span className="text-xs bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium px-2 py-0.5 rounded-full">
            {pending.length - [...localDone].filter(id => pending.find(t => t.id === id)).length} do zrobienia
          </span>
        )}
      </div>

      {allTasks.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm text-ink-muted">Nie masz przypisanych zadań</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allTasks.map((task, i) => {
            const isDone = localDone.has(task.id)
            return (
              <div
                key={task.id}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-2 transition-all duration-150 group animate-fade-up opacity-0'
                )}
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}
              >
                <button
                  onClick={() => toggle(task.id)}
                  className={cn(
                    'flex-shrink-0 transition-colors',
                    isDone ? 'text-green-500' : 'text-ink-subtle hover:text-brand-500'
                  )}
                >
                  {isDone ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', isDone ? 'line-through text-ink-subtle' : 'text-ink')}>
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
            )
          })}
        </div>
      )}
    </div>
  )
}
