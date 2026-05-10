export function EmptyHint({
  icon,
  title,
  subtitle,
}: {
  icon: string
  title: string
  subtitle: string
}) {
  return (
    <div className="py-8 text-center bg-surface-1/60 border border-dashed border-surface-2 rounded-2xl">
      <p className="text-3xl mb-2">{icon}</p>
      <p className="text-ink font-medium">{title}</p>
      <p className="text-ink-muted text-xs mt-1 max-w-xs mx-auto">{subtitle}</p>
    </div>
  )
}
