'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckSquare, Square, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { checklistApi } from '@/lib/api'
import { avatarUrl, userName } from '@/lib/userHelpers'
import { ListSkeleton } from '@/components/ui/ListSkeleton'
import { EmptyHint } from '@/components/ui/EmptyHint'
import { InlineError } from '@/components/ui/InlineError'
import { AddTaskModal } from '@/components/modals/AddTaskModal'
import type { ChecklistItem, Participant, User } from '@/types'

export function ChecklistSection({
  eventId,
  items,
  isLoading,
  isError,
  participants = [],
  organizer,
}: {
  eventId: string
  items: ChecklistItem[]
  isLoading: boolean
  isError: boolean
  participants?: Participant[]
  organizer?: User
}) {
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)

  const toggleMutation = useMutation({
    mutationFn: (itemId: string) => checklistApi.toggle(eventId, itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ['events', eventId, 'checklist'] })
      const prev = queryClient.getQueryData<ChecklistItem[]>(['events', eventId, 'checklist'])
      queryClient.setQueryData<ChecklistItem[]>(
        ['events', eventId, 'checklist'],
        (old = []) =>
          old.map((i) => (i.id === itemId ? { ...i, is_done: !i.is_done } : i)),
      )
      return { prev }
    },
    onError: (_err, _itemId, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['events', eventId, 'checklist'], ctx.prev)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'checklist'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => checklistApi.delete(eventId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'checklist'] })
    },
  })

  const done = items.filter((i) => i.is_done).length
  const total = items.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <>
    <section className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-ink flex items-center gap-2">
          <CheckSquare size={18} className="text-brand-500" />
          Lista zadań
        </h2>
        <div className="flex items-center gap-3">
          {total > 0 && (
            <span className="text-xs text-ink-subtle">
              {done}/{total} ({pct}%)
            </span>
          )}
          <button
            onClick={() => setAddOpen(true)}
            className="btn-ghost flex items-center gap-1.5 text-sm"
          >
            <Plus size={14} />
            Dodaj
          </button>
        </div>
      </div>

      {total > 0 && (
        <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <InlineError text="Nie udało się wczytać listy zadań." />
      ) : items.length === 0 ? (
        <EmptyHint
          icon="✅"
          title="Brak zadań"
          subtitle="Dodaj pierwsze zadanie, które trzeba załatwić przed wydarzeniem."
        />
      ) : (
        <ul className="divide-y divide-surface-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 py-2.5 group"
            >
              <button
                onClick={() => toggleMutation.mutate(item.id)}
                className="flex-shrink-0 transition-transform active:scale-90"
                aria-label={item.is_done ? 'Odznacz' : 'Zaznacz'}
              >
                {item.is_done ? (
                  <CheckSquare size={18} className="text-brand-500" />
                ) : (
                  <Square size={18} className="text-ink-subtle hover:text-brand-500 transition-colors" />
                )}
              </button>
              <span
                className={cn(
                  'flex-1 text-sm',
                  item.is_done ? 'line-through text-ink-subtle' : 'text-ink',
                )}
              >
                {item.label}
              </span>
              {item.assigned_to && (
                <div className="flex items-center gap-1.5 flex-shrink-0 text-xs text-ink-subtle">
                  <img
                    src={avatarUrl(item.assigned_to)}
                    alt={userName(item.assigned_to)}
                    className="w-5 h-5 rounded-full bg-surface-2"
                  />
                  <span>{userName(item.assigned_to)}</span>
                </div>
              )}
              <button
                onClick={() => deleteMutation.mutate(item.id)}
                className="text-ink-subtle hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Usuń zadanie"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>

    {addOpen && organizer && (
      <AddTaskModal
        eventId={eventId}
        participants={participants}
        organizer={organizer}
        onClose={() => setAddOpen(false)}
      />
    )}
    </>
  )
}
