import { cn } from '@/lib/utils'

export function Logo({ className, iconOnly = false }: { className?: string, iconOnly?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-glow flex-shrink-0">
        <span className="text-white text-lg">🗺️</span>
      </div>
      {!iconOnly && <span className="font-display text-xl text-ink">Plan It Out</span>}
    </div>
  )
}