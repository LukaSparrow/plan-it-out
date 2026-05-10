'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Loader2 } from 'lucide-react'
import { eventsApi } from '@/lib/api'
import { ModalShell } from '@/components/ui/ModalShell'

export function InviteModal({
  eventId,
  onClose,
}: {
  eventId: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const inviteMutation = useMutation({
    mutationFn: (em: string) => eventsApi.invite(eventId, em),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId] })
      onClose()
    },
    onError: () => setError('Nie udało się wysłać zaproszenia.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.includes('@')) {
      setError('Podaj poprawny adres e-mail.')
      return
    }
    inviteMutation.mutate(email)
  }

  return (
    <ModalShell title="Zaproś znajomego" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="invite-email" className="text-sm font-medium text-ink-muted">
            E-mail znajomego
          </label>
          <input
            id="invite-email"
            type="email"
            placeholder="ania@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            autoFocus
          />
        </div>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            Anuluj
          </button>
          <button
            type="submit"
            disabled={inviteMutation.isPending}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {inviteMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <UserPlus size={14} />
            )}
            Wyślij zaproszenie
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
