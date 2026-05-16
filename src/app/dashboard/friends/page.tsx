'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Search, Mail, UserPlus, Check, X, Loader2, Send, UserMinus } from 'lucide-react'
import { friendsApi } from '@/lib/api'
import { avatarUrl, userName } from '@/lib/userHelpers'
import type { User, FriendRequest } from '@/types'

export default function FriendsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

  const friendsQuery = useQuery<User[]>({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await friendsApi.list()
      return res.data
    },
  })

  const requestsQuery = useQuery<FriendRequest[]>({
    queryKey: ['friends', 'requests'],
    queryFn: async () => {
      const res = await friendsApi.requests()
      return res.data
    },
  })

  const inviteMutation = useMutation({
    mutationFn: (email: string) => friendsApi.invite(email),
    onSuccess: () => {
      setInviteEmail('')
      setInviteError('')
      setInviteSuccess('Zaproszenie wysłane!')
      setTimeout(() => setInviteSuccess(''), 3000)
    },
    onError: (err: any) => {
      setInviteSuccess('')
      setInviteError(err?.response?.data?.detail ?? 'Nie udało się wysłać zaproszenia.')
    },
  })

  const acceptMutation = useMutation({
    mutationFn: (id: string) => friendsApi.accept(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] })
    },
  })

  const declineMutation = useMutation({
    mutationFn: (id: string) => friendsApi.decline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (friendId: string) => friendsApi.remove(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] })
    },
  })

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    const email = inviteEmail.trim()
    if (!email) return
    setInviteError('')
    inviteMutation.mutate(email)
  }

  const friends = friendsQuery.data ?? []
  const requests = requestsQuery.data ?? []

  const filtered = search.trim()
    ? friends.filter(
        (f) =>
          f.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          f.email?.toLowerCase().includes(search.toLowerCase()),
      )
    : friends

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-ink">Znajomi</h1>
          <p className="text-ink-muted mt-1">
            {friendsQuery.isLoading
              ? 'Ładowanie…'
              : `${friends.length} ${friends.length === 1 ? 'znajomy' : 'znajomych'}`}
          </p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            type="text"
            placeholder="Szukaj znajomych…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 w-60"
          />
        </div>
      </div>

      {/* ── Invite form ── */}
      <div className="card p-5">
        <h2 className="font-display text-lg text-ink mb-4 flex items-center gap-2">
          <UserPlus size={18} className="text-brand-500" />
          Zaproś znajomego
        </h2>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            placeholder="Adres e-mail…"
            value={inviteEmail}
            onChange={(e) => { setInviteEmail(e.target.value); setInviteError('') }}
            className="input-field flex-1"
            disabled={inviteMutation.isPending}
          />
          <button
            type="submit"
            disabled={!inviteEmail.trim() || inviteMutation.isPending}
            className="btn-primary flex items-center gap-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {inviteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Wyślij
          </button>
        </form>
        {inviteError && <p className="mt-2 text-sm text-red-500">{inviteError}</p>}
        {inviteSuccess && <p className="mt-2 text-sm text-green-600 dark:text-green-400">{inviteSuccess}</p>}
      </div>

      {/* ── Pending requests ── */}
      {(requestsQuery.isLoading || requests.length > 0) && (
        <div className="card p-5">
          <h2 className="font-display text-lg text-ink mb-4 flex items-center gap-2">
            <Mail size={18} className="text-brand-500" />
            Oczekujące zaproszenia
            {requests.length > 0 && (
              <span className="text-xs bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium px-2 py-0.5 rounded-full">
                {requests.length}
              </span>
            )}
          </h2>
          {requestsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-ink-muted py-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Ładowanie…</span>
            </div>
          ) : (
            <ul className="divide-y divide-surface-2">
              {requests.map((req) => (
                <li key={req.id} className="flex items-center gap-3 py-3">
                  <img
                    src={avatarUrl(req.requester)}
                    referrerPolicy="no-referrer"
                    alt={userName(req.requester)}
                    className="w-10 h-10 rounded-full bg-surface-2 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-ink truncate">{userName(req.requester)}</p>
                    <p className="text-xs text-ink-subtle truncate flex items-center gap-1">
                      <Mail size={10} />
                      {req.requester.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => acceptMutation.mutate(req.id)}
                      disabled={acceptMutation.isPending || declineMutation.isPending}
                      className="btn-primary flex items-center gap-1 text-xs py-1.5 px-3 disabled:opacity-50"
                    >
                      <Check size={13} />
                      Akceptuj
                    </button>
                    <button
                      onClick={() => declineMutation.mutate(req.id)}
                      disabled={acceptMutation.isPending || declineMutation.isPending}
                      className="btn-ghost flex items-center gap-1 text-xs py-1.5 px-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                    >
                      <X size={13} />
                      Odrzuć
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Friends list ── */}
      {friendsQuery.isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-surface-2 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-surface-2 rounded w-3/4" />
                  <div className="h-3 bg-surface-2 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <Users size={40} className="mx-auto text-ink-subtle mb-4" />
          {friends.length === 0 ? (
            <>
              <p className="text-ink font-medium">Brak znajomych</p>
              <p className="text-sm text-ink-muted mt-1">
                Wyślij zaproszenie powyżej, żeby dodać pierwszego znajomego.
              </p>
            </>
          ) : (
            <>
              <p className="text-ink font-medium">Brak wyników</p>
              <p className="text-sm text-ink-muted mt-1">Spróbuj innej frazy.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((friend) => (
            <div key={friend.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <img
                  src={avatarUrl(friend)}
                  referrerPolicy="no-referrer"
                  alt={userName(friend)}
                  className="w-12 h-12 rounded-full bg-surface-2 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink truncate">{userName(friend)}</p>
                  <p className="text-xs text-ink-subtle flex items-center gap-1 truncate">
                    <Mail size={11} />
                    {friend.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Usunąć ${userName(friend)} ze znajomych?`)) {
                      removeMutation.mutate(friend.id)
                    }
                  }}
                  disabled={removeMutation.isPending}
                  className="flex-shrink-0 p-1.5 rounded-lg text-ink-subtle hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                  title="Usuń znajomego"
                >
                  <UserMinus size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
