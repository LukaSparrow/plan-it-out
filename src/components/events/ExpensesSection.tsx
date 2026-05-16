'use client'

import { Receipt, Plus, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { avatarUrl, userName } from '@/lib/userHelpers'
import { ListSkeleton } from '@/components/ui/ListSkeleton'
import { EmptyHint } from '@/components/ui/EmptyHint'
import { InlineError } from '@/components/ui/InlineError'
import type { Expense, Balance } from '@/types'

export function ExpensesSection({
  eventId: _eventId,
  expenses,
  balances,
  isLoading,
  isError,
  onAdd,
}: {
  eventId: string
  expenses: Expense[]
  balances: Balance[]
  isLoading: boolean
  isError: boolean
  onAdd: () => void
}) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const currency = expenses[0]?.currency || 'PLN'

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-ink flex items-center gap-2">
          <Receipt size={18} className="text-brand-500" />
          Wydatki i rozliczenia
        </h2>
        <button
          onClick={onAdd}
          className="btn-primary flex items-center gap-1.5 text-sm"
        >
          <Plus size={14} />
          Dodaj wydatek
        </button>
      </div>

      {expenses.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-surface-1 border border-surface-2 rounded-xl p-4">
            <p className="text-xs text-ink-subtle mb-1">Łącznie wydane</p>
            <p className="font-display text-2xl text-ink">
              {formatCurrency(total, currency)}
            </p>
          </div>
          <div className="bg-surface-1 border border-surface-2 rounded-xl p-4">
            <p className="text-xs text-ink-subtle mb-1">Liczba wydatków</p>
            <p className="font-display text-2xl text-ink">{expenses.length}</p>
          </div>
        </div>
      )}

      {balances.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-medium text-ink-muted mb-2 flex items-center gap-1.5">
            <TrendingUp size={14} />
            Kto komu ile winien
          </h3>
          <ul className="space-y-2">
            {balances.map((b, i) => (
              <li
                key={i}
                className="flex items-center gap-3 bg-surface-1 border border-surface-2 rounded-xl p-3"
              >
                <img
                  src={avatarUrl(b.from)}
                  referrerPolicy="no-referrer"
                  alt={userName(b.from)}
                  className="w-8 h-8 rounded-full bg-surface-2"
                />
                <div className="flex-1 text-sm">
                  <span className="font-medium text-ink">{userName(b.from)}</span>
                  <span className="text-ink-muted"> winien </span>
                  <span className="font-medium text-ink">{userName(b.to)}</span>
                </div>
                <img
                  src={avatarUrl(b.to)}
                  referrerPolicy="no-referrer"
                  alt={userName(b.to)}
                  className="w-8 h-8 rounded-full bg-surface-2"
                />
                <span className="font-mono font-semibold text-brand-600 dark:text-brand-400 text-sm">
                  {formatCurrency(b.amount, currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : isError ? (
        <InlineError text="Nie udało się wczytać wydatków." />
      ) : expenses.length === 0 ? (
        <EmptyHint
          icon="💸"
          title="Brak wydatków"
          subtitle="Dodaj pierwszy wydatek, a my wyliczymy najprostsze rozliczenia."
        />
      ) : (
        <div>
          <h3 className="text-sm font-medium text-ink-muted mb-2">Historia</h3>
          <ul className="divide-y divide-surface-2">
            {expenses.map((exp) => (
              <li key={exp.id} className="py-3 flex items-center gap-3">
                <img
                  src={avatarUrl(exp.paid_by)}
                  referrerPolicy="no-referrer"
                  alt={userName(exp.paid_by)}
                  className="w-9 h-9 rounded-full bg-surface-2"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink font-medium truncate">
                    {exp.description}
                  </p>
                  <p className="text-xs text-ink-subtle">
                    {userName(exp.paid_by)} zapłacił
                    {exp.split_among.length > 0 && (
                      <> · dzielone na {exp.split_among.length} os.</>
                    )}
                  </p>
                </div>
                <span className="font-mono font-semibold text-ink whitespace-nowrap">
                  {formatCurrency(exp.amount, exp.currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
