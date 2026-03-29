import { CheckSquare, UserPlus, Calendar, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'checklist' | 'invite' | 'event' | 'expense'
  message: string
  time: string
  avatar?: string
  name?: string
}

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: 'a1',
    type: 'checklist',
    message: 'Anna Nowak odhaczył(a) "Apteczka" na wyjeździe do Zakopanego',
    time: '5 min temu',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Anna',
    name: 'Anna',
  },
  {
    id: 'a2',
    type: 'expense',
    message: 'Piotr dodał wydatek 280 zł za paliwo – Zakopane',
    time: '1 godz. temu',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Piotr',
    name: 'Piotr',
  },
  {
    id: 'a3',
    type: 'invite',
    message: 'Anna zaprosiła Cię na "Grill u Piotra"',
    time: '3 godz. temu',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Anna',
    name: 'Anna',
  },
  {
    id: 'a4',
    type: 'event',
    message: 'Marta dołączyła do "Wyjazd na narty – Zakopane"',
    time: 'wczoraj',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Marta',
    name: 'Marta',
  },
]

const ICONS = {
  checklist: { Icon: CheckSquare, bg: 'bg-green-100 dark:bg-green-950/50', color: 'text-green-600 dark:text-green-400' },
  invite:    { Icon: UserPlus,    bg: 'bg-violet-100 dark:bg-violet-950/50', color: 'text-violet-600 dark:text-violet-400' },
  event:     { Icon: Calendar,    bg: 'bg-blue-100 dark:bg-blue-950/50',   color: 'text-blue-600 dark:text-blue-400' },
  expense:   { Icon: Wallet,      bg: 'bg-brand-100 dark:bg-brand-950/50', color: 'text-brand-600 dark:text-brand-400' },
}

export function ActivityFeed() {
  return (
    <div className="card p-5">
      <h3 className="font-display text-lg text-ink mb-5">Aktywność</h3>
      <div className="space-y-4">
        {MOCK_ACTIVITY.map((item, i) => {
          const { Icon, bg, color } = ICONS[item.type]
          return (
            <div
              key={item.id}
              className={cn('flex items-start gap-3 animate-fade-up opacity-0')}
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'forwards' }}
            >
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', bg)}>
                <Icon size={15} className={color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink leading-snug">{item.message}</p>
                <p className="text-xs text-ink-subtle mt-0.5">{item.time}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
