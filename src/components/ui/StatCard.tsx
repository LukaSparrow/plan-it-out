export function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-2 text-ink-muted">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-display text-2xl text-ink">{value}</p>
    </div>
  )
}
