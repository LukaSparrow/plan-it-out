'use client'

import { Users, UserPlus, Sparkles } from 'lucide-react'
import { cn, formatRelative } from '@/lib/utils'
import { avatarUrl, userName } from '@/lib/userHelpers'
import type { Participant, User } from '@/types'

function RsvpBadge({ rsvp }: { rsvp: Participant['rsvp'] }) {
  const cfg = {
    accepted: { label: 'Potwierdzono', cls: 'text-green-600 dark:text-green-400' },
    pending:  { label: 'Oczekuje',     cls: 'text-amber-600 dark:text-amber-400' },
    declined: { label: 'Odrzucono',    cls: 'text-red-500 dark:text-red-400' },
  }[rsvp]
  return <span className={cn('font-medium', cfg.cls)}>{cfg.label}</span>
}

export function ParticipantsSection({
  participants,
  organizer,
  onInvite,
}: {
  participants: Participant[]
  organizer: User
  onInvite: () => void
}) {
  const members = participants.filter((p) => p.user.id !== organizer.id)
  const accepted = members.filter((p) => p.rsvp === 'accepted').length
  const pending = members.filter((p) => p.rsvp === 'pending').length

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-ink flex items-center gap-2">
          <Users size={18} className="text-brand-500" />
          Uczestnicy
        </h2>
        <button
          onClick={onInvite}
          className="btn-ghost flex items-center gap-1.5 text-sm"
          aria-label="Zaproś znajomego"
        >
          <UserPlus size={14} />
        </button>
      </div>

      {members.length > 0 && (
        <div className="flex gap-2 mb-4 text-xs">
          <span className="px-2 py-1 rounded-full bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400">
            ✓ {accepted} potwierdzonych
          </span>
          {pending > 0 && (
            <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              ⏳ {pending} oczekuje
            </span>
          )}
        </div>
      )}

      <ul className="space-y-2">
        <li className="flex items-center gap-3 p-2.5 rounded-xl bg-brand-50/40 dark:bg-brand-950/20 border border-brand-200/40 dark:border-brand-800/30">
          <img
            src={avatarUrl(organizer)}
            alt={userName(organizer)}
            className="w-9 h-9 rounded-full bg-surface-2"
            onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${organizer.id}` }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">
              {userName(organizer)}
            </p>
            <p className="text-xs text-ink-subtle">Organizator</p>
          </div>
          <Sparkles size={14} className="text-brand-500" />
        </li>

        {participants.filter((p) => p.user.id !== organizer.id).map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-1 transition-colors"
          >
            <img
              src={avatarUrl(p.user)}
              alt={userName(p.user)}
              className="w-9 h-9 rounded-full bg-surface-2"
              onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${p.user.id}` }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">
                {userName(p.user)}
              </p>
              <p className="text-xs text-ink-subtle">
                <RsvpBadge rsvp={p.rsvp} /> · dołączył {formatRelative(p.joined_at)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {members.length === 0 && (
        <button
          onClick={onInvite}
          className="w-full mt-3 py-3 border border-dashed border-surface-3 rounded-xl text-sm text-ink-muted hover:text-brand-500 hover:border-brand-400 transition-colors flex items-center justify-center gap-2"
        >
          <UserPlus size={14} />
          Zaproś znajomych
        </button>
      )}
    </section>
  )
}
