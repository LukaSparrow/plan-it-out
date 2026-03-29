import { Calendar, Users, CheckSquare, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  accent: string
  delay?: string
}

function StatCard({ icon: Icon, label, value, sub, accent, delay = '' }: StatCardProps) {
  return (
    <div className={cn('card p-5 animate-fade-up opacity-0', delay)} style={{ animationFillMode: 'forwards' }}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', accent)}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-ink font-display leading-none mb-0.5">{value}</p>
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      {sub && <p className="text-xs text-ink-subtle mt-1">{sub}</p>}
    </div>
  )
}

interface DashboardStatsProps {
  eventsCount: number
  upcomingCount: number
  friendsCount: number
  checklistDone: number
  checklistTotal: number
  totalExpenses: number
}

export function DashboardStats({
  eventsCount,
  upcomingCount,
  friendsCount,
  checklistDone,
  checklistTotal,
  totalExpenses,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Calendar}
        label="Moje wydarzenia"
        value={eventsCount}
        sub={`${upcomingCount} nadchodzących`}
        accent="bg-gradient-to-br from-blue-500 to-blue-600"
        delay="animation-delay-100"
      />
      <StatCard
        icon={Users}
        label="Znajomi"
        value={friendsCount}
        sub="w Twoich grupach"
        accent="bg-gradient-to-br from-violet-500 to-violet-600"
        delay="animation-delay-200"
      />
      <StatCard
        icon={CheckSquare}
        label="Zadania"
        value={`${checklistDone}/${checklistTotal}`}
        sub="ukończonych"
        accent="bg-gradient-to-br from-green-500 to-green-600"
        delay="animation-delay-300"
      />
      <StatCard
        icon={Wallet}
        label="Wydatki"
        value={`${totalExpenses.toLocaleString('pl-PL')} zł`}
        sub="łącznie we wszystkich"
        accent="bg-gradient-to-br from-brand-500 to-brand-600"
        delay="animation-delay-400"
      />
    </div>
  )
}
