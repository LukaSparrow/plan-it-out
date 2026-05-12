'use client'

import { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { checklistApi } from '@/lib/api'
import { avatarUrl, userName } from '@/lib/userHelpers'
import { ModalShell } from '@/components/ui/ModalShell'
import type { Participant, User } from '@/types'

export function AddTaskModal({
  eventId,
  participants,
  organizer,
  onClose,
}: {
  eventId: string
  participants: Participant[]
  organizer: User
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [label, setLabel] = useState('')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const assignableUsers = useMemo(() => {
    const seen = new Set<string>()
    const result: User[] = []
    seen.add(organizer.id)
    result.push(organizer)
    for (const p of participants) {
      if (p.user.id !== organizer.id && p.rsvp !== 'declined' && !seen.has(p.user.id)) {
        seen.add(p.user.id)
        result.push(p.user)
      }
    }
    return result
  }, [participants, organizer])

  const addMutation = useMutation({
    mutationFn: () => checklistApi.add(eventId, label.trim(), assignedTo || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'checklist'] })
      onClose()
    },
    onError: () => setError('Nie udało się dodać zadania.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!label.trim()) return setError('Opis zadania jest wymagany.')
    addMutation.mutate()
  }

  return (
    <ModalShell title="Dodaj zadanie" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-muted">Zadanie</label>
          <input
            type="text"
            placeholder='np. Kupić napoje'
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="input-field"
            autoFocus
          />
        </div>

        {assignableUsers.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink-muted">Przypisz do</label>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              <label
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                  assignedTo === '' ? 'bg-surface-2' : 'hover:bg-surface-1',
                )}
              >
                <input
                  type="radio"
                  name="assignee"
                  value=""
                  checked={assignedTo === ''}
                  onChange={() => setAssignedTo('')}
                  className="w-4 h-4 accent-brand-500"
                />
                <span className="text-sm text-ink-muted italic">Bez przypisania</span>
              </label>

              {assignableUsers.map((u) => {
                const selected = assignedTo === u.id
                return (
                  <label
                    key={u.id}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                      selected ? 'bg-brand-50 dark:bg-brand-950/30' : 'hover:bg-surface-1',
                    )}
                  >
                    <input
                      type="radio"
                      name="assignee"
                      value={u.id}
                      checked={selected}
                      onChange={() => setAssignedTo(u.id)}
                      className="w-4 h-4 accent-brand-500"
                    />
                    <img
                      src={avatarUrl(u)}
                      alt={userName(u)}
                      className="w-7 h-7 rounded-full bg-surface-2"
                    />
                    <span className="flex-1 text-sm text-ink">{userName(u)}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            Anuluj
          </button>
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {addMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            Dodaj zadanie
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
