'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckSquare, Square, Plus, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { checklistApi } from '@/lib/api'
import { avatarUrl, userName } from '@/lib/userHelpers'
import { ListSkeleton } from '@/components/ui/ListSkeleton'
import { EmptyHint } from '@/components/ui/EmptyHint'
import { InlineError } from '@/components/ui/InlineError'
import type { ChecklistItem } from '@/types'

export function ChecklistSection({
  eventId,
  items,
  isLoading,
  isError,
}: {
  eventId: string
  items: ChecklistItem[]
  isLoading: boolean
  isError: boolean
}) {
  const queryClient = useQueryClient()
  const [newLabel, setNewLabel] = useState('')

  const addMutation = useMutation({
    mutationFn: (label: string) => checklistApi.add(eventId, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'checklist'] })
      setNewLabel('')
    },
  })

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

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const label = newLabel.trim()
    if (!label) return
    addMutation.mutate(label)
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-ink flex items-center gap-2">
          <CheckSquare size={18} className="text-brand-500" />
          Lista zadań
        </h2>
        {total > 0 && (
          <span className="text-xs text-ink-subtle">
            {done}/{total} ({pct}%)
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Dodaj zadanie… np. „Kupić namiot"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="input-field flex-1"
          disabled={addMutation.isPending}
        />
        <button
          type="submit"
          disabled={!newLabel.trim() || addMutation.isPending}
          className="btn-primary flex items-center gap-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {addMutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          Dodaj
        </button>
      </form>

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
                <img
                  src={avatarUrl(item.assigned_to)}
                  alt={userName(item.assigned_to)}
                  title={`Przypisane: ${userName(item.assigned_to)}`}
                  className="w-6 h-6 rounded-full bg-surface-2"
                />
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
  )
}
