import { AlertCircle } from 'lucide-react'

export function InlineError({ text }: { text: string }) {
  return (
    <div className="px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
      <AlertCircle size={14} />
      {text}
    </div>
  )
}
