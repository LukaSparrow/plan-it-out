'use client'

import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ClickableToastProps {
  toastId: string | number
  title: string
  description?: string
  link: string
  borderClass?: string
}

export function ClickableToast({
  toastId,
  title,
  description,
  link,
  borderClass = 'border-l-brand-500',
}: ClickableToastProps) {
  const router = useRouter()

  return (
    <div
      onClick={() => {
        router.push(link)
        toast.dismiss(toastId)
      }}
      className={cn(
        'relative flex items-start gap-3 p-4 cursor-pointer w-full',
        'bg-surface-1 border border-surface-2 shadow-card-lg rounded-xl',
        'border-l-2',
        borderClass,
        'hover:bg-surface-2 transition-colors',
      )}
    >
      <div className="flex-1 min-w-0 pr-5">
        <p className="text-sm font-medium text-ink leading-snug">{title}</p>
        {description && (
          <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          toast.dismiss(toastId)
        }}
        className="absolute top-3 right-3 text-ink-subtle hover:text-ink transition-colors"
        aria-label="Zamknij"
      >
        <X size={14} />
      </button>
    </div>
  )
}
