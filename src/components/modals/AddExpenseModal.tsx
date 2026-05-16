'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { expensesApi } from '@/lib/api'
import { avatarUrl, userName } from '@/lib/userHelpers'
import { ModalShell } from '@/components/ui/ModalShell'
import type { Participant, User } from '@/types'

export function AddExpenseModal({
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
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const members = participants.filter((p) => p.user.id !== organizer.id)
  const allUsers: User[] = [organizer, ...members.map((p) => p.user)]
  // Mapa status RSVP per user — używana do wyświetlenia etykiet (Potwierdził/Odrzucił itp.)
  const rsvpMap = new Map<string, string>([
    [organizer.id, 'organizer'],
    ...members.map((p) => [p.user.id, p.rsvp] as [string, string]),
  ])
  // Domyślnie dzielimy na wszystkich aktywnych (bez odrzuconych)
  const [splitAmong, setSplitAmong] = useState<string[]>(() => [
    organizer.id,
    ...members.filter((p) => p.rsvp !== 'declined').map((p) => p.user.id),
  ])
  const [error, setError] = useState<string | null>(null)

  const addMutation = useMutation({
    mutationFn: (data: any) => expensesApi.add(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'expenses'] })
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'balances'] })
      onClose()
    },
    onError: () => setError('Nie udało się dodać wydatku.'),
  })

  const toggleUser = (id: string) => {
    setSplitAmong((curr) =>
      curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id],
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const amt = parseFloat(amount)
    if (!description.trim()) return setError('Opis jest wymagany.')
    if (!amt || amt <= 0) return setError('Kwota musi być większa od 0.')
    if (splitAmong.length === 0) return setError('Wybierz przynajmniej jedną osobę.')

    addMutation.mutate({
      description: description.trim(),
      amount: amt,
      currency: 'PLN',
      split_among: splitAmong,
    })
  }

  return (
    <ModalShell title="Dodaj wydatek" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-muted">Opis</label>
          <input
            type="text"
            placeholder="np. Pizza dla wszystkich"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-ink-muted">Kwota (PLN)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-ink-muted">
            Dzielone na ({splitAmong.length}{' '}
            {splitAmong.length === 1 ? 'osobę' : 'osób'})
          </label>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {allUsers.map((u) => {
              const checked = splitAmong.includes(u.id)
              return (
                <label
                  key={u.id}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                    checked ? 'bg-brand-50 dark:bg-brand-950/30' : 'hover:bg-surface-1',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleUser(u.id)}
                    className="w-4 h-4 accent-brand-500"
                  />
                  <img
                    src={avatarUrl(u)}
                    referrerPolicy="no-referrer"
                    alt={userName(u)}
                    className="w-7 h-7 rounded-full bg-surface-2"
                  />
                  <span className="flex-1 text-sm text-ink">{userName(u)}</span>
                  {(() => {
                    const s = rsvpMap.get(u.id)
                    if (s === 'organizer') return <span className="text-xs text-brand-500 font-medium">Organizator</span>
                    if (s === 'accepted')  return <span className="text-xs text-green-600 dark:text-green-400">Potwierdził</span>
                    if (s === 'declined')  return <span className="text-xs text-red-500">Odrzucił</span>
                    if (s === 'pending')   return <span className="text-xs text-amber-500">Oczekuje</span>
                  })()}
                </label>
              )
            })}
          </div>
        </div>

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
            Dodaj wydatek
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
