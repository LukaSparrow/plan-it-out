'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Mail, Users, Loader2, Check } from 'lucide-react'
import { eventsApi, friendsApi } from '@/lib/api'
import { ModalShell } from '@/components/ui/ModalShell'
import { avatarUrl, userName } from '@/lib/userHelpers'
import type { User, Participant } from '@/types'
import { cn } from '@/lib/utils'

export function InviteModal({
  eventId,
  participants,
  onClose,
}: {
  eventId: string
  participants?: Participant[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'friends' | 'email'>('friends')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set())
  const [pendingFriendIds, setPendingFriendIds] = useState<Set<string>>(new Set())

  const participantUserIds = new Set(participants?.map((p) => p.user.id) ?? [])

  const friendsQuery = useQuery<User[]>({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await friendsApi.list()
      return res.data
    },
    staleTime: 60_000,
  })

  const inviteMutation = useMutation({
    mutationFn: (em: string) => eventsApi.invite(eventId, em),
    onSuccess: (_, em) => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId] })
      setError(null)
      // If inviting by email, close; if inviting friend, mark as invited
      if (tab === 'email') {
        onClose()
      }
    },
    onError: (err: any) => {
      setError(err?.response?.data?.detail ?? 'Nie udało się wysłać zaproszenia.')
    },
  })

  const inviteFriend = (friend: User) => {
    setError(null)
    setPendingFriendIds((prev) => new Set(prev).add(friend.id))
    eventsApi.invite(eventId, friend.email)
      .then(() => {
        setInvitedIds((prev) => new Set(prev).add(friend.id))
        queryClient.invalidateQueries({ queryKey: ['events', eventId] })
      })
      .catch((err: any) => {
        setError(err?.response?.data?.detail ?? 'Nie udało się wysłać zaproszenia.')
      })
      .finally(() => {
        setPendingFriendIds((prev) => { const s = new Set(prev); s.delete(friend.id); return s })
      })
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.includes('@')) {
      setError('Podaj poprawny adres e-mail.')
      return
    }
    inviteMutation.mutate(email)
  }

  const friends = friendsQuery.data ?? []

  return (
    <ModalShell title="Zaproś do wydarzenia" onClose={onClose}>
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-2 rounded-xl mb-4">
        <button
          onClick={() => setTab('friends')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-1.5 rounded-lg transition-all',
            tab === 'friends'
              ? 'bg-surface-0 text-ink shadow-sm'
              : 'text-ink-muted hover:text-ink',
          )}
        >
          <Users size={14} />
          Ze znajomych
        </button>
        <button
          onClick={() => setTab('email')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-1.5 rounded-lg transition-all',
            tab === 'email'
              ? 'bg-surface-0 text-ink shadow-sm'
              : 'text-ink-muted hover:text-ink',
          )}
        >
          <Mail size={14} />
          Przez e-mail
        </button>
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {tab === 'friends' ? (
        <div>
          {friendsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-ink-muted">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Ładowanie znajomych…</span>
            </div>
          ) : friends.length === 0 ? (
            <div className="py-8 text-center">
              <Users size={32} className="mx-auto text-ink-subtle mb-2" />
              <p className="text-sm text-ink-muted">Nie masz jeszcze znajomych.</p>
              <button
                onClick={() => setTab('email')}
                className="mt-2 text-sm text-brand-500 hover:underline"
              >
                Zaproś przez e-mail →
              </button>
            </div>
          ) : (
            <ul className="space-y-1 max-h-64 overflow-y-auto">
              {friends.map((friend) => {
                const alreadyIn = participantUserIds.has(friend.id)
                const justInvited = invitedIds.has(friend.id)
                const done = alreadyIn || justInvited
                return (
                  <li
                    key={friend.id}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-2 transition-colors"
                  >
                    <img
                      src={avatarUrl(friend)}
                      alt={userName(friend)}
                      className="w-8 h-8 rounded-full bg-surface-2 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{userName(friend)}</p>
                      <p className="text-xs text-ink-subtle truncate">{friend.email}</p>
                    </div>
                    <button
                      onClick={() => !done && inviteFriend(friend)}
                      disabled={done || pendingFriendIds.has(friend.id)}
                      className={cn(
                        'flex-shrink-0 flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:cursor-not-allowed',
                        done
                          ? 'bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400'
                          : 'btn-primary',
                      )}
                    >
                      {done ? (
                        <><Check size={12} /> Zaproszono</>
                      ) : pendingFriendIds.has(friend.id) ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <><UserPlus size={12} /> Zaproś</>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          <div className="flex justify-end pt-4">
            <button onClick={onClose} className="btn-ghost text-sm">
              Zamknij
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="invite-email" className="text-sm font-medium text-ink-muted">
              E-mail osoby
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
      )}
    </ModalShell>
  )
}
