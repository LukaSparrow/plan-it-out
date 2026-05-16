'use client'

import { useState, useMemo } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import {
  Wallet,
  Receipt,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { eventsApi, expensesApi } from '@/lib/api'
import { cn, formatCurrency, formatDate, CATEGORY_ICONS } from '@/lib/utils'
import { avatarUrl, userName } from '@/lib/userHelpers'
import { useAuthStore } from '@/lib/store'
import { StatCard } from '@/components/ui/StatCard'
import type { Expense, Balance, User } from '@/types'

interface EventSummary {
  id: string
  title: string
  date: string
  category: string
}

export default function ExpensesPage() {
  const { user } = useAuthStore()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const eventsListQuery = useQuery<EventSummary[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await eventsApi.list()
      return (res.data as any[]).map((e) => ({
        id: e.id as string,
        title: e.title as string,
        date: e.date as string,
        category: (e.category ?? 'other') as string,
      }))
    },
  })

  const events = eventsListQuery.data ?? []
  const eventIds = events.map((e) => e.id)

  const expenseQueries = useQueries({
    queries: eventIds.map((id) => ({
      queryKey: ['events', id, 'expenses'],
      queryFn: async () => {
        const res = await expensesApi.list(id)
        return res.data as Expense[]
      },
      enabled: eventIds.length > 0,
    })),
  })

  const balanceQueries = useQueries({
    queries: eventIds.map((id) => ({
      queryKey: ['events', id, 'balances'],
      queryFn: async () => {
        const res = await expensesApi.balances(id)
        return res.data as Balance[]
      },
      enabled: eventIds.length > 0,
    })),
  })

  const isLoading =
    eventsListQuery.isLoading ||
    expenseQueries.some((q) => q.isLoading) ||
    balanceQueries.some((q) => q.isLoading)

  const eventsWithExpenses = useMemo(() => {
    return events
      .map((ev, i) => ({
        event: ev,
        expenses: expenseQueries[i]?.data ?? [],
        balances: balanceQueries[i]?.data ?? [],
        isLoading: expenseQueries[i]?.isLoading || balanceQueries[i]?.isLoading,
      }))
      .filter(({ expenses }) => expenses.length > 0)
  }, [events, expenseQueries, balanceQueries])

  const totalSpent = useMemo(
    () =>
      eventsWithExpenses.reduce(
        (sum, { expenses }) => sum + expenses.reduce((s, e) => s + e.amount, 0),
        0,
      ),
    [eventsWithExpenses],
  )

  const totalCount = useMemo(
    () => eventsWithExpenses.reduce((sum, { expenses }) => sum + expenses.length, 0),
    [eventsWithExpenses],
  )

  const chartData = useMemo(
    () =>
      eventsWithExpenses.map(({ event, expenses }) => ({
        name: (event.title?.length ?? 0) > 14 ? event.title.slice(0, 13) + '…' : (event.title ?? ''),
        amount: expenses.reduce((s, e) => s + e.amount, 0),
        currency: expenses[0]?.currency ?? 'PLN',
      })),
    [eventsWithExpenses],
  )

  const primaryCurrency = eventsWithExpenses[0]?.expenses[0]?.currency ?? 'PLN'

  /**
   * Globalne podsumowanie długów zalogowanego użytkownika (wszystkie wydarzenia).
   * Agreguje balance per kontrahent (UUID jako klucz), a następnie nettuje wzajemne
   * długi — jeśli A winien B 10 zł i B winien A 6 zł, wynik = A winien B 4 zł.
   * UUID normalizowane do lowercase, bo backend może zwracać różne formaty.
   */
  const globalSummary = useMemo(() => {
    if (!user) return { iOwe: [] as { person: User; amount: number }[], owedToMe: [] as { person: User; amount: number }[] }
    const iOweMap = new Map<string, { person: User; amount: number }>()
    const owedMap = new Map<string, { person: User; amount: number }>()
    const myId = String(user.id).toLowerCase()
    for (const { balances } of eventsWithExpenses) {
      for (const b of balances) {
        const fromId = String(b.from.id).toLowerCase()
        const toId = String(b.to.id).toLowerCase()
        if (fromId === myId) {
          // Bieżący użytkownik jest dłużnikiem — sumujemy kwoty do tego samego kontrahenta
          const prev = iOweMap.get(toId)
          iOweMap.set(toId, { person: b.to, amount: (prev?.amount ?? 0) + b.amount })
        } else if (toId === myId) {
          // Bieżący użytkownik jest wierzycielem
          const prev = owedMap.get(fromId)
          owedMap.set(fromId, { person: b.from, amount: (prev?.amount ?? 0) + b.amount })
        }
      }
    }
    // Net-cancel: ta sama osoba w obu mapach → zostaw tylko różnicę w większym kosz uku
    const allIds = new Set<string>([...iOweMap.keys(), ...owedMap.keys()])
    const iOwe: { person: User; amount: number }[] = []
    const owedToMe: { person: User; amount: number }[] = []
    for (const id of allIds) {
      const owe = iOweMap.get(id)?.amount ?? 0
      const owed = owedMap.get(id)?.amount ?? 0
      const person = (iOweMap.get(id) ?? owedMap.get(id))!.person
      const net = owe - owed
      if (net > 0) iOwe.push({ person, amount: net })
      else if (net < 0) owedToMe.push({ person, amount: -net })
      // net === 0: rozliczeni — pomijamy
    }
    return {
      iOwe: iOwe.sort((a, b) => b.amount - a.amount),
      owedToMe: owedToMe.sort((a, b) => b.amount - a.amount),
    }
  }, [eventsWithExpenses, user])

  const totalIOwe = globalSummary.iOwe.reduce((s, x) => s + x.amount, 0)
  const totalOwedToMe = globalSummary.owedToMe.reduce((s, x) => s + x.amount, 0)

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-up">
      <h1 className="font-display text-3xl text-ink mb-1">Rozliczenia</h1>
      <p className="text-ink-muted mb-6">
        Globalny widok wydatków ze wszystkich wydarzeń.
      </p>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<Wallet size={18} className="text-brand-500" />}
          label="Łącznie wydane"
          value={isLoading ? '…' : formatCurrency(totalSpent, primaryCurrency)}
        />
        <StatCard
          icon={<Receipt size={18} className="text-brand-500" />}
          label="Liczba wydatków"
          value={isLoading ? '…' : String(totalCount)}
        />
        <StatCard
          icon={<TrendingUp size={18} className="text-brand-500" />}
          label="Wydarzeń z wydatkami"
          value={isLoading ? '…' : String(eventsWithExpenses.length)}
        />
      </div>

      {/* ── Global balance summary ── */}
      {!isLoading && (globalSummary.iOwe.length > 0 || globalSummary.owedToMe.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* I owe */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpRight size={16} className="text-red-500" />
              <h2 className="font-display text-base text-ink">Jesteś winny łącznie</h2>
            </div>
            {globalSummary.iOwe.length === 0 ? (
              <p className="text-sm text-ink-subtle">Nic nie jesteś winny</p>
            ) : (
              <>
                <p className="font-mono font-bold text-2xl text-red-500 mb-3">
                  {formatCurrency(totalIOwe, primaryCurrency)}
                </p>
                <ul className="space-y-2">
                  {globalSummary.iOwe.map(({ person, amount }) => (
                    <li key={person.id} className="flex items-center gap-2">
                      <img
                        src={avatarUrl(person)}
                        referrerPolicy="no-referrer"
                        alt={userName(person)}
                        className="w-6 h-6 rounded-full bg-surface-2 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink truncate">{userName(person)}</p>
                        <p className="text-xs text-ink-subtle truncate">{person.email}</p>
                      </div>
                      <span className="font-mono text-sm font-semibold text-red-500">
                        {formatCurrency(amount, primaryCurrency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Owed to me */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <ArrowDownLeft size={16} className="text-green-500" />
              <h2 className="font-display text-base text-ink">Należy Ci się łącznie</h2>
            </div>
            {globalSummary.owedToMe.length === 0 ? (
              <p className="text-sm text-ink-subtle">Nikt Ci nic nie winien</p>
            ) : (
              <>
                <p className="font-mono font-bold text-2xl text-green-600 dark:text-green-400 mb-3">
                  {formatCurrency(totalOwedToMe, primaryCurrency)}
                </p>
                <ul className="space-y-2">
                  {globalSummary.owedToMe.map(({ person, amount }) => (
                    <li key={person.id} className="flex items-center gap-2">
                      <img
                        src={avatarUrl(person)}
                        referrerPolicy="no-referrer"
                        alt={userName(person)}
                        className="w-6 h-6 rounded-full bg-surface-2 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-ink truncate">{userName(person)}</p>
                        <p className="text-xs text-ink-subtle truncate">{person.email}</p>
                      </div>
                      <span className="font-mono text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(amount, primaryCurrency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Chart ── */}
      {!isLoading && chartData.length > 1 && (
        <div className="card p-5 sm:p-6 mb-6">
          <h2 className="font-display text-lg text-ink mb-4">Wydatki na wydarzenie</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={32}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: 'hsl(var(--ink-muted))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--ink-subtle))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v} ${primaryCurrency}`}
                width={70}
              />
              <Tooltip
                formatter={(value: number) =>
                  formatCurrency(value, primaryCurrency)
                }
                contentStyle={{
                  background: 'hsl(var(--surface-1))',
                  border: '1px solid hsl(var(--surface-3))',
                  borderRadius: '12px',
                  fontSize: '13px',
                }}
                cursor={{ fill: 'hsl(var(--surface-2))' }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={`hsl(var(--brand) / ${0.5 + (i / Math.max(chartData.length - 1, 1)) * 0.5})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Per-event accordion ── */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-2" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-2 rounded w-1/3" />
                  <div className="h-3 bg-surface-2 rounded w-1/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : eventsWithExpenses.length === 0 ? (
        <div className="card p-16 text-center">
          <Wallet size={40} className="mx-auto text-ink-subtle mb-4" />
          <p className="text-ink font-medium">Brak wydatków</p>
          <p className="text-sm text-ink-muted mt-1">
            Dodaj wydatki w swoich wydarzeniach, a pojawią się tutaj.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {eventsWithExpenses.map(({ event, expenses, balances }) => {
            const isOpen = expanded.has(event.id)
            const total = expenses.reduce((s, e) => s + e.amount, 0)
            const currency = expenses[0]?.currency ?? 'PLN'

            return (
              <div key={event.id} className="card overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => toggle(event.id)}
                  className="w-full flex items-center gap-3 p-5 text-left hover:bg-surface-1/60 transition-colors"
                >
                  <span className="text-2xl flex-shrink-0">
                    {CATEGORY_ICONS[event.category as keyof typeof CATEGORY_ICONS] ?? '📌'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink truncate">{event.title}</p>
                    <p className="text-xs text-ink-subtle">
                      {formatDate(event.date, 'd MMMM yyyy')} ·{' '}
                      {expenses.length}{' '}
                      {expenses.length === 1 ? 'wydatek' : 'wydatków'}
                    </p>
                  </div>
                  <span className="font-mono font-semibold text-ink whitespace-nowrap mr-2">
                    {formatCurrency(total, currency)}
                  </span>
                  {isOpen ? (
                    <ChevronUp size={16} className="text-ink-subtle flex-shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-ink-subtle flex-shrink-0" />
                  )}
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="border-t border-surface-2 p-5 space-y-5">
                    {/* Balances */}
                    {balances.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-ink-muted mb-2 flex items-center gap-1.5">
                          <TrendingUp size={13} />
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
                                className="w-7 h-7 rounded-full bg-surface-2"
                              />
                              <div className="flex-1 text-sm">
                                <span className="font-medium text-ink">
                                  {userName(b.from)}
                                </span>
                                <span className="text-ink-muted"> → </span>
                                <span className="font-medium text-ink">
                                  {userName(b.to)}
                                </span>
                              </div>
                              <img
                                src={avatarUrl(b.to)}
                                referrerPolicy="no-referrer"
                                alt={userName(b.to)}
                                className="w-7 h-7 rounded-full bg-surface-2"
                              />
                              <span className="font-mono font-semibold text-brand-600 dark:text-brand-400 text-sm ml-2">
                                {formatCurrency(b.amount, currency)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Expense list */}
                    <div>
                      <h3 className="text-sm font-medium text-ink-muted mb-2">
                        Historia
                      </h3>
                      <ul className="divide-y divide-surface-2">
                        {expenses.map((exp) => (
                          <li key={exp.id} className="py-3 flex items-center gap-3">
                            <img
                              src={avatarUrl(exp.paid_by)}
                              referrerPolicy="no-referrer"
                              alt={userName(exp.paid_by)}
                              className="w-8 h-8 rounded-full bg-surface-2"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-ink font-medium truncate">
                                {exp.description}
                              </p>
                              <p className="text-xs text-ink-subtle">
                                {userName(exp.paid_by)} zapłacił ·{' '}
                                {formatDate(exp.created_at, 'd MMM yyyy')}
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
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
